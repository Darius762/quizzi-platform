"""
app/api/routes/pdf_export.py
Export quiz ca PDF cu intrebari si raspunsuri corecte.
"""

import io
from fpdf import FPDF
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import Quiz, Question, Material
from app.core.deps import get_current_user, User

router = APIRouter(prefix="/quizzes", tags=["PDF Export"])

import os
BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
FONT_PATH      = os.path.join(BASE_DIR, "..", "..", "fonts", "DejaVuSans.ttf")
FONT_PATH_BOLD = os.path.join(BASE_DIR, "..", "..", "fonts", "DejaVuSans-Bold.ttf")
OPTION_LABELS  = ["A", "B", "C", "D", "E"]

DIFFICULTY_LABELS = { "easy": "Usor", "medium": "Mediu", "hard": "Greu" }
MODE_LABELS       = { "practice": "Practica", "test": "Test", "exam": "Examen" }


# PDF Builder

class QuizPDF(FPDF):
    def __init__(self, quiz_title: str):
        super().__init__()
        self.quiz_title = quiz_title[:80]
        self.add_font("DejaVu", "",  FONT_PATH)
        self.add_font("DejaVu", "B", FONT_PATH_BOLD)
        self.set_margins(20, 25, 20)
        self.set_auto_page_break(auto=True, margin=20)

    @property
    def cw(self) -> float:
        """Content width — latime utila fara margini."""
        return self.w - self.l_margin - self.r_margin

    def header(self):
        self.set_font("DejaVu", "B", 8)
        self.set_text_color(120, 120, 120)
        self.cell(self.cw / 2, 6, self.quiz_title, align="L")
        self.cell(self.cw / 2, 6, f"Pagina {self.page_no()}", align="R")
        self.ln(6)
        self.set_draw_color(220, 220, 220)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-14)
        self.set_font("DejaVu", "", 8)
        self.set_text_color(160, 160, 160)
        self.cell(self.cw, 6, "Generat de platforma Quizzi", align="C")


def _val(field) -> str:
    """Extrage valoarea dintr-un enum SQLAlchemy sau string."""
    return str(field.value if hasattr(field, "value") else field)


def generate_quiz_pdf(quiz, questions, material_name: str) -> bytes:
    title = quiz.title or "Quiz"
    pdf   = QuizPDF(title)
    pdf.add_page()
    cw = pdf.cw

    # Titlu
    pdf.set_font("DejaVu", "B", 18)
    pdf.set_text_color(15, 23, 42)
    pdf.multi_cell(cw, 9, title, align="C")
    pdf.ln(3)

    #  Metadata banner
    diff = DIFFICULTY_LABELS.get(_val(quiz.difficulty), _val(quiz.difficulty))
    mode = MODE_LABELS.get(_val(quiz.mode), _val(quiz.mode))
    meta_parts = []
    if material_name:
        meta_parts.append(f"Material: {material_name}")
    meta_parts.append(f"Dificultate: {diff}")
    meta_parts.append(f"Mod: {mode}")
    meta_parts.append(f"Intrebari: {len(questions)}")
    meta_line = "   |   ".join(meta_parts)

    y0 = pdf.get_y()
    pdf.set_fill_color(240, 253, 244)
    pdf.set_draw_color(34, 197, 94)
    pdf.rect(pdf.l_margin, y0, cw, 10, style="FD")
    pdf.set_xy(pdf.l_margin, y0 + 2)
    pdf.set_font("DejaVu", "", 9)
    pdf.set_text_color(21, 128, 61)
    pdf.cell(cw, 6, meta_line, align="C")
    pdf.ln(14)

    # Header sectiune
    pdf.set_font("DejaVu", "B", 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(cw, 7, "Intrebari", align="L")
    pdf.ln(7)
    pdf.set_draw_color(34, 197, 94)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(5)

    # Intrebari
    for i, q in enumerate(questions):
        q_text  = q.question_text or ""
        q_type  = _val(q.type)
        correct = str(q.correct_answer or "").strip()

        # Text intrebare
        pdf.set_font("DejaVu", "B", 10)
        pdf.set_text_color(15, 23, 42)
        pdf.multi_cell(cw, 6, f"{i + 1}. {q_text}", align="L")
        pdf.ln(2)

        indent = 8

        if q_type == "mc" and q.options:
            for j, opt in enumerate(q.options):
                label    = OPTION_LABELS[j] if j < len(OPTION_LABELS) else str(j + 1)
                opt_str  = str(opt)

                opt_text = opt_str.replace(f"{label}:", "").replace(f"{label}.", "").strip()

                is_correct = (
                    correct == label or
                    opt_str.strip() == correct or
                    opt_str.startswith(correct + ":") or
                    opt_str.startswith(correct + ".")
                )
                if is_correct:
                    pdf.set_font("DejaVu", "B", 10)
                    pdf.set_text_color(21, 128, 61)
                    pdf.set_fill_color(240, 253, 244)
                    pdf.set_x(pdf.l_margin + indent)
                    pdf.multi_cell(cw - indent, 6, f"[✓] {label}. {opt_text}", align="L", fill=True)
                else:
                    pdf.set_font("DejaVu", "", 10)
                    pdf.set_text_color(71, 85, 105)
                    pdf.set_x(pdf.l_margin + indent)
                    pdf.multi_cell(cw - indent, 6, f"[ ] {label}. {opt_text}", align="L")

        elif q_type == "tf":
            for opt in ["Adevarat", "Fals"]:
                is_correct = opt.lower() == correct.lower()
                if is_correct:
                    pdf.set_font("DejaVu", "B", 10)
                    pdf.set_text_color(21, 128, 61)
                    pdf.set_fill_color(240, 253, 244)
                    pdf.set_x(pdf.l_margin + indent)
                    pdf.multi_cell(cw - indent, 6, f"[✓] {opt}", fill=True)
                else:
                    pdf.set_font("DejaVu", "", 10)
                    pdf.set_text_color(71, 85, 105)
                    pdf.set_x(pdf.l_margin + indent)
                    pdf.multi_cell(cw - indent, 6, f"[ ] {opt}")

        elif q_type == "fill":
            pdf.set_font("DejaVu", "", 10)
            pdf.set_text_color(71, 85, 105)
            pdf.set_x(pdf.l_margin + indent)
            pdf.cell(cw - indent, 6, "Raspuns:", align="L")
            pdf.ln(6)
            pdf.set_font("DejaVu", "B", 10)
            pdf.set_text_color(21, 128, 61)
            pdf.set_fill_color(240, 253, 244)
            pdf.set_x(pdf.l_margin + indent)
            pdf.multi_cell(cw - indent, 6, f"[✓] {correct}", fill=True)


        if q.explanation:
            pdf.ln(1)
            pdf.set_font("DejaVu", "", 9)
            pdf.set_text_color(100, 116, 139)
            pdf.set_fill_color(248, 250, 252)
            pdf.set_x(pdf.l_margin + indent)
            pdf.multi_cell(cw - indent, 5, f"Explicatie: {q.explanation}", fill=True)

        pdf.ln(5)


        if i < len(questions) - 1:
            pdf.set_draw_color(230, 230, 230)
            pdf.line(pdf.l_margin, pdf.get_y() - 1, pdf.w - pdf.r_margin, pdf.get_y() - 1)
            pdf.ln(3)

    # Cheie rapida de raspunsuri
    pdf.add_page()
    cw = pdf.cw
    pdf.set_font("DejaVu", "B", 13)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(cw, 8, "Cheie de raspunsuri", align="L")
    pdf.ln(8)
    pdf.set_draw_color(34, 197, 94)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(6)


    col_w    = cw / 3
    num_col  = 3
    for i, q in enumerate(questions):
        col = i % num_col
        x   = pdf.l_margin + col * col_w
        if col == 0 and i > 0:
            pdf.ln(8)
        pdf.set_x(x)
        pdf.set_font("DejaVu", "B", 10)
        pdf.set_text_color(71, 85, 105)
        pdf.cell(col_w * 0.25, 6, f"{i + 1}.", align="R")
        pdf.set_font("DejaVu", "B", 10)
        pdf.set_text_color(21, 128, 61)
        answer = str(q.correct_answer or "")
        if len(answer) > 22:
            answer = answer[:20] + "..."
        pdf.cell(col_w * 0.75, 6, answer, align="L")

    return bytes(pdf.output())


# Route

@router.get("/{quiz_id}/export-pdf")
async def export_quiz_pdf(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Exporta un quiz ca fisier PDF cu intrebari, optiuni si raspunsuri corecte."""

    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz   = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz-ul nu a fost gasit")

    if quiz.created_by != current_user.id and _val(current_user.role) != "admin":
        raise HTTPException(status_code=403, detail="Nu ai acces la acest quiz")

    q_result  = await db.execute(
        select(Question).where(Question.quiz_id == quiz_id).order_by(Question.order_index)
    )
    questions = q_result.scalars().all()
    if not questions:
        raise HTTPException(status_code=404, detail="Quiz-ul nu are intrebari")

    material_name = ""
    if quiz.material_id:
        m_res = await db.execute(select(Material).where(Material.id == quiz.material_id))
        mat   = m_res.scalar_one_or_none()
        if mat:
            material_name = mat.title or ""

    try:
        pdf_bytes = generate_quiz_pdf(quiz, questions, material_name)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Eroare la generarea PDF: {str(e)}")

    safe_title = "".join(c for c in (quiz.title or "quiz") if c.isalnum() or c in " -_")
    safe_title = safe_title.strip().replace(" ", "_")[:50] or "quiz"
    filename   = f"quiz_{quiz_id}_{safe_title}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )