"""
create_dataset.py - v3
Script automat pentru crearea dataset-ului EduRO-FillBlank
Target: 100.000 exemple
Nou in v3: extrage si subcategorii, relaxeaza filtrele, mai multe propozirii per articol
"""

import re
import json
import time
import requests
import csv
import os
from tqdm import tqdm

# Configuratie

WIKI_API = "https://ro.wikipedia.org/w/api.php"
OUTPUT_FILE = "eduro_fillblank.csv"
OUTPUT_JSON = "eduro_fillblank.json"
MIN_SENTENCE_LEN = 7    # relaxat de la 10
MAX_SENTENCE_LEN = 50   # marit de la 40
MAX_ARTICLES_PER_CATEGORY = 200
MAX_SUBCATEGORY_DEPTH = 1   # extrage si subcategorii de nivel 1
MIN_WORD_LEN = 4
TARGET_EXAMPLES = 100000

HEADERS = {
    "User-Agent": "EduRO-Dataset/3.0 (licenta academica; contact: student@university.ro)",
    "Accept": "application/json",
}


CATEGORIES = [
    # Informatica
    "Informatică", "Algoritmi", "Programare orientată pe obiecte",
    "Structuri de date", "Baze de date", "Rețele de calculatoare",
    "Inteligență artificială", "Sisteme de operare", "Limbaje de programare",
    "Securitate informatică", "Inginerie software", "Calculatoare",
    "Programare", "Internet", "Robotică", "Telecomunicații",
    # Economie
    "Economie", "Microeconomie", "Macroeconomie", "Management",
    "Marketing", "Finanțe", "Contabilitate", "Economie politică",
    "Teoria jocurilor", "Comerț",
    # Matematica
    "Matematică", "Algebră", "Analiză matematică", "Geometrie",
    "Statistică", "Probabilitate", "Logică matematică", "Topologie",
    # Stiinte naturale
    "Fizică", "Chimie", "Biologie", "Chimie organică",
    "Chimie anorganică", "Biochimie", "Ecologie", "Genetică",
    "Neurologie", "Fizică teoretică", "Fizică aplicată",
    "Meteorologie", "Geologie", "Astronomie", "Paleontologie",
    # Inginerie
    "Inginerie", "Electronică", "Electrotehnică", "Mecanică",
    "Automatică", "Nanotehnologie", "Energetică", "Arhitectură",
    # Stiinte sociale
    "Psihologie", "Sociologie", "Filozofie", "Drept",
    "Medicină", "Anatomie", "Pedagogie", "Antropologie",
    "Arheologie", "Lingvistică", "Etică",
    # Altele
    "Istorie", "Geografie", "Oceanografie",
]

# Wikipedia API

def get_articles_from_category(category, max_articles=200):
    articles = []
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": f"Categorie:{category}",
        "cmlimit": 500,
        "cmtype": "page",
        "format": "json",
        "utf8": 1,
    }
    try:
        response = requests.get(WIKI_API, params=params, headers=HEADERS, timeout=15)
        response.raise_for_status()
        data = response.json()
        members = data.get("query", {}).get("categorymembers", [])
        articles = [m["title"] for m in members[:max_articles]]
    except Exception as e:
        pass
    return articles


def get_subcategories(category, max_sub=10):
    """Obtine subcategoriile unei categorii"""
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": f"Categorie:{category}",
        "cmlimit": max_sub,
        "cmtype": "subcat",
        "format": "json",
        "utf8": 1,
    }
    try:
        response = requests.get(WIKI_API, params=params, headers=HEADERS, timeout=15)
        response.raise_for_status()
        data = response.json()
        members = data.get("query", {}).get("categorymembers", [])
        # Returneaza numele subcategoriei fara prefixul "Categorie:"
        return [m["title"].replace("Categorie:", "") for m in members]
    except:
        return []


def get_article_text(title):
    params = {
        "action": "query",
        "prop": "extracts",
        "explaintext": True,
        "titles": title,
        "format": "json",
        "utf8": 1,
    }
    try:
        response = requests.get(WIKI_API, params=params, headers=HEADERS, timeout=15)
        response.raise_for_status()
        data = response.json()
        pages = data.get("query", {}).get("pages", {})
        for page_id, page in pages.items():
            if page_id != "-1":
                return page.get("extract", "")
    except:
        pass
    return ""


