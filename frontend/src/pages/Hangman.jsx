// frontend/src/pages/Hangman.jsx
import { useState, useEffect, useCallback } from "react";
import { getToken } from "../api/auth";
import { ArrowLeft, RefreshCw, Trophy, X, Lightbulb, Heart } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";


const FALLBACK_WORDS = [
  { word: "ALGORITM",    hint: "Secvență de pași pentru rezolvarea unei probleme" },
  { word: "VARIABILA",   hint: "Spațiu de memorie cu un nume și o valoare" },
  { word: "FUNCTIE",     hint: "Bloc de cod reutilizabil cu un nume" },
  { word: "RECURSIVITATE", hint: "O funcție care se apelează pe sine" },
  { word: "MATRICE",     hint: "Structură de date bidimensională" },
  { word: "COMPILATOR",  hint: "Program care traduce codul sursă în cod mașină" },
  { word: "POLIMORFISM", hint: "Proprietate OOP — același nume, comportamente diferite" },
  { word: "MOSTENIRE",   hint: "Clasă derivată preia proprietăți din clasa de bază" },
  { word: "ENCAPSULARE", hint: "Ascunderea detaliilor de implementare" },
  { word: "INTERFATA",   hint: "Contract care definește metodele unui obiect" },
];

const MAX_ERRORS = 6;

//SVG Spânzurătoare
function HangmanSVG({ errors }) {
  const stroke = { stroke: "var(--text)", strokeWidth: 2.5, strokeLinecap: "round" };
  const gray   = { stroke: "var(--text-muted)", strokeWidth: 2, strokeLinecap: "round" };

  return (
    <svg viewBox="0 0 200 220" width="200" height="220">
      {/* Structură fixă */}
      <line x1="20" y1="210" x2="180" y2="210" {...gray} />
      <line x1="60"  y1="210" x2="60"  y2="20"  {...gray} />
      <line x1="60"  y1="20"  x2="130" y2="20"  {...gray} />
      <line x1="130" y1="20"  x2="130" y2="45"  {...gray} />

      {/* Eroare 1 — cap */}
      {errors >= 1 && <circle cx="130" cy="58" r="13" fill="none" {...stroke} />}
      {/* Eroare 2 — corp */}
      {errors >= 2 && <line x1="130" y1="71" x2="130" y2="130" {...stroke} />}
      {/* Eroare 3 — braț stâng */}
      {errors >= 3 && <line x1="130" y1="85" x2="105" y2="110" {...stroke} />}
      {/* Eroare 4 — braț drept */}
      {errors >= 4 && <line x1="130" y1="85" x2="155" y2="110" {...stroke} />}
      {/* Eroare 5 — picior stâng */}
      {errors >= 5 && <line x1="130" y1="130" x2="105" y2="165" {...stroke} />}
      {/* Eroare 6 — picior drept */}
      {errors >= 6 && <line x1="130" y1="130" x2="155" y2="165" {...stroke} />}
    </svg>
  );
}

//Keyboard
const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

