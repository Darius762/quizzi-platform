"""
app/api/routes/admin.py
Endpoint-uri pentru panoul de administrare
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr

from app.db.database import get_db
from app.db.models import User, Material, Quiz, QuizAttempt, UserRole
from app.core.deps import get_current_admin
from app.core.security import hash_password

router = APIRouter(prefix="/admin", tags=["Admin"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str

    class Config:
        from_attributes = True


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "user"


class UpdateRoleRequest(BaseModel):
    role: str


class GlobalStatsOut(BaseModel):
    total_users: int
    total_materials: int
    total_quizzes: int
    total_attempts: int
    global_materials: int


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=GlobalStatsOut)
async def get_global_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    users = await db.execute(select(func.count(User.id)))
    materials = await db.execute(select(func.count(Material.id)))
    quizzes = await db.execute(select(func.count(Quiz.id)))
    attempts = await db.execute(select(func.count(QuizAttempt.id)))
    global_mats = await db.execute(select(func.count(Material.id)).where(Material.is_global == True))

    return {
        "total_users": users.scalar(),
        "total_materials": materials.scalar(),
        "total_quizzes": quizzes.scalar(),
        "total_attempts": attempts.scalar(),
        "global_materials": global_mats.scalar(),
    }


@router.get("/users", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [{"id": u.id, "email": u.email, "name": u.name, "role": u.role.value} for u in users]


@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(
    body: CreateUserRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):

    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email deja înregistrat")

    if body.role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Rol invalid")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        role=UserRole(body.role),
    )
    db.add(user)
    await db.flush()
    return {"id": user.id, "email": user.email, "name": user.name, "role": user.role.value}


@router.patch("/users/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: int,
    body: UpdateRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    if body.role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Rol invalid")

    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Nu îți poți schimba propriul rol")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizator negăsit")

    user.role = UserRole(body.role)
    await db.flush()
    return {"id": user.id, "email": user.email, "name": user.name, "role": user.role.value}


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Nu îți poți șterge propriul cont")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizator negăsit")

    await db.delete(user)
    await db.commit()

@router.get("/materials", response_model=list)
async def list_all_materials(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(Material).order_by(Material.created_at.desc()))
    materials = result.scalars().all()
    return [
        {
            "id": m.id, "title": m.title, "subject": m.subject,
            "chapter": m.chapter, "filename": m.filename,
            "is_global": m.is_global, "uploaded_by": m.uploaded_by,
        }
        for m in materials
    ]


@router.patch("/materials/{material_id}/global", response_model=dict)
async def toggle_global(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material negăsit")

    material.is_global = not material.is_global
    await db.flush()
    return {"id": material.id, "is_global": material.is_global}


@router.delete("/materials/{material_id}", status_code=204)
async def admin_delete_material(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    import os
    from app.core.config import settings

    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material negăsit")

    file_path = os.path.join(settings.UPLOAD_DIR, material.filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    # Seteaza material_id = NULL in quizuri si flashcarduri asociate
    from app.db.models import Quiz, Flashcard
    from sqlalchemy import update

    await db.execute(update(Quiz).where(Quiz.material_id == material_id).values(material_id=None))
    await db.execute(update(Flashcard).where(Flashcard.material_id == material_id).values(material_id=None))
    await db.delete(material)
    await db.commit()


@router.get("/quizzes", response_model=list)
async def list_all_quizzes(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(Quiz).order_by(Quiz.created_at.desc()))
    quizzes = result.scalars().all()
    return [
        {
            "id": q.id, "title": q.title,
            "num_questions": q.num_questions,
            "difficulty": q.difficulty.value,
            "mode": q.mode.value,
            "created_by": q.created_by,
            "material_id": q.material_id,
        }
        for q in quizzes
    ]


@router.delete("/quizzes/{quiz_id}", status_code=204)
async def admin_delete_quiz(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    from app.db.models import Question, QuizAttempt, Answer

    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = result.scalar_one_or_none()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz negăsit")


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