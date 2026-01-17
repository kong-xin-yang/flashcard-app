from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv
import os
load_dotenv()  # loads .env into os.environ

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
app = FastAPI()

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

class UserProfileCreate(BaseModel):
    email : str
    username : str

class LangProfileCreate(BaseModel):
    lang: str
    level: str
    purpose: str

class DeckCreate(BaseModel):
    name: str

class CardCreate(BaseModel):
    word: str
    translation: str

@app.post("/user_profiles")
def create_user(payload: UserProfileCreate):
    res = supabase.table("user_profiles").insert(payload.model_dump()).execute()
    if getattr(res, "error", None):
        raise HTTPException(status_code=400, detail=str(res.error))
    return res.data

@app.post("/users/{user_id}/lang_profiles")
def create_lang_profile(user_id: int, payload: LangProfileCreate):
    row = payload.model_dump()
    row["user_id"] = user_id
    res = supabase.table("lang_profiles").insert(row).execute()
    if getattr(res, "error", None):
        raise HTTPException(status_code=400, detail=str(res.error))
    return res.data

@app.post("/lang_profile/{lang_profile_id}/decks")
def create_deck(langProfile_id: int, payload: DeckCreate):
    row = payload.model_dump()
    row["lang_profile_id"] = langProfile_id
    res = supabase.table("decks").insert(row).execute()
    if getattr(res, "error", None):
        raise HTTPException(status_code=400, detail=str(res.error))
    return res.data

@app.post("/decks/{deck_id}/cards")
def create_card(deck_id: int, payload: CardCreate):
    sense_row = payload.model_dump()
    sense_row["deck_id"] = deck_id

    sense_res = (
        supabase.table("sense")
        .upsert(sense_row, on_conflict="word,translation")
        .select("id")
        .single()
        .execute()
    )

    if getattr(sense_res, "error", None):
        raise HTTPException(status_code=400, detail=sense_res.error)

    sense_id = sense_res.data["id"]

    card_res = (supabase.table("cards")
    .insert({"deck_id": deck_id, "sense_id": sense_id})
    .execute()
    )

    if getattr(card_res, "error", None):
        raise HTTPException(status_code=400, detail=card_res.error)
    
    return card_res.data




