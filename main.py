"""
main.py
Entry point FastAPI cu toate router-ele platformei
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.db.database import init_db
from app.api.routes import auth, materials, quizzes, attempts, flashcards, admin, profile, bert_quiz
from app.api.routes.bert_quiz_v5 import router as bert_quiz_v5_router
from app.api.routes.compare_quiz import router as compare_quiz_router

from app.api.routes.predictions import router as predictions_router
from app.api.routes.pdf_export import router as pdf_router
from app.api.routes.wordle import router as wordle_router
from app.api.routes.avatar import router as avatar_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="QuizPlatform API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# Routers
app.include_router(auth.router,             prefix="/api")
app.include_router(materials.router,        prefix="/api")
app.include_router(quizzes.router,          prefix="/api")
app.include_router(attempts.router,         prefix="/api")
app.include_router(flashcards.router,       prefix="/api")
app.include_router(admin.router,            prefix="/api")
app.include_router(profile.router,          prefix="/api")
app.include_router(bert_quiz.router,        prefix="/api")
app.include_router(bert_quiz_v5_router,     prefix="/api")
app.include_router(compare_quiz_router,     prefix="/api")
app.include_router(predictions_router,      prefix="/api")
app.include_router(pdf_router,              prefix="/api")
app.include_router(wordle_router,           prefix="/api")
app.include_router(avatar_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "QuizPlatform API v1.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}