# Procesare text

def clean_text(text):
    text = re.sub(r'==+[^=]+=+\n?', ' ', text)
    text = re.sub(r'\[\d+\]', '', text)
    text = re.sub(r'\([^)]{0,30}\)', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'  +', ' ', text)
    return text.strip()


def split_into_sentences(text):
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-ZĂÂÎȘȚ])', text)
    sentences = [s.strip().replace('\n', ' ') for s in sentences]
    sentences = [s for s in sentences if len(s) > 15 and not re.search(r'[|{}<>]', s)]
    return sentences


def is_good_sentence(sentence):
    words = sentence.split()
    if len(words) < MIN_SENTENCE_LEN or len(words) > MAX_SENTENCE_LEN:
        return False
    long_words = [w for w in words if len(re.sub(r'[^a-zA-ZăâîșțĂÂÎȘȚ]', '', w)) >= MIN_WORD_LEN]
    if len(long_words) < 2:
        return False
    if sentence.count(':') > 2:
        return False
    return True


def find_best_word_to_mask(sentence):
    words = sentence.split()
    stopwords = {
        'este', 'sunt', 'care', 'prin', 'pentru', 'acest', 'această',
        'unui', 'unei', 'sau', 'dar', 'iar', 'când', 'unde', 'cum',
        'dacă', 'poate', 'trebuie', 'astfel', 'deci', 'între', 'după',
        'înainte', 'despre', 'peste', 'aceste', 'acesta', 'aceasta',
        'alte', 'orice', 'fiecare', 'toate', 'toți', 'fiind', 'într',
        'also', 'have', 'were', 'been', 'their', 'from', 'that', 'this',
    }
    candidates = []
    for i, word in enumerate(words):
        clean_word = re.sub(r'[^a-zA-ZăâîșțĂÂÎȘȚ-]', '', word)
        if len(clean_word) < MIN_WORD_LEN:
            continue
        if i < 1 or i > len(words) - 2:
            continue
        if clean_word.lower() in stopwords:
            continue

        if re.match(r'^[a-z]+$', clean_word) and len(clean_word) < 6:
            continue
        position_score = 1 - abs(i - len(words)/2) / (len(words)/2)
        length_score = min(len(clean_word) / 10, 1.0)
        score = position_score * 0.4 + length_score * 0.6
        candidates.append((i, word, clean_word, score))

    if not candidates:
        return None, None, None
    candidates.sort(key=lambda x: x[3], reverse=True)
    idx, original_word, clean_word, _ = candidates[0]
    return idx, original_word, clean_word


def create_fill_in_blank(sentence):
    idx, original_word, clean_word = find_best_word_to_mask(sentence)
    if idx is None:
        return None, None
    words = sentence.split()
    masked_sentence = ' '.join('_____' if i == idx else w for i, w in enumerate(words))
    return masked_sentence, clean_word


#Incarcare date existente

def load_existing_data():
    existing_sentences = set()
    existing_examples = []
    if os.path.exists(OUTPUT_FILE):
        print(f"📂 CSV existent găsit: {OUTPUT_FILE}")
        try:
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    existing_sentences.add(row['sentence'])
                    existing_examples.append(row)
            print(f"   Exemple existente: {len(existing_examples)}")
        except Exception as e:
            print(f"   ⚠ Eroare: {e}")
    return existing_sentences, existing_examples


# Procesare categorie

def process_category(category, seen_sentences, all_examples, stats):
    """Proceseaza o categorie si subcategoriile ei"""
    if len(all_examples) >= TARGET_EXAMPLES:
        return

    articles = get_articles_from_category(category, MAX_ARTICLES_PER_CATEGORY)
    new_in_cat = 0

    for title in articles:
        if len(all_examples) >= TARGET_EXAMPLES:
            break

        text = get_article_text(title)
        if not text:
            continue

        stats["articles"] += 1
        text = clean_text(text)
        sentences = split_into_sentences(text)
        stats["sentences"] += len(sentences)

        for sentence in sentences:
            if not is_good_sentence(sentence):
                continue
            if sentence in seen_sentences:
                stats["duplicates"] += 1
                continue

            seen_sentences.add(sentence)
            masked, answer = create_fill_in_blank(sentence)
            if masked is None:
                continue

            all_examples.append({
                "sentence": sentence,
                "masked_sentence": masked,
                "answer": answer,
                "category": category,
                "source": title,
            })
            stats["new_examples"] += 1
            new_in_cat += 1

        time.sleep(0.03)

    return new_in_cat


