import os
import json
import re
from groq import Groq


def generate_quiz(context: str, num_questions: int = 10, question_types: list = None) -> dict:
    if question_types is None:
        question_types = ["multiple_choice", "true_false", "fill_in_the_blank"]

    types_str = ", ".join(question_types)
    from app.core.config import settings
    client = Groq(api_key=settings.GROQ_API_KEY)

    prompt = f"""You are a professor creating high-quality exam questions from course materials.
Based on the text below, generate exactly {num_questions} questions.

Use these types: {types_str}

TEXT:
{context}

STRICT RULES:
- Use ONLY information from the text, do not invent
- multiple_choice: exactly 4 options (A,B,C,D), only one correct, make wrong answers plausible
- true_false: clear statement, answer must be "Adevarat" or "Fals"
- fill_in_the_blank: remove ONE important keyword and replace with _____, correct_answer is ONLY that one word
- NO duplicate questions
- explanation field is MANDATORY
- All questions and answers must be in Romanian
- Distribute question types evenly

Respond ONLY with valid JSON, no markdown, no backticks:
{{
  "questions": [
    {{
      "type": "multiple_choice",
      "question": "intrebarea aici",
      "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
      "correct_answer": "A",
      "explanation": "explicatie in romana"
    }},
    {{
      "type": "true_false",
      "question": "afirmatia aici",
      "correct_answer": "Adevarat",
      "explanation": "explicatie in romana"
    }},
    {{
      "type": "fill_in_the_blank",
      "question": "propozitia cu _____ aici",
      "correct_answer": "un singur cuvant",
      "explanation": "explicatie in romana"
    }}
  ]
}}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=4000
    )

    raw = response.choices[0].message.content.strip()
    raw = re.sub(r"```json|```", "", raw).strip()

    json_match = re.search(r'\{.*\}', raw, re.DOTALL)
    if json_match:
        raw = json_match.group()

    quiz = json.loads(raw)
    return quiz