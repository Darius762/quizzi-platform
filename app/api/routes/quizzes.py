"""
app/api/routes/quizzes.py
Endpoint-uri pentru generare si gestionare quizuri
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

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


# Schemas

class GenerateQuizRequest(BaseModel):
    material_id: int
    title: Optional[str] = None
    num_questions: int = 10
    difficulty: str = "medium"
    mode: str = "practice"
    topic: str = "toate conceptele importante"
    time_limit_sec: Optional[int] = None


class QuestionOut(BaseModel):
    id: int
    question_text: str
    type: str
    options: Optional[list]
    correct_answer: str
    explanation: Optional[str]
    order_index: int

    class Config:
        from_attributes = True


class QuizOut(BaseModel):
    id: int
    title: Optional[str]
    num_questions: int
    difficulty: str
    mode: str
    material_id: Optional[int] = None
    time_limit_sec: Optional[int] = None
    questions: list[QuestionOut] = []

    class Config:
        from_attributes = True


# Helpers

def parse_options(raw_options) -> list:
    if not raw_options:
        return []
    if isinstance(raw_options, list):
        return raw_options
    if isinstance(raw_options, dict):
        return [f"{k}: {v}" for k, v in raw_options.items()]
    return []


def detect_question_type(q: dict) -> QuestionType:
    q_type = q.get("type", "")
    if q_type == "true_false":
        return QuestionType.true_false
    if q_type == "fill_in_the_blank":
        return QuestionType.fill_in
    return QuestionType.multiple_choice


# Routes

@router.post("/generate", response_model=QuizOut, status_code=201)
async def generate_quiz_endpoint(
    body: GenerateQuizRequest,
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
        from app.core.chunker import split_text_into_chunks
        from app.core.embeddings import create_vector_store, retrieve_relevant_chunks
        from app.core.quiz_generator import generate_quiz

        text = extract_text_from_pdf(pdf_path)
        chunks = split_text_into_chunks(text)
        vector_store = create_vector_store(chunks, material.filename)
        relevant_chunks = retrieve_relevant_chunks(vector_store, body.topic, k=6)
        context = "\n\n".join(relevant_chunks)

        if body.difficulty == "easy":
            question_types = ["multiple_choice", "true_false"]
        elif body.difficulty == "hard":
            question_types = ["multiple_choice", "true_false", "fill_in_the_blank"]
        else:
            question_types = ["multiple_choice", "true_false"]

        raw_quiz = generate_quiz(context, body.num_questions, question_types)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la generarea quiz-ului: {str(e)}")

    quiz_title = body.title or f"Quiz — {material.title}"

    quiz = Quiz(
        material_id=material.id,
        created_by=current_user.id,
        title=quiz_title,
        num_questions=body.num_questions,
        difficulty=Difficulty(body.difficulty),
        mode=QuizMode(body.mode),
        time_limit_sec=body.time_limit_sec if body.mode == "exam" else None,
    )
    db.add(quiz)
    await db.flush()

    questions_data = raw_quiz.get("questions", [])

    saved_questions = []
    for i, q in enumerate(questions_data[:body.num_questions]):
        question = Question(
            quiz_id=quiz.id,
            question_text=q.get("question", ""),
            type=detect_question_type(q),
            options=parse_options(q.get("options")),
            correct_answer=str(q.get("correct_answer", "")),
            explanation=q.get("explanation", ""),
            order_index=i,
        )
        db.add(question)
        saved_questions.append(question)

    await db.flush()

    return {
        "id": quiz.id,
        "title": quiz.title,
        "num_questions": quiz.num_questions,
        "difficulty": quiz.difficulty.value,
        "mode": quiz.mode.value,
        "material_id": quiz.material_id,
        "time_limit_sec": quiz.time_limit_sec,
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


@router.get("/", response_model=list[QuizOut])
async def list_quizzes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Quiz).where(Quiz.created_by == current_user.id).order_by(Quiz.created_at.desc())
    )
    quizzes = result.scalars().all()
    return [
        {
            "id": q.id,
            "title": q.title,
            "num_questions": q.num_questions,
            "difficulty": q.difficulty.value,
            "mode": q.mode.value,
            "material_id": q.material_id,
            "time_limit_sec": q.time_limit_sec,
            "questions": []
        }
        for q in quizzes
    ]


@router.get("/{quiz_id}", response_model=QuizOut)
async def get_quiz(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = result.scalar_one_or_none()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz negăsit")
    if quiz.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Acces interzis")

    q_result = await db.execute(
        select(Question).where(Question.quiz_id == quiz_id).order_by(Question.order_index)
    )
    questions = q_result.scalars().all()

    return {
        "id": quiz.id,
        "title": quiz.title,
        "num_questions": quiz.num_questions,
        "difficulty": quiz.difficulty.value,
        "mode": quiz.mode.value,
        "material_id": quiz.material_id,
        "time_limit_sec": quiz.time_limit_sec,
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
            for q in questions
        ]
    }


@router.delete("/{quiz_id}", status_code=204)
async def delete_quiz(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.db.models import Question, QuizAttempt, Answer

    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = result.scalar_one_or_none()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz negăsit")
    if quiz.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Acces interzis")

    attempts_result = await db.execute(select(QuizAttempt).where(QuizAttempt.quiz_id == quiz_id))
    for attempt in attempts_result.scalars().all():
        answers_result = await db.execute(select(Answer).where(Answer.attempt_id == attempt.id))
        for answer in answers_result.scalars().all():
            await db.delete(answer)
        await db.delete(attempt)

    questions_result = await db.execute(select(Question).where(Question.quiz_id == quiz_id))
    for q in questions_result.scalars().all():
        await db.delete(q)

    await db.delete(quiz)
    await db.commit()