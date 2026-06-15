"""
app/api/routes/wordle.py
Daily Wordle Challenge — admin seteaza cuvantul, userii joaca o singura data.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, select
from sqlalchemy.orm import relationship
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Base, User, UserRole
from app.core.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/wordle", tags=["Wordle"])

# Models

class WordleChallenge(Base):
    """Cuvantul curent setat de admin."""
    __tablename__ = "wordle_challenges"

    id         = Column(Integer, primary_key=True, index=True)
    word       = Column(String(32), nullable=False)
    set_by     = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active  = Column(Boolean, default=True)

    attempts   = relationship("WordleAttempt", back_populates="challenge")
    admin      = relationship("User", foreign_keys=[set_by])


class WordleAttempt(Base):
    """Inregistreaza daca un user a jucat challenge-ul curent."""
    __tablename__ = "wordle_attempts"

    id           = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("wordle_challenges.id"), nullable=False)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    guesses      = Column(Text, nullable=False)
    solved       = Column(Boolean, default=False)
    completed_at = Column(DateTime, default=datetime.utcnow)

    challenge    = relationship("WordleChallenge", back_populates="attempts")
    user         = relationship("User", foreign_keys=[user_id])


# Schemas

class SetWordRequest(BaseModel):
    word: str = Field(..., min_length=3, max_length=16, description="Cuvantul de ghicit")


class GuessRequest(BaseModel):
    guess: str = Field(..., min_length=1, description="Ghicirea userului")


class LetterResult(BaseModel):
    letter: str
    result: str   # "correct" | "present" | "absent"


class GuessResponse(BaseModel):
    letters: List[LetterResult]
    solved:  bool
    attempts_used: int
    word_length: int


class ChallengeStatusResponse(BaseModel):
    active:        bool
    word_length:   Optional[int]
    challenge_id:  Optional[int]
    already_played: bool
    solved:        Optional[bool]
    guesses:       Optional[List[List[LetterResult]]]
    set_by_name:   Optional[str]
    created_at:    Optional[str]


class AdminChallengeResponse(BaseModel):
    id:         int
    word:       str
    created_at: str
    players:    int
    solvers:    int


# Helpers

def normalize(s: str) -> str:
    """Uppercase + inlocuieste diacritice."""
    s = s.upper()
    diacritics = {"Ă":"A","Â":"A","Î":"I","Ș":"S","Ş":"S","Ț":"T","Ţ":"T"}
    return "".join(diacritics.get(c, c) for c in s)


MAX_ATTEMPTS = 6

def evaluate_guess(word: str, guess: str) -> List[dict]:
    """
    Evalueaza o ghicire fata de cuvantul corect.
    Returneaza lista de {letter, result} unde result e:
      - "correct"  — litera corecta pe pozitia corecta (verde)
      - "present"  — litera exista dar pe alta pozitie (galben)
      - "absent"   — litera nu exista in cuvant (gri)
    """
    word  = normalize(word)
    guess = normalize(guess)


    if len(guess) < len(word):
        guess = guess.ljust(len(word))
    elif len(guess) > len(word):
        guess = guess[:len(word)]

    results  = ["absent"] * len(word)
    word_rem = list(word)


    for i, (w, g) in enumerate(zip(word, guess)):
        if w == g:
            results[i] = "correct"
            word_rem[i] = None

    for i, g in enumerate(guess):
        if results[i] == "correct":
            continue
        if g in word_rem:
            results[i] = "present"
            word_rem[word_rem.index(g)] = None

    return [{"letter": guess[i], "result": results[i]} for i in range(len(word))]


import json

def parse_guesses(guesses_json: str) -> List[List[dict]]:
    try:
        return json.loads(guesses_json)
    except Exception:
        return []


# Routes

@router.post("/set-word", status_code=status.HTTP_201_CREATED)
async def set_word(
    body: SetWordRequest,
    db:   AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Admin seteaza un cuvant nou. Dezactiveaza automat challenge-ul anterior.
    """

    result = await db.execute(
        select(WordleChallenge).where(WordleChallenge.is_active == True)
    )
    for ch in result.scalars().all():
        ch.is_active = False


    word = normalize(body.word.strip())
    if not word.isalpha():
        raise HTTPException(status_code=400, detail="Cuvantul trebuie sa contina doar litere.")

    challenge = WordleChallenge(word=word, set_by=admin.id, is_active=True)
    db.add(challenge)
    await db.flush()

    return {
        "message": f"Cuvantul '{word}' a fost setat cu succes.",
        "challenge_id": challenge.id,
        "word_length": len(word),
    }


