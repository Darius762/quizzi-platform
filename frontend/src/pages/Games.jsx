// frontend/src/pages/Games.jsx
import { useState } from "react";
import { Gamepad2, Puzzle, Zap, Brain, Lock } from "lucide-react";
import Hangman from "./Hangman";
import Association from "./Association";
import Memory from "./Memory";

const GAMES = [
  {
    id: "hangman",
    title: "Spânzurătoarea",
    description: "Ghicește termeni din flashcard-urile tale literă cu literă.",
    icon: Puzzle,
    color: "#22c55e",
    available: true,
  },
  {
    id: "association",
    title: "Asociere rapidă",
    description: "Potrivește termenii cu definițiile contra cronometru.",
    icon: Zap,
    color: "#3b82f6",
    available: true,
  },
  {
    id: "memory",
    title: "Memory",
    description: "Găsește perechile de carduri întoarse cu fața în jos.",
    icon: Brain,
    color: "#a855f7",
    available: true,
  },
];

export default function Games() {
  const [activeGame, setActiveGame] = useState(null);

  if (activeGame === "hangman") {
    return <Hangman onBack={() => setActiveGame(null)} />;
  }
  if (activeGame === "association") {
    return <Association onBack={() => setActiveGame(null)} />;
  }
  if (activeGame === "memory") {
    return <Memory onBack={() => setActiveGame(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <Gamepad2 size={20} style={{ color: "#22c55e" }} />
          </div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Jocuri</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-sub)" }}>
          Antrenează-ți memoria și vocabularul prin jocuri interactive.
        </p>
      </div>

      {/* Grid jocuri */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map(game => {
          const Icon = game.icon;
          return (
            <div key={game.id}
              onClick={() => game.available && setActiveGame(game.id)}
              className="rounded-2xl p-6 transition-all"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--card-border)",
                cursor: game.available ? "pointer" : "default",
                opacity: game.available ? 1 : 0.6,
              }}
              onMouseEnter={e => game.available && (e.currentTarget.style.borderColor = `${game.color}40`)}
              onMouseLeave={e => game.available && (e.currentTarget.style.borderColor = "var(--card-border)")}>

              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${game.color}15`, border: `1px solid ${game.color}30` }}>
                  <Icon size={22} style={{ color: game.color }} />
                </div>
                {!game.available && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: "var(--surface-1)", color: "var(--text-muted)" }}>
                    <Lock size={11} />
                    În curând
                  </div>
                )}
              </div>

              <h3 className="font-bold text-base mb-1.5" style={{ color: "var(--text)" }}>
                {game.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-sub)" }}>
                {game.description}
              </p>

              {game.available && (
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold"
                  style={{ color: game.color }}>
                  Joacă acum →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}