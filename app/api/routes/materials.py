"""
app/api/routes/materials.py
Endpoint-uri pentru gestionarea materialelor PDF
"""

import os
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import Material, User
from app.core.deps import get_current_user, get_current_admin
from app.core.config import settings

router = APIRouter(prefix="/materials", tags=["Materials"])


# Schemas

class MaterialResponse(BaseModel):
    id: int
    title: str
    subject: Optional[str]
    chapter: Optional[str]
    filename: str
    is_global: bool

    class Config:
        from_attributes = True


# Helpers

def get_upload_path(filename: str) -> str:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    return os.path.join(settings.UPLOAD_DIR, filename)


# Routes

@router.post("/upload", response_model=MaterialResponse, status_code=201)
async def upload_material(
    file: UploadFile = File(...),
    title: str = Form(...),
    subject: str = Form(default=""),
    chapter: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Doar fișiere PDF sunt acceptate")

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Fișierul depășește {settings.MAX_FILE_SIZE_MB}MB")

    safe_filename = f"{current_user.id}_{file.filename}"
    file_path = get_upload_path(safe_filename)
    with open(file_path, "wb") as f:
        f.write(content)

    material = Material(
        uploaded_by=current_user.id,
        title=title,
        subject=subject or None,
        chapter=chapter or None,
        filename=safe_filename,
        is_global=False,
    )
    db.add(material)
    await db.flush()
    return material


@router.get("/", response_model=list[MaterialResponse])
async def list_materials(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returneaza materialele proprii + materialele globale (admin)"""
    result = await db.execute(
        select(Material).where(
            (Material.uploaded_by == current_user.id) | (Material.is_global == True)
        ).order_by(Material.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/{material_id}", status_code=204)
async def delete_material(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()

    if not material:
        raise HTTPException(status_code=404, detail="Material negăsit")

    if material.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Nu ai permisiunea să ștergi acest material")

    file_path = get_upload_path(material.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    from app.db.models import Quiz, Flashcard
    from sqlalchemy import update

    await db.execute(update(Quiz).where(Quiz.material_id == material_id).values(material_id=None))
    await db.execute(update(Flashcard).where(Flashcard.material_id == material_id).values(material_id=None))
    await db.delete(material)
    await db.commit()


# Summary

@router.post("/{material_id}/summary")
async def generate_summary(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()

    if not material:
        raise HTTPException(status_code=404, detail="Material negăsit")
    if material.uploaded_by != current_user.id and not material.is_global:
        raise HTTPException(status_code=403, detail="Acces interzis")

    pdf_path = get_upload_path(material.filename)
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Fișierul PDF nu există")

    try:
        from app.core.pdf_extractor import extract_text_from_pdf
        from app.core.chunker import split_text_into_chunks
        from app.core.embeddings import create_vector_store, retrieve_relevant_chunks
        from app.core.config import settings as cfg
        from groq import Groq
        import re

        text = extract_text_from_pdf(pdf_path)
        chunks = split_text_into_chunks(text)
        vector_store = create_vector_store(chunks, material.filename)
        relevant_chunks = retrieve_relevant_chunks(vector_store, "conceptele principale si ideile cheie", k=8)
        context = "\n\n".join(relevant_chunks)

        client = Groq(api_key=cfg.GROQ_API_KEY)

        prompt = f"""Ești un asistent academic. Pe baza textului de mai jos, generează un rezumat structurat și clar.

TEXT:
{context}

CERINȚE:
- Rezumatul trebuie să fie în română
- Structurează pe secțiuni cu titluri clare (folosește ## pentru titluri)
- Include: ideile principale, conceptele cheie, concluzii
- Lungime: 1000-2000 cuvinte
- Scrie clar și academic
- NU folosi markdown cu asteriscuri pentru bold, doar titluri cu ##"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=2000
        )

        summary = response.choices[0].message.content.strip()
        return {"summary": summary, "title": material.title}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la generare: {str(e)}")