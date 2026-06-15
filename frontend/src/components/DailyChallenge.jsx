// frontend/src/components/DailyChallenge.jsx
import { useState, useEffect } from "react";
import { getToken } from "../api/auth";
import { Sword, Trophy, Lock, ChevronRight, Loader2 } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

export default function DailyChallenge({ onPlay }) {
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/wordle/status`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (res.ok) setStatus(await res.json());
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return null;
  if (!status?.active) return null;

  const { already_played, solved, word_length, set_by_name, guesses } = status;
  const attemptsUsed = guesses?.length || 0;
  const canPlay      = !already_played;


  if (already_played) {
    return (
      <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: solved ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.08)" }}>
          {solved
            ? <Trophy size={13} style={{ color: "#22c55e" }} />
            : <Lock   size={13} style={{ color: "#f87171" }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: "var(--text-sub)" }}>
            Daily Challenge —{" "}
            {solved ? `ghicit în ${attemptsUsed} încercări 🎉` : `epuizat (${attemptsUsed}/6)`}
          </p>
        </div>
      </div>
    );
  }


  return (
    <div
      onClick={() => onPlay(status)}
      className="rounded-2xl px-5 py-4 flex items-center gap-4 cursor-pointer transition-all relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)",
        border: "1px solid rgba(34,197,94,0.35)",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(34,197,94,0.6)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(34,197,94,0.35)"}>

      {/* Glow effect */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)" }} />

      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.3)" }}>
        <Sword size={18} style={{ color: "#22c55e" }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-black" style={{ color: "#22c55e" }}>Daily Challenge disponibil!</p>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse"
            style={{ backgroundColor: "rgba(34,197,94,0.2)", color: "#22c55e" }}>
            NOU
          </span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-sub)" }}>
          Ghicește cuvântul de {word_length} litere setat de {set_by_name} · 6 încercări
        </p>
      </div>

      <ChevronRight size={18} style={{ color: "#22c55e", flexShrink: 0 }} />
    </div>
  );
}