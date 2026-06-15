"""
app/api/routes/compare_quiz.py
Endpoint pentru generarea simultana fill-in-the-blank cu toate 3 sisteme:
Groq, BERT v3, BERT v5 — pe acelasi material, pentru comparatie vizuala.
"""

import os
import asyncio
import random
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import Material, User
from app.core.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/compare-quiz", tags=["Compare Quiz"])


class CompareRequest(BaseModel):
    material_id: int
    num_questions: int = 5


class QuestionItem(BaseModel):
    question_text: str
    correct_answer: str
    options: list
    explanation: Optional[str] = None


class SystemResult(BaseModel):
    system: str
    label: str
    questions: list[QuestionItem] = []
    error: Optional[str] = None
    duration_sec: Optional[float] = None


class CompareResponse(BaseModel):
    material_title: str
    num_questions: int
    groq: SystemResult
    bert_v3: SystemResult
    bert_v5: SystemResult


def run_groq(text: str, num_questions: int) -> SystemResult:
    import time
    t0 = time.time()
    try:
        from app.core.chunker import split_text_into_chunks
        from app.core.embeddings import create_vector_store, retrieve_relevant_chunks
        from app.core.quiz_generator import generate_quiz

        chunks = split_text_into_chunks(text)

        import chromadb
        try:
            client = chromadb.Client()
            client.delete_collection("compare_temp")
        except:
            pass

        vector_store = create_vector_store(chunks, "compare_temp")
        relevant_chunks = retrieve_relevant_chunks(
            vector_store, "concepte importante din materie", k=6
        )
        context = "\n\n".join(relevant_chunks)

        raw = generate_quiz(
            context=context,
            num_questions=num_questions * 3,
            question_types=["fill_in_the_blank"]
        )
        fib_qs = [q for q in raw.get("questions", [])
                  if q.get("type") == "fill_in_the_blank"]

        questions = []
        for q in fib_qs[:num_questions]:
            correct = str(q.get("correct_answer", "")).strip()
            if not correct:
                continue
            other_answers = [
                str(other.get("correct_answer", "")).strip()
                for other in fib_qs
                if str(other.get("correct_answer","")).strip().lower() != correct.lower()
            ]
            distractors = other_answers[:3]
            while len(distractors) < 3:
                distractors.append(["concept","proces","element"][len(distractors) % 3])
            opts = [correct] + distractors[:3]
            random.shuffle(opts)
            questions.append(QuestionItem(
                question_text=q.get("question", ""),
                correct_answer=correct,
                options=opts,
                explanation=q.get("explanation", ""),
            ))

        return SystemResult(
            system="groq", label="Groq / Llama",
            questions=questions,
            duration_sec=round(time.time() - t0, 2)
        )
    except Exception as e:
        return SystemResult(
            system="groq", label="Groq / Llama",
            error=str(e),
            duration_sec=round(time.time() - t0, 2)
        )


def run_bert(text: str, num_questions: int, version: str) -> SystemResult:
    import time
    t0 = time.time()
    label = "BERT v3 (Quiz Cloze)" if version == "v3" else "BERT v5 (Quiz Cloze · Hard)"
    try:
        if version == "v3":
            from app.core.bert_generator import generate_fillblank_questions
            # Asiguram ca modelul e incarcat pe thread-ul principal inainte
            from app.core.bert_generator import get_model
            get_model()
            qs_data = generate_fillblank_questions(text, num_questions)
        else:
            from app.core.bert_generator_v5 import generate_fillblank_questions_v5
            from app.core.bert_generator_v5 import get_model_v5
            get_model_v5()
            qs_data = generate_fillblank_questions_v5(text, num_questions)

        questions = []
        for q in qs_data:
            opts    = q.get("options", [])
            correct = str(q.get("correct_answer", "")).strip()
            opts_lower = [str(o).lower() for o in opts]
            if correct and correct.lower() not in opts_lower:
                if len(opts) >= 4:
                    opts[-1] = correct
                else:
                    opts.append(correct)
            questions.append(QuestionItem(
                question_text=q["question_text"],
                correct_answer=correct,
                options=opts,
                explanation=q.get("explanation", ""),
            ))

        return SystemResult(
            system=f"bert_{version}", label=label,
            questions=questions,
            duration_sec=round(time.time() - t0, 2)
        )
    except Exception as e:
        return SystemResult(
            system=f"bert_{version}", label=label,
            error=str(e),
            duration_sec=round(time.time() - t0, 2)
        )


@router.post("/generate", response_model=CompareResponse)
async def generate_compare(
    body: CompareRequest,
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
        raise HTTPException(status_code=500, detail=f"Eroare extragere PDF: {str(e)}")

    loop = asyncio.get_event_loop()
    groq_task = loop.run_in_executor(None, run_groq, text, body.num_questions)

    bert_v3_result = run_bert(text, body.num_questions, "v3")
    bert_v5_result = run_bert(text, body.num_questions, "v5")

    groq_result = await groq_task

    return CompareResponse(
        material_title=material.title,
        num_questions=body.num_questions,
        groq=groq_result,
        bert_v3=bert_v3_result,
        bert_v5=bert_v5_result,
    )