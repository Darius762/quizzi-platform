// frontend/src/pages/CompareQuiz.jsx
import { useState, useEffect, useRef } from "react";
import { getToken } from "../api/auth";
import {
  GitCompare, FileText, ChevronDown, X, Search,
  Loader2, Globe, Trophy, ThumbsUp, ThumbsDown,
  Minus, Star, AlertTriangle, CheckCircle, Clock
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";
const h = () => ({ Authorization: `Bearer ${getToken()}` });

async function fetchMaterials() {
  const res = await fetch(`${API_URL}/materials/`, { headers: h() });
  if (!res.ok) throw new Error("Eroare la încărcarea materialelor");
  return res.json();
}
async function generateCompare(payload) {
  const res = await fetch(`${API_URL}/compare-quiz/generate`, {
    method: "POST",
    headers: { ...h(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Eroare la generare"); }
  return res.json();
}

// Culori sisteme
const SYSTEMS = {
  groq:    { color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.25)",   label: "Groq / Llama" },
  bert_v3: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.25)",  label: "BERT v3 · Cloze" },
  bert_v5: { color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.25)",  label: "BERT v5 · Hard" },
};

// Dropdown material
function MaterialDropdown({ materials, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.subject?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-all"
        style={{ backgroundColor: "var(--card)", border: `1px solid ${open ? "rgba(99,102,241,0.45)" : "var(--card-border)"}` }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--card-hover)"}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--card)"}>
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={15} style={{ color: selected ? "#6366f1" : "var(--text-sub)" }} className="flex-shrink-0" />
          <span className="text-sm font-medium truncate" style={{ color: selected ? "var(--text)" : "var(--text-sub)" }}>
            {selected ? selected.title : "Alege un material..."}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {selected && (
            <div onClick={e => { e.stopPropagation(); onSelect(null); }}
              className="p-1 rounded-md cursor-pointer"
              onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-sub)"; e.currentTarget.style.backgroundColor = "transparent"; }}
              style={{ color: "var(--text-sub)" }}>
              <X size={13} />
            </div>
          )}
          <ChevronDown size={15} style={{ color: "var(--text-sub)", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
        </div>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ backgroundColor: "var(--modal)", border: "1px solid var(--card-border)" }}>
          {materials.length > 4 && (
            <div className="p-3 relative" style={{ borderBottom: "1px solid var(--divider)" }}>
              <Search size={13} className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-sub)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută material..." autoFocus
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)", color: "var(--text)" }}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.45)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--card-border)"} />
            </div>
          )}
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.map(m => (
              <button key={m.id} onClick={() => { onSelect(m); setOpen(false); setSearch(""); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                style={{ backgroundColor: selected?.id === m.id ? "rgba(99,102,241,0.08)" : "transparent" }}
                onMouseEnter={e => { if (selected?.id !== m.id) e.currentTarget.style.backgroundColor = "var(--surface-1)"; }}
                onMouseLeave={e => { if (selected?.id !== m.id) e.currentTarget.style.backgroundColor = "transparent"; }}>
                <FileText size={14} style={{ color: selected?.id === m.id ? "#6366f1" : "var(--text-sub)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: selected?.id === m.id ? "var(--text)" : "var(--text-sub)" }}>{m.title}</p>
                  {m.subject && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{m.subject}</p>}
                </div>
                {m.is_global && (
                  <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: "rgba(99,102,241,0.1)", color: "#818cf8" }}>
                    <Globe size={9} />Global
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Card intrebare cu rating
function QuestionCard({ question, index, systemKey, rating, onRate }) {
  const sys = SYSTEMS[systemKey];
  const [showOptions, setShowOptions] = useState(false);
  return (
    <div className="rounded-xl p-4 transition-all"
      style={{ backgroundColor: "var(--surface-1)", border: `1px solid ${rating ? sys.border : "var(--card-border)"}` }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: sys.bg, color: sys.color, border: `1px solid ${sys.border}` }}>
          #{index + 1}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {[
            { icon: ThumbsUp,   val: "good",    label: "Bună",    col: "#22c55e" },
            { icon: Minus,      val: "neutral",  label: "OK",      col: "#f59e0b" },
            { icon: ThumbsDown, val: "bad",      label: "Slabă",   col: "#ef4444" },
          ].map(({ icon: Icon, val, label, col }) => (
            <button key={val} onClick={() => onRate(val)} title={label}
              className="p-1.5 rounded-lg transition-all"
              style={{
                backgroundColor: rating === val ? `${col}20` : "transparent",
                border: `1px solid ${rating === val ? col : "transparent"}`,
                color: rating === val ? col : "var(--text-muted)",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = col; e.currentTarget.style.backgroundColor = `${col}15`; }}
              onMouseLeave={e => {
                e.currentTarget.style.color = rating === val ? col : "var(--text-muted)";
                e.currentTarget.style.backgroundColor = rating === val ? `${col}20` : "transparent";
              }}>
              <Icon size={13} />
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text)" }}>
        {question.question_text}
      </p>
      <button onClick={() => setShowOptions(o => !o)}
        className="text-xs transition-all mb-2"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={e => e.currentTarget.style.color = sys.color}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
        {showOptions ? "Ascunde variante ▲" : "Vezi variante ▼"}
      </button>
      {showOptions && (
        <div className="space-y-1.5">
          {question.options.map((opt, i) => {
            const isCorrect = opt === question.correct_answer;
            return (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{
                  backgroundColor: isCorrect ? "rgba(34,197,94,0.08)" : "var(--card)",
                  border: `1px solid ${isCorrect ? "rgba(34,197,94,0.3)" : "var(--card-border)"}`,
                  color: isCorrect ? "#22c55e" : "var(--text-sub)",
                }}>
                {isCorrect && <CheckCircle size={11} style={{ color: "#22c55e", flexShrink: 0 }} />}
                <span>{opt}</span>
              </div>
            );
          })}
          {question.explanation && (
            <p className="text-xs mt-2 px-1 italic" style={{ color: "var(--text-muted)" }}>
              {question.explanation.slice(0, 120)}{question.explanation.length > 120 ? "..." : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

//  Coloana sistem
function SystemColumn({ systemKey, result, ratings, onRate }) {
  const sys = SYSTEMS[systemKey];
  if (!result) return (
    <div className="flex-1 min-w-0 rounded-2xl p-5 flex items-center justify-center"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)", minHeight: 200 }}>
      <Loader2 size={22} className="animate-spin" style={{ color: sys.color }} />
    </div>
  );
  return (
    <div className="flex-1 min-w-0 rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${sys.border}` }}>
      {/* Header coloana */}
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ backgroundColor: sys.bg, borderBottom: `1px solid ${sys.border}` }}>
        <div>
          <p className="text-sm font-black" style={{ color: sys.color }}>{sys.label}</p>
          {result.duration_sec && (
            <div className="flex items-center gap-1 mt-0.5">
              <Clock size={10} style={{ color: "var(--text-muted)" }} />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{result.duration_sec}s</p>
            </div>
          )}
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-lg"
          style={{ backgroundColor: `${sys.color}20`, color: sys.color, border: `1px solid ${sys.border}` }}>
          {result.error ? "Eroare" : `${result.questions?.length || 0} întrebări`}
        </span>
      </div>

      {/* Continut */}
      <div className="p-4 space-y-3" style={{ backgroundColor: "var(--card)" }}>
        {result.error ? (
          <div className="flex items-start gap-2 rounded-xl px-4 py-3"
            style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#f87171" }} />
            <p className="text-xs" style={{ color: "#f87171" }}>{result.error}</p>
          </div>
        ) : result.questions?.map((q, i) => (
          <QuestionCard key={i} question={q} index={i} systemKey={systemKey}
            rating={ratings[`${systemKey}_${i}`]}
            onRate={val => onRate(`${systemKey}_${i}`, val)} />
        ))}
      </div>
    </div>
  );
}

// Scoreboard
function Scoreboard({ results, ratings, numQuestions }) {
  const scores = Object.keys(SYSTEMS).map(sysKey => {
    const result = results[sysKey];
    if (!result || result.error) return { sysKey, total: 0, good: 0, neutral: 0, bad: 0 };
    let good = 0, neutral = 0, bad = 0;
    for (let i = 0; i < numQuestions; i++) {
      const r = ratings[`${sysKey}_${i}`];
      if (r === "good") good++;
      else if (r === "neutral") neutral++;
      else if (r === "bad") bad++;
    }
    const total = good * 3 + neutral * 1 + bad * 0;
    return { sysKey, total, good, neutral, bad };
  }).sort((a, b) => b.total - a.total);

  const maxScore = numQuestions * 3;
  const winner = scores[0];
  const allZero = scores.every(s => s.total === 0);

  return (
    <div className="rounded-2xl p-6 mt-6"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
      <div className="flex items-center gap-3 mb-5">
        <Trophy size={20} style={{ color: "#f59e0b" }} />
        <h3 className="text-base font-black" style={{ color: "var(--text)" }}>
          Scoreboard — Voturile tale
        </h3>
        {!allZero && (
          <span className="text-xs px-2 py-1 rounded-lg font-bold ml-auto"
            style={{ backgroundColor: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}>
            {SYSTEMS[winner.sysKey].label} câștigă!
          </span>
        )}
      </div>
      <div className="space-y-3">
        {scores.map((s, rank) => {
          const sys = SYSTEMS[s.sysKey];
          const pct = maxScore > 0 ? (s.total / maxScore) * 100 : 0;
          return (
            <div key={s.sysKey}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {rank === 0 && !allZero && <Trophy size={12} style={{ color: "#f59e0b" }} />}
                  <span className="text-sm font-semibold" style={{ color: sys.color }}>{sys.label}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    ({s.good}👍 {s.neutral}➖ {s.bad}👎)
                  </span>
                </div>
                <span className="text-sm font-black" style={{ color: sys.color }}>
                  {s.total}/{maxScore}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--divider)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: sys.color }} />
              </div>
            </div>
          );
        })}
      </div>
      {allZero && (
        <p className="text-xs text-center mt-4" style={{ color: "var(--text-muted)" }}>
          Evaluează întrebările cu 👍 👎 pentru a vedea scoreboard-ul
        </p>
      )}
      <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
        Sistem de punctaj: 👍 Bună = 3 puncte · ➖ OK = 1 punct · 👎 Slabă = 0 puncte
      </p>
    </div>
  );
}

// Pagina principala
export default function CompareQuiz() {
  const [materials, setMaterials]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [numQ, setNumQ]             = useState(5);
  const [generating, setGenerating] = useState(false);
  const [results, setResults]       = useState(null);
  const [ratings, setRatings]       = useState({});
  const [error, setError]           = useState("");

  useEffect(() => {
    fetchMaterials().then(setMaterials).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!selected) return;
    setError(""); setGenerating(true); setResults(null); setRatings({});
    try {
      const data = await generateCompare({ material_id: selected.id, num_questions: numQ });
      setResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleRate = (key, val) => {
    setRatings(prev => ({ ...prev, [key]: prev[key] === val ? undefined : val }));
  };

  const totalRated = results
    ? Object.keys(SYSTEMS).reduce((sum, sys) => {
        return sum + Array.from({ length: numQ }, (_, i) => ratings[`${sys}_${i}`] ? 1 : 0).reduce((a,b)=>a+b,0);
      }, 0)
    : 0;
  const totalToRate = results ? Object.keys(SYSTEMS).length * numQ : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.28)" }}>
            <GitCompare size={20} style={{ color: "#6366f1" }} />
          </div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Comparație Modele</h1>
          <span className="text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider"
            style={{ backgroundColor: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8" }}>
            Live
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--text-sub)" }}>
          Generează fill-in-the-blank cu toate 3 sisteme simultan și votează care e mai bun.
        </p>
      </div>

      {/* Formular */}
      <div className="rounded-2xl p-5 space-y-4"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-sub)" }}>
            1. Selectează materialul
          </p>
          {loading ? (
            <div className="flex justify-center py-5 rounded-xl" style={{ border: "1px dashed var(--card-border)" }}>
              <Loader2 size={18} className="animate-spin" style={{ color: "#6366f1" }} />
            </div>
          ) : (
            <MaterialDropdown materials={materials} selected={selected} onSelect={setSelected} />
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-sub)" }}>
            2. Număr de întrebări per sistem
          </p>
          <div className="flex gap-2">
            {[3, 5, 8, 10].map(n => {
              const on = numQ === n;
              return (
                <button key={n} onClick={() => setNumQ(n)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    backgroundColor: on ? "rgba(99,102,241,0.15)" : "var(--card)",
                    border: `1px solid ${on ? "rgba(99,102,241,0.45)" : "var(--card-border)"}`,
                    color: on ? "#818cf8" : "var(--text-sub)",
                  }}>
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Previzualizare sisteme */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {Object.entries(SYSTEMS).map(([key, sys]) => (
            <div key={key} className="rounded-xl px-3 py-2.5 text-center"
              style={{ backgroundColor: sys.bg, border: `1px solid ${sys.border}` }}>
              <p className="text-xs font-bold" style={{ color: sys.color }}>{sys.label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl px-4 py-3"
            style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button onClick={handleGenerate} disabled={!selected || generating}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={{
            backgroundColor: selected && !generating ? "#6366f1" : "var(--card)",
            color:            selected && !generating ? "#fff"    : "var(--text-sub)",
            border:           selected && !generating ? "none"    : "1px solid var(--card-border)",
            boxShadow:        selected && !generating ? "0 0 20px rgba(99,102,241,0.3)" : "none",
          }}
          onMouseEnter={e => selected && !generating && (e.currentTarget.style.backgroundColor = "#4f46e5")}
          onMouseLeave={e => selected && !generating && (e.currentTarget.style.backgroundColor = "#6366f1")}>
          {generating ? (
            <><Loader2 size={15} className="animate-spin" />Se generează cu toate 3 sistemele...</>
          ) : selected ? (
            <><GitCompare size={15} />Generează {numQ} întrebări × 3 sisteme</>
          ) : (
            <><FileText size={15} />Selectează un material</>
          )}
        </button>

        {generating && (
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(SYSTEMS).map(([key, sys]) => (
              <div key={key} className="rounded-xl px-3 py-2.5 flex items-center gap-2"
                style={{ backgroundColor: sys.bg, border: `1px solid ${sys.border}` }}>
                <Loader2 size={12} className="animate-spin flex-shrink-0" style={{ color: sys.color }} />
                <p className="text-xs font-medium truncate" style={{ color: sys.color }}>{sys.label}...</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rezultate — 3 coloane */}
      {results && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black" style={{ color: "var(--text)" }}>
              Rezultate — {results.material_title}
            </h2>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {totalRated}/{totalToRate} întrebări evaluate
            </span>
          </div>

          <div className="flex gap-4 items-start">
            {Object.keys(SYSTEMS).map(sysKey => (
              <SystemColumn
                key={sysKey}
                systemKey={sysKey}
                result={results[sysKey]}
                ratings={ratings}
                onRate={handleRate}
              />
            ))}
          </div>

          <Scoreboard results={results} ratings={ratings} numQuestions={numQ} />
        </>
      )}
    </div>
  );
}