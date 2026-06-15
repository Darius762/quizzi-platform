# Quizzi — Educational Platform with Automatic Quiz Generation

A full-stack educational web platform that automatically generates quizzes from PDF course materials using RAG (Retrieval-Augmented Generation) and a locally fine-tuned Romanian BERT model. Developed as a Bachelor's thesis project at the University of Craiova, Faculty of Automation, Computers and Electronics.

---

## Overview

Quizzi integrates two distinct question generation systems:

- **RAG + Groq/Llama 3.3 70B** — generates multiple choice, true/false, and fill-in-the-blank questions from any PDF, using semantic retrieval via ChromaDB and the Groq API
- **Romanian BERT (local)** — generates fill-in-the-blank (cloze) questions entirely offline, using a custom fine-tuned model trained on the original EduRO-FillBlank dataset

Beyond quiz generation, the platform includes spaced repetition flashcards (SM-2 algorithm), an ML-based academic performance predictor, interactive games, and a full admin panel.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + SQLAlchemy + PostgreSQL 16 |
| Frontend | React 19 + Tailwind CSS v4 + Vite |
| RAG Pipeline | ChromaDB + Sentence Transformers + Groq API |
| BERT Model | `dumitrescumartin/bert-base-romanian-cased-v1` fine-tuned on EduRO-FillBlank |
| Auth | JWT tokens |
| Migrations | Alembic |

---

## Original Contributions

### EduRO-FillBlank Dataset
A Romanian fill-in-the-blank dataset built from scratch by scraping Romanian Wikipedia, covering 45 academic categories. Cleaned and optimized across two versions:

- **v1**: 100,212 examples from 4,364 articles
- **v2**: 72,541 examples after strict linguistic filtering
- **v6**: 55,162 examples with semantic KeyBERT masking

🤗 [EduRO-FillBlank on Hugging Face](https://huggingface.co/datasets/dariurs/EduRO-FillBlank)

### BERT Fine-tuning (6 iterations)
Iterative fine-tuning of a Romanian BERT model across 6 versions, exploring Whole Word Masking, Domain-Adaptive Pre-Training (DAPT) with a 70/30 mixed corpus (EduRO + IJUSI), and KeyBERT semantic masking. Best internal validation accuracy: **Acc@1 = 57.31%** (+24.69 pp over baseline).

The v3 model is publicly released as the honest baseline — it outperforms v5 on a neutral Wikipedia evaluation corpus across 5 out of 6 metrics, demonstrating better generalization.

🤗 [EduRO-BERT v3 on Hugging Face](https://huggingface.co/dariurs/eduro-bert-romanian-fillblank-v3)

---

## Platform Features

- 📄 Upload PDF materials and generate quizzes instantly
- 🤖 Two generation modes: RAG (Groq API) and BERT (local, offline)
- 🃏 Spaced repetition flashcards with SM-2 algorithm
- 📊 Academic performance predictor (Linear Regression, R² = 0.9532)
- 🎮 Three interactive games (Wordle, etc.)
- 🛡️ Admin panel with user and material management
- 🌙 Dark-themed responsive UI

---

## Repository Structure

```
quizzi-platform/
├── app/
│   ├── api/routes/        # FastAPI endpoints
│   ├── core/              # BERT generators, RAG pipeline, PDF extractor
│   └── db/                # SQLAlchemy models, database config
├── frontend/
│   └── src/
│       ├── pages/         # React pages
│       └── api/           # API calls
├── alembic/               # Database migrations
├── main.py                # FastAPI entry point
└── requirements.txt
```

## License

Code: [MIT](LICENSE)  
Dataset & Model: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