# Pipeline principal

def create_dataset():
    print("=" * 60)
    print("EduRO-FillBlank Dataset Creator v3")
    print(f"Target: {TARGET_EXAMPLES:,} exemple")
    print("=" * 60)


    print("\n🔗 Testez conexiunea...")
    try:
        test = requests.get(WIKI_API,
                           params={"action": "query", "meta": "siteinfo", "format": "json"},
                           headers=HEADERS, timeout=10)
        test.raise_for_status()
        print("✅ OK!\n")
    except Exception as e:
        print(f"❌ Eroare: {e}")
        return []


    seen_sentences, all_examples = load_existing_data()
    initial_count = len(all_examples)
    print(f"\n▶ Pornesc cu {initial_count:,} exemple | Target: {TARGET_EXAMPLES:,}\n")

    stats = {"articles": 0, "sentences": 0, "new_examples": 0, "duplicates": 0}

    for category in tqdm(CATEGORIES, desc="Categorii principale"):
        if len(all_examples) >= TARGET_EXAMPLES:
            print(f"\n🎯 Target atins: {len(all_examples):,} exemple!")
            break

        print(f"\n📚 {category} [{len(all_examples):,}/{TARGET_EXAMPLES:,}]")


        new_main = process_category(category, seen_sentences, all_examples, stats)
        print(f"   +{new_main} din categoria principală")

        if len(all_examples) >= TARGET_EXAMPLES:
            break


        if MAX_SUBCATEGORY_DEPTH > 0:
            subcats = get_subcategories(category, max_sub=8)
            if subcats:
                print(f"   Subcategorii: {len(subcats)}")
                for subcat in subcats:
                    if len(all_examples) >= TARGET_EXAMPLES:
                        break
                    new_sub = process_category(subcat, seen_sentences, all_examples, stats)
                    if new_sub and new_sub > 0:
                        print(f"   +{new_sub} din subcategoria: {subcat[:40]}")
                    time.sleep(0.1)

    print(f"\n{'='*60}")
    print(f"✅ STATISTICI FINALE:")
    print(f"   Existente la start:   {initial_count:,}")
    print(f"   Exemple noi:          {stats['new_examples']:,}")
    print(f"   Total final:          {len(all_examples):,}")
    print(f"   Articole procesate:   {stats['articles']:,}")
    print(f"   Duplicate sarite:     {stats['duplicates']:,}")
    print(f"{'='*60}")


    print(f"\n💾 Salvez {OUTPUT_FILE}...")
    try:
        with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=["sentence", "masked_sentence", "answer", "category", "source"])
            writer.writeheader()
            writer.writerows(all_examples)
        print("✅ CSV salvat!")
    except PermissionError:
        alt_file = "eduro_fillblank_new.csv"
        print(f"⚠ Fisierul e deschis! Salvez in {alt_file}...")
        with open(alt_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=["sentence", "masked_sentence", "answer", "category", "source"])
            writer.writeheader()
            writer.writerows(all_examples)
        print(f"✅ Salvat in {alt_file}!")

    print(f"💾 Salvez {OUTPUT_JSON}...")
    try:
        with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
            json.dump({
                "dataset_name": "EduRO-FillBlank",
                "version": "3.0",
                "description": "Dataset pentru fill-in-the-blank in limba romana, domeniu academic",
                "source": "Wikipedia Romania",
                "total_examples": len(all_examples),
                "categories": CATEGORIES,
                "examples": all_examples
            }, f, ensure_ascii=False, indent=2)
        print("✅ JSON salvat!")
    except PermissionError:
        print("⚠ JSON deschis, skip.")

    print(f"\n🎉 Gata! Total: {len(all_examples):,} exemple")
    return all_examples


if __name__ == "__main__":
    create_dataset()