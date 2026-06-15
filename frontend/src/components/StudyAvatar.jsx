// frontend/src/components/StudyAvatar.jsx

import { useState, useEffect, useRef } from "react";

const COLORS = {
  purple:  { body: "#8b5cf6", face: "#a78bfa" },
  blue:    { body: "#3b82f6", face: "#60a5fa" },
  green:   { body: "#22c55e", face: "#4ade80" },
  orange:  { body: "#f59e0b", face: "#fcd34d" },
  pink:    { body: "#ec4899", face: "#f9a8d4" },
  red:     { body: "#ef4444", face: "#fca5a5" },
  teal:    { body: "#14b8a6", face: "#5eead4" },
  indigo:  { body: "#6366f1", face: "#a5b4fc" },
};

export default function StudyAvatar({
  mood = "idle",
  lastScore = null,
  avatarColor = "purple",
  equippedAccessories = [],
}) {
  const [currentMood, setCurrentMood] = useState(mood);
  const [showTooltip, setShowTooltip]  = useState(false);
  const [tick, setTick]                = useState(0);
  const timeoutRef = useRef(null);
  const rafRef     = useRef(null);
  const startRef   = useRef(null);

  useEffect(() => {
    if (!document.getElementById("avatar-styles")) {
      const style = document.createElement("style");
      style.id = "avatar-styles";
      style.textContent = `
        @keyframes av-blink {
          0%,88%,100% { transform: scaleY(1); }
          93% { transform: scaleY(0.05); }
        }
        @keyframes av-thought {
          0%,100% { opacity:0.3; } 50% { opacity:1; }
        }
        .av-eye-l { animation: av-blink 3.5s ease-in-out infinite; transform-origin: 32px 34px; }
        .av-eye-r { animation: av-blink 3.5s ease-in-out infinite 0.15s; transform-origin: 48px 34px; }
        .av-th1 { animation: av-thought 1.4s ease-in-out infinite 0s; }
        .av-th2 { animation: av-thought 1.4s ease-in-out infinite 0.3s; }
        .av-th3 { animation: av-thought 1.4s ease-in-out infinite 0.6s; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      setTick(ts - startRef.current);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    setCurrentMood(mood);
    if (["happy", "sad", "celebrating"].includes(mood)) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCurrentMood("idle"), 5000);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [mood]);

  const getTransform = () => {
    const t = tick / 1000;
    switch (currentMood) {
      case "idle":        return `translateY(${Math.sin(t * 2) * 3}px)`;
      case "happy":       return `translateY(${Math.sin(t * 9) * 5}px) rotate(${Math.sin(t * 9) * 12}deg)`;
      case "celebrating": return `translateY(${Math.abs(Math.sin(t * 14)) * -8}px) rotate(${Math.sin(t * 14) * 16}deg) scale(${1 + Math.abs(Math.sin(t * 14)) * 0.06})`;
      case "sad":
        if (t % 5 < 1.5) return `translateX(${Math.sin(t * 30) * 4}px) rotate(${Math.sin(t * 30) * 3}deg)`;
        return `translateY(2px)`;
      case "thinking":    return `rotate(${Math.sin(t * 2) * 4}deg) translateY(${Math.sin(t * 2) * 2}px)`;
      default:            return `translateY(${Math.sin(t * 2) * 3}px)`;
    }
  };

  const isHappy       = currentMood === "happy";
  const isCelebrating = currentMood === "celebrating";
  const isSad         = currentMood === "sad";
  const isThinking    = currentMood === "thinking";
  const isPositive    = isHappy || isCelebrating;

  const moodOverride = isCelebrating ? { body: "#f59e0b", face: "#fcd34d" }
    : isHappy  ? { body: "#22c55e", face: "#4ade80" }
    : isSad    ? { body: "#6b7280", face: "#9ca3af" }
    : null;

  const palette   = moodOverride || COLORS[avatarColor] || COLORS.purple;
  const bodyColor = palette.body;
  const faceColor = palette.face;

  const hasHat      = equippedAccessories.includes("hat_student");
  const hasGlasses  = equippedAccessories.includes("glasses_cool");
  const hasCrown    = equippedAccessories.includes("crown");
  const hasStar     = equippedAccessories.includes("star");
  const hasBackpack = equippedAccessories.includes("backpack");
  const hasTrophy   = equippedAccessories.includes("trophy");
  const hasCard     = equippedAccessories.includes("card");
  const hasFlame    = equippedAccessories.includes("flame");
  const hasDiamond  = equippedAccessories.includes("diamond");

  const messages = {
    idle:        "Bună! Gata de studiu? 📚",
    happy:       lastScore !== null ? `Bravo! ${lastScore}% — continuă! 🎉` : "Bravo! Continuă tot așa! 🎉",
    sad:         lastScore !== null ? `${lastScore}% — mai încearcă! 💪` : "Nu-ți face griji, mai încearcă! 💪",
    thinking:    "Hai, poți! Gândește bine! 🧠",
    celebrating: lastScore !== null ? `${lastScore}% — EXTRAORDINAR! 🏆` : "EXTRAORDINAR! 🏆",
  };

  return (
    <div style={{ padding: "6px 12px", display: "flex", justifyContent: "center", position: "relative" }}>
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ position: "relative", display: "inline-block", cursor: "pointer" }}
      >
        <svg
          viewBox="0 0 80 110"
          width="60" height="83"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block", transform: getTransform(), transition: "none" }}
        >
          {/* Umbra */}
          <ellipse cx="40" cy="107" rx="16" ry="3.5" fill="rgba(0,0,0,0.25)" />

          {/* RUCSAC — pe latura dreapta corpului, INAINTEA corpului ca sa fie vizibil */}
          {hasBackpack && (
            <g>
              <rect x="53" y="54" width="11" height="17" rx="3" fill="#92400e"/>
              <rect x="54" y="55" width="9" height="13" rx="2" fill="#b45309"/>
              <rect x="55" y="58" width="5" height="4" rx="1" fill="#d97706"/>
              <rect x="56" y="59" width="3" height="1.5" rx="0.5" fill="#fbbf24"/>
              <rect x="53" y="54" width="11" height="2.5" rx="1" fill="#78350f"/>
              <line x1="56" y1="54" x2="55" y2="52" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="60" y1="54" x2="61" y2="52" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round"/>
            </g>
          )}

          {/* Corp */}
          <rect x="24" y="53" width="32" height="26" rx="8" fill={bodyColor} />
          <rect x="24" y="53" width="32" height="10" rx="8" fill="white" opacity="0.12" />

          {/* TROFEU — in mana stanga, DUPA corp ca sa fie in fata */}
          {hasTrophy && (
            <g transform="translate(7, 57)">
              <rect x="2" y="11" width="8" height="2.5" rx="1" fill="#b45309"/>
              <rect x="3" y="9" width="6" height="3.5" rx="0.5" fill="#d97706"/>
              <path d="M1 0 Q0 4 3 7 L9 7 Q12 4 11 0 Z" fill="#fbbf24"/>
              <path d="M1 0 Q-1 -1 0 -3 Q1 0 3 0" fill="#fcd34d" opacity="0.8"/>
              <path d="M11 0 Q13 -1 12 -3 Q11 0 9 0" fill="#fcd34d" opacity="0.8"/>
              <ellipse cx="4" cy="3" rx="1.2" ry="1.8" fill="white" opacity="0.2"/>
            </g>
          )}

          {/* Stea flotanta langa cap */}
          {hasStar && !isCelebrating && (
            <g>
              <text x="60" y="22" fontSize="11" fill="#fbbf24">⭐</text>
            </g>
          )}

          {/* Carte de joc — in mana dreapta */}
          {hasCard && (
            <g transform="translate(63, 60)">
              <rect x="0" y="0" width="10" height="13" rx="1.5" fill="white" stroke="#e2e8f0" strokeWidth="0.5"/>
              <rect x="0" y="0" width="10" height="13" rx="1.5" fill="none" stroke="#dc2626" strokeWidth="0.8"/>
              <text x="5" y="9" fontSize="7" textAnchor="middle" fill="#dc2626" fontWeight="bold">♥</text>
              <text x="1.5" y="4.5" fontSize="4" fill="#dc2626">A</text>
              <text x="6.5" y="12" fontSize="4" fill="#dc2626" transform="rotate(180, 8, 11)">A</text>
            </g>
          )}

          {/* Flacara — deasupra capului stanga */}
          {hasFlame && !hasCrown && !hasHat && (
            <text x="2" y="20" fontSize="14">🔥</text>
          )}
          {hasFlame && (hasCrown || hasHat) && (
            <text x="2" y="28" fontSize="12">🔥</text>
          )}

          {/* Diamant — deasupra capului dreapta */}
          {hasDiamond && (
            <text x="60" y="12" fontSize="12">💎</text>
          )}

          {/* Brate */}
          <rect x="12" y="55" width="12" height="6" rx="3" fill={bodyColor}
            style={isPositive ? { transform: "rotate(-25deg)", transformOrigin: "24px 58px" } : {}} />
          <rect x="56" y="55" width="12" height="6" rx="3" fill={bodyColor}
            style={isPositive ? { transform: "rotate(25deg)", transformOrigin: "56px 58px" } : {}} />

          {/* Cap */}
          <circle cx="40" cy="35" r="21" fill={faceColor} />
          <ellipse cx="34" cy="27" rx="8" ry="5" fill="white" opacity="0.18" />

          {/* Ochelari */}
          {hasGlasses && !isPositive && !isSad && (
            <g>
              <rect x="25" y="31" width="12" height="8" rx="4" fill="none" stroke="#1e293b" strokeWidth="2"/>
              <rect x="43" y="31" width="12" height="8" rx="4" fill="none" stroke="#1e293b" strokeWidth="2"/>
              <line x1="37" y1="35" x2="43" y2="35" stroke="#1e293b" strokeWidth="1.5"/>
              <line x1="25" y1="35" x2="22" y2="34" stroke="#1e293b" strokeWidth="1.5"/>
              <line x1="55" y1="35" x2="58" y2="34" stroke="#1e293b" strokeWidth="1.5"/>
              <rect x="27" y="33" width="8" height="4" rx="2" fill="#93c5fd" opacity="0.3"/>
              <rect x="45" y="33" width="8" height="4" rx="2" fill="#93c5fd" opacity="0.3"/>
            </g>
          )}

          {/* Ochi */}
          {isPositive ? (
            <>
              <path d="M28 33 Q32 29 36 33" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M44 33 Q48 29 52 33" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          ) : isSad ? (
            <>
              <g className="av-eye-l">
                <ellipse cx="32" cy="35" rx="4" ry="4" fill="#1e293b" />
                <ellipse cx="33" cy="33.5" rx="1.2" ry="1.2" fill="white" opacity="0.8" />
              </g>
              <g className="av-eye-r">
                <ellipse cx="48" cy="35" rx="4" ry="4" fill="#1e293b" />
                <ellipse cx="49" cy="33.5" rx="1.2" ry="1.2" fill="white" opacity="0.8" />
              </g>
              <line x1="28" y1="27" x2="36" y2="29.5" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
              <line x1="44" y1="29.5" x2="52" y2="27" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : isThinking ? (
            <>
              <g className="av-eye-l">
                <ellipse cx="32" cy="34" rx="4" ry="4" fill="#1e293b" />
                <ellipse cx="31" cy="32" rx="1.5" ry="1.5" fill="white" opacity="0.8" />
              </g>
              <g className="av-eye-r">
                <ellipse cx="48" cy="34" rx="4" ry="4" fill="#1e293b" />
                <ellipse cx="47" cy="32" rx="1.5" ry="1.5" fill="white" opacity="0.8" />
              </g>
              <path d="M28 26 Q32 24 36 26" stroke="#1e293b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <g className="av-eye-l">
                <ellipse cx="32" cy="34" rx="4" ry="4.5" fill="#1e293b" />
                <ellipse cx="33.5" cy="32" rx="1.3" ry="1.3" fill="white" opacity="0.8" />
              </g>
              <g className="av-eye-r">
                <ellipse cx="48" cy="34" rx="4" ry="4.5" fill="#1e293b" />
                <ellipse cx="49.5" cy="32" rx="1.3" ry="1.3" fill="white" opacity="0.8" />
              </g>
            </>
          )}

          {/* Obrajori happy */}
          {isPositive && (
            <>
              <ellipse cx="26" cy="40" rx="5" ry="3" fill="rgba(251,113,133,0.5)" />
              <ellipse cx="54" cy="40" rx="5" ry="3" fill="rgba(251,113,133,0.5)" />
            </>
          )}

          {/* Gura */}
          {isSad ? (
            <path d="M33 46 Q40 42 47 46" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : isPositive ? (
            <path d="M30 42 Q40 51 50 42" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : isThinking ? (
            <path d="M35 45 Q40 47 45 44" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M33 44 Q40 49 47 44" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}

          {/* Toca de student */}
          {hasHat && !hasCrown && (
            <g>
              <rect x="22" y="13" width="36" height="5" rx="1" fill="#1e293b"/>
              <rect x="28" y="7" width="24" height="8" rx="2" fill="#1e293b"/>
              <rect x="28" y="7" width="24" height="3" rx="1" fill="#374151"/>
              <line x1="52" y1="13" x2="58" y2="20" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="58" cy="21" r="2" fill="#fbbf24"/>
            </g>
          )}

          {/* Coroana */}
          {hasCrown && (
            <g>
              <path d="M26 16 L28 8 L34 14 L40 6 L46 14 L52 8 L54 16 Z" fill="#fbbf24"/>
              <rect x="26" y="15" width="28" height="5" rx="1" fill="#f59e0b"/>
              <circle cx="32" cy="11" r="2" fill="#ef4444"/>
              <circle cx="40" cy="8"  r="2" fill="#3b82f6"/>
              <circle cx="48" cy="11" r="2" fill="#22c55e"/>
            </g>
          )}

          {/* Elemente mood */}
          {isThinking && (
            <>
              <circle cx="55" cy="24" r="2"   fill="white" className="av-th1" />
              <circle cx="61" cy="18" r="3"   fill="white" className="av-th2" />
              <circle cx="68" cy="11" r="4.5" fill="white" className="av-th3" />
              <text x="65" y="14" fontSize="6" textAnchor="middle" fill="#3b82f6" fontWeight="bold">?</text>
            </>
          )}
          {isSad && (
            <>
              <path d="M25 18 Q30 12 36 16" stroke="#9ca3af" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
              <ellipse cx="31" cy="42" rx="1.5" ry="2.5" fill="#60a5fa" opacity="0.9" />
            </>
          )}
          {isCelebrating && (
            <>
              <text x="6"  y="22" fontSize="12">⭐</text>
              <text x="58" y="18" fontSize="10">✨</text>
              <text x="18" y="10" fontSize="9">🎉</text>
              <text x="52" y="28" fontSize="8">⭐</text>
            </>
          )}
          {isHappy && (
            <>
              <text x="58" y="20" fontSize="11" fill={bodyColor} opacity="0.9">♪</text>
              <text x="9"  y="24" fontSize="9"  fill={bodyColor} opacity="0.8">♫</text>
            </>
          )}
        </svg>

        {/* Tooltip */}
        {showTooltip && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#1e2330", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "10px", padding: "7px 12px",
            fontSize: "11px", color: "white", whiteSpace: "nowrap",
            pointerEvents: "none", zIndex: 200,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)", fontWeight: "500",
          }}>
            {messages[currentMood] || messages.idle}
            <div style={{
              position: "absolute", top: "100%", left: "50%",
              transform: "translateX(-50%)", width: 0, height: 0,
              borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
              borderTop: "6px solid #1e2330",
            }} />
          </div>
        )}
      </div>
    </div>
  );
}