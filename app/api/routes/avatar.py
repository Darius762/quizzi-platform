"""
app/api/routes/avatar.py
Endpoint-uri pentru personalizarea avatarului — culori si accesorii deblocabile
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

from app.db.database import get_db
from app.db.models import User, QuizAttempt, Material, Flashcard
from app.core.deps import get_current_user

router = APIRouter(prefix="/avatar", tags=["Avatar"])

ACCESSORIES_DEF = {
    "hat_student": {
        "label": "Tochă de student",
        "emoji": "🎓",
        "description": "Completeaza 5 quizuri",
        "condition_type": "quizzes_completed",
        "condition_value": 5,
    },
    "glasses_cool": {
        "label": "Ochelari cool",
        "emoji": "😎",
        "description": "Obtine scor 100% la un quiz",
        "condition_type": "perfect_score",
        "condition_value": 1,
    },
    "crown": {
        "label": "Coroana",
        "emoji": "👑",
        "description": "Completeaza 20 de quizuri",
        "condition_type": "quizzes_completed",
        "condition_value": 20,
    },
    "star": {
        "label": "Stea de aur",
        "emoji": "⭐",
        "description": "Medie peste 80% pe 10 quizuri consecutive",
        "condition_type": "star_unlocked",
        "condition_value": True,
    },
    "backpack": {
        "label": "Rucsac",
        "emoji": "🎒",
        "description": "Uploadeaza 3 materiale",
        "condition_type": "materials_uploaded",
        "condition_value": 3,
    },
    "trophy": {
        "label": "Trofeu",
        "emoji": "🏆",
        "description": "Completeaza 50 de quizuri",
        "condition_type": "quizzes_completed",
        "condition_value": 50,
    },
    # ── Accesorii noi ────────────────────────────────────────────────────────
    "card": {
        "label": "Carte de joc",
        "emoji": "🃏",
        "description": "Creaza 10 flashcard-uri",
        "condition_type": "flashcards_created",
        "condition_value": 10,
    },
    "flame": {
        "label": "Flacara",
        "emoji": "🔥",
        "description": "7 zile consecutive de studiu",
        "condition_type": "streak_days",
        "condition_value": 7,
    },
    "diamond": {
        "label": "Diamant",
        "emoji": "💎",
        "description": "14 zile consecutive de studiu",
        "condition_type": "streak_days",
        "condition_value": 14,
    },
}

COLORS_DEF = {
    "purple":  { "label": "Violet",     "body": "#8b5cf6", "face": "#a78bfa", "unlocked": True },
    "blue":    { "label": "Albastru",   "body": "#3b82f6", "face": "#60a5fa", "unlocked": True },
    "green":   { "label": "Verde",      "body": "#22c55e", "face": "#4ade80", "unlocked": True },
    "orange":  { "label": "Portocaliu", "body": "#f59e0b", "face": "#fcd34d", "unlocked": True },
    "pink":    { "label": "Roz",        "body": "#ec4899", "face": "#f9a8d4", "unlocked": True },
    "red":     { "label": "Rosu",       "body": "#ef4444", "face": "#fca5a5", "unlocked": True },
    "teal":    { "label": "Turcoaz",    "body": "#14b8a6", "face": "#5eead4", "unlocked": True },
    "indigo":  { "label": "Indigo",     "body": "#6366f1", "face": "#a5b4fc", "unlocked": True },
}


def calc_streak(attempt_dates: list) -> int:
    """Calculeaza streak-ul curent din lista de date ale tentativelor."""
    if not attempt_dates:
        return 0
    today = datetime.utcnow().date()
    days = set(d.date() if isinstance(d, datetime) else d for d in attempt_dates)
    streak = 0
    check = today
    while check in days:
        streak += 1
        check -= timedelta(days=1)
    # daca nu a studiat azi, verifica de ieri
    if streak == 0:
        check = today - timedelta(days=1)
        while check in days:
            streak += 1
            check -= timedelta(days=1)
    return streak


async def compute_unlocked(user_id: int, db: AsyncSession) -> dict:
    """Calculeaza live ce e deblocat bazat pe statisticile utilizatorului."""

    # Total quizuri completate
    q_count = await db.execute(
        select(func.count(QuizAttempt.id))
        .where(QuizAttempt.user_id == user_id)
    )
    quizzes_completed = q_count.scalar() or 0

    # Scor perfect vreodata
    perfect = await db.execute(
        select(func.count(QuizAttempt.id))
        .where(QuizAttempt.user_id == user_id)
        .where(QuizAttempt.score == QuizAttempt.total)
        .where(QuizAttempt.total > 0)
    )
    perfect_count = perfect.scalar() or 0

    # Steaua de aur: verifica daca VREODATA a existat o fereastra de 10 quizuri
    # consecutive cu medie >= 80%. Odata deblocata, ramane deblocata permanent.
    all_att = await db.execute(
        select(QuizAttempt.score, QuizAttempt.total)
        .where(QuizAttempt.user_id == user_id)
        .where(QuizAttempt.total > 0)
        .order_by(QuizAttempt.completed_at.asc())
    )
    all_rows = all_att.all()
    star_unlocked = False
    avg_score_10  = 0
    if len(all_rows) >= 10:
        last10 = all_rows[-10:]
        avg_score_10 = sum(r.score / r.total * 100 for r in last10) / 10
        for i in range(len(all_rows) - 9):
            window = all_rows[i:i+10]
            if sum(r.score / r.total * 100 for r in window) / 10 >= 80:
                star_unlocked = True
                break

    # Materiale uploadate
    mat_count = await db.execute(
        select(func.count(Material.id))
        .where(Material.uploaded_by == user_id)
    )
    materials_uploaded = mat_count.scalar() or 0

    # Flashcard-uri create
    fc_count = await db.execute(
        select(func.count(Flashcard.id))
        .where(Flashcard.user_id == user_id)
    )
    flashcards_created = fc_count.scalar() or 0

    # Streak — zile consecutive cu cel putin un quiz completat
    dates_res = await db.execute(
        select(QuizAttempt.completed_at)
        .where(QuizAttempt.user_id == user_id)
        .where(QuizAttempt.completed_at.isnot(None))
    )
    attempt_dates = [r.completed_at for r in dates_res.all()]
    streak_days = calc_streak(attempt_dates)

    stats = {
        "quizzes_completed":  quizzes_completed,
        "perfect_score":      perfect_count,
        "avg_score_10":       avg_score_10,
        "materials_uploaded": materials_uploaded,
        "star_unlocked":      star_unlocked,
        "flashcards_created": flashcards_created,
        "streak_days":        streak_days,
    }

    # Calculeaza ce accesorii sunt deblocate
    unlocked = {}
    for acc_id, acc in ACCESSORIES_DEF.items():
        if acc_id == "star":
            unlocked[acc_id] = star_unlocked
        else:
            ctype = acc["condition_type"]
            cval  = acc["condition_value"]
            current_val = stats.get(ctype, 0)
            unlocked[acc_id] = current_val >= cval

    return unlocked, stats


# ── Schemas ───────────────────────────────────────────────────────────────────

class AccessoryInfo(BaseModel):
    id: str
    label: str
    emoji: str
    description: str
    unlocked: bool
    equipped: bool


class ColorInfo(BaseModel):
    id: str
    label: str
    body: str
    face: str
    unlocked: bool
    selected: bool


class AvatarState(BaseModel):
    color: str
    equipped_accessories: list[str]
    accessories: list[AccessoryInfo]
    colors: list[ColorInfo]
    stats: dict


class UpdateAvatarRequest(BaseModel):
    color: Optional[str] = None
    equipped_accessories: Optional[list[str]] = None


#Routes

@router.get("/", response_model=AvatarState)
async def get_avatar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    unlocked_map, stats = await compute_unlocked(current_user.id, db)

    saved = current_user.avatar_config or {}
    current_color        = saved.get("color", "purple")
    equipped_accessories = saved.get("equipped_accessories", [])
    equipped_accessories = [a for a in equipped_accessories if unlocked_map.get(a, False)]

    accessories = [
        AccessoryInfo(
            id=acc_id,
            label=acc["label"],
            emoji=acc["emoji"],
            description=acc["description"],
            unlocked=unlocked_map.get(acc_id, False),
            equipped=acc_id in equipped_accessories,
        )
        for acc_id, acc in ACCESSORIES_DEF.items()
    ]

    colors = [
        ColorInfo(
            id=color_id,
            label=color["label"],
            body=color["body"],
            face=color["face"],
            unlocked=True,
            selected=color_id == current_color,
        )
        for color_id, color in COLORS_DEF.items()
    ]

    return AvatarState(
        color=current_color,
        equipped_accessories=equipped_accessories,
        accessories=accessories,
        colors=colors,
        stats=stats,
    )


@router.put("/", response_model=AvatarState)
async def update_avatar(
    body: UpdateAvatarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    unlocked_map, stats = await compute_unlocked(current_user.id, db)

    saved = current_user.avatar_config or {}

    if body.color is not None:
        if body.color not in COLORS_DEF:
            raise HTTPException(status_code=400, detail="Culoare invalida")
        saved["color"] = body.color

    if body.equipped_accessories is not None:
        for acc_id in body.equipped_accessories:
            if acc_id not in ACCESSORIES_DEF:
                raise HTTPException(status_code=400, detail=f"Accesoriu invalid: {acc_id}")
            if not unlocked_map.get(acc_id, False):
                raise HTTPException(status_code=403, detail=f"Accesoriul {acc_id} nu este deblocat")
        saved["equipped_accessories"] = body.equipped_accessories

    from sqlalchemy.orm.attributes import flag_modified
    current_user.avatar_config = saved
    flag_modified(current_user, "avatar_config")
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    current_color        = saved.get("color", "purple")
    equipped_accessories = saved.get("equipped_accessories", [])

    accessories = [
        AccessoryInfo(
            id=acc_id,
            label=acc["label"],
            emoji=acc["emoji"],
            description=acc["description"],
            unlocked=unlocked_map.get(acc_id, False),
            equipped=acc_id in equipped_accessories,
        )
        for acc_id, acc in ACCESSORIES_DEF.items()
    ]

    colors = [
        ColorInfo(
            id=color_id,
            label=color["label"],
            body=color["body"],
            face=color["face"],
            unlocked=True,
            selected=color_id == current_color,
        )
        for color_id, color in COLORS_DEF.items()
    ]

    return AvatarState(
        color=current_color,
        equipped_accessories=equipped_accessories,
        accessories=accessories,
        colors=colors,
        stats=stats,
    )