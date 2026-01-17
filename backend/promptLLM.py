import os
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def query_llm(prompt):
    response = client.responses.create(model="gpt-5", input=prompt)
    return response.output_text





