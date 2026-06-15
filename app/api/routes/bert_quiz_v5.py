"""
app/api/routes/bert_quiz_v5.py
Endpoint pentru generarea quizurilor fill-in-the-blank cu modelul BERT v5 (mixed DAPT)
"""

import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import Quiz, Question, Material, User, QuizMode, Difficulty, QuestionType
from app.core.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/bert-quiz-v5", tags=["BERT Quiz v5"])


class BertQuizV5Request(BaseModel):
    material_id: int
    num_questions: int = 10
    title: Optional[str] = None


class QuestionOut(BaseModel):
    id: int
    question_text: str
    type: str
    options: Optional[list]
    correct_answer: str
    explanation: Optional[str]
    order_index: int


class BertQuizV5Out(BaseModel):
    id: int
    title: Optional[str]
    num_questions: int
    requested_questions: int
    difficulty: str
    mode: str
    material_id: Optional[int]
    time_limit_sec: Optional[int] = None
    questions: list[QuestionOut] = []
    generated_by: str = "bert_v5_local"


@router.post("/generate", response_model=BertQuizV5Out, status_code=201)
async def generate_bert_quiz_v5(
    body: BertQuizV5Request,
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
        raise HTTPException(status_code=404, detail="Fișierul PDF nu există pe server")

    try:
        from app.core.pdf_extractor import extract_text_from_pdf
        text = extract_text_from_pdf(pdf_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la extragerea textului: {str(e)}")

    try:
        from app.core.bert_generator_v5 import generate_fillblank_questions_v5
        questions_data = generate_fillblank_questions_v5(text, body.num_questions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la generarea BERT v5: {str(e)}")

    if not questions_data:
        raise HTTPException(
            status_code=422,
            detail=(
                "Materialul este prea scurt sau nu conține propoziții complete în română. "
                "Încearcă cu un PDF mai lung (minim 1-2 pagini de text continuu)."
            )
        )

    quiz_title = body.title or f"Quiz ML v5 — {material.title}"

    quiz = Quiz(
        material_id=material.id,
        created_by=current_user.id,
        title=quiz_title,
        num_questions=len(questions_data),
        difficulty=Difficulty("medium"),
        mode=QuizMode("practice"),
        time_limit_sec=None,
    )
    db.add(quiz)
    await db.flush()

    saved_questions = []
    for i, q in enumerate(questions_data):
        question = Question(
            quiz_id=quiz.id,
            question_text=q["question_text"],
            type=QuestionType.multiple_choice,
            options=q["options"],
            correct_answer=q["correct_answer"],
            explanation=f"Răspuns din propoziția: {q['original_sentence'][:100]}",
            order_index=i,
        )
        db.add(question)
        saved_questions.append(question)

    await db.flush()

    return {
        "id": quiz.id,
        "title": quiz.title,
        "num_questions": quiz.num_questions,
        "requested_questions": body.num_questions,
        "difficulty": quiz.difficulty.value,
        "mode": quiz.mode.value,
        "material_id": quiz.material_id,
        "time_limit_sec": None,
        "generated_by": "bert_v5_local",
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "type": q.type.value,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
                "order_index": q.order_index,
            }
            for q in saved_questions
        ]
    }