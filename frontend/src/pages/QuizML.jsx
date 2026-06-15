// frontend/src/pages/QuizML.jsx
import { useState, useEffect, useRef } from "react";
import { getToken } from "../api/auth";
import {
  PenLine, AlertTriangle, Info, FileText,
  ChevronDown, X, Loader2, Globe, Search, Sparkles, CheckCircle
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";
const h = () => ({ Authorization: `Bearer ${getToken()}` });

async function fetchMaterials() {
  const res = await fetch(`${API_URL}/materials/`, { headers: h() });
  if (!res.ok) throw new Error("Eroare la încărcarea materialelor");
  return res.json();
}
async function generateBertQuiz(payload) {
  const res = await fetch(`${API_URL}/bert-quiz/generate`, {
    method: "POST",
    headers: { ...h(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Eroare la generare"); }
  return res.json();
}

function BtnGroup({ label, options, value, onChange, accent = "#3b82f6" }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: "var(--text-sub)" }}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(o => {
          const on = value === o.value;
          return (
            <button key={o.value} onClick={() => onChange(o.value)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: on ? `${accent}18` : "var(--card)",
                border: `1px solid ${on ? `${accent}45` : "var(--card-border)"}`,
                color: on ? accent : "var(--text-sub)",
              }}
              onMouseEnter={e => { if (!on) { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--divider)"; }}}
              onMouseLeave={e => { if (!on) { e.currentTarget.style.color = "var(--text-sub)"; e.currentTarget.style.borderColor = "var(--card-border)"; }}}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MaterialDropdown({ materials, selected, onSelect }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef();

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = m => { onSelect(selected?.id === m.id ? null : m); setOpen(false); setSearch(""); };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-all"
        style={{
          backgroundColor: open ? "var(--card-hover)" : "var(--card)",
          border: `1px solid ${open ? "rgba(59,130,246,0.45)" : "var(--card-border)"}`,
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.backgroundColor = "var(--card-hover)"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = "var(--card)"; }}>
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={15} style={{ color: selected ? "#3b82f6" : "var(--text-sub)" }} className="flex-shrink-0" />
          <span className="text-sm font-medium truncate"
            style={{ color: selected ? "var(--text)" : "var(--text-sub)" }}>
            {selected ? selected.title : "Alege un material din listă..."}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {selected && (
            <div onClick={e => { e.stopPropagation(); onSelect(null); }}
              className="p-1 rounded-md transition-all cursor-pointer"
              style={{ color: "var(--text-sub)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-sub)"; e.currentTarget.style.backgroundColor = "transparent"; }}>
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
              <Search size={13} className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-sub)" }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Caută material..." autoFocus
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)", color: "var(--text)" }}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(59,130,246,0.45)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--card-border)"} />
            </div>
          )}
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-center py-5" style={{ color: "var(--text-sub)" }}>Niciun rezultat</p>
            ) : filtered.map(m => (
              <button key={m.id} onClick={() => handleSelect(m)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                style={{ backgroundColor: selected?.id === m.id ? "rgba(59,130,246,0.08)" : "transparent" }}
                onMouseEnter={e => { if (selected?.id !== m.id) e.currentTarget.style.backgroundColor = "var(--surface-1)"; }}
                onMouseLeave={e => { if (selected?.id !== m.id) e.currentTarget.style.backgroundColor = "transparent"; }}>
                <FileText size={14} style={{ color: selected?.id === m.id ? "#3b82f6" : "var(--text-sub)" }} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate"
                    style={{ color: selected?.id === m.id ? "var(--text)" : "var(--text-sub)" }}>
                    {m.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {m.subject && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{m.subject}</span>}
                    {m.is_global && (
                      <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>
                        <Globe size={9} />Global
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuizML({ onStartQuiz }) {
  const [materials, setMaterials]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [numQuestions, setNum]      = useState(10);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState("");
  const [pendingQuiz, setPendingQuiz] = useState(null); // quiz generat parțial, așteaptă confirmare

  useEffect(() => {
    fetchMaterials().then(setMaterials).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!selected) return;
    setError("");
    setPendingQuiz(null);
    setGenerating(true);
    try {
      const quiz = await generateBertQuiz({ material_id: selected.id, num_questions: numQuestions });
      // dacă s-au generat mai puține decât s-au cerut, afișăm warning înainte să pornim
      if (quiz.num_questions < quiz.requested_questions) {
        setPendingQuiz(quiz);
      } else {
        if (onStartQuiz) onStartQuiz(quiz);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex justify-center pb-10">
      <div className="w-full max-w-2xl space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.28)" }}>
              <PenLine size={20} style={{ color: "#3b82f6" }} />
            </div>
            <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Quiz Cloze</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--text-sub)" }}>
            Completează spațiile libere din textul tău. Generat local, fără API extern.
          </p>
        </div>

        {/* Ce e diferit față de Quiz Cloze Hard */}
        <div className="rounded-2xl p-5 flex gap-4"
          style={{ backgroundColor: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <Info size={20} className="flex-shrink-0 mt-0.5" style={{ color: "#3b82f6" }} />
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: "#60a5fa" }}>
              Varianta standard — recomandat pentru început
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
              Modelul identifică cuvântul corect mai precis, iar variantele greșite sunt
              mai ușor de eliminat. Ideal pentru{" "}
              <span style={{ color: "#60a5fa" }}>recapitulare și memorare activă</span> —
              când vrei să verifici că ai reținut termenii cheie din material.
              Dacă vrei un challenge mai serios, încearcă{" "}
              <span style={{ color: "#a78bfa", fontWeight: "600" }}>Quiz Cloze · Hard</span>.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-2xl p-5 flex gap-4"
          style={{ backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: "#fcd34d" }}>
              Rulează local — calitate variabilă
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
              Spre deosebire de quizurile generate cu Groq/Llama, acest tip de quiz
              rulează complet pe server,{" "}
              <span style={{ color: "#fcd34d" }}>fără niciun API extern</span>.
              Calitatea întrebărilor depinde de textul din PDF — funcționează cel mai bine
              pe materiale cu propoziții complete și vocabular academic.
            </p>
          </div>
        </div>

        {/* Cum funcționează */}
        <div className="rounded-2xl p-6"
          style={{ backgroundColor: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.15)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Info size={15} style={{ color: "#3b82f6" }} />
            <p className="text-sm font-bold" style={{ color: "#60a5fa" }}>Cum funcționează?</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { step: "1", label: "Extrage propoziții", desc: "complete din PDF" },
              { step: "2", label: "Alege un cuvânt",    desc: "cheie din propoziție" },
              { step: "3", label: "Generează variante", desc: "una corectă, trei greșite" },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" }}>
                  {s.step}
                </div>
                <p className="text-xs font-bold mb-0.5" style={{ color: "var(--text)" }}>{s.label}</p>
                <p className="text-xs" style={{ color: "var(--text-sub)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Formular */}
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-sub)" }}>
              1. Selectează materialul
            </p>
            {loading ? (
              <div className="flex justify-center py-6 rounded-xl"
                style={{ border: "1px dashed var(--card-border)" }}>
                <Loader2 size={20} className="animate-spin" style={{ color: "#3b82f6" }} />
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-8 rounded-xl"
                style={{ border: "1px dashed var(--card-border)" }}>
                <p className="text-sm" style={{ color: "var(--text-sub)" }}>Nu ai materiale uploadate încă</p>
              </div>
            ) : (
              <MaterialDropdown materials={materials} selected={selected} onSelect={setSelected} />
            )}
          </div>
          <BtnGroup label="2. Număr de întrebări" value={numQuestions} onChange={setNum}
            options={[{value:5,label:"5"},{value:10,label:"10"},{value:15,label:"15"},{value:20,label:"20"}]} />
        </div>

        {/* Warning generare parțială */}
        {pendingQuiz && (
          <div className="rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: "#fcd34d" }}>
                  Material scurt — s-au generat {pendingQuiz.num_questions} din {pendingQuiz.requested_questions} întrebări cerute
                </p>
                <p className="text-sm" style={{ color: "var(--text-sub)" }}>
                  PDF-ul nu conține suficiente propoziții complete pentru a genera {pendingQuiz.requested_questions} întrebări.
                  Poți continua cu cele {pendingQuiz.num_questions} disponibile sau încarcă un material mai lung.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { if (onStartQuiz) onStartQuiz(pendingQuiz); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ backgroundColor: "#3b82f6", color: "#fff" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#2563eb"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#3b82f6"}>
                <CheckCircle size={15} />
                Continuă cu {pendingQuiz.num_questions} întrebări
              </button>
              <button
                onClick={() => setPendingQuiz(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-sub)"}>
                Anulează
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />{error}
          </div>
        )}

        {generating && (
          <div className="flex items-center gap-3 rounded-xl px-5 py-4"
            style={{ backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <Loader2 size={17} className="animate-spin flex-shrink-0" style={{ color: "#3b82f6" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                Se procesează PDF-ul...
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
                Se extrag propozițiile și se generează variantele. Poate dura 15–45 secunde.
              </p>
            </div>
          </div>
        )}

        <button onClick={handleGenerate} disabled={!selected || generating || !!pendingQuiz}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={{
            backgroundColor: selected && !generating && !pendingQuiz ? "#3b82f6" : "var(--card)",
            color:            selected && !generating && !pendingQuiz ? "#fff"    : "var(--text-sub)",
            border:           selected && !generating && !pendingQuiz ? "none"    : "1px solid var(--card-border)",
            boxShadow:        selected && !generating && !pendingQuiz ? "0 0 20px rgba(59,130,246,0.25)" : "none",
          }}
          onMouseEnter={e => selected && !generating && !pendingQuiz && (e.currentTarget.style.backgroundColor = "#2563eb")}
          onMouseLeave={e => selected && !generating && !pendingQuiz && (e.currentTarget.style.backgroundColor = "#3b82f6")}>
          {generating ? (
            <><Loader2 size={15} className="animate-spin" />Se generează...</>
          ) : selected ? (
            <><Sparkles size={15} />Generează {numQuestions} întrebări</>
          ) : (
            <><FileText size={15} />Selectează un material</>
          )}
        </button>
      </div>
    </div>
  );
}