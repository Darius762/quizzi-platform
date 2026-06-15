"""
app/core/bert_generator_v5.py
Generator fill-in-the-blank cu BERT local — v5 (mixed DAPT EduRO+IJUSI)
"""

import re
import os
import random
import torch
from typing import List, Dict, Optional, Tuple
from transformers import AutoModelForMaskedLM, AutoTokenizer

MODEL_PATH_V5 = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..', 'bert_eduro_v5', 'best_model')
)

_model_v5 = None
_tokenizer_v5 = None
_device_v5 = None


def get_model_v5():
    global _model_v5, _tokenizer_v5, _device_v5
    if _model_v5 is None:
        print(f"[BERT v5] Incarcare model din {MODEL_PATH_V5}...")
        _device_v5 = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        _tokenizer_v5 = AutoTokenizer.from_pretrained(MODEL_PATH_V5)
        _model_v5 = AutoModelForMaskedLM.from_pretrained(MODEL_PATH_V5)
        _model_v5.eval()
        _model_v5.to(_device_v5)
        print(f"[BERT v5] Model incarcat pe {_device_v5}!")
    return _model_v5, _tokenizer_v5, _device_v5


def remove_diacritics(text: str) -> str:
    return (text.replace('ă','a').replace('â','a').replace('î','i')
                .replace('ș','s').replace('ț','t')
                .replace('ş','s').replace('ţ','t')
                .replace('Ă','A').replace('Â','A').replace('Î','I')
                .replace('Ș','S').replace('Ț','T')
                .replace('Ş','S').replace('Ţ','T'))


def is_clean_word(token: str) -> bool:
    """
    Verifica ca un token e un cuvant real, fara caractere ciudate.
    Fix principal fata de v3: elimina tokeni cu cratima, punct median,
    caractere de control, sau alte artefacte BERT.
    """
    if not token:
        return False

    allowed = re.compile(r'^[a-zA-ZăâîșțĂÂÎȘȚşţŞŢ][a-zA-ZăâîșțĂÂÎȘȚşţŞŢ\'-]*[a-zA-ZăâîșțĂÂÎȘȚşţŞŢ]$')

    if len(token) < 3 or len(token) > 25:
        return False

    if '--' in token or token.startswith('-') or token.endswith('-'):
        return False

    if not allowed.match(token):
        return False

    if re.search(r'[^a-zA-ZăâîșțĂÂÎȘȚşţŞŢ]{2,}', token):
        return False
    return True


# Cuvinte englezesti
EN_WORDS = {
    'the','and','of','in','is','are','was','were','that','this','with','for',
    'from','have','has','been','will','when','what','who','how','can','could',
    'would','should','they','their','there','where','which','an','it','its',
    'but','not','all','any','both','each','few','more','most','other','some',
    'such','than','too','very','just','did','do','does','had','may','might',
    'must','shall','up','out','about','into','through','nobody','everybody',
    'anybody','somebody','nice','good','bad','new','old','by','at','on','as',
    'or','if','so','we','he','she','you','my','our','your','his','her','same',
    'different','first','last','long','great','little','own','right','big',
    'high','small','large','next','early','young','important','public',
    'private','real','best','free','used','between','after','before','during',
    'above','below','also','then','now','only','well','even','back','still',
    'way','take','come','go','know','think','look','want','give','use','find',
    'tell','ask','seem','feel','try','leave','call','keep','let','begin','show',
}

# Stopwords romane
RO_STOPWORDS = {
    'este','sunt','care','prin','pentru','acest','această','acestui','unui',
    'unei','sau','dar','iar','când','unde','cum','dacă','poate','trebuie',
    'astfel','deci','între','după','înainte','despre','peste','aceste','acesta',
    'aceasta','alte','orice','fiecare','toate','toți','fiind','într','care',
    'această','reprezintă','folosește','permite','există','include','conține',
    'aproximativ','diferite','diverse','multiple','principale','importante',
    'specifice','generale','similare','comune','informații','sistem','sisteme',
    'proces','procese','rezultat','parte','nivel','forma','numărul','valoare',
    'valori','tipuri','utilizarea','utilizare','dezvoltarea','programare',
    'folosirea','precum','deoarece','deși','totuși','chiar','doar','numai',
    'mai','deja','încă','mereu','întotdeauna','uneori','adesea',
}



# PASUL 1: EXTRAGERE SI CURATARE TEXT

def clean_pdf_text(text: str) -> str:
    text = re.sub(r'-\s*\n\s*', '', text)
    text = re.sub(r'[^\x20-\x7E\u00C0-\u024F\u0100-\u024F\n\r\t]', ' ', text)
    text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*[-•·▪▸►★☆]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+[.)]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*[a-zA-Z][.)]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()


