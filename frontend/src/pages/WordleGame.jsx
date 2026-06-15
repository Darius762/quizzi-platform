// frontend/src/pages/WordleGame.jsx
import { useState, useEffect, useCallback } from "react";
import { getToken } from "../api/auth";
import { ArrowLeft, RefreshCw, Trophy, X, Info } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const MAX_ATTEMPTS = 6;
const KEYBOARD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

//Helpers
function normalize(s) {
  return s.toUpperCase()
    .replace(/[ĂÂ]/g, "A").replace(/Î/g, "I")
    .replace(/[ȘŞ]/g, "S").replace(/[ȚŢ]/g, "T");
}

function getLetterColor(result) {
  if (result === "correct") return { bg: "#22c55e", border: "#16a34a", text: "#fff" };
  if (result === "present") return { bg: "#f59e0b", border: "#d97706", text: "#fff" };
  return { bg: "#475569", border: "#334155", text: "#fff" };
}

//Letter Cell
function LetterCell({ letter, result, isActive, shake }) {
  const filled = letter !== "";
  const colors = result ? getLetterColor(result) : null;

  return (
    <div className={shake ? "animate-bounce" : ""}
      style={{
        width: 52, height: 52,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 8,
        border: `2px solid ${colors ? colors.border : filled ? "var(--text-sub)" : "var(--card-border)"}`,
        backgroundColor: colors ? colors.bg : "var(--card)",
        color: colors ? colors.text : "var(--text)",
        fontSize: 22, fontWeight: "900",
        transition: "all 0.15s ease",
        transform: filled && !result ? "scale(1.05)" : "scale(1)",
      }}>
      {letter}
    </div>
  );
}

//Keyboard
function WordleKeyboard({ letterStates, onKey, disabled }) {
  return (
    <div className="space-y-2">
      {KEYBOARD_ROWS.map(row => (
        <div key={row} className="flex justify-center gap-1.5">
          {row.split("").map(letter => {
            const state  = letterStates[letter];
            const colors = state ? getLetterColor(state) : null;
            return (
              <button key={letter} onClick={() => !disabled && onKey(letter)}
                disabled={disabled}
                className="font-bold text-sm rounded-lg transition-all"
                style={{
                  width: 36, height: 44,
                  backgroundColor: colors ? colors.bg : "var(--surface-2)",
                  border: `1px solid ${colors ? colors.border : "var(--card-border)"}`,
                  color: colors ? colors.text : "var(--text)",
                  cursor: disabled ? "default" : "pointer",
                }}>
                {letter}
              </button>
            );
          })}
        </div>
      ))}
      {/* Enter + Backspace */}
      <div className="flex justify-center gap-1.5 mt-1">
        <button onClick={() => !disabled && onKey("ENTER")} disabled={disabled}
          className="rounded-lg font-bold text-xs transition-all px-4"
          style={{ height: 44, backgroundColor: "var(--surface-2)", border: "1px solid var(--card-border)", color: "var(--text)", cursor: disabled ? "default" : "pointer" }}>
          ENTER
        </button>
        <button onClick={() => !disabled && onKey("BACKSPACE")} disabled={disabled}
          className="rounded-lg font-bold text-sm transition-all px-4"
          style={{ height: 44, backgroundColor: "var(--surface-2)", border: "1px solid var(--card-border)", color: "var(--text)", cursor: disabled ? "default" : "pointer" }}>
          ⌫
        </button>
      </div>
    </div>
  );
}

