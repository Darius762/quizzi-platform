"""
app/api/routes/profile.py
Endpoint-uri pentru gestionarea profilului utilizatorului
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from app.db.database import get_db
from app.db.models import User
from app.core.deps import get_current_user
from app.core.security import verify_password, hash_password

router = APIRouter(prefix="/profile", tags=["Profile"])


# Schemas

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ProfileOut(BaseModel):
    id: int
    email: str
    name: str
    role: str

    class Config:
        from_attributes = True


# Routes

@router.patch("/", response_model=ProfileOut)
async def update_profile(
    body: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.name is not None:
        if len(body.name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Numele trebuie să aibă cel puțin 2 caractere")
        current_user.name = body.name.strip()

    if body.email is not None:

        result = await db.execute(select(User).where(User.email == body.email, User.id != current_user.id))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email deja folosit de alt cont")
        current_user.email = body.email

    await db.flush()
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role.value,
    }


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Parola curentă este incorectă")

    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="Parola nouă trebuie să aibă cel puțin 6 caractere")

    if body.current_password == body.new_password:
        raise HTTPException(status_code=400, detail="Parola nouă trebuie să fie diferită de cea curentă")

    current_user.password_hash = hash_password(body.new_password)
    await db.flush()
    return {"message": "Parola a fost schimbată cu succes"}