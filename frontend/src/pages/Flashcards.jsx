// frontend/src/pages/Flashcards.jsx
import { useState, useEffect } from "react";
import { getToken } from "../api/auth";
import {
  Plus, Trash2, ChevronLeft, Frown, Meh, Smile,
  Flame, Clock, RotateCcw, Brain, ChevronDown,
  Loader2, BookOpen, X, AlertCircle, Layers,
  FolderOpen, Play, Zap
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";
const h  = () => ({ Authorization: `Bearer ${getToken()}` });
const hj = () => ({ ...h(), "Content-Type": "application/json" });

// Flip CSS
const FLIP_CSS = `
  .fc-scene { perspective: 1200px; }
  .fc-inner {
    position: relative; width: 100%; height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.55s cubic-bezier(0.4,0,0.2,1);
    cursor: pointer;
  }
  .fc-inner.is-flipped { transform: rotateY(180deg); }
  .fc-face {
    position: absolute; inset: 0;
    backface-visibility: hidden; -webkit-backface-visibility: hidden;
    border-radius: 28px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 3rem; text-align: center;
  }
  .fc-back { transform: rotateY(180deg); }
`;

function useFlipStyles() {
  useEffect(() => {
    if (!document.getElementById("fc-css")) {
      const s = document.createElement("style");
      s.id = "fc-css"; s.textContent = FLIP_CSS;
      document.head.appendChild(s);
    }
  }, []);
}

// Helpers
function isDue(c) {
  return !c.next_review || c.repetitions === 0 || new Date(c.next_review) <= new Date();
}

function getDueInfo(c) {
  if (!c.next_review || c.repetitions === 0)
    return { label: "Nou", color: "#a855f7", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.25)" };
  const diff = Math.ceil((new Date(c.next_review) - new Date()) / 86400000);
  if (diff <= 0) return { label: "Scadent", color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)" };
  if (diff === 1) return { label: "Mâine",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" };
  return { label: `${diff} zile`,           color: "#22c55e", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.25)" };
}

//  Generate Modal
function GenerateModal({ materials, onClose, onGenerated }) {
  const [mId, setMId]         = useState("");
  const [num, setNum]         = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const submit = async () => {
    if (!mId) return setError("Selectează un material");
    setError(""); setLoading(true);
    try {
      const r = await fetch(`${API_URL}/flashcards/generate`, {
        method: "POST", headers: hj(),
        body: JSON.stringify({ material_id: parseInt(mId), num_cards: num }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.detail || "Eroare"); }
      onGenerated(); onClose();
    } catch (e) { setError(e.message); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--modal)", border: "1px solid var(--input-border)" }}>
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid var(--divider)" }}>
          <h2 className="font-bold text-base" style={{ color: "var(--text)" }}>Generează flashcard-uri</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--text-sub)" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--divider)"; e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--text-sub)"; }}>
            <X size={15} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-sub)" }}>Material</p>
            <select value={mId} onChange={e => setMId(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)", color: mId ? "var(--text)" : "var(--text-sub)" }}>
              <option value="">Alege materialul...</option>
              {materials.map(m => <option key={m.id} value={m.id} style={{ backgroundColor: "var(--modal)" }}>{m.title}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-sub)" }}>Număr carduri</p>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map(n => (
                <button key={n} onClick={() => setNum(n)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: num === n ? "rgba(34,197,94,0.15)" : "var(--card)",
                    border: `1px solid ${num === n ? "rgba(34,197,94,0.4)" : "var(--card-border)"}`,
                    color: num === n ? "#22c55e" : "var(--text-sub)",
                  }}>{n}</button>
              ))}
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              <AlertCircle size={13} />{error}
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: "#22c55e" }} />
              <p className="text-xs" style={{ color: "#22c55e" }}>Se generează... 10–30 secunde</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-sub)"}>Anulează</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ backgroundColor: "#22c55e", color: "#000" }}
            onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = "#16a34a")}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}>
            {loading ? "Se generează..." : "Generează"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Flash Card (mini, în grilă)
function FlashCardMini({ card, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const due = getDueInfo(card);

  return (
    <div className="rounded-2xl overflow-hidden transition-all group"
      style={{
        backgroundColor: "var(--surface-1)",
        border: `1px solid var(--surface-2)`,
      }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-sm font-medium leading-snug flex-1" style={{ color: "var(--text)" }}>{card.front}</p>
          <button onClick={() => onDelete(card.id)}
            className="p-1 rounded-lg transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.backgroundColor = "transparent"; }}>
            <Trash2 size={12} />
          </button>
        </div>
        {/* Status + recenzii */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: due.bg, border: `1px solid ${due.border}`, color: due.color }}>
            <Clock size={9} />{due.label}
          </span>
          {card.repetitions > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa" }}>
              <RotateCcw size={9} />{card.repetitions}× repetat
            </span>
          )}
        </div>
      </div>
      {/* Răspuns expandabil */}
      <button onClick={() => setExpanded(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium transition-all"
        style={{ borderTop: "1px solid var(--surface-2)", color: "var(--text-muted)" }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--text-sub)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
        <span>Răspuns</span>
        <ChevronDown size={13} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
      </button>
      {expanded && (
        <div className="px-4 py-3" style={{ borderTop: "1px solid var(--card)", backgroundColor: "rgba(255,255,255,0.02)" }}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-sub)" }}>{card.back}</p>
        </div>
      )}
    </div>
  );
}

// Material Group
function MaterialGroup({ name, cards, onDelete, onStudy, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const dueCount = cards.filter(isDue).length;
  const totalReps = cards.reduce((s, c) => s + (c.repetitions || 0), 0);

  // Accent color hash
  const COLORS = ["#22c55e","#3b82f6","#a855f7","#f59e0b","#06b6d4","#ec4899"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % COLORS.length;
  const accent = COLORS[hash];

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{
        border: `1px solid ${open ? "var(--input-border)" : "var(--card-hover)"}`,
        backgroundColor: "rgba(255,255,255,0.02)",
      }}>

      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5">
        {/* Dot + icon */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: dueCount > 0 ? "rgba(239,68,68,0.1)" : `${accent}15` }}>
          <FolderOpen size={18} style={{ color: dueCount > 0 ? "#ef4444" : accent }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>{name}</h3>
            {dueCount > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.22)" }}>
                <Flame size={10} />{dueCount} scadente
              </span>
            )}
          </div>
          <p className="text-sm" style={{ color: "var(--text-sub)" }}>
            {cards.length} carduri
            {totalReps > 0 && <span style={{ color: "var(--text-muted)" }}> · {totalReps} recenzii</span>}
          </p>
        </div>

        {/* Butoane MARI */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {dueCount > 0 && (
            <button
              onClick={() => onStudy(cards.filter(isDue))}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
              style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.18)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)"; }}>
              <Zap size={15} />Scadente ({dueCount})
            </button>
          )}
          <button
            onClick={() => onStudy(cards)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ backgroundColor: "#22c55e", color: "#000", boxShadow: "0 0 16px rgba(34,197,94,0.2)" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#16a34a"; e.currentTarget.style.boxShadow = "0 0 24px rgba(34,197,94,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#22c55e"; e.currentTarget.style.boxShadow = "0 0 16px rgba(34,197,94,0.2)"; }}>
            <Play size={15} />Studiază tot
          </button>
          <button
            onClick={() => setOpen(o => !o)}
            className="p-3 rounded-xl transition-all"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--surface-2)", color: "var(--text-sub)" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-sub)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "var(--card)"; e.currentTarget.style.color = "var(--text-sub)"; }}>
            <ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.25s" }} />
          </button>
        </div>
      </div>

      {/* Cards grid */}
      {open && (
        <div className="px-5 pb-5 pt-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
          style={{ borderTop: "1px solid var(--surface-2)" }}>
          {cards.map(c => (
            <div key={c.id} className="group">
              <FlashCardMini card={c} onDelete={onDelete} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

//Study Session
function StudySession({ cards, onClose }) {
  useFlipStyles();
  const [index, setIndex]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone]       = useState(false);
  const [results, setResults] = useState([]);

  const card     = cards[index];
  const progress = (index / cards.length) * 100;

  const rate = async (rating) => {
    setResults(p => [...p, { rating }]);
    await fetch(`${API_URL}/flashcards/${card.id}/review`, {
      method: "POST", headers: hj(), body: JSON.stringify({ rating }),
    });
    if (index + 1 < cards.length) { setIndex(i => i + 1); setFlipped(false); }
    else setDone(true);
  };

  // Done screen
  if (done) {
    const hard = results.filter(r => r.rating === 0).length;
    const ok   = results.filter(r => r.rating === 3).length;
    const easy = results.filter(r => r.rating === 5).length;
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
        style={{ backgroundColor: "var(--bg-deep)" }}>
        <div className="w-full max-w-md px-6 text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <Brain size={36} style={{ color: "#22c55e" }} />
          </div>
          <h2 className="text-3xl font-black mb-2" style={{ color: "var(--text)" }}>Sesiune completă!</h2>
          <p className="text-sm mb-10" style={{ color: "var(--text-sub)" }}>Ai revizuit {cards.length} carduri</p>
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: "Greu", count: hard, color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: Frown },
              { label: "Ok",   count: ok,   color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: Meh },
              { label: "Ușor", count: easy, color: "#22c55e", bg: "rgba(34,197,94,0.08)",  icon: Smile },
            ].map(r => {
              const Icon = r.icon;
              return (
                <div key={r.label} className="rounded-2xl p-5 text-center"
                  style={{ backgroundColor: r.bg, border: `1px solid ${r.color}22` }}>
                  <Icon size={24} className="mx-auto mb-2" style={{ color: r.color }} />
                  <p className="text-2xl font-black" style={{ color: r.color }}>{r.count}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: r.color, opacity: 0.7 }}>{r.label}</p>
                </div>
              );
            })}
          </div>
          <button onClick={onClose}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all"
            style={{ backgroundColor: "#22c55e", color: "#000" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#16a34a"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}>
            Înapoi la bibliotecă
          </button>
        </div>
      </div>
    );
  }

  //Card screen
  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: "var(--bg-deep)" }}>

      {/* Top bar */}
      <div className="flex items-center px-8 py-5 flex-shrink-0">
        <button onClick={onClose}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--input-border)", color: "var(--text-sub)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-sub)"; e.currentTarget.style.borderColor = "var(--input-border)"; }}>
          <ChevronLeft size={16} />Ieși
        </button>

        <div className="flex items-center gap-4 flex-1 mx-8">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--divider)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #22c55e, #4ade80)" }} />
          </div>
          <span className="text-sm font-bold flex-shrink-0" style={{ color: "var(--text-sub)" }}>
            {index + 1} <span style={{ color: "var(--text-muted)" }}>/</span> {cards.length}
          </span>
        </div>

        <div style={{ width: "88px" }} />
      </div>

      {/* Flip card */}
      <div className="flex-1 flex items-center justify-center px-8 py-4">
        <div className="w-full max-w-2xl flex flex-col gap-6">

          {/* Card */}
          <div className="fc-scene" style={{ height: "260px" }}>
            <div className={`fc-inner ${flipped ? "is-flipped" : ""}`}
              style={{ height: "260px" }}
              onClick={() => setFlipped(f => !f)}>

              {/* Front */}
              <div className="fc-face"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--input-border)" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--card-hover)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--card)"}>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
                  style={{ backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" }}>
                  <BookOpen size={13} style={{ color: "#60a5fa" }} />
                  <span className="text-xs font-semibold" style={{ color: "#60a5fa" }}>Întrebare</span>
                </div>
                <p className="text-2xl font-bold leading-snug max-w-lg" style={{ color: "var(--text)" }}>{card.front}</p>
                <p className="text-xs mt-6 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                  <span>Click pentru răspuns</span>
                </p>
              </div>

              {/* Back */}
              <div className="fc-face fc-back"
                style={{ backgroundColor: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.25)" }}>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
                  style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
                  <Brain size={13} style={{ color: "#22c55e" }} />
                  <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>Răspuns</span>
                </div>
                <p className="text-xl font-semibold leading-relaxed max-w-lg" style={{ color: "var(--text-sub)" }}>{card.back}</p>
                {card.repetitions > 0 && (
                  <div className="flex items-center gap-1.5 mt-6 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: "var(--surface-2)" }}>
                    <RotateCcw size={11} style={{ color: "var(--text-sub)" }} />
                    <span className="text-xs" style={{ color: "var(--text-sub)" }}>Repetat de {card.repetitions}×</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating buttons — MARI */}
          <div className={`grid grid-cols-3 gap-4 transition-all duration-300 ${flipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
            {[
              {
                rating: 0, label: "Greu", sub: "Repet azi",
                icon: Frown, color: "#f87171",
                bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)",
                hover: "rgba(239,68,68,0.15)",
              },
              {
                rating: 3, label: "Ok", sub: "Interval mic",
                icon: Meh, color: "#fbbf24",
                bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)",
                hover: "rgba(245,158,11,0.15)",
              },
              {
                rating: 5, label: "Ușor", sub: "Interval mare",
                icon: Smile, color: "#4ade80",
                bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)",
                hover: "rgba(34,197,94,0.15)",
              },
            ].map(r => {
              const Icon = r.icon;
              return (
                <button key={r.rating} onClick={() => rate(r.rating)}
                  className="flex flex-col items-center gap-3 py-6 rounded-2xl transition-all"
                  style={{ backgroundColor: r.bg, border: `1px solid ${r.border}` }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = r.hover; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = r.bg; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <Icon size={28} style={{ color: r.color }} />
                  <div className="text-center">
                    <p className="text-base font-bold" style={{ color: r.color }}>{r.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: r.color, opacity: 0.55 }}>{r.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function FlashcardsPage() {
  const [cards, setCards]          = useState([]);
  const [materials, setMaterials]  = useState([]);
  const [loading, setLoading]      = useState(true);
  const [showGen, setShowGen]      = useState(false);
  const [studying, setStudying]    = useState(false);
  const [sessionCards, setSession] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        fetch(`${API_URL}/materials/`, { headers: h() }),
        fetch(`${API_URL}/flashcards/`, { headers: h() }),
      ]);
      setMaterials(await mRes.json());
      setCards(await cRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Sigur ștergi cardul?")) return;
    await fetch(`${API_URL}/flashcards/${id}`, { method: "DELETE", headers: h() });
    setCards(p => p.filter(c => c.id !== id));
  };

  if (studying) return <StudySession cards={sessionCards} onClose={() => { setStudying(false); load(); }} />;

  const grouped = cards.reduce((acc, c) => {
    const mat = materials.find(m => m.id === c.material_id);
    const key = mat ? mat.title : "Diverse";
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const totalDue  = cards.filter(isDue).length;
  const totalReps = cards.reduce((s, c) => s + (c.repetitions || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Flashcard-uri</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-sub)" }}>
            {cards.length} carduri · {Object.keys(grouped).length} materiale
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalDue > 0 && (
            <button onClick={() => { setSession(cards.filter(isDue)); setStudying(true); }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
              style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.18)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)"; }}>
              <Zap size={16} />{totalDue} de revizuit
            </button>
          )}
          <button onClick={() => setShowGen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ backgroundColor: "#22c55e", color: "#000", boxShadow: "0 0 24px rgba(34,197,94,0.2)" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#16a34a"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}>
            <Plus size={16} />Generează
          </button>
        </div>
      </div>

      {/* Stats */}
      {cards.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Layers,    label: "Total carduri",   val: cards.length, color: "var(--text-sub)" },
            { icon: Clock,     label: "De revizuit azi", val: totalDue,     color: totalDue > 0 ? "#ef4444" : "#22c55e" },
            { icon: RotateCcw, label: "Recenzii totale", val: totalReps,    color: "#3b82f6" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-4 px-5 py-4 rounded-xl"
                style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--divider)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${s.color}12` }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xl font-black" style={{ color: "var(--text)" }}>{s.val}</p>
                  <p className="text-xs" style={{ color: "var(--text-sub)" }}>{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={26} className="animate-spin" style={{ color: "#22c55e" }} />
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-24 rounded-2xl"
          style={{ border: "1px dashed var(--divider)" }}>
          <Layers size={36} className="mx-auto mb-3" style={{ color: "var(--text-faint)" }} />
          <p className="font-medium text-sm" style={{ color: "var(--text-sub)" }}>Niciun flashcard încă</p>
          <p className="text-xs mt-1 mb-5" style={{ color: "var(--text-muted)" }}>Generează din materialele tale pentru a începe</p>
          <button onClick={() => setShowGen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ backgroundColor: "#22c55e", color: "#000" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#16a34a"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}>
            <Plus size={15} />Generează acum
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([name, gCards], i) => (
            <MaterialGroup key={name} name={name} cards={gCards}
              onDelete={handleDelete}
              onStudy={(c) => { setSession(c); setStudying(true); }}
              defaultOpen={i === 0} />
          ))}
        </div>
      )}

      {showGen && <GenerateModal materials={materials} onClose={() => setShowGen(false)} onGenerated={load} />}
    </div>
  );
}