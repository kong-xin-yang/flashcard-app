from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv
from typing import Optional
from promptLLM import get_past_sentences, generate_sentence_with_history
import os
load_dotenv()  # loads .env into os.environ
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    # 1 line extra
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


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

class SentenceHistoryCreate(BaseModel):
    language: str



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

@app.post("/user_profiles/{user_id}/decks")
def create_deck(user_id: int, payload: DeckCreate):
    row = payload.model_dump()
    row["user_id"] = user_id
    
    # Run the execution
    try:
        res = supabase.table("decks").insert(row).execute()
    except Exception as e:
        # This catches connection errors or Supabase Auth errors
        print(f"Supabase Execution Error: {e}")
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

    # Check if 'res' actually exists before touching .data
    if res is None:
        raise HTTPException(status_code=500, detail="Supabase returned None. Check your Service Role Key.")
    
    if not res.data:
        raise HTTPException(status_code=400, detail="No data returned. Check RLS policies.")

    return res.data[0]

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

@app.post("/users/{user_id}/senses/{sense_id}/sentence_history") # No trailing slash
# OR add a second decorator
@app.post("/users/{user_id}/senses/{sense_id}/sentence_history/")
def create_sentence_history(
    user_id: int, 
    sense_id: int, 
    payload: SentenceHistoryCreate
):
    # --- 1) Validate user exists ---
    # We use .execute() to prevent the 500 error crash
    user_res = (
        supabase.table("user_profiles")
        .select("id")
        .eq("id", user_id)
        .execute()
    )
    
    # Specific error message to help us debug the 404
    if not user_res.data:
        print(f"DEBUG: User {user_id} not found in user_profiles table")
        raise HTTPException(status_code=404, detail=f"User {user_id} not found in database")

    # --- 2) Fetch sense (word + translation) ---
    sense_res = (
        supabase.table("senses")
        .select("id, word, translation")
        .eq("id", sense_id)
        .execute()
    )
    
    if not sense_res.data:
        print(f"DEBUG: Sense {sense_id} not found in senses table")
        raise HTTPException(status_code=404, detail=f"Sense {sense_id} not found in database")

    # Safely extract data now that we know it exists
    sense_data = sense_res.data[0]
    word = sense_data["word"]
    translation = sense_data["translation"]

    # --- 3) Generate the sentence via LLM ---
    try:
        past = get_past_sentences(user_id, sense_id)
        sentence = generate_sentence_with_history(word, translation, payload.language, past)
    except Exception as e:
        print(f"LLM Error: {e}")
        raise HTTPException(status_code=500, detail="LLM failed to generate sentence")

    # --- 4) Save to history ---
    ins = supabase.table("sentence_history").insert({
        "user_id": user_id,
        "sense_id": sense_id,
        "sentence": sentence
    }).execute()

    return {
        "user_id": user_id,
        "sense_id": sense_id,
        "sentence": sentence
    }






