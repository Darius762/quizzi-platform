"""
app/api/routes/predictions.py
"""

import os
import joblib
import numpy as np
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.db.models import User, QuizAttempt
from app.core.deps import get_current_user

router = APIRouter(prefix="/predictions", tags=["Predictions"])

current_file_path = os.path.abspath(__file__)
routes_dir = os.path.dirname(current_file_path)
api_dir = os.path.dirname(routes_dir)
app_dir = os.path.dirname(api_dir)

MODEL_PATH = os.path.join(app_dir, "ml", "student_performance_model.pkl")

print("---- DEBUG ML MODEL ----")
print(f"Caut modelul la calea: {MODEL_PATH}")
print(f"Modelul există fizic acolo?: {os.path.exists(MODEL_PATH)}")
print("------------------------")

_model_package = None

def get_model():
    global _model_package
    if _model_package is None:
        if not os.path.exists(MODEL_PATH):
            raise HTTPException(
                status_code=503,
                detail="Modelul ML nu este disponibil. Contactați administratorul."
            )
        _model_package = joblib.load(MODEL_PATH)
    return _model_package


class PredictionRequest(BaseModel):
    study_time_weekly: float = Field(..., ge=0, le=168)
    absences:          int   = Field(..., ge=0, le=100)
    tutoring:          int   = Field(..., ge=0, le=1)
    parental_support:  int   = Field(..., ge=0, le=4)
    extracurricular:   int   = Field(..., ge=0, le=1)
    age:                Optional[int] = Field(default=20, ge=15, le=30)
    gender:             Optional[int] = Field(default=0, ge=0, le=1)
    ethnicity:          Optional[int] = Field(default=0, ge=0, le=3)
    parental_education: Optional[int] = Field(default=2, ge=0, le=4)
    sports:             Optional[int] = Field(default=0, ge=0, le=1)
    music:              Optional[int] = Field(default=0, ge=0, le=1)
    volunteering:       Optional[int] = Field(default=0, ge=0, le=1)


class PredictionResponse(BaseModel):
    gpa_predicted:      float
    grade_class:        int
    grade_label:        str
    nota_ro:            float
    platform_avg_score: Optional[float]
    platform_attempts:  int
    recommendations:    list[str]
    model_name:         str
    model_r2:           float


def generate_recommendations(gpa, absences, study_time, tutoring, platform_avg, platform_attempts):
    recs = []
    if absences > 15:
        recs.append(
            f"⚠️ Ai {absences} absențe — aceasta este cea mai mare cauză a scăderii GPA-ului. "
            "Reducerea absențelor la sub 5 ar putea crește GPA-ul cu până la 1.5 puncte."
        )
    elif absences > 8:
        recs.append(f"📅 Ai {absences} absențe. Încearcă să reduci la sub 5 pentru rezultate mai bune.")
    else:
        recs.append("✅ Prezența ta la cursuri este bună — continuă!")

    if study_time < 5:
        recs.append(
            f"📚 Studiezi doar {study_time:.1f} ore/săptămână. "
            "Crește la minim 10-15 ore pentru a vedea o îmbunătățire semnificativă."
        )
    elif study_time < 10:
        recs.append(
            f"📖 Studiezi {study_time:.1f} ore/săptămână. "
            "Încearcă să ajungi la 15 ore pentru a-ți maximiza potențialul."
        )
    else:
        recs.append(f"✅ Dedici {study_time:.1f} ore/săptămână studiului — foarte bine!")

    if not tutoring and gpa < 2.0:
        recs.append(
            "🎓 Ia în considerare meditații — studenții cu meditații au în medie "
            "cu 0.3-0.5 puncte GPA mai mult."
        )

    if platform_attempts < 5:
        recs.append(
            "💡 Ai puține quiz-uri completate pe platformă. "
            "Practica regulată cu quiz-uri crește retenția cu până la 30%."
        )
    elif platform_avg is not None and platform_avg < 60:
        recs.append(
            f"📊 Scorul tău mediu pe platformă este {platform_avg:.0f}%. "
            "Încearcă mai multe quiz-uri de practică și revizuiește flashcard-urile scadente."
        )

    if gpa >= 3.5:
        recs.append("🏆 Predicția indică performanță excelentă! Menține ritmul.")
    elif gpa >= 2.5:
        recs.append("📈 Ești pe drumul cel bun. Consistența este cheia.")
    elif gpa >= 2.0:
        recs.append("⚡ Ai potențial — concentrează-te pe reducerea absențelor și mai mult timp de studiu.")
    else:
        recs.append("🔴 GPA-ul prezis este scăzut. Prioritizează prezența și ia în considerare suport academic suplimentar.")

    return recs[:4]