def extract_sentences(text: str) -> List[str]:
    text = clean_pdf_text(text)
    text = re.sub(r'(?<![.!?])\n(?=[a-zăâîșț])', ' ', text)
    raw = re.split(r'(?<=[.!?])\s+', text)
    sentences = []
    for s in raw:
        s = s.strip()
        s = re.sub(r'\s+', ' ', s)
        if s:
            sentences.append(s)
    return sentences


# PASUL 2: VALIDARE PROPOZITII

def is_complete_sentence(sentence: str) -> bool:
    s = sentence.strip()
    words = s.split()
    n = len(words)

    # FIX: relaxat de la 12 la 8 cuvinte minim, si de la 45 la 55 maxim
    if n < 8 or n > 55:
        return False
    if not s[0].isupper():
        return False
    if s[-1] not in '.!?':
        return False

    has_diacritics = bool(re.search(r'[ăâîșțĂÂÎȘȚ]', s))
    ro_markers = {'este','sunt','care','prin','pentru','sau','dar','când',
                  'unde','dacă','deci','astfel','după','între','despre',
                  'totuși','deoarece','deși','iar','ori','fie','nici'}
    words_lower = {w.lower().strip('.,;:!?()[]') for w in words}
    ro_count = len(words_lower & ro_markers)

    if not has_diacritics and ro_count < 2:
        return False

    en_count = sum(1 for w in words
                   if re.sub(r'[^a-z]','',w.lower()) in EN_WORDS
                   and len(re.sub(r'[^a-z]','',w.lower())) > 2)
    if en_count > 2:
        return False

    digit_ratio = sum(c.isdigit() for c in s) / max(len(s), 1)
    if digit_ratio > 0.08:
        return False

    if sum(1 for c in s if c in '[]{}|<>@#$%^&*=\\/') > 1:
        return False

    fragment_patterns = [
        r'^[-–•·▪]',
        r'^\d+[.)]\s',
        r'^[a-zA-Z][.)]\s',
        r'Pagina\s+\d',
        r'pag\.\s*\d',
        r'\bFig\.\s*\d',
        r'\bTabel\s+\d',
        r'^\s*Capitolul',
        r'^\s*Curs\s+\d',
        r'\.\.\.',
        r'^\s*NB\b',
        r'^\s*Obs\.',
        r'^\s*Note:',
        r'^\s*Exemplu:',
        r'^\s*Definitie:',
    ]
    for pat in fragment_patterns:
        if re.search(pat, s, re.IGNORECASE):
            return False

    # FIX: relaxat de la 5 la 3 cuvinte lungi minim
    long_words = [w for w in words
                  if len(re.sub(r'[^a-zA-ZăâîșțĂÂÎȘȚ]', '', w)) >= 5]
    if len(long_words) < 3:
        return False

    verb_pattern = re.compile(
        r'(ează|ăşte|ește|ăsc|esc|ând|ind|ează|uite|ate|ite|ute|ată|ită)$',
        re.IGNORECASE
    )
    has_verb = any(
        verb_pattern.search(re.sub(r'[^a-zA-ZăâîșțĂÂÎȘȚ]', '', w))
        for w in words if len(w) > 4
    )
    if not has_verb:
        return False

    return True


# PASUL 3: SELECTIE CUVANT DE MASCAT

def find_mask_candidate(sentence: str, tokenizer) -> Optional[Tuple[int, str, str, str]]:
    words = sentence.split()
    n = len(words)
    candidates = []

    for i, word in enumerate(words):
        clean = re.sub(r'[^a-zA-ZăâîșțĂÂÎȘȚşţŞŢ-]', '', word)

        if len(clean) < 5:
            continue
        # FIX: relaxat marginile de la 3 la 2 cuvinte de la capete
        if i < 2 or i >= n - 2:
            continue
        if clean.lower() in RO_STOPWORDS:
            continue

        clean_nodiac = remove_diacritics(clean.lower())
        if clean_nodiac in EN_WORDS:
            continue
        if any(c.isdigit() for c in clean):
            continue

        if not is_clean_word(clean):
            continue

        tokens = tokenizer.tokenize(clean)
        if not tokens:
            continue
        if tokens[0].startswith('##'):
            continue
        if len(tokens) > 2:
            continue

        pos_score  = 1 - abs(i - n/2) / (n/2 + 1)
        len_score  = min(len(clean) / 12, 1.0)
        diac_bonus = 0.3 if re.search(r'[ăâîșțĂÂÎȘȚ]', clean) else 0.0
        freq_penalty = -0.2 if clean.lower() in {'această','acestei','acestui',
                                                   'aceste','acești','acelor'} else 0.0
        score = pos_score * 0.3 + len_score * 0.4 + diac_bonus * 0.2 + freq_penalty + 0.1

        candidates.append((i, word, clean, score))

    if not candidates:
        return None

    candidates.sort(key=lambda x: x[3], reverse=True)
    best = candidates[0]
    return best[0], best[1], best[2], best[1]


