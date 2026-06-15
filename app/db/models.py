"""
app/db/models.py — actualizat cu avatar_config pe User
"""

import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, Float,
    DateTime, Text, ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    pass


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class Difficulty(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class QuestionType(str, enum.Enum):
    multiple_choice = "mc"
    true_false = "tf"
    fill_in = "fill"


class QuizMode(str, enum.Enum):
    practice = "practice"
    test = "test"
    exam = "exam"


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String(255), unique=True, nullable=False, index=True)
    password_hash   = Column(String(255), nullable=False)
    name            = Column(String(100), nullable=False)
    role            = Column(Enum(UserRole), default=UserRole.user, nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)

    avatar_config   = Column(JSON, default=dict, nullable=True)


    materials       = relationship("Material", back_populates="uploader", foreign_keys="Material.uploaded_by")
    quiz_attempts   = relationship("QuizAttempt", back_populates="user")
    flashcards      = relationship("Flashcard", back_populates="user")


class Material(Base):
    __tablename__ = "materials"

    id              = Column(Integer, primary_key=True, index=True)
    uploaded_by     = Column(Integer, ForeignKey("users.id"), nullable=False)
    title           = Column(String(255), nullable=False)
    subject         = Column(String(100))
    chapter         = Column(String(100))
    filename        = Column(String(255), nullable=False)
    is_global       = Column(Boolean, default=False)
    created_at      = Column(DateTime, default=datetime.utcnow)

    uploader        = relationship("User", back_populates="materials", foreign_keys=[uploaded_by])
    quizzes         = relationship("Quiz", back_populates="material")
    flashcards      = relationship("Flashcard", back_populates="material")


class Quiz(Base):
    __tablename__ = "quizzes"

    id              = Column(Integer, primary_key=True, index=True)
    material_id     = Column(Integer, ForeignKey("materials.id"), nullable=True)
    created_by      = Column(Integer, ForeignKey("users.id"), nullable=False)
    title           = Column(String(255))
    num_questions   = Column(Integer, default=10)
    difficulty      = Column(Enum(Difficulty), default=Difficulty.medium)
    mode            = Column(Enum(QuizMode), default=QuizMode.practice)
    time_limit_sec  = Column(Integer, nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)

    material        = relationship("Material", back_populates="quizzes")
    creator         = relationship("User", foreign_keys=[created_by])
    questions       = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    attempts        = relationship("QuizAttempt", back_populates="quiz")


class Question(Base):
    __tablename__ = "questions"

    id              = Column(Integer, primary_key=True, index=True)
    quiz_id         = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text   = Column(Text, nullable=False)
    type            = Column(Enum(QuestionType), default=QuestionType.multiple_choice)
    options         = Column(JSON)
    correct_answer  = Column(Text, nullable=False)
    explanation     = Column(Text)
    order_index     = Column(Integer, default=0)

    quiz            = relationship("Quiz", back_populates="questions")
    answers         = relationship("Answer", back_populates="question")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    quiz_id         = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    mode            = Column(Enum(QuizMode), nullable=False)
    score           = Column(Integer, default=0)
    total           = Column(Integer, nullable=False)
    time_seconds    = Column(Integer, nullable=True)
    completed_at    = Column(DateTime, default=datetime.utcnow)

    user            = relationship("User", back_populates="quiz_attempts")
    quiz            = relationship("Quiz", back_populates="attempts")
    answers         = relationship("Answer", back_populates="attempt", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"

    id              = Column(Integer, primary_key=True, index=True)
    attempt_id      = Column(Integer, ForeignKey("quiz_attempts.id"), nullable=False)
    question_id     = Column(Integer, ForeignKey("questions.id"), nullable=False)
    user_answer     = Column(Text)
    is_correct      = Column(Boolean, nullable=False)
    time_spent_sec  = Column(Integer, nullable=True)

    attempt         = relationship("QuizAttempt", back_populates="answers")
    question        = relationship("Question", back_populates="answers")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    material_id     = Column(Integer, ForeignKey("materials.id"), nullable=True)
    front           = Column(Text, nullable=False)
    back            = Column(Text, nullable=False)
    easiness        = Column(Float, default=2.5)
    interval_days   = Column(Integer, default=1)
    repetitions     = Column(Integer, default=0)
    next_review     = Column(DateTime, default=datetime.utcnow)
    created_at      = Column(DateTime, default=datetime.utcnow)

    user            = relationship("User", back_populates="flashcards")
    material        = relationship("Material", back_populates="flashcards")

from app.api.routes.wordle import WordleChallenge, WordleAttempt