@router.post("/predict", response_model=PredictionResponse)
async def predict_performance(
    body: PredictionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pkg = get_model()

    reg_model    = pkg["regression_model"]
    class_model  = pkg["classification_model"]
    feature_cols = pkg["feature_cols"]
    grade_labels = pkg["grade_labels"]
    reg_metrics  = pkg["reg_metrics"]
    model_name   = pkg["best_reg_name"]

    result = await db.execute(
        select(QuizAttempt).where(QuizAttempt.user_id == current_user.id)
    )
    attempts = result.scalars().all()

    platform_attempts = len(attempts)
    platform_avg = None
    if platform_attempts > 0:
        scores = [a.score / a.total * 100 for a in attempts if a.total > 0]
        platform_avg = round(sum(scores) / len(scores), 1) if scores else None

    feature_vector = np.array([[
        body.age,
        body.gender,
        body.ethnicity,
        body.parental_education,
        body.study_time_weekly,
        body.absences,
        body.tutoring,
        body.parental_support,
        body.extracurricular,
        body.sports,
        body.music,
        body.volunteering,
    ]], dtype=float)

    if feature_vector.shape[1] != len(feature_cols):
        raise HTTPException(
            status_code=500,
            detail=f"Feature mismatch: expected {len(feature_cols)}, got {feature_vector.shape[1]}"
        )

    try:
        gpa_raw = float(reg_model.predict(feature_vector)[0])
        gpa_raw = max(0.0, min(4.0, gpa_raw))

        fv_no_abs = feature_vector.copy()
        fv_no_abs[0][5] = 0  # absences = 0
        gpa_no_abs = float(reg_model.predict(fv_no_abs)[0])
        gpa_no_abs = max(0.0, min(4.0, gpa_no_abs))


        abs_penalty_original = gpa_no_abs - gpa_raw


        abs_capped = min(body.absences, 30)
        abs_penalty_new = (abs_capped / 30) * min(abs_penalty_original, 1.8)

        gpa_pred = max(0.5, gpa_no_abs - abs_penalty_new)
        gpa_pred = max(0.0, min(4.0, gpa_pred))


        grade_pred = int(class_model.predict(feature_vector)[0])


        if gpa_pred >= 3.5:
            grade_pred = 0
        elif gpa_pred >= 3.0:
            grade_pred = 1
        elif gpa_pred >= 2.5:
            grade_pred = 2
        elif gpa_pred >= 2.0:
            grade_pred = 3
        else:
            grade_pred = 4

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la predicție: {str(e)}")

    nota_ro = round(1 + (gpa_pred / 4.0) * 9, 2)
    grade_label = grade_labels.get(grade_pred, f"Clasa {grade_pred}")

    recommendations = generate_recommendations(
        gpa=gpa_pred,
        absences=body.absences,
        study_time=body.study_time_weekly,
        tutoring=body.tutoring,
        platform_avg=platform_avg,
        platform_attempts=platform_attempts,
    )

    return PredictionResponse(
        gpa_predicted=round(gpa_pred, 3),
        grade_class=grade_pred,
        grade_label=grade_label,
        nota_ro=nota_ro,
        platform_avg_score=platform_avg,
        platform_attempts=platform_attempts,
        recommendations=recommendations,
        model_name=model_name,
        model_r2=round(reg_metrics.get("R²", 0), 4),
    )