function Keyboard({ guessed, onGuess, disabled }) {
  return (
    <div className="space-y-2">
      {ROWS.map(row => (
        <div key={row} className="flex justify-center gap-1.5">
          {row.split("").map(letter => {
            const used    = guessed.includes(letter);
            return (
              <button key={letter} onClick={() => !used && !disabled && onGuess(letter)}
                disabled={used || disabled}
                className="w-9 h-10 rounded-lg text-sm font-bold transition-all"
                style={{
                  backgroundColor: used ? "var(--surface-1)" : "var(--card)",
                  border: `1px solid ${used ? "var(--divider)" : "var(--card-border)"}`,
                  color: used ? "var(--text-muted)" : "var(--text)",
                  cursor: used || disabled ? "default" : "pointer",
                  opacity: used ? 0.4 : 1,
                }}
                onMouseEnter={e => !used && !disabled && (e.currentTarget.style.borderColor = "#22c55e")}
                onMouseLeave={e => !used && !disabled && (e.currentTarget.style.borderColor = "var(--card-border)")}>
                {letter}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Main Game
export default function Hangman({ onBack }) {
  const [words, setWords]         = useState([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [guessed, setGuessed]     = useState([]);
  const [errors, setErrors]       = useState(0);
  const [showHint, setShowHint]   = useState(false);
  const [gameState, setGameState] = useState("playing"); // playing | won | lost
  const [score, setScore]         = useState({ won: 0, lost: 0 });
  const [loading, setLoading]     = useState(true);


  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/flashcards/`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (res.ok) {
          const cards = await res.json();

          const STOP_WORDS = new Set([
            "ESTE","SUNT","ESTE","ERAM","ESTI","AVEM","AVEAM","AVEA","ESTE","FIIND",
            "CARE","CARE","UNDE","CÂND","CUM","DACA","DECI","DESI","INSA","INCAT",
            "PRIN","PRIN","PESTE","ÎNTRE","DINTRE","DESPRE","PENTRU","CONTRA","FARA",
            "CATRE","SPRE","PANA","PINA","DUPA","INAINTE","INAPOI","AFARA","INAUNTRU",
            "ACUM","ATUNCI","ACOLO","ACESTA","ACEASTA","ACESTEA","ACESTI","ACELE",
            "ACEL","ACEA","ACEST","CARE","CELE","CELOR","CELUI","CELE","CEVA","CINEVA",
            "NIMENI","NIMIC","ORICE","ORICARE","ORICINE","FIECARE","ALTUL","ALTA",
            "ALTI","ALTE","ALTCEVA","ALTCINEVA","MULT","MULTA","MULTI","MULTE","PUTIN",
            "PUTINA","PUTINI","PUTINE","TOTI","TOATE","TOATA","TOATA","TUTUROR",
            "UNEI","UNOR","UNUI","UNII","UNELE","NISTE","NICIO","NICIUN","NICI",
            "TOATE","TOATA","TOTI","TATA","MAMA","DEJA","INCA","CHIAR","DOAR",
            "POATE","TREBUIE","POATE","PUTEA","PUTUT","VREA","VRUT","VENIT","MERS",
            "FACE","FACUT","SPUNE","SPUS","MERGE","FATA","BINE","BUNA","MARE","MICI",
            "ALTA","ALTE","ALTI","PRIMUL","PRIMA","ULTIM","ASTFEL","DUPA","INAINTE",
            "FOLOSIT","FOLOSIND","AVAND","FIIND","AVUTA","AVUT","ESTI","ESTE","ERAU",
            "CARE","CAREI","CARUI","CARORA","CAROR","POATE","TREBUIE","ODATA","MEREU",
            "INTAI","INTII","UNDE","CAND","DECI","INSA","TOTUSI","CHIAR","DOAR","PREA",
            "FOARTE","DESTUL","APROAPE","EXACT","DEJA","INCA","ABIA","TOCMAI","NICIODATA",
          ]);

          const wordList = cards
            .flatMap(c => {
              const sources = [c.front || "", c.back || ""];
              const words = [];
              sources.forEach(src => {
                src.split(/[\s,;:.!?()\[\]{}"'\-\/\\]+/)
                   .map(w => w.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[ĂÂÎȘȚăâîșț]/g, m => ({"Ă":"A","Â":"A","Î":"I","Ș":"S","Ț":"T","ă":"A","â":"A","î":"I","ș":"S","ț":"T"}[m]||m)).replace(/[^A-Z]/g, ""))
                   .filter(w =>
                     w.length >= 5 &&
                     w.length <= 16 &&
                     !STOP_WORDS.has(w) &&
                     !/^(\d+)$/.test(w) &&
                     /[AEIOU]/.test(w)
                   )
                   .forEach(w => {
                     const rawHint = c.back?.trim() || c.front?.trim() || "";

                     const norm = s => s.toLowerCase()
                       .replace(/[ăâ]/g, "a").replace(/[î]/g, "i")
                       .replace(/[șş]/g, "s").replace(/[țţ]/g, "t")
                       .replace(/[^a-z0-9]/g, "");
                     const normWord = norm(w);
                     const prefix = normWord.slice(0, Math.max(4, Math.floor(normWord.length * 0.65)));

                     const safeHint = rawHint.replace(
                       /[a-zA-ZăâîșțĂÂÎȘȚşţ]+/g,
                       token => norm(token).startsWith(prefix) ? "___" : token
                     );
                     words.push({ word: w, hint: safeHint });
                   });
              });
              return words;
            })
            .filter((item, idx, arr) => arr.findIndex(x => x.word === item.word) === idx);

          if (wordList.length >= 3) {

            const shuffled = wordList.sort(() => Math.random() - 0.5);
            setWords(shuffled);
          } else {
            setWords(FALLBACK_WORDS.sort(() => Math.random() - 0.5));
          }
        } else {
          setWords(FALLBACK_WORDS.sort(() => Math.random() - 0.5));
        }
      } catch {
        setWords(FALLBACK_WORDS.sort(() => Math.random() - 0.5));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentWord = words[wordIndex]?.word || "";
  const currentHint = words[wordIndex]?.hint || "";


  useEffect(() => {
    if (!currentWord || gameState !== "playing") return;
    const allGuessed = currentWord.split("").every(l => guessed.includes(l));
    if (allGuessed) {
      setGameState("won");
      setScore(s => ({ ...s, won: s.won + 1 }));
    } else if (errors >= MAX_ERRORS) {
      setGameState("lost");
      setScore(s => ({ ...s, lost: s.lost + 1 }));
    }
  }, [guessed, errors, currentWord, gameState]);


  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toUpperCase();
      if (gameState !== "playing") return;
      if (/^[A-ZĂÂÎȘȚ]$/.test(key) && !guessed.includes(key)) {
        handleGuess(key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [guessed, gameState, currentWord]);

  const handleGuess = useCallback((letter) => {
    if (guessed.includes(letter) || gameState !== "playing") return;
    setGuessed(g => [...g, letter]);
    if (!currentWord.includes(letter)) {
      setErrors(e => e + 1);
    }
  }, [guessed, gameState, currentWord]);

  const nextWord = () => {
    const next = (wordIndex + 1) % words.length;
    setWordIndex(next);
    setGuessed([]);
    setErrors(0);
    setShowHint(false);
    setGameState("playing");
  };

  const restart = () => {
    setWords(w => [...w].sort(() => Math.random() - 0.5));
    setWordIndex(0);
    setGuessed([]);
    setErrors(0);
    setShowHint(false);
    setGameState("playing");
    setScore({ won: 0, lost: 0 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm" style={{ color: "var(--text-sub)" }}>Se încarcă cuvintele...</div>
      </div>
    );
  }

  const displayWord = currentWord.split("").map((l, i) => (
    <span key={i} className="inline-flex flex-col items-center mx-1">
      <span className="text-2xl font-black min-w-[1.5rem] text-center"
        style={{ color: gameState === "lost" && !guessed.includes(l) ? "#ef4444" : "var(--text)" }}>
        {guessed.includes(l) || gameState === "lost" ? l : "\u00A0"}
      </span>
      <span className="w-6 h-0.5 mt-1 rounded-full"
        style={{ backgroundColor: guessed.includes(l) ? "#22c55e" : "var(--text-sub)" }} />
    </span>
  ));

  const remainingLives = MAX_ERRORS - errors;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">

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
            <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Spânzurătoarea</h1>
            <p className="text-xs" style={{ color: "var(--text-sub)" }}>
              Cuvântul {wordIndex + 1} din {words.length}
            </p>
          </div>
        </div>

        {/* Scor + vieți */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: MAX_ERRORS }).map((_, i) => (
              <Heart key={i} size={16}
                fill={i < remainingLives ? "#ef4444" : "none"}
                style={{ color: i < remainingLives ? "#ef4444" : "var(--text-muted)" }} />
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)" }}>
            <span style={{ color: "#22c55e" }}>✓ {score.won}</span>
            <span style={{ color: "var(--divider)" }}>|</span>
            <span style={{ color: "#ef4444" }}>✗ {score.lost}</span>
          </div>
        </div>
      </div>

      {/* Game area */}
      <div className="rounded-2xl p-6"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>

        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* SVG */}
          <div className="flex-shrink-0">
            <HangmanSVG errors={errors} />
          </div>

          {/* Cuvânt + hint + status */}
          <div className="flex-1 w-full space-y-6">

            {/* Cuvântul de ghicit */}
            <div className="flex flex-wrap justify-center gap-1">
              {displayWord}
            </div>

            {/* Hint */}
            {!showHint ? (
              <button onClick={() => setShowHint(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all"
                style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#f59e0b"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--text-sub)"; e.currentTarget.style.borderColor = "var(--card-border)"; }}>
                <Lightbulb size={15} />
                Arată indiciu
              </button>
            ) : (
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                <span className="font-semibold" style={{ color: "#f59e0b" }}>Indiciu: </span>
                <span style={{ color: "var(--text-sub)" }}>{currentHint}</span>
              </div>
            )}

            {/* Game over overlay */}
            {gameState !== "playing" && (
              <div className="rounded-2xl p-5 text-center"
                style={{
                  backgroundColor: gameState === "won" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                  border: `1px solid ${gameState === "won" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                }}>
                <div className="text-3xl mb-2">{gameState === "won" ? "🎉" : "💀"}</div>
                <p className="font-black text-lg mb-1"
                  style={{ color: gameState === "won" ? "#22c55e" : "#ef4444" }}>
                  {gameState === "won" ? "Felicitări!" : "Ai pierdut!"}
                </p>
                {gameState === "lost" && (
                  <p className="text-sm mb-3" style={{ color: "var(--text-sub)" }}>
                    Cuvântul era: <span className="font-black" style={{ color: "var(--text)" }}>{currentWord}</span>
                  </p>
                )}
                <div className="flex gap-3 justify-center mt-3">
                  <button onClick={nextWord}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{ backgroundColor: "#22c55e", color: "#000" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#4ade80"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}>
                    Cuvânt următor →
                  </button>
                  <button onClick={restart}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-sub)"}>
                    <RefreshCw size={14} /> Restart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tastatură */}
      {gameState === "playing" && (
        <div className="rounded-2xl p-5"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
          <Keyboard guessed={guessed} onGuess={handleGuess} disabled={gameState !== "playing"} />
          <p className="text-center text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            Poți folosi și tastatura fizică
          </p>
        </div>
      )}
    </div>
  );
}