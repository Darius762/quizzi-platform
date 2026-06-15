"""
app/api/routes/flashcards.py
Endpoint-uri pentru generare si gestionare flashcard-uri cu SM-2 (Modificat pentru Examene)
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import Flashcard, Material, User
from app.core.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/flashcards", tags=["Flashcards"])

#Schemas

class GenerateFlashcardsRequest(BaseModel):
    material_id: int
    num_cards: int = 10
    topic: str = "toate conceptele importante"

class FlashcardOut(BaseModel):
    id: int
    material_id: Optional[int] = None
    front: str
    back: str
    easiness: float
    interval_days: int
    repetitions: int
    next_review: datetime

    class Config:
        from_attributes = True

class ReviewRequest(BaseModel):
    rating: int  # 0=Greu, 3=Mediu, 5=Usor

# Algoritm Repetiție

def sm2_update(easiness: float, interval: int, repetitions: int, rating: int):
    new_easiness = easiness + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)
    new_easiness = max(1.3, new_easiness)

    if rating == 0:
        new_interval = 0
        new_repetitions = 1

    elif rating == 3:
        if repetitions == 0:
            new_interval = 1
        else:
            new_interval = max(1, round(interval * 1.2))
        new_repetitions = repetitions + 1
    else:
        if repetitions == 0:
            new_interval = 2
        else:
            new_interval = max(2, round(interval * new_easiness))
        new_repetitions = repetitions + 1

    next_review = datetime.utcnow() + timedelta(days=new_interval)
    return new_easiness, new_interval, new_repetitions, next_review

#Routes

@router.post("/generate", response_model=list[FlashcardOut], status_code=201)
async def generate_flashcards(
    body: GenerateFlashcardsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Material).where(Material.id == body.material_id))
    material = result.scalar_one_or_none()

    if not material:
        raise HTTPException(status_code=404, detail="Material negăsit")
    if material.uploaded_by != current_user.id and not material.is_global:
        raise HTTPException(status_code=403, detail="Acces interzis")

    pdf_path = os.path.join(settings.UPLOAD_DIR, material.filename)
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Fișierul PDF nu există")

    existing_cards_query = await db.execute(
        select(Flashcard.front).where(
            Flashcard.material_id == material.id,
            Flashcard.user_id == current_user.id
        )
    )
    existing_fronts = existing_cards_query.scalars().all()
    existing_text = "\n- ".join(existing_fronts) if existing_fronts else "Niciuna."

    try:
        from app.core.pdf_extractor import extract_text_from_pdf
        from app.core.chunker import split_text_into_chunks
        from app.core.embeddings import create_vector_store, retrieve_relevant_chunks
        from app.core.config import settings as cfg
        from groq import Groq
        import json, re

        text = extract_text_from_pdf(pdf_path)
        chunks = split_text_into_chunks(text)
        vector_store = create_vector_store(chunks, material.filename)
        relevant_chunks = retrieve_relevant_chunks(vector_store, body.topic, k=6)
        context = "\n\n".join(relevant_chunks)

        client = Groq(api_key=cfg.GROQ_API_KEY)

        prompt = f"""Ești un profesor care creează flashcard-uri de studiu din materiale de curs.
Pe baza textului de mai jos, generează exact {body.num_cards} flashcard-uri noi.

TEXT:
{context}

REGULI STRICTE:
1. Fiecare flashcard are o față (întrebare/termen) și un verso (răspuns/definiție).
2. Fața trebuie să fie concisă — maxim 15 cuvinte.
3. Versoul trebuie să fie clar și complet — 1-3 propoziții.
4. Folosește DOAR informații din text, toate în română.
5. URMĂTOARELE ÎNTREBĂRI AU FOST DEJA GENERATE. ESTE INTERZIS SĂ LE REPEȚI SAU SĂ FACI UNELE FOARTE ASEMĂNĂTOARE:
- {existing_text}

Răspunde DOAR cu JSON valid, fără markdown, fără backtick-uri:
{{
  "flashcards": [
    {{
      "front": "Ce este o clasă în POO?",
      "back": "O clasă este un tip de date personalizat care encapsulează date și funcții care operează pe acele date."
    }}
  ]
}}"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=3000
        )

        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"```json|```", "", raw).strip()
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            raw = json_match.group()
        data = json.loads(raw)
        cards_data = data.get("flashcards", [])

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la generare: {str(e)}")

    saved = []
    for card in cards_data[:body.num_cards]:
        fc = Flashcard(
            user_id=current_user.id,
            material_id=material.id,
            front=card.get("front", ""),
            back=card.get("back", ""),
        )
        db.add(fc)
        saved.append(fc)

    await db.flush()
    return saved

@router.get("/", response_model=list[FlashcardOut])
async def list_flashcards(
    material_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Flashcard).where(Flashcard.user_id == current_user.id)
    if material_id:
        query = query.where(Flashcard.material_id == material_id)
    query = query.order_by(Flashcard.next_review.asc())
    result = await db.execute(query)
    cards = result.scalars().all()
    return [
        {
            "id": c.id,
            "material_id": c.material_id,
            "front": c.front,
            "back": c.back,
            "easiness": c.easiness,
            "interval_days": c.interval_days,
            "repetitions": c.repetitions,
            "next_review": c.next_review,
        }
        for c in cards
    ]

@router.post("/{card_id}/review", response_model=FlashcardOut)
async def review_flashcard(
    card_id: int,
    body: ReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Flashcard).where(Flashcard.id == card_id, Flashcard.user_id == current_user.id)
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard negăsit")

    new_e, new_i, new_r, next_rev = sm2_update(
        card.easiness, card.interval_days, card.repetitions, body.rating
    )
    card.easiness = new_e
    card.interval_days = new_i
    card.repetitions = new_r
    card.next_review = next_rev

    await db.flush()
    return {
        "id": card.id,
        "material_id": card.material_id,
        "front": card.front,
        "back": card.back,
        "easiness": card.easiness,
        "interval_days": card.interval_days,
        "repetitions": card.repetitions,
        "next_review": card.next_review,
    }

@router.delete("/{card_id}", status_code=204)
async def delete_flashcard(
    card_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Flashcard).where(Flashcard.id == card_id, Flashcard.user_id == current_user.id)
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard negăsit")
    await db.delete(card)