//Main Game
export default function WordleGame({ onBack, challengeId, wordLength, previousGuesses, alreadySolved }) {
  const [guesses,      setGuesses]      = useState(previousGuesses || []);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver,     setGameOver]     = useState(
    alreadySolved || (previousGuesses && previousGuesses.length >= MAX_ATTEMPTS)
  );
  const [solved,       setSolved]       = useState(alreadySolved || false);
  const [error,        setError]        = useState("");
  const [shake,        setShake]        = useState(false);
  const [loading,      setLoading]      = useState(false);

  // Starea tastaturii — cea mai bună culoare per literă
  const letterStates = {};
  const priority = { correct: 3, present: 2, absent: 1 };
  guesses.forEach(guessRow => {
    guessRow.forEach(({ letter, result }) => {
      const cur = letterStates[letter];
      if (!cur || priority[result] > priority[cur]) {
        letterStates[letter] = result;
      }
    });
  });

  const showError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => { setError(""); setShake(false); }, 1500);
  };

  const submitGuess = async () => {
    if (currentGuess.length !== wordLength) {
      showError(`Cuvântul trebuie să aibă ${wordLength} litere!`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/wordle/guess`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ guess: currentGuess }),
      });
      const data = await res.json();
      if (!res.ok) { showError(data.detail || "Eroare"); setLoading(false); return; }

      const newGuesses = [...guesses, data.letters];
      setGuesses(newGuesses);
      setCurrentGuess("");

      if (data.solved) { setSolved(true); setGameOver(true); }
      else if (data.attempts_used >= MAX_ATTEMPTS) { setGameOver(true); }
    } catch {
      showError("Eroare de rețea.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = useCallback((key) => {
    if (gameOver || loading) return;
    if (key === "ENTER") { submitGuess(); return; }
    if (key === "BACKSPACE") { setCurrentGuess(p => p.slice(0, -1)); return; }
    const norm = normalize(key);
    if (/^[A-Z]$/.test(norm) && currentGuess.length < wordLength) {
      setCurrentGuess(p => p + norm);
    }
  }, [gameOver, loading, currentGuess, wordLength]);


  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter") handleKey("ENTER");
      else if (e.key === "Backspace") handleKey("BACKSPACE");
      else if (e.key.length === 1) handleKey(e.key.toUpperCase());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);


  const grid = [];
  for (let row = 0; row < MAX_ATTEMPTS; row++) {
    if (row < guesses.length) {
      grid.push(guesses[row]);
    } else if (row === guesses.length && !gameOver) {
      const cells = [];
      for (let col = 0; col < wordLength; col++) {
        cells.push({ letter: currentGuess[col] || "", result: null });
      }
      grid.push(cells);
    } else {
      // Rand gol
      grid.push(Array(wordLength).fill({ letter: "", result: null }));
    }
  }

  const lastGuessRow = gameOver && !solved ? guesses.length - 1 : -1;

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-sub)"; }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Daily Challenge</h1>
            <p className="text-xs" style={{ color: "var(--text-sub)" }}>
              Ghicește cuvântul în {MAX_ATTEMPTS} încercări
            </p>
          </div>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: "var(--surface-1)", color: "var(--text-sub)" }}>
          {guesses.length} / {MAX_ATTEMPTS}
        </div>
      </div>

      {/* Eroare */}
      {error && (
        <div className="text-center py-2 px-4 rounded-xl text-sm font-bold"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="flex flex-col items-center gap-1.5">
        {grid.map((row, ri) => (
          <div key={ri} className="flex gap-1.5">
            {row.map((cell, ci) => (
              <LetterCell
                key={ci}
                letter={cell.letter}
                result={cell.result}
                isActive={ri === guesses.length}
                shake={shake && ri === guesses.length} />
            ))}
          </div>
        ))}
      </div>

      {/* Game over */}
      {gameOver && (
        <div className="rounded-2xl p-5 text-center"
          style={{
            backgroundColor: solved ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${solved ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
          }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            {solved
              ? <Trophy size={20} style={{ color: "#22c55e" }} />
              : <X size={20} style={{ color: "#f87171" }} />}
            <p className="font-black text-lg" style={{ color: solved ? "#22c55e" : "#f87171" }}>
              {solved ? "Felicitări! Ai ghicit!" : "Ai epuizat încercările!"}
            </p>
          </div>
          {solved && (
            <p className="text-sm" style={{ color: "var(--text-sub)" }}>
              Ghicit în {guesses.length} {guesses.length === 1 ? "încercare" : "încercări"}
            </p>
          )}
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            Revino când adminul setează un cuvânt nou!
          </p>
        </div>
      )}

      {/* Tastatura */}
      {!gameOver && (
        <div className="rounded-2xl p-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
          <WordleKeyboard letterStates={letterStates} onKey={handleKey} disabled={gameOver || loading} />
          <p className="text-center text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            Poți folosi și tastatura fizică · Enter pentru confirmare
          </p>
        </div>
      )}

      {/* Legenda */}
      <div className="rounded-xl p-4 flex items-center justify-center gap-6 text-xs"
        style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)" }}>
        {[
          { color: "#22c55e", label: "Litera corectă, poziție corectă" },
          { color: "#f59e0b", label: "Litera există, altă poziție" },
          { color: "#475569", label: "Litera nu există" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
            <span style={{ color: "var(--text-sub)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}