# PASUL 4: GENERARE DISTRACTORI CU BERT

def generate_distractors(
    sentence: str,
    mask_idx: int,
    correct: str,
    tokenizer,
    model,
    device,
    k: int = 3
) -> List[str]:
    words = sentence.split()
    masked_sent = ' '.join('[MASK]' if i == mask_idx else w for i, w in enumerate(words))

    enc = tokenizer(
        masked_sent,
        return_tensors='pt',
        max_length=128,
        truncation=True,
        padding='max_length'
    )
    input_ids      = enc['input_ids'].to(device)
    attention_mask = enc['attention_mask'].to(device)

    mask_pos_list = (input_ids == tokenizer.mask_token_id).nonzero(as_tuple=True)[1]
    if len(mask_pos_list) == 0:
        return []

    with torch.no_grad():
        out = model(input_ids=input_ids, attention_mask=attention_mask)

    logits  = out.logits[0, mask_pos_list[0], :]
    top_ids = torch.topk(logits, 100).indices.tolist()

    correct_lower  = correct.lower()
    correct_nodiac = remove_diacritics(correct_lower)
    ans_len        = len(correct)

    results = []
    seen    = {correct_lower, correct_nodiac, remove_diacritics(correct_lower)}

    for tid in top_ids:
        token = tokenizer.decode([tid]).strip()

        if not token:
            continue

        if re.search(r'[#\[\]{}|<>@$%^&*=\\/()_+~`]', token):
            continue

        if token.startswith('##'):
            continue

        if re.search(r'[\u00B7\u2013\u2014\u2015\u2022\u2026\u00AD]', token):
            continue

        if not is_clean_word(token):
            continue

        token_lower  = token.lower()
        token_nodiac = remove_diacritics(token_lower)
        token_alpha  = re.sub(r'[^a-z]', '', token_nodiac)

        if token_lower in seen or token_nodiac in seen:
            continue
        if token_alpha in EN_WORDS and len(token_alpha) > 3:
            continue
        if len(token) < ans_len * 0.4 or len(token) > ans_len * 2.2:
            continue

        sub_toks = tokenizer.tokenize(token)
        if not sub_toks or sub_toks[0].startswith('##'):
            continue
        if len(token_alpha) < 3:
            continue

        seen.add(token_lower)
        seen.add(token_nodiac)
        results.append(token)

        if len(results) >= k:
            break

    return results


# FUNCTIA PRINCIPALA — GENERARE FILL-IN-THE-BLANK (v5)

def generate_fillblank_questions_v5(text: str, num_questions: int = 10) -> List[Dict]:
    """
    Genereaza intrebari fill-in-the-blank cu modelul BERT v5.
    Identic cu v3 ca pipeline, dar foloseste modelul v5 (mixed DAPT).
    """
    model, tokenizer, device = get_model_v5()

    sentences = extract_sentences(text)
    good = [s for s in sentences if is_complete_sentence(s)]

    if not good:
        return []

    # FIX: clampam num_questions la ce e realist din materialul disponibil
    # in medie ~1 intrebare reusita la 3 propozitii bune (nu toate trec de mask+distractori)
    actual_num = num_questions
    print(f"[BERT] {len(good)} propozitii valide, cerute={num_questions}")

    random.shuffle(good)

    questions      = []
    used_answers   = set()
    used_sentences = set()

    for sentence in good:
        if len(questions) >= actual_num:
            break

        sent_key = sentence[:50].lower()
        if sent_key in used_sentences:
            continue

        result = find_mask_candidate(sentence, tokenizer)
        if result is None:
            continue

        mask_idx, orig_word, clean, answer_raw = result

        answer = re.sub(r'[^a-zA-ZăâîșțĂÂÎȘȚşţŞŢ-]', '', orig_word)

        if not is_clean_word(answer):
            continue

        answer_key = remove_diacritics(answer.lower())
        if answer_key in used_answers:
            continue

        distractors = generate_distractors(
            sentence, mask_idx, answer,
            tokenizer, model, device, k=5
        )

        if len(distractors) < 3:
            continue

        distractors = distractors[:3]

        words = sentence.split()
        masked = ' '.join(
            '_____' if i == mask_idx else w
            for i, w in enumerate(words)
        )

        if '_____' not in masked:
            continue

        options = [answer] + distractors
        random.shuffle(options)

        questions.append({
            "question_text":     masked,
            "correct_answer":    answer,
            "options":           options,
            "original_sentence": sentence,
            "explanation":       f"Propoziția originală: \"{sentence}\"",
            "type":              "fill_bert",
        })

        used_answers.add(answer_key)
        used_sentences.add(sent_key)

    return questions