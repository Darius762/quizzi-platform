"""
app/api/routes/attempts.py
Endpoint-uri pentru salvarea si listarea tentativelor de quiz
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import QuizAttempt, Answer, Quiz, User, QuizMode
from app.core.deps import get_current_user

router = APIRouter(prefix="/attempts", tags=["Attempts"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class AnswerIn(BaseModel):
    question_id: int
    user_answer: Optional[str] = None
    is_correct: bool
    time_spent_sec: Optional[int] = None


class CreateAttemptRequest(BaseModel):
    quiz_id: int
    mode: str
    score: int
    total: int
    time_seconds: Optional[int] = None
    answers: list[AnswerIn] = []


class AttemptOut(BaseModel):
    id: int
    quiz_id: int
    mode: str
    score: int
    total: int
    time_seconds: Optional[int]
    completed_at: Optional[str] = None

    class Config:
        from_attributes = True


class StatsOut(BaseModel):
    total_attempts: int
    avg_score_pct: float
    best_score_pct: float
    total_questions_answered: int
    correct_answers: int
    total_study_time_min: int


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/", response_model=AttemptOut, status_code=201)
async def create_attempt(
    body: CreateAttemptRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    result = await db.execute(select(Quiz).where(Quiz.id == body.quiz_id))
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz negăsit")


    attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_id=body.quiz_id,
        mode=QuizMode(body.mode),
        score=body.score,
        total=body.total,
        time_seconds=body.time_seconds,
    )
    db.add(attempt)
    await db.flush()


    for ans in body.answers:
        answer = Answer(
            attempt_id=attempt.id,
            question_id=ans.question_id,
            user_answer=ans.user_answer,
            is_correct=ans.is_correct,
            time_spent_sec=ans.time_spent_sec,
        )
        db.add(answer)

    await db.flush()

    return {
        "id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "mode": attempt.mode.value,
        "score": attempt.score,
        "total": attempt.total,
        "time_seconds": attempt.time_seconds,
    }


@router.get("/", response_model=list[AttemptOut])
async def list_attempts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.desc())
    )
    attempts = result.scalars().all()
    return [
        {
            "id": a.id,
            "quiz_id": a.quiz_id,
            "mode": a.mode.value,
            "score": a.score,
            "total": a.total,
            "time_seconds": a.time_seconds,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
        }
        for a in attempts
    ]


@router.get("/stats", response_model=StatsOut)
async def get_stats(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(QuizAttempt).where(QuizAttempt.user_id == current_user.id)
    )
    attempts = result.scalars().all()

    if not attempts:
        return {
            "total_attempts": 0,
            "avg_score_pct": 0.0,
            "best_score_pct": 0.0,
            "total_questions_answered": 0,
            "correct_answers": 0,
            "total_study_time_min": 0,
        }


    total_seconds = sum(a.time_seconds for a in attempts if a.time_seconds)
    total_minutes = total_seconds // 60

    scores_pct = [a.score / a.total * 100 for a in attempts if a.total > 0]

    return {
        "total_attempts": len(attempts),
        "avg_score_pct": round(sum(scores_pct) / len(scores_pct), 1) if scores_pct else 0.0,
        "best_score_pct": round(max(scores_pct), 1) if scores_pct else 0.0,
        "total_questions_answered": sum(a.total for a in attempts),
        "correct_answers": sum(a.score for a in attempts),
        "total_study_time_min": total_minutes,  # <--- Trimitem valoarea reală
    }