@router.get("/status", response_model=ChallengeStatusResponse)
async def get_status(
    db:           AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returneaza statusul challenge-ului curent pentru utilizatorul autentificat.
    """

    result = await db.execute(
        select(WordleChallenge).where(WordleChallenge.is_active == True)
    )
    challenge = result.scalar_one_or_none()

    if not challenge:
        return ChallengeStatusResponse(
            active=False, word_length=None, challenge_id=None,
            already_played=False, solved=None, guesses=None,
            set_by_name=None, created_at=None,
        )


    att_result = await db.execute(
        select(WordleAttempt).where(
            WordleAttempt.challenge_id == challenge.id,
            WordleAttempt.user_id == current_user.id,
        )
    )
    attempt = att_result.scalar_one_or_none()

    already_played = attempt is not None
    solved         = attempt.solved if attempt else None
    guesses_parsed = parse_guesses(attempt.guesses) if attempt else None


    admin_result = await db.execute(select(User).where(User.id == challenge.set_by))
    admin_user   = admin_result.scalar_one_or_none()
    set_by_name  = admin_user.name if admin_user else "Admin"

    return ChallengeStatusResponse(
        active=True,
        word_length=len(challenge.word),
        challenge_id=challenge.id,
        already_played=already_played,
        solved=solved,
        guesses=guesses_parsed,
        set_by_name=set_by_name,
        created_at=challenge.created_at.strftime("%d.%m.%Y %H:%M"),
    )


@router.post("/guess", response_model=GuessResponse)
async def submit_guess(
    body:         GuessRequest,
    db:           AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Trimite o ghicire pentru challenge-ul activ.
    """

    result = await db.execute(
        select(WordleChallenge).where(WordleChallenge.is_active == True)
    )
    challenge = result.scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Nu exista niciun challenge activ.")


    att_result = await db.execute(
        select(WordleAttempt).where(
            WordleAttempt.challenge_id == challenge.id,
            WordleAttempt.user_id == current_user.id,
        )
    )
    existing = att_result.scalar_one_or_none()

    guesses_list = parse_guesses(existing.guesses) if existing else []

    if existing and (existing.solved or len(guesses_list) >= MAX_ATTEMPTS):
        raise HTTPException(status_code=400, detail="Ai terminat deja acest challenge.")


    guess = normalize(body.guess.strip())
    if len(guess) != len(challenge.word):
        raise HTTPException(
            status_code=400,
            detail=f"Ghicirea trebuie sa aiba {len(challenge.word)} litere."
        )
    if not guess.isalpha():
        raise HTTPException(status_code=400, detail="Ghicirea trebuie sa contina doar litere.")


    letter_results = evaluate_guess(challenge.word, guess)
    guesses_list.append(letter_results)

    solved        = all(r["result"] == "correct" for r in letter_results)
    attempts_used = len(guesses_list)
    game_over     = solved or attempts_used >= MAX_ATTEMPTS


    if existing:
        existing.guesses = json.dumps(guesses_list)
        existing.solved  = solved
    else:
        new_attempt = WordleAttempt(
            challenge_id=challenge.id,
            user_id=current_user.id,
            guesses=json.dumps(guesses_list),
            solved=solved,
        )
        db.add(new_attempt)

    return GuessResponse(
        letters=[LetterResult(**r) for r in letter_results],
        solved=solved,
        attempts_used=attempts_used,
        word_length=len(challenge.word),
    )


@router.get("/admin/info", response_model=AdminChallengeResponse)
async def admin_challenge_info(
    db:    AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Admin vede informatii despre challenge-ul activ (cuvant, nr. jucatori).
    """
    result = await db.execute(
        select(WordleChallenge).where(WordleChallenge.is_active == True)
    )
    challenge = result.scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Nu exista challenge activ.")

    att_result = await db.execute(
        select(WordleAttempt).where(WordleAttempt.challenge_id == challenge.id)
    )
    attempts = att_result.scalars().all()

    return AdminChallengeResponse(
        id=challenge.id,
        word=challenge.word,
        created_at=challenge.created_at.strftime("%d.%m.%Y %H:%M"),
        players=len(attempts),
        solvers=sum(1 for a in attempts if a.solved),
    )