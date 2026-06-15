import fitz
import os


def extract_text_from_pdf(pdf_path: str) -> str:
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF-ul nu a fost gasit: {pdf_path}")

    doc = fitz.open(pdf_path)
    full_text = ""

    for page_num, page in enumerate(doc):
        text = page.get_text()
        if text.strip():
            full_text += f"\n--- Pagina {page_num + 1} ---\n"
            full_text += text

    doc.close()

    if not full_text.strip():
        raise ValueError("PDF-ul nu contine text")

    return full_text