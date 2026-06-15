// frontend/src/pages/Association.jsx
import { useState, useEffect, useRef } from "react";
import { getToken } from "../api/auth";
import { ArrowLeft, RefreshCw, Clock, Trophy, Zap } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const FALLBACK_PAIRS = [
  { term: "Algoritm",       def: "Secvență finită de pași pentru rezolvarea unei probleme" },
  { term: "Variabilă",      def: "Zonă de memorie identificată printr-un nume" },
  { term: "Funcție",        def: "Bloc de cod reutilizabil care îndeplinește o sarcină" },
  { term: "Recursivitate",  def: "Tehnică în care o funcție se apelează pe ea însăși" },
  { term: "Matrice",        def: "Structură de date bidimensională cu linii și coloane" },
  { term: "Polimorfism",    def: "Același nume, comportamente diferite în funcție de context" },
  { term: "Moștenire",      def: "O clasă preia proprietățile altei clase" },
  { term: "Encapsulare",    def: "Ascunderea detaliilor interne ale unui obiect" },
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Timer
function useTimer(running) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);
  const reset = () => setElapsed(0);
  const fmt = t => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  return { elapsed, fmt, reset };
}

// Card
function MatchCard({ text, selected, matched, wrong, onClick, color }) {
  let bg     = "var(--card)";
  let border = "var(--card-border)";
  let textC  = "var(--text)";

  if (matched) { bg = `${color}15`; border = `${color}40`; textC = color; }
  else if (wrong)    { bg = "rgba(239,68,68,0.12)"; border = "rgba(239,68,68,0.4)"; textC = "#f87171"; }
  else if (selected) { bg = `${color}18`; border = `${color}55`; textC = color; }

  return (
    <button
      onClick={onClick}
      disabled={matched}
      className="w-full text-left px-4 py-3.5 rounded-2xl text-sm font-medium transition-all"
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        color: textC,
        opacity: matched ? 0.35 : 1,
        cursor: matched ? "default" : "pointer",
        transform: selected ? "scale(1.02)" : "scale(1)",
        boxShadow: selected ? `0 0 16px ${color}30` : "none",
      }}
      onMouseEnter={e => { if (!matched && !selected) e.currentTarget.style.borderColor = `${color}40`; }}
      onMouseLeave={e => { if (!matched && !selected) e.currentTarget.style.borderColor = "var(--card-border)"; }}>
      {text}
    </button>
  );
}

//  Results
function Results({ pairs, elapsed, fmt, mistakes, onRetry, onBack }) {
  const total = pairs.length;
  const pct   = Math.round(((total - mistakes) / total) * 100);
  const color = pct === 100 ? "#22c55e" : pct >= 60 ? "#3b82f6" : "#f59e0b";

  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-8">
      <div className="rounded-3xl p-8 relative overflow-hidden"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 0%, ${color}18 0%, transparent 70%)` }} />

        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
          <Trophy size={28} style={{ color }} />
        </div>

        <h2 className="text-2xl font-black mb-1" style={{ color }}>
          {pct === 100 ? "Perfect!" : pct >= 60 ? "Bine făcut!" : "Mai încearcă!"}
        </h2>

        <div className="text-6xl font-black my-4" style={{ color }}>
          {pct}%
        </div>

        <div className="flex justify-center gap-4 text-sm">
          <div className="px-4 py-2 rounded-xl"
            style={{ backgroundColor: "var(--surface-1)" }}>
            <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Timp</p>
            <p className="font-bold" style={{ color: "var(--text)" }}>{fmt(elapsed)}</p>
          </div>
          <div className="px-4 py-2 rounded-xl"
            style={{ backgroundColor: "var(--surface-1)" }}>
            <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Greșeli</p>
            <p className="font-bold" style={{ color: "var(--text)" }}>{mistakes}</p>
          </div>
          <div className="px-4 py-2 rounded-xl"
            style={{ backgroundColor: "var(--surface-1)" }}>
            <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Perechi</p>
            <p className="font-bold" style={{ color: "var(--text)" }}>{total}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all"
          style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-sub)"}>
          <ArrowLeft size={15} /> Înapoi
        </button>
        <button onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all"
          style={{ backgroundColor: "#22c55e", color: "#000", boxShadow: "0 0 20px rgba(34,197,94,0.25)" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#4ade80"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}>
          <RefreshCw size={15} /> Joacă din nou
        </button>
      </div>
    </div>
  );
}

//  Main
export default function Association({ onBack }) {
  const [allPairs, setAllPairs]       = useState([]);
  const [pairs, setPairs]             = useState([]);      // perechile rundei curente
  const [terms, setTerms]             = useState([]);      // coloana stanga
  const [defs, setDefs]               = useState([]);      // coloana dreapta (amestecate)
  const [selTerm, setSelTerm]         = useState(null);    // index termen selectat
  const [selDef, setSelDef]           = useState(null);    // index definitie selectata
  const [matched, setMatched]         = useState([]);      // perechi corecte
  const [wrong, setWrong]             = useState({ term: null, def: null });
  const [mistakes, setMistakes]       = useState(0);
  const [finished, setFinished]       = useState(false);
  const [loading, setLoading]         = useState(true);
  const [timerOn, setTimerOn]         = useState(false);
  const { elapsed, fmt, reset }       = useTimer(timerOn && !finished);

  const PAIR_COUNT = 6;


  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/flashcards/`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (res.ok) {
          const cards = await res.json();

          const maskTerm = (term, def) => {
            const norm = s => s.toLowerCase()
              .replace(/[ăâ]/g,"a").replace(/î/g,"i")
              .replace(/[șş]/g,"s").replace(/[țţ]/g,"t");
            const termWords = term.split(/\s+/).filter(w => w.length >= 4);
            let result = def;
            termWords.forEach(tw => {
              const prefix = norm(tw).slice(0, Math.max(4, Math.floor(norm(tw).length * 0.7)));
              result = result.replace(
                /[a-zA-ZăâîșțĂÂÎȘȚşţ]+/g,
                token => norm(token).startsWith(prefix) ? "▪▪▪" : token
              );
            });
            return result;
          };

          const valid = cards.filter(c =>
            c.front?.trim().length >= 2 &&
            c.back?.trim().length >= 5 &&
            c.front.trim().length <= 40 &&
            c.back.trim().length <= 120
          ).map(c => ({
            term: c.front.trim(),
            def: maskTerm(c.front.trim(), c.back.trim())
          }));
          setAllPairs(valid.length >= PAIR_COUNT ? valid : FALLBACK_PAIRS);
        } else {
          setAllPairs(FALLBACK_PAIRS);
        }
      } catch {
        setAllPairs(FALLBACK_PAIRS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);


  useEffect(() => {
    if (allPairs.length === 0) return;
    startRound();
  }, [allPairs]);

  const startRound = () => {
    const selected = shuffle(allPairs).slice(0, PAIR_COUNT);
    setPairs(selected);
    setTerms(selected.map((p, i) => ({ ...p, idx: i })));
    setDefs(shuffle(selected.map((p, i) => ({ ...p, idx: i }))));
    setSelTerm(null); setSelDef(null);
    setMatched([]); setWrong({ term: null, def: null });
    setMistakes(0); setFinished(false);
    reset(); setTimerOn(true);
  };


  useEffect(() => {
    if (selTerm === null || selDef === null) return;

    const termPair = terms[selTerm];
    const defPair  = defs[selDef];

    if (termPair.idx === defPair.idx) {

      const newMatched = [...matched, termPair.idx];
      setMatched(newMatched);
      setSelTerm(null); setSelDef(null);
      if (newMatched.length === pairs.length) {
        setTimerOn(false);
        setTimeout(() => setFinished(true), 400);
      }
    } else {
      // Greșit — flash roșu
      setWrong({ term: selTerm, def: selDef });
      setMistakes(m => m + 1);
      setTimeout(() => {
        setWrong({ term: null, def: null });
        setSelTerm(null); setSelDef(null);
      }, 600);
    }
  }, [selTerm, selDef]);

  const handleTerm = (i) => {
    if (matched.includes(terms[i].idx)) return;
    setSelTerm(i === selTerm ? null : i);
  };

  const handleDef = (i) => {
    if (matched.includes(defs[i].idx)) return;
    setSelDef(i === selDef ? null : i);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: "var(--text-sub)" }}>Se încarcă perechile...</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}>
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Asociere rapidă</h1>
        </div>
        <Results pairs={pairs} elapsed={elapsed} fmt={fmt} mistakes={mistakes}
          onRetry={startRound} onBack={onBack} />
      </div>
    );
  }

  const termAccent  = "#22c55e";
  const defAccent   = "#3b82f6";
  const remaining   = pairs.length - matched.length;

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.backgroundColor = "var(--card-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-sub)"; e.currentTarget.style.backgroundColor = "var(--card)"; }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Asociere rapidă</h1>
            <p className="text-xs" style={{ color: "var(--text-sub)" }}>
              {remaining} perechi rămase
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}>
            <Clock size={14} />
            <span className="font-mono">{fmt(elapsed)}</span>
          </div>
          {/* Greșeli */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: mistakes > 0 ? "rgba(239,68,68,0.08)" : "var(--surface-1)", border: `1px solid ${mistakes > 0 ? "rgba(239,68,68,0.25)" : "var(--card-border)"}`, color: mistakes > 0 ? "#f87171" : "var(--text-muted)" }}>
            <Zap size={13} />
            {mistakes} greșeli
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(matched.length / pairs.length) * 100}%`, backgroundColor: "#22c55e" }} />
      </div>

      {/* Instrucțiuni */}
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
        <span className="px-2 py-0.5 rounded-md font-semibold" style={{ backgroundColor: `${termAccent}12`, color: termAccent }}>Termen</span>
        <span>→ selectează un termen, apoi definiția corespunzătoare</span>
        <span className="px-2 py-0.5 rounded-md font-semibold" style={{ backgroundColor: `${defAccent}12`, color: defAccent }}>Definiție</span>
      </div>

      {/* Coloane */}
      <div className="grid grid-cols-2 gap-4">
        {/* Termeni */}
        <div className="space-y-2.5">
          {terms.map((t, i) => (
            <MatchCard key={i} text={t.term}
              selected={selTerm === i}
              matched={matched.includes(t.idx)}
              wrong={wrong.term === i}
              color={termAccent}
              onClick={() => handleTerm(i)} />
          ))}
        </div>

        {/* Definiții */}
        <div className="space-y-2.5">
          {defs.map((d, i) => (
            <MatchCard key={i} text={d.def}
              selected={selDef === i}
              matched={matched.includes(d.idx)}
              wrong={wrong.def === i}
              color={defAccent}
              onClick={() => handleDef(i)} />
          ))}
        </div>
      </div>
    </div>
  );
}