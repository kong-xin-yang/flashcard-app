from fastapi import FastAPI, HTTPException, Query
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

class LangProfileCreate(BaseModel):
    lang: str
    level: str

class DeckCreate(BaseModel):
    name: str

class CardCreate(BaseModel):
    word: str
    translation: str

class UserProfileRetrieve(BaseModel):
    email: str

class UserProfileRetrieveResponse(BaseModel):
    user_id: int

@app.get("/user_profiles/lookup", response_model=UserProfileRetrieveResponse)
def retrieve_user_profile(email: str = Query(...)):
    res = (
        supabase.table("user_profiles")
        .select("id")
        .eq("email", email)
        .maybe_single()
        .execute()
    )

    if getattr(res, "error", None):
        raise HTTPException(status_code=500, detail=str(res.error))

    if res.data is None:
        raise HTTPException(status_code=404, detail="User not found")

    return {"user_id": res.data["id"]}

@app.get("/users/{user_id}/decks")
def get_decks_for_user(user_id: int):
    res = (
        supabase
        .table("decks")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    if getattr(res, "error", None):
        raise HTTPException(status_code=400, detail=str(res.error))

    return res.data  # [] if no decks

@app.get("/decks/{deck_id}/cards")
def get_cards_for_deck(deck_id: int):
    cards_res = (
        supabase
        .table("cards")
        .select("id, deck_id, sense_id")
        .eq("deck_id", deck_id)
        .execute()
    )

    if getattr(cards_res, "error", None):
        raise HTTPException(status_code=400, detail=str(cards_res.error))

    cards = cards_res.data

    for card in cards:
        sense_res = (
            supabase
            .table("senses")
            .select("word, translation")
            .eq("id", card["sense_id"])
            .single()
            .execute()
        )
        card["senses"] = sense_res.data if sense_res.data else None

    return cards


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

@app.post("/user_profile/{user_id}/decks")
def create_deck(user_id: int, payload: DeckCreate):
    row = payload.model_dump()
    row["user_id"] = user_id
    res = supabase.table("decks").insert(row).execute()
    if getattr(res, "error", None):
        raise HTTPException(status_code=400, detail=str(res.error))
    return res.data

@app.post("/decks/{deck_id}/cards")
def create_card(deck_id: int, payload: CardCreate):
    sense_row = payload.model_dump()
    #sense_row["deck_id"] = deck_id

    sense_table_update_res = (
        supabase.table("senses")
        .upsert(sense_row, on_conflict="word,translation")
        .execute()
    )

    if getattr(sense_table_update_res, "error", None):
        raise HTTPException(status_code=400, detail=sense_table_update_res.error)

    sense_select_res = (
        supabase.table("senses")
        .select("id")
        .eq("word", payload.word)
        .eq("translation", payload.translation)
        .maybe_single()
        .execute()
    )
    if getattr(sense_select_res, "error", None):
        raise HTTPException(status_code=400, detail=sense_select_res.error)


    sense_id = sense_select_res.data["id"]

    card_res = (supabase.table("cards")
    .insert({"deck_id": deck_id, "sense_id": sense_id})
    .execute()
    )

    if getattr(card_res, "error", None):
        raise HTTPException(status_code=400, detail=card_res.error)
    
    return card_res.data



