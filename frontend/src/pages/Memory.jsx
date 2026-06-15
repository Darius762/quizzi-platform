// frontend/src/pages/Memory.jsx
import { useState, useEffect, useRef } from "react";
import { getToken } from "../api/auth";
import { ArrowLeft, RefreshCw, Clock, Trophy, Brain } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const FALLBACK_PAIRS = [
  { term: "Algoritm",      def: "Secvență finită de pași pentru rezolvarea unei probleme" },
  { term: "Variabilă",     def: "Zonă de memorie identificată printr-un nume" },
  { term: "Funcție",       def: "Bloc de cod reutilizabil care îndeplinește o sarcină" },
  { term: "Recursivitate", def: "Tehnică în care o funcție se apelează pe ea însăși" },
  { term: "Matrice",       def: "Structură de date bidimensională cu linii și coloane" },
  { term: "Moștenire",     def: "O clasă preia proprietățile altei clase" },
];

function fisherYates(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function useTimer(running) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (running) ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
    else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running]);
  const fmt = t => `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`;
  return { elapsed, fmt, setElapsed };
}

function MemCard({ card, flipped, matched, onClick }) {
  const accent = card.type === "term" ? "#22c55e" : "#3b82f6";
  return (
    <div onClick={onClick} className="relative cursor-pointer select-none"
      style={{ perspective: "600px", height: "90px" }}>
      <div className="w-full h-full transition-all duration-300"
        style={{ transformStyle:"preserve-3d", transform: (flipped||matched) ? "rotateY(180deg)" : "rotateY(0deg)", position:"relative" }}>
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
          style={{ backfaceVisibility:"hidden", backgroundColor:"var(--card)", border:"1px solid var(--card-border)" }}>
          <Brain size={20} style={{ color:"var(--text-muted)" }} />
        </div>
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center p-3 text-center"
          style={{ backfaceVisibility:"hidden", transform:"rotateY(180deg)",
            backgroundColor: matched ? `${accent}12` : `${accent}10`,
            border:`1px solid ${matched ? `${accent}50` : `${accent}30`}` }}>
          <p className="text-xs font-semibold leading-snug"
            style={{ color: matched ? accent : "var(--text)",
              display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {card.text}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Memory({ onBack }) {

  const [cards,     setCards]     = useState([]);

  const [matched,   setMatched]   = useState(new Set());

  const [open,      setOpen]      = useState([]);

  const [locked,    setLocked]    = useState(false);
  const [attempts,  setAttempts]  = useState(0);
  const [finished,  setFinished]  = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [timerOn,   setTimerOn]   = useState(false);
  const { elapsed, fmt, setElapsed } = useTimer(timerOn);


  const totalPairs = cards.length / 2;

  async function fetchPairs() {
    try {
      const res = await fetch(`${API_URL}/flashcards/`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) return FALLBACK_PAIRS;
      const data = await res.json();
      const valid = data.filter(c =>
        c.front?.trim().length >= 2 &&
        c.back?.trim().length  >= 4 &&
        c.front.trim().length  <= 60 &&
        c.back.trim().length   <= 120
      ).map(c => ({ term: c.front.trim(), def: c.back.trim() }));
      return valid.length >= 2 ? valid : FALLBACK_PAIRS;
    } catch {
      return FALLBACK_PAIRS;
    }
  }

  async function startGame() {
    setLoading(true);
    setFinished(false);
    setMatched(new Set());
    setOpen([]);
    setLocked(false);
    setAttempts(0);
    setElapsed(0);
    setTimerOn(false);

    const pairs   = await fetchPairs();
    const count   = Math.min(6, pairs.length);
    const chosen  = fisherYates(pairs).slice(0, count);
    const ts      = Date.now();
    const deck    = fisherYates(
      chosen.flatMap((p, i) => [
        { uid: `t${i}${ts}`, pairId: i, type: "term", text: p.term },
        { uid: `d${i}${ts}`, pairId: i, type: "def",  text: p.def  },
      ])
    );
    setCards(deck);
    setTimerOn(true);
    setLoading(false);
  }

  useEffect(() => { startGame(); }, []);

  function onCardClick(card) {

    if (locked) return;
    if (matched.has(card.pairId)) return;
    if (open.find(c => c.uid === card.uid)) return;
    if (open.length >= 2) return;

    const newOpen = [...open, card];
    setOpen(newOpen);

    if (newOpen.length === 2) {
      const [a, b] = newOpen;
      setAttempts(prev => prev + 1);

      if (a.pairId === b.pairId && a.type !== b.type) {

        const newMatched = new Set(matched);
        newMatched.add(a.pairId);
        setMatched(newMatched);
        setOpen([]);

        if (newMatched.size === Math.floor(cards.length / 2)) {
          setTimerOn(false);
          setTimeout(() => setFinished(true), 600);
        }
      } else {

        setLocked(true);
        setTimeout(() => {
          setOpen([]);
          setLocked(false);
        }, 1000);
      }
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm" style={{ color:"var(--text-sub)" }}>Se încarcă jocul...</p>
    </div>
  );

  if (finished) {
    const color = attempts === totalPairs ? "#22c55e" : attempts <= totalPairs*1.5 ? "#3b82f6" : "#f59e0b";
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor:"var(--card)", border:"1px solid var(--card-border)", color:"var(--text-sub)" }}>
            <ArrowLeft size={18}/>
          </button>
          <h1 className="text-xl font-black" style={{ color:"var(--text)" }}>Memory</h1>
        </div>
        <div className="max-w-md mx-auto text-center space-y-5 py-8">
          <div className="rounded-3xl p-8 relative overflow-hidden"
            style={{ backgroundColor:"var(--card)", border:"1px solid var(--card-border)" }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background:`radial-gradient(circle at 50% 0%, ${color}18 0%, transparent 70%)` }}/>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor:`${color}15`, border:`1px solid ${color}30` }}>
              <Trophy size={28} style={{ color }}/>
            </div>
            <h2 className="text-2xl font-black mb-4" style={{ color }}>
              {attempts===totalPairs ? "Perfect!" : attempts<=totalPairs*1.5 ? "Excelent!" : "Bine făcut!"}
            </h2>
            <div className="flex justify-center gap-4 text-sm">
              {[
                { label:"Timp",          val: fmt(elapsed) },
                { label:"Încercări",     val: attempts },
                { label:"Minim posibil", val: totalPairs },
              ].map(s => (
                <div key={s.label} className="px-4 py-2.5 rounded-xl" style={{ backgroundColor:"var(--surface-1)" }}>
                  <p className="text-xs mb-0.5" style={{ color:"var(--text-muted)" }}>{s.label}</p>
                  <p className="font-bold" style={{ color:"var(--text)" }}>{s.val}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onBack}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all"
              style={{ backgroundColor:"var(--surface-1)", border:"1px solid var(--card-border)", color:"var(--text-sub)" }}
              onMouseEnter={e=>e.currentTarget.style.color="var(--text)"}
              onMouseLeave={e=>e.currentTarget.style.color="var(--text-sub)"}>
              <ArrowLeft size={15}/> Înapoi
            </button>
            <button onClick={startGame}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all"
              style={{ backgroundColor:"#22c55e", color:"#000", boxShadow:"0 0 20px rgba(34,197,94,0.25)" }}
              onMouseEnter={e=>e.currentTarget.style.backgroundColor="#4ade80"}
              onMouseLeave={e=>e.currentTarget.style.backgroundColor="#22c55e"}>
              <RefreshCw size={15}/> Joacă din nou
            </button>
          </div>
        </div>
      </div>
    );
  }

  const remaining = totalPairs - matched.size;
  const cols      = totalPairs <= 3 ? totalPairs * 2 : 4;

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ backgroundColor:"var(--card)", border:"1px solid var(--card-border)", color:"var(--text-sub)" }}
            onMouseEnter={e=>{ e.currentTarget.style.color="var(--text)"; e.currentTarget.style.backgroundColor="var(--card-hover)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.color="var(--text-sub)"; e.currentTarget.style.backgroundColor="var(--card)"; }}>
            <ArrowLeft size={18}/>
          </button>
          <div>
            <h1 className="text-xl font-black" style={{ color:"var(--text)" }}>Memory</h1>
            <p className="text-xs" style={{ color:"var(--text-sub)" }}>{remaining} perechi rămase</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor:"var(--surface-1)", border:"1px solid var(--card-border)", color:"var(--text-sub)" }}>
            <Clock size={13}/><span className="font-mono">{fmt(elapsed)}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor:"var(--surface-1)", border:"1px solid var(--card-border)", color:"var(--text-sub)" }}>
            {attempts} încercări
          </div>
          <button onClick={startGame}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ backgroundColor:"var(--surface-1)", border:"1px solid var(--card-border)", color:"var(--text-sub)" }}
            onMouseEnter={e=>e.currentTarget.style.color="var(--text)"}
            onMouseLeave={e=>e.currentTarget.style.color="var(--text-sub)"}>
            <RefreshCw size={14}/>
          </button>
        </div>
      </div>

      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor:"var(--surface-2)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width:`${totalPairs > 0 ? (matched.size/totalPairs)*100 : 0}%`, backgroundColor:"#22c55e" }}/>
      </div>

      <div className="flex items-center gap-4 text-xs" style={{ color:"var(--text-muted)" }}>
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor:"rgba(34,197,94,0.3)" }}/> Termen
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor:"rgba(59,130,246,0.3)" }}/> Definiție
        </span>
        <span>— găsește perechile termen + definiție</span>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns:`repeat(${cols}, 1fr)` }}>
        {cards.map(card => (
          <MemCard key={card.uid} card={card}
            flipped={!!open.find(c => c.uid === card.uid)}
            matched={matched.has(card.pairId)}
            onClick={() => onCardClick(card)}/>
        ))}
      </div>
    </div>
  );
}