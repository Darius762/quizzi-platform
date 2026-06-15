import os
import shutil
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.core.pdf_extractor import extract_text_from_pdf
from app.core.chunker import split_text_into_chunks
from app.core.embeddings import create_vector_store, retrieve_relevant_chunks
from app.core.quiz_generator import generate_quiz

router = APIRouter()


@router.post("/generate-quiz")
async def generate_quiz_endpoint(
        file: UploadFile = File(...),
        topic: str = Form(default="toate conceptele importante"),
        num_questions: int = Form(default=10),
        question_types: str = Form(default="multiple_choice,true_false,fill_in_the_blank")
):
    try:
        pdf_path = f"uploads/{file.filename}"
        with open(pdf_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        text = extract_text_from_pdf(pdf_path)
        chunks = split_text_into_chunks(text)
        vector_store = create_vector_store(chunks, file.filename)
        relevant_chunks = retrieve_relevant_chunks(vector_store, topic, k=6)
        context = "\n\n".join(relevant_chunks)

        types_list = question_types.split(",")
        quiz = generate_quiz(context, num_questions, types_list)

        return JSONResponse(content={"success": True, "quiz": quiz})

    except Exception as e:
        return JSONResponse(content={"success": False, "error": str(e)}, status_code=500)