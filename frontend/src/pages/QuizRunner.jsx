// frontend/src/pages/QuizRunner.jsx
import { useState, useEffect, useRef } from "react";
import { getToken } from "../api/auth";
import {
  Flame, Clock, Check, X,
  Trophy, ThumbsUp, Book, Activity, ArrowLeft, ArrowRight,
  RefreshCw, Target, ListChecks
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

//API
async function saveAttempt(payload) {
  try {
    await fetch(`${API_URL}/attempts/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) { console.error("Eroare la salvarea tentativei:", err); }
}

//Confetti
function loadConfetti() {
  return new Promise((resolve) => {
    if (window.confetti) { resolve(window.confetti); return; }
    if (document.getElementById("confetti-script")) {
      const check = setInterval(() => { if (window.confetti) { clearInterval(check); resolve(window.confetti); } }, 100);
      return;
    }
    const s = document.createElement("script");
    s.id = "confetti-script";
    s.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js";
    s.onload = () => resolve(window.confetti);
    document.head.appendChild(s);
  });
}

async function fireConfetti(pct) {
  const confetti = await loadConfetti();
  if (!confetti) return;
  if (pct >= 90) {
    const fire = (origin) => confetti({ particleCount: 120, spread: 80, origin, colors: ["#22c55e","#4ade80","#86efac","#fbbf24","#ffffff"], gravity: 0.8, scalar: 1.1 });
    fire({ x: 0.2, y: 0.6 });
    setTimeout(() => fire({ x: 0.8, y: 0.6 }), 200);
    setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { x: 0.5, y: 0.4 }, colors: ["#22c55e","#fbbf24","#ffffff"], gravity: 0.7 }), 500);
  } else if (pct >= 70) {
    confetti({ particleCount: 80, spread: 70, origin: { x: 0.5, y: 0.55 }, colors: ["#3b82f6","#60a5fa","#93c5fd","#22c55e","#ffffff"], gravity: 0.9 });
    setTimeout(() => confetti({ particleCount: 40, spread: 60, origin: { x: 0.3, y: 0.6 }, colors: ["#3b82f6","#ffffff","#22c55e"], gravity: 0.9 }), 350);
  }
}




// CSS
const GLOBAL_STYLES = `
  @keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes streakPop { 0%{transform:scale(0.5);opacity:0;} 60%{transform:scale(1.2);opacity:1;} 100%{transform:scale(1);opacity:1;} }
  @keyframes resultsIn { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
  .question-enter { animation: fadeInUp 0.28s ease-out forwards; }
  .streak-pop { animation: streakPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .results-enter { animation: resultsIn 0.5s ease-out forwards; }
`;

// Streak Badge
function StreakBadge({ streak }) {
  const prevStreak = useRef(streak);
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => { if (streak > prevStreak.current) setAnimKey(k => k+1); prevStreak.current = streak; }, [streak]);
  if (streak < 2) return null;
  const color  = streak >= 7 ? "#ef4444" : streak >= 5 ? "#f97316" : "#f59e0b";
  const bg     = streak >= 7 ? "rgba(239,68,68,0.15)" : streak >= 5 ? "rgba(249,115,22,0.15)" : "rgba(245,158,11,0.15)";
  const border = streak >= 7 ? "rgba(239,68,68,0.4)"  : streak >= 5 ? "rgba(249,115,22,0.4)"  : "rgba(245,158,11,0.4)";
  return (
    <div key={animKey} className="streak-pop flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
      style={{ backgroundColor: bg, border: `1px solid ${border}`, color }}>
      <Flame size={13} fill="currentColor" />{streak} la rând!
    </div>
  );
}

//  Animated Score
function AnimatedScore({ target }) {
  const [current, setCurrent] = useState(0);
  const t0 = useRef(null), raf = useRef(null);
  const DURATION = 1200;
  useEffect(() => {
    const animate = ts => {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / DURATION, 1);
      setCurrent(Math.round((1 - Math.pow(1-p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return <span>{current}</span>;
}

// Timer
function Timer({ seconds, onTimeUp }) {
  const [remaining, setRemaining] = useState(seconds);
  const ref = useRef();
  useEffect(() => {
    ref.current = setInterval(() => {
      setRemaining(p => { if (p <= 1) { clearInterval(ref.current); onTimeUp(); return 0; } return p-1; });
    }, 1000);
    return () => clearInterval(ref.current);
  }, []);
  const mins = Math.floor(remaining / 60), secs = remaining % 60;
  const urgent = remaining < 60;
  const pctLeft = (remaining / seconds) * 100;
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl"
      style={{ backgroundColor: urgent ? "rgba(239,68,68,0.1)" : "var(--surface-2)", border: `1px solid ${urgent ? "rgba(239,68,68,0.3)" : "var(--input-border)"}`, color: urgent ? "#f87171" : "var(--text)" }}>
      <Clock size={15} />
      <span className="font-mono font-bold text-sm tracking-widest">
        {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
      </span>
      {/* mini progress arc */}
      <svg width="16" height="16" viewBox="0 0 16 16" style={{ transform:"rotate(-90deg)" }}>
        <circle cx="8" cy="8" r="6" fill="none" stroke="var(--input-border)" strokeWidth="2"/>
        <circle cx="8" cy="8" r="6" fill="none"
          stroke={urgent ? "#ef4444" : "#22c55e"} strokeWidth="2"
          strokeDasharray={`${2*Math.PI*6}`}
          strokeDashoffset={`${2*Math.PI*6*(1-pctLeft/100)}`}
          strokeLinecap="round"/>
      </svg>
    </div>
  );
}

//  Helpers
function checkCorrect(selected, correctAnswer, type) {
  if (!selected) return false;
  const normalize = s => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ");
  if (type === "mc") {
    if (selected.includes(":")) return selected.startsWith(correctAnswer.trim()+":");
    return normalize(selected) === normalize(correctAnswer);
  }
  return normalize(selected) === normalize(correctAnswer);
}

//  Question Card
function QuestionCard({ question, index, total, mode, onAnswer, onNext, streak, isLastQuestion }) {
  const [selected, setSelected]     = useState(null);
  const [submitted, setSubmitted]   = useState(false);
  const [fillValue, setFillValue]   = useState("");
  const [animKey, setAnimKey]       = useState(0);


  useEffect(() => { setAnimKey(k=>k+1); }, [question.id]);



  const currentSelected = question.type === "fill" ? fillValue : selected;
  const isCorrect = submitted ? checkCorrect(currentSelected, question.correct_answer, question.type) : false;

  const handleSubmit = () => {
    const val = question.type === "fill" ? fillValue : selected;
    if (!val) return;
    setSubmitted(true);
    const correct = checkCorrect(val, question.correct_answer, question.type);
    onAnswer({ questionId: question.id, answer: val, isCorrect: correct });
  };

  const getOptionStyle = opt => {
    const def = { backgroundColor:"var(--card)", border:"1px solid var(--card-border)", color:"var(--text)" };
    if (!submitted) return selected === opt ? { backgroundColor:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.45)", color:"#4ade80" } : def;
    const norm = s => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const isThisCorrect = /^[A-D]:/.test(opt) ? opt.startsWith(question.correct_answer.trim()+":") : norm(opt)===norm(question.correct_answer);
    if (isThisCorrect)             return { backgroundColor:"rgba(34,197,94,0.12)",  border:"1px solid rgba(34,197,94,0.45)",  color:"#4ade80" };
    if (opt===selected&&!isThisCorrect) return { backgroundColor:"rgba(239,68,68,0.12)",  border:"1px solid rgba(239,68,68,0.45)",  color:"#f87171" };
    return { backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid var(--surface-2)", color:"var(--text-sub)" };
  };

  const getTFStyle = opt => {
    const def = { backgroundColor:"var(--card)", border:"1px solid var(--card-border)", color:"var(--text)" };
    if (!submitted) return selected===opt ? { backgroundColor:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.45)", color:"#4ade80" } : def;
    const isThisCorrect = opt.toLowerCase()===question.correct_answer.trim().toLowerCase();
    if (isThisCorrect)              return { backgroundColor:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.45)", color:"#4ade80" };
    if (opt===selected&&!isThisCorrect) return { backgroundColor:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.45)", color:"#f87171" };
    return { backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid var(--surface-2)", color:"var(--text-sub)" };
  };

  const renderOptions = () => {
    if (question.type === "tf") {
      return ["Adevarat","Fals"].map(opt => (
        <button key={opt} onClick={() => !submitted && setSelected(opt)}
          className="w-full text-left px-5 py-4 rounded-2xl text-sm font-medium transition-all"
          style={getTFStyle(opt)}
          onMouseEnter={e => !submitted && selected!==opt && (e.currentTarget.style.borderColor="rgba(34,197,94,0.3)")}
          onMouseLeave={e => !submitted && selected!==opt && (e.currentTarget.style.borderColor="var(--card-border)")}>
          {opt}
        </button>
      ));
    }
    if (question.type === "fill") {
      return (
        <div className="space-y-3">
          <input type="text" value={fillValue}
            onChange={e => !submitted && setFillValue(e.target.value)}
            onKeyDown={e => e.key==="Enter" && !submitted && handleSubmit()}
            placeholder="Scrie răspunsul tău aici..."
            className="w-full rounded-2xl px-5 py-4 text-sm focus:outline-none transition-all"
            style={{ backgroundColor:"var(--card)", color:"var(--text)",
              border: submitted ? (isCorrect ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(239,68,68,0.5)") : "1px solid var(--input-border)" }}
            onFocus={e => !submitted && (e.currentTarget.style.borderColor="rgba(34,197,94,0.45)")}
            onBlur={e => !submitted && (e.currentTarget.style.borderColor="var(--input-border)")}/>
          {submitted && !isCorrect && (
            <p className="text-sm px-2" style={{ color:"var(--text-sub)" }}>
              Răspuns corect: <span className="font-bold" style={{ color:"#4ade80" }}>{question.correct_answer}</span>
            </p>
          )}
        </div>
      );
    }
    return (question.options||[]).map((opt,i) => {
      const label = ["A","B","C","D"][i];
      const style = getOptionStyle(opt);
      const isSelected = selected === opt;
      const isSubmittedCorrect = submitted && (() => { const norm = s=>s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); return /^[A-D]:/.test(opt) ? opt.startsWith(question.correct_answer.trim()+":") : norm(opt)===norm(question.correct_answer); })();
      const isSubmittedWrong = submitted && isSelected && !isSubmittedCorrect;

      return (
        <button key={i} onClick={() => !submitted && setSelected(opt)}
          className="w-full text-left px-5 py-4 rounded-2xl text-sm transition-all flex items-center gap-4"
          style={style}
          onMouseEnter={e => !submitted && !isSelected && (e.currentTarget.style.borderColor="rgba(34,197,94,0.3)")}
          onMouseLeave={e => !submitted && !isSelected && (e.currentTarget.style.borderColor="var(--card-border)")}>
          {/* Label badge */}
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
            style={{
              backgroundColor: isSubmittedCorrect ? "rgba(34,197,94,0.25)" : isSubmittedWrong ? "rgba(239,68,68,0.25)" : isSelected ? "rgba(34,197,94,0.2)" : "var(--divider)",
              color: isSubmittedCorrect ? "#4ade80" : isSubmittedWrong ? "#f87171" : isSelected ? "#4ade80" : "var(--text-sub)",
            }}>{label}</div>
          <span className="flex-1">{opt.replace(/^[A-D]:\s*/,"")}</span>
          {submitted && isSubmittedCorrect && <Check size={15} style={{ color:"#4ade80", flexShrink:0 }}/>}
          {submitted && isSubmittedWrong   && <X    size={15} style={{ color:"#f87171", flexShrink:0 }}/>}
        </button>
      );
    });
  };

  const typeLabel = question.type==="mc" ? "Alegere multiplă" : question.type==="tf" ? "Adevărat / Fals" : "Completează spațiul";
  const canSubmit = question.type==="fill" ? fillValue.trim().length>0 : selected!==null;

  return (
    <div key={animKey} className="question-enter space-y-5">

      {/* Progress + meta */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs" style={{ color:"var(--text-sub)" }}>
          <span className="font-semibold" style={{ color:"var(--text-sub)" }}>
            {index+1} <span style={{ color:"var(--text-muted)" }}>/ {total}</span>
          </span>
          <div className="flex items-center gap-2">
            {mode==="practice" && streak>=2 && <StreakBadge streak={streak}/>}
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ backgroundColor:"var(--surface-2)", border:"1px solid var(--card-border)", color:"var(--text-sub)" }}>
              {typeLabel}
            </span>
          </div>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor:"var(--card-hover)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width:`${((index+1)/total)*100}%`, background:"linear-gradient(90deg,#22c55e,#4ade80)" }}/>
        </div>
      </div>

      {/* Question */}
      <div className="rounded-2xl p-6" style={{ backgroundColor:"var(--surface-1)", border:"1px solid var(--surface-2)" }}>
        <div>
          <p className="font-semibold text-base leading-relaxed" style={{ color:"var(--text)" }}>
            {question.question_text}
          </p>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2.5">{renderOptions()}</div>

      {/* Feedback practică */}
      {submitted && mode==="practice" && (
        <div className="rounded-2xl p-5 flex gap-4 items-start"
          style={{
            backgroundColor: isCorrect ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)",
            border:`1px solid ${isCorrect ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: isCorrect ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }}>
            {isCorrect ? <Check size={16} style={{ color:"#4ade80" }}/> : <X size={16} style={{ color:"#f87171" }}/>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm mb-1" style={{ color: isCorrect ? "#4ade80" : "#f87171" }}>
              {isCorrect ? "Răspuns Corect!" : "Răspuns Incorect"}
            </p>
            {!isCorrect && (
              <div className="text-xs space-y-1 mb-2">
                <p style={{ color:"var(--text-sub)" }}>Răspunsul tău: <span className="font-bold" style={{ color:"#f87171" }}>{currentSelected||"Niciun răspuns"}</span></p>
                <p style={{ color:"var(--text-sub)" }}>Răspuns corect: <span className="font-bold" style={{ color:"#4ade80" }}>{question.correct_answer}</span></p>
              </div>
            )}
            {question.explanation && (
              <div className="mt-2 p-3 rounded-xl text-xs leading-relaxed"
                style={{ backgroundColor:"rgba(0,0,0,0.2)", color:"var(--text-sub)", borderLeft:`2px solid ${isCorrect?"rgba(34,197,94,0.4)":"rgba(239,68,68,0.4)"}` }}>
                <span className="font-semibold block mb-1" style={{ color:"var(--text-sub)" }}>Explicație:</span>
                {question.explanation}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {!submitted ? (
        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-35 disabled:cursor-not-allowed"
          style={{ backgroundColor:"#22c55e", color:"#000", boxShadow: canSubmit ? "0 0 20px rgba(34,197,94,0.25)" : "none" }}
          onMouseEnter={e => canSubmit && (e.currentTarget.style.backgroundColor="#4ade80")}
          onMouseLeave={e => canSubmit && (e.currentTarget.style.backgroundColor="#22c55e")}>
          Verifică Răspunsul
        </button>
      ) : (
        <button onClick={onNext}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all"
          style={{ backgroundColor:"var(--surface-2)", border:"1px solid var(--input-border)", color:"var(--text)" }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor="var(--input-border)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor="var(--surface-2)"; e.currentTarget.style.borderColor="var(--input-border)"; }}>
          {isLastQuestion ? "Vezi rezultatele finale" : "Următoarea întrebare"} <ArrowRight size={16}/>
        </button>
      )}
    </div>
  );
}

// Results
function Results({ quiz, answers, timeSpent, onRetry, onExit }) {
  const correct = answers.filter(a=>a.isCorrect).length;
  const total   = quiz.questions.length;
  const pct     = Math.round((correct/total)*100);

  const grade = pct>=90 ? { label:"Excelent!",     color:"#4ade80", bg:"rgba(34,197,94,0.1)",   Icon:Trophy   }
    :           pct>=70 ? { label:"Bine!",          color:"#60a5fa", bg:"rgba(59,130,246,0.1)",  Icon:ThumbsUp }
    :           pct>=50 ? { label:"Acceptabil",     color:"#facc15", bg:"rgba(250,204,21,0.1)",  Icon:Book     }
    :                     { label:"Mai încearcă!",  color:"#f87171", bg:"rgba(239,68,68,0.1)",   Icon:Activity };
  const GradeIcon = grade.Icon;

  useEffect(() => { if (pct>=70) setTimeout(()=>fireConfetti(pct),400); }, []);

  return (
    <div className="max-w-xl mx-auto space-y-6 results-enter pb-10">

      {/* Score card */}
      <div className="text-center rounded-3xl p-10 relative overflow-hidden"
        style={{ backgroundColor:"var(--surface-1)", border:"1px solid var(--surface-2)" }}>
        <div className="absolute inset-0 pointer-events-none opacity-15"
          style={{ background:`radial-gradient(circle at 50% 60%, ${grade.color} 0%, transparent 65%)` }}/>

        <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-5 relative z-10"
          style={{ backgroundColor:grade.bg, border:`1px solid ${grade.color}30` }}>
          <GradeIcon size={36} style={{ color:grade.color }}/>
        </div>

        <h2 className="text-2xl font-black mb-1 relative z-10" style={{ color:grade.color }}>{grade.label}</h2>

        <div className="text-7xl font-black my-5 relative z-10"
          style={{ color:grade.color, textShadow:`0 0 40px ${grade.color}40` }}>
          <AnimatedScore target={pct}/>%
        </div>

        {/* Score ring */}
        <div className="flex justify-center mb-5 relative z-10">
          <svg width="120" height="8" viewBox="0 0 120 8">
            <rect x="0" y="2" width="120" height="4" rx="2" fill="var(--divider)"/>
            <rect x="0" y="2" width={`${pct*1.2}`} height="4" rx="2" fill={grade.color}/>
          </svg>
        </div>

        <div className="flex justify-center items-center gap-3 text-sm relative z-10">
          <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl"
            style={{ backgroundColor:"var(--card-hover)", color:"var(--text)" }}>
            <Check size={14} style={{ color:grade.color }}/> <strong style={{ color:"#fff" }}>{correct}</strong>/{total} corecte
          </span>
          {timeSpent && (
            <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl"
              style={{ backgroundColor:"var(--card-hover)", color:"var(--text-sub)" }}>
              <Clock size={13}/> {Math.floor(timeSpent/60)}m {timeSpent%60}s
            </span>
          )}
        </div>
      </div>

      {/* Sumar */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-3 pl-1" style={{ color:"var(--text-muted)" }}>
          Sumar răspunsuri
        </p>
        <div className="space-y-2.5">
          {quiz.questions.map(q => {
            const ans = answers.find(a=>a.questionId===q.id);
            let fullCorrectAnswer = q.correct_answer;
            if (q.type==="mc" && q.options) {
              const match = q.options.find(o=>o.startsWith(q.correct_answer.trim()+":"));
              if (match) fullCorrectAnswer = match;
            }
            return (
              <div key={q.id} className="flex items-start gap-4 p-5 rounded-2xl"
                style={{
                  backgroundColor: ans?.isCorrect ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
                  border:`1px solid ${ans?.isCorrect ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
                }}>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: ans?.isCorrect ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }}>
                  {ans?.isCorrect ? <Check size={14} style={{ color:"#4ade80" }}/> : <X size={14} style={{ color:"#f87171" }}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color:"var(--text)" }}>{q.question_text}</p>
                  {!ans?.isCorrect && (
                    <div className="mt-2.5 p-3 rounded-xl text-xs space-y-1"
                      style={{ backgroundColor:"rgba(0,0,0,0.2)" }}>
                      <p style={{ color:"var(--text-sub)" }}>Răspunsul tău: <span style={{ color:"#f87171", fontWeight:600 }}>{ans?.answer||"Niciun răspuns"}</span></p>
                      <p style={{ color:"var(--text-sub)" }}>Corect: <span style={{ color:"#4ade80", fontWeight:700 }}>{fullCorrectAnswer}</span></p>
                    </div>
                  )}
                  {q.explanation && (
                    <div className="mt-2.5 p-3 rounded-xl text-xs leading-relaxed"
                      style={{ backgroundColor:"var(--surface-1)", border:"1px solid var(--card-hover)" }}>
                      <span className="font-semibold block mb-0.5" style={{ color:"var(--text-sub)" }}>Explicație:</span>
                      <span style={{ color:"var(--text-sub)" }}>{q.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Butoane */}
      <div className="flex gap-3 pt-2">
        <button onClick={() => onExit(null,null)}
          className="flex-1 flex justify-center items-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all"
          style={{ backgroundColor:"var(--surface-2)", border:"1px solid var(--card-border)", color:"var(--text-sub)" }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor="var(--card-border)"; e.currentTarget.style.color="var(--text)"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor="var(--surface-2)"; e.currentTarget.style.color="var(--text-sub)"; }}>
          <ArrowLeft size={16}/> Înapoi la meniu
        </button>
        <button onClick={onRetry}
          className="flex-1 flex justify-center items-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all"
          style={{ backgroundColor:"#22c55e", color:"#000", boxShadow:"0 0 20px rgba(34,197,94,0.2)" }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor="#4ade80"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor="#22c55e"; }}>
          <RefreshCw size={16}/> Încearcă din nou
        </button>
      </div>
    </div>
  );
}

// Quiz Runner
export default function QuizRunner({ quiz, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers]           = useState([]);
  const [finished, setFinished]         = useState(false);
  const [startTime]                     = useState(Date.now());
  const [timeSpent, setTimeSpent]       = useState(null);
  const [streak, setStreak]             = useState(0);
  const savedRef = useRef(false);

  const questions = quiz.questions || [];
  const mode      = quiz.mode;

  useEffect(() => {
    if (!document.getElementById("quizrunner-styles")) {
      const style = document.createElement("style");
      style.id = "quizrunner-styles"; style.textContent = GLOBAL_STYLES;
      document.head.appendChild(style);
    }
    return () => {};
  }, []);

  const finish = async (finalAnswers, elapsed) => {
    if (savedRef.current) return;
    savedRef.current = true;
    const correct = finalAnswers.filter(a=>a.isCorrect).length;
    await saveAttempt({
      quiz_id:quiz.id, mode:quiz.mode, score:correct, total:questions.length, time_seconds:elapsed,
      answers:finalAnswers.map(a=>({ question_id:a.questionId, user_answer:a.answer||null, is_correct:a.isCorrect })),
    });
  };

  const handleAnswer = ({ questionId, answer, isCorrect }) => {
    const newAnswers = [...answers, { questionId, answer, isCorrect }];
    setAnswers(newAnswers);
    setStreak(s => isCorrect ? s+1 : 0);
    if (mode !== "practice") handleNext(newAnswers);
  };

  const handleNext = (currentAnswers) => {
    const ans = currentAnswers || answers;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      const elapsed = Math.round((Date.now()-startTime)/1000);
      setTimeSpent(elapsed); finish(ans,elapsed);
      const correct = ans.filter(a=>a.isCorrect).length;
      onExit(correct, questions.length, true);
      setFinished(true);
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  const handleTimeUp = () => {
    const elapsed = Math.round((Date.now()-startTime)/1000);
    setTimeSpent(elapsed); finish(answers,elapsed);
    const correct = answers.filter(a=>a.isCorrect).length;
    onExit(correct, questions.length, true);
    setFinished(true);
  };

  const handleRetry = () => {
    setCurrentIndex(0); setAnswers([]); setFinished(false);
    setTimeSpent(null); setStreak(0); savedRef.current = false;
  };

  const ModeIcon  = mode==="practice" ? Target : mode==="exam" ? Clock : ListChecks;
  const modeLabel = mode==="practice" ? "Practică" : mode==="exam" ? "Examen" : "Test";
  const modeColor = mode==="practice" ? "#22c55e" : mode==="exam" ? "#f59e0b" : "#a855f7";

  if (finished) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => onExit(null,null,false)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ backgroundColor:"var(--surface-2)", border:"1px solid var(--card-border)", color:"var(--text-sub)" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor="var(--card-border)"; e.currentTarget.style.color="var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor="var(--surface-2)"; e.currentTarget.style.color="var(--text-sub)"; }}>
            <ArrowLeft size={18}/>
          </button>
          <div>
            <h1 className="text-xl font-black" style={{ color:"var(--text)" }}>Rezultate Finale</h1>
            <p className="text-xs mt-0.5" style={{ color:"var(--text-sub)" }}>{quiz.title}</p>
          </div>
        </div>
        <Results quiz={quiz} answers={answers} timeSpent={timeSpent} onRetry={handleRetry} onExit={(s,t)=>onExit(s,t,false)}/>
      </div>
    );
  }

  const question = questions[currentIndex];
  if (!question) return null;
  const showTimer     = mode==="exam" && quiz.time_limit_sec;
  const isLastQuestion = currentIndex+1 >= questions.length;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => onExit(null,null,false)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            style={{ backgroundColor:"var(--surface-2)", border:"1px solid var(--card-border)", color:"var(--text-sub)" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor="var(--card-border)"; e.currentTarget.style.color="var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor="var(--surface-2)"; e.currentTarget.style.color="var(--text-sub)"; }}>
            <ArrowLeft size={18}/>
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-black truncate max-w-[200px] sm:max-w-sm" style={{ color:"var(--text)" }}>{quiz.title}</h1>
            <p className="text-xs mt-0.5" style={{ color:"var(--text-sub)" }}>
              Întrebarea {currentIndex+1} din {questions.length}
            </p>
          </div>
        </div>

        {showTimer ? (
          <Timer seconds={quiz.time_limit_sec} onTimeUp={handleTimeUp}/>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ backgroundColor:`${modeColor}12`, border:`1px solid ${modeColor}28`, color:modeColor }}>
            <ModeIcon size={13}/>{modeLabel}
          </div>
        )}
      </div>

      {/* Question card */}
      <QuestionCard
        key={`${quiz.id}-${currentIndex}`}
        question={question} index={currentIndex} total={questions.length}
        mode={mode} streak={streak} isLastQuestion={isLastQuestion}
        onAnswer={handleAnswer} onNext={() => handleNext()}
      />
    </div>
  );
}