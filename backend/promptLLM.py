import os
from typing import List
from openai import OpenAI
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def get_past_sentences(user_id: int, sense_id: int, limit: int = 5) -> List[str]:
    res = (
        supabase.table("sentence_history")
        .select("sentence")
        .eq("user_id", user_id)
        .eq("sense_id", sense_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    if getattr(res, "error", None) or not res.data:
        return []
    return [r["sentence"] for r in res.data]


def build_prompt(word: str, meaning: str, language: str, past_sentences: List[str]) -> str:
    prompt = (
        f"You are helping a language learner.\n"
        f"Target language: {language}\n"
        f"Target word: '{word}' (meaning: {meaning})\n\n"
    )

    if past_sentences:
        prompt += "Previously used example sentences:\n"
        for i, s in enumerate(past_sentences, 1):
            prompt += f"{i}. {s}\n"

        prompt += (
            "\nGenerate ONE new, natural example sentence using the target word.\n"
            "The new sentence must be DIFFERENT from the sentences above.\n"
            "Do not repeat structure or meaning.\n"
        )
    else:
        prompt += "Generate ONE simple, natural example sentence using the target word.\n"

    prompt += "Return ONLY the sentence. No explanation."

    return prompt


def generate_sentence_with_history(
    word: str,
    meaning: str,
    language: str,
    past_sentences: List[str]
) -> str:
    prompt = build_prompt(word, meaning, language, past_sentences)

    resp = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt,
        temperature=0.7,
    )

    return resp.output_text.strip()
