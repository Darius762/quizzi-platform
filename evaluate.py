from dotenv import load_dotenv
load_dotenv()

import pandas as pd
import json
import re
import os
import time
from groq import Groq
from bert_score import score as bert_score


# CONFIGURARE

CSV_PATH = r"C:\Users\dicul\Documents\FACULTATEA\LICENTA\quiz_generator_groq\EduQuizRO_balanced.csv"
NUM_SAMPLES = 100
RESULTS_PATH = "evaluation_results.json"

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# GENERARE INTREBARE DIN CONTEXT

def generate_question_from_context(context: str) -> dict:
    prompt = f"""You are a professor creating exam questions from course materials.
Based on the text below, generate exactly 1 multiple choice question.

TEXT:
{context}

STRICT RULES:
- Use ONLY information from the text
- Exactly 4 options (A, B, C, D), only one correct
- Wrong answers must be plausible
- Question and answers must be in Romanian

Respond ONLY with valid JSON, no markdown, no backticks:
{{
  "question": "intrebarea aici",
  "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
  "correct_answer": "A",
  "explanation": "explicatie in romana"
}}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=500
    )

    raw = response.choices[0].message.content.strip()
    raw = re.sub(r"```json|```", "", raw).strip()
    json_match = re.search(r'\{.*\}', raw, re.DOTALL)
    if json_match:
        raw = json_match.group()

    return json.loads(raw)



# EVALUARE PRINCIPALA

def run_evaluation():
    print("=== EVALUARE CALITATE INTREBARI ===\n")

    # incarcam CSV-ul
    df = pd.read_csv(CSV_PATH)
    samples = df.head(NUM_SAMPLES)
    print(f"Evaluam {NUM_SAMPLES} exemple din dataset...\n")

    generated_questions = []
    reference_questions = []
    results = []
    errors = 0

    for i, row in enumerate(samples.itertuples()):
        print(f"Procesez {i+1}/{NUM_SAMPLES}...", end="\r")

        try:
            generated = generate_question_from_context(row.context)
            generated_questions.append(generated["question"])
            reference_questions.append(row.question)

            results.append({
                "id": row.id,
                "context": row.context,
                "reference_question": row.question,
                "generated_question": generated["question"],
                "generated_options": generated.get("options", {}),
                "generated_correct": generated.get("correct_answer", ""),
                "reference_correct": row.correct_answer,
                "explanation": generated.get("explanation", "")
            })

            # pauza mica sa nu depasim rate limit
            time.sleep(0.5)

        except Exception as e:
            errors += 1
            print(f"\n   Eroare la exemplul {i+1}: {e}")
            continue

    print(f"\n\nGenerare completa! {len(generated_questions)} intrebari generate, {errors} erori.\n")


    # CALCUL BERTSCORE

    print("Calculez BERTScore...")
    P, R, F1 = bert_score(
        generated_questions,
        reference_questions,
        lang="ro",
        verbose=True
    )

    avg_precision = P.mean().item()
    avg_recall = R.mean().item()
    avg_f1 = F1.mean().item()

    print(f"\n=== REZULTATE BERTSCORE ===")
    print(f"Precision:  {avg_precision:.4f}")
    print(f"Recall:     {avg_recall:.4f}")
    print(f"F1 Score:   {avg_f1:.4f}")


    # STATISTICI SUPLIMENTARE

    correct_matches = sum(
        1 for r in results
        if r["generated_correct"].upper() == r["reference_correct"].upper()
    )
    accuracy = correct_matches / len(results) * 100

    print(f"\n=== STATISTICI SUPLIMENTARE ===")
    print(f"Total intrebari evaluate: {len(results)}")
    print(f"Erori generare:           {errors}")
    print(f"Answer accuracy:          {accuracy:.1f}%")


    final_results = {
        "summary": {
            "total_evaluated": len(results),
            "errors": errors,
            "bertscore_precision": avg_precision,
            "bertscore_recall": avg_recall,
            "bertscore_f1": avg_f1,
            "answer_accuracy": accuracy
        },
        "details": results
    }

    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(final_results, f, ensure_ascii=False, indent=2)

    print(f"\nRezultate salvate in: {RESULTS_PATH}")
    print("\n=== INTERPRETARE ===")
    print(f"BERTScore F1 {avg_f1:.4f} inseamna:")
    if avg_f1 >= 0.90:
        print("  -> Excelent! Intrebarile generate sunt foarte similare cu cele de referinta.")
    elif avg_f1 >= 0.85:
        print("  -> Foarte bine! Calitate ridicata, comparabila cu intrebarile umane.")
    elif avg_f1 >= 0.80:
        print("  -> Bine. Calitate acceptabila pentru un sistem automat.")
    else:
        print("  -> Acceptabil. Exista spatiu de imbunatatire.")

if __name__ == "__main__":
    run_evaluation()