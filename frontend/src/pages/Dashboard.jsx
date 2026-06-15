// frontend/src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from "react";
import { getToken, logoutUser } from "../api/auth";
import {
  LayoutDashboard, FileText, ClipboardList, Layers,
  BarChart2, BrainCircuit, LogOut, ShieldCheck,
  Upload, Flame, Clock, TrendingUp, BookOpen,
  ChevronRight, Zap, Sun, Moon, GraduationCap, Gamepad2,
  GitCompare, Palette
} from "lucide-react";
import Materials from "./Materials";
import Quizzes from "./Quizzes";
import Progress from "./Progress";
import FlashcardsPage from "./Flashcards";
import QuizRunner from "./QuizRunner";
import Admin from "./Admin";
import Profile from "./Profile";
import QuizML from "./QuizML";
import QuizMLV5 from "./QuizMLV5";
import MusicPlayer from "../components/MusicPlayer";
import StudyAvatar from "../components/StudyAvatar";
import { useTheme } from "../context/ThemeContext";
import Prediction from "./Prediction";
import Games from "./Games";
import DailyChallenge from "../components/DailyChallenge";
import WordleGame from "./WordleGame";
import CompareQuiz from "./CompareQuiz";
import AvatarCustomizer from "./AvatarCustomizer";

const API_URL = "http://127.0.0.1:8000/api";

const C = {
  bg:        "var(--bg)",
  sidebar:   "var(--sidebar)",
  card:      "var(--card)",
  cardBorder:"var(--card-border)",
  text:      "var(--text)",
  textSub:   "var(--text-sub)",
  textMuted: "var(--text-muted)",
  divider:   "var(--divider)",
  green:  "#22c55e",
  blue:   "#3b82f6",
  purple: "#a855f7",
  amber:  "#f59e0b",
  red:    "#ef4444",
};

function formatStudyTime(seconds) {
  if (!seconds || seconds === 0) return "0 min";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

function calcStreak(attempts) {
  if (!attempts || attempts.length === 0) return 0;
  const today = new Date(); today.setHours(0,0,0,0);
  const days = new Set(attempts.filter(a => a.completed_at).map(a => {
    const d = new Date(a.completed_at); d.setHours(0,0,0,0); return d.getTime();
  }));
  let streak = 0, check = today.getTime();
  while (days.has(check)) { streak++; check -= 86400000; }
  if (streak === 0 && days.has(today.getTime() - 86400000)) {
    check = today.getTime() - 86400000;
    while (days.has(check)) { streak++; check -= 86400000; }
  }
  return streak;
}

function Counter({ to, suffix = "" }) {
  const [val, setVal] = useState(0);
  const raf = useRef(null), start = useRef(null);
  useEffect(() => {
    if (!to) return;
    start.current = null;
    const animate = (ts) => {
      if (!start.current) start.current = ts;
      const p = Math.min((ts - start.current) / 900, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [to]);
  return <span>{val}{suffix}</span>;
}

const NAV_ITEMS = [
  { id: "dashboard",  label: "Dashboard",           icon: LayoutDashboard },
  { id: "materials",  label: "Materiale",           icon: FileText },
  { id: "quizzes",    label: "Quizuri",             icon: ClipboardList },
  { id: "flashcards", label: "Flashcard-uri",       icon: Layers },
  { id: "progress",   label: "Progres",             icon: BarChart2 },
  { id: "quiz-ml",    label: "Quiz Cloze",          icon: BrainCircuit },
  { id: "quiz-ml-v5", label: "Quiz Cloze · Hard",   icon: Flame },
  { id: "compare",    label: "Comparație Modele",   icon: GitCompare },
  { id: "prediction", label: "Predicție Academică", icon: GraduationCap },
  { id: "games",      label: "Jocuri",              icon: Gamepad2 },
  { id: "avatar",     label: "Avatar",              icon: Palette },
];

function Sidebar({ active, setActive, user, onLogout, avatarMood, lastScore, avatarColor, equippedAccessories }) {
  const isAdmin = user?.role === "admin";
  const { theme, toggle } = useTheme();
  return (
    <aside className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{ width: "232px", backgroundColor: "var(--sidebar)", borderRight: "1px solid var(--divider)" }}>

      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: `1px solid ${C.divider}` }}>
        <img src="/logo.webp" alt="Quizzi" className="w-8 h-8 rounded-lg" />
        <span className="font-black text-sm" style={{ color: C.text, letterSpacing: "0.12em" }}>QUIZZI</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const on = active === id;
          return (
            <button key={id} onClick={() => setActive(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: on ? "rgba(34,197,94,0.12)" : "transparent",
                color: on ? C.green : C.textSub,
                border: on ? "1px solid rgba(34,197,94,0.22)" : "1px solid transparent",
              }}
              onMouseEnter={e => { if (!on) { e.currentTarget.style.backgroundColor = "var(--surface-2)"; e.currentTarget.style.color = C.text; }}}
              onMouseLeave={e => { if (!on) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.textSub; }}}>
              <Icon size={16} strokeWidth={1.8} />{label}
            </button>
          );
        })}
        {isAdmin && (
          <button onClick={() => setActive("admin")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-2"
            style={{
              backgroundColor: active === "admin" ? "rgba(168,85,247,0.12)" : "transparent",
              color: active === "admin" ? C.purple : C.textSub,
              border: active === "admin" ? "1px solid rgba(168,85,247,0.22)" : "1px solid transparent",
            }}>
            <ShieldCheck size={16} strokeWidth={1.8} />Admin
          </button>
        )}
      </nav>

      {/* Avatar — fix: dimensiune fixa sa nu modifice latimea sidebarului */}
      <div style={{ borderTop: `1px solid ${C.divider}`, height: "80px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <StudyAvatar
          mood={avatarMood}
          lastScore={lastScore}
          avatarColor={avatarColor}
          equippedAccessories={equippedAccessories}
        />
      </div>

      <div className="px-3 pb-4 space-y-0.5">
        <button onClick={() => setActive("profile")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
          style={{ backgroundColor: active === "profile" ? "var(--card-hover)" : "transparent" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--surface-2)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = active === "profile" ? "var(--card-hover)" : "transparent"}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: "rgba(34,197,94,0.18)", color: C.green }}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium truncate" style={{ color: C.text }}>{user?.name || "Utilizator"}</p>
            <p className="text-xs truncate" style={{ color: C.textMuted }}>{user?.email || ""}</p>
          </div>
        </button>
        <button onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: C.textSub, backgroundColor: "transparent" }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--surface-2)"; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.textSub; }}>
          {theme === "dark" ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
          {theme === "dark" ? "Mod luminos" : "Mod întunecat"}
        </button>
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: C.textSub }}
          onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.textSub; e.currentTarget.style.backgroundColor = "transparent"; }}>
          <LogOut size={15} strokeWidth={1.8} />Delogare
        </button>
      </div>
    </aside>
  );
}

// Dashboard Home
function DashboardHome({ user, onGoMaterials, onGoFlashcards, onGoProgress, onGoQuizzes, onGoWordle }) {
  const [stats,           setStats]      = useState(null);
  const [materialsCount,  setMaterials]  = useState(0);
  const [quizzesCount,    setQuizzes]    = useState(0);
  const [flashcardsData,  setFlashcards] = useState({ total: 0, due: 0 });
  const [recentAttempts,  setRecent]     = useState([]);
  const [allAttempts,     setAll]        = useState([]);
  const [subjectProgress, setSubjectProg]= useState([]);
  const [loading,         setLoading]    = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bună dimineața" : hour < 18 ? "Bună ziua" : "Bună seara";

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const load = async () => {
      try {
        const [mRes, qRes, aRes, fcRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/materials/`,     { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/quizzes/`,       { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/attempts/`,      { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/flashcards/`,    { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/attempts/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        let materials = [], quizzes = [], attempts = [];
        if (mRes.ok)     { materials = await mRes.json(); setMaterials(materials.length); }
        if (qRes.ok)     { quizzes   = await qRes.json(); setQuizzes(quizzes.length); }
        if (aRes.ok)     { attempts  = await aRes.json(); setAll(attempts); setRecent(attempts.slice(0, 6)); }
        if (statsRes.ok) { setStats(await statsRes.json()); }
        if (fcRes.ok) {
          const fc = await fcRes.json();
          setFlashcards({ total: fc.length, due: fc.filter(c => !c.next_review || c.repetitions === 0 || new Date(c.next_review) <= new Date()).length });
        }
        if (materials.length > 0 && quizzes.length > 0 && attempts.length > 0) {
          const matSubject = {};
          materials.forEach(m => { if (m.subject) matSubject[m.id] = m.subject; });
          const quizSubject = {};
          quizzes.forEach(q => { if (q.material_id && matSubject[q.material_id]) quizSubject[q.id] = matSubject[q.material_id]; });
          const bySubject = {};
          attempts.forEach(a => {
            const subj = quizSubject[a.quiz_id];
            if (subj) { if (!bySubject[subj]) bySubject[subj] = []; bySubject[subj].push(Math.round((a.score / a.total) * 100)); }
          });
          setSubjectProg(Object.entries(bySubject).map(([name, scores]) => ({
            name, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), count: scores.length,
          })).sort((a, b) => b.count - a.count).slice(0, 4));
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const streak         = calcStreak(allAttempts);
  const totalStudyTime = allAttempts.reduce((s, a) => s + (a.time_seconds || 0), 0);
  const sparkData      = [...recentAttempts].slice(0, 7).reverse().map(a => Math.round((a.score / a.total) * 100));
  const trend          = recentAttempts.length >= 2
    ? Math.round((recentAttempts[0].score / recentAttempts[0].total) * 100) -
      Math.round((recentAttempts[1].score / recentAttempts[1].total) * 100)
    : null;
  const scoreColor = (pct) => pct >= 70 ? C.green : pct >= 50 ? C.amber : C.red;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: C.text }}>
            {greeting}, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: C.textSub }}>Rezumatul activității tale de studiu.</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ backgroundColor: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
            <Flame size={15} style={{ color: C.amber }} />
            <span className="font-bold text-sm" style={{ color: C.amber }}>
              {streak} {streak === 1 ? "zi" : "zile"} la rând
            </span>
          </div>
        )}
      </div>

      <DailyChallenge onPlay={(status) => onGoWordle(status)} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Materiale",  value: materialsCount,            suffix: "",  icon: FileText,      accent: C.green,  sub: `${materialsCount} PDF-uri` },
          { label: "Quizuri",    value: quizzesCount,              suffix: "",  icon: ClipboardList, accent: C.blue,   sub: `${quizzesCount} generate` },
          { label: "Scor mediu", value: stats?.avg_score_pct || 0, suffix: "%", icon: TrendingUp,    accent: C.purple, sub: `${stats?.total_attempts || 0} tentative` },
          { label: "Timp studiu",value: null, icon: Clock, accent: C.amber, sub: "total acumulat", timeVal: totalStudyTime },
        ].map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl p-5"
              style={{ backgroundColor: `${c.accent}14`, border: `1px solid ${c.accent}30` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold" style={{ color: c.accent }}>{c.label}</p>
                <Icon size={14} style={{ color: c.accent, opacity: 0.6 }} />
              </div>
              <p className="text-2xl font-black" style={{ color: C.text }}>
                {loading ? "—" : c.timeVal !== undefined ? formatStudyTime(c.timeVal) : <Counter to={c.value} suffix={c.suffix || ""} />}
              </p>
              <p className="text-xs mt-1" style={{ color: C.textSub }}>{c.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2 rounded-2xl p-5 flex flex-col"
          style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}` }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textSub }}>Evoluție recentă</p>
              <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>Ultimele {sparkData.length} tentative</p>
            </div>
            {trend !== null && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: trend >= 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: trend >= 0 ? C.green : C.red }}>
                <TrendingUp size={10} />{trend >= 0 ? "+" : ""}{trend}%
              </div>
            )}
          </div>
          {sparkData.length >= 2 ? (
            <div className="flex items-end gap-1.5 flex-1" style={{ minHeight: "64px" }}>
              {sparkData.map((v, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full rounded-sm"
                    style={{ height: `${Math.max(6, (v / 100) * 52)}px`, backgroundColor: v >= 70 ? "rgba(34,197,94,0.6)" : v >= 50 ? "rgba(245,158,11,0.6)" : "rgba(239,68,68,0.55)" }} />
                  <span style={{ color: C.textMuted, fontSize: "9px" }}>{v}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-center" style={{ color: C.textMuted }}>Completează quizuri pentru grafic</p>
            </div>
          )}
          <button onClick={onGoProgress}
            className="flex items-center gap-1 mt-4 text-xs font-medium transition-all w-fit"
            style={{ color: C.textSub }}
            onMouseEnter={e => e.currentTarget.style.color = C.green}
            onMouseLeave={e => e.currentTarget.style.color = C.textSub}>
            Vezi statistici complete <ChevronRight size={11} />
          </button>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-2.5">
          {[
            { icon: Upload,   label: "Încarcă material PDF",     desc: "Adaugă un curs sau capitol nou",   accent: C.green, action: onGoMaterials },
            { icon: Zap,      label: "Generează quiz nou",        desc: "Din materialele din bibliotecă",   accent: C.blue,  action: onGoMaterials },
            { icon: BookOpen, label: "Revizuiește flashcard-uri", desc: flashcardsData.due > 0 ? `${flashcardsData.due} carduri programate azi` : "Niciun card de revizuit acum", accent: C.amber, action: onGoFlashcards, badge: flashcardsData.due > 0 ? flashcardsData.due : null },
          ].map(a => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={a.action}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all"
                style={{ backgroundColor: `${a.accent}10`, border: `1px solid ${a.accent}28` }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${a.accent}18`; e.currentTarget.style.borderColor = `${a.accent}45`; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${a.accent}10`; e.currentTarget.style.borderColor = `${a.accent}28`; }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${a.accent}20` }}>
                  <Icon size={16} style={{ color: a.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: C.text }}>{a.label}</p>
                  <p className="text-xs" style={{ color: C.textSub }}>{a.desc}</p>
                </div>
                {a.badge && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: a.accent, color: "#000" }}>{a.badge}</div>
                )}
                <ChevronRight size={14} style={{ color: C.textMuted, flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-3 rounded-2xl p-5"
          style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}` }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textSub }}>Activitate recentă</p>
            <button onClick={onGoQuizzes} className="text-xs transition-all" style={{ color: C.textMuted }}
              onMouseEnter={e => e.currentTarget.style.color = C.green}
              onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
              Vezi toate →
            </button>
          </div>
          {recentAttempts.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={26} className="mx-auto mb-2" style={{ color: C.textMuted }} />
              <p className="text-sm" style={{ color: C.textSub }}>Nicio tentativă încă</p>
              <p className="text-xs mt-1" style={{ color: C.textMuted }}>Completează un quiz pentru a vedea istoricul</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentAttempts.map((a, i) => {
                const pct = Math.round((a.score / a.total) * 100);
                const sc  = scoreColor(pct);
                const modeLabel = a.mode === "practice" ? "Practică" : a.mode === "exam" ? "Examen" : "Test";
                const ModeIcon  = a.mode === "practice" ? BookOpen : a.mode === "exam" ? Clock : ClipboardList;
                return (
                  <div key={a.id || i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ backgroundColor: "var(--surface-1)" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "var(--card-hover)" }}>
                      <ModeIcon size={12} style={{ color: C.textSub }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: C.text }}>{a.quiz_title || modeLabel}</p>
                      <p className="text-xs" style={{ color: C.textMuted }}>{a.score}/{a.total} corecte · {modeLabel}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--divider)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: sc }} />
                      </div>
                      <div className="w-10 text-center text-xs font-bold py-0.5 rounded-lg"
                        style={{ backgroundColor: `${sc}18`, color: sc }}>{pct}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="rounded-2xl p-5 flex-1"
            style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}` }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: C.textSub }}>
              Progres per materie
            </p>
            {loading ? (
              <p className="text-xs text-center py-4" style={{ color: C.textMuted }}>Se încarcă...</p>
            ) : subjectProgress.length === 0 ? (
              <div className="text-center py-4 space-y-1">
                <BarChart2 size={22} className="mx-auto" style={{ color: C.textMuted }} />
                <p className="text-xs" style={{ color: C.textSub }}>Nu există date încă</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {subjectProgress.map(s => (
                  <div key={s.name}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium truncate" style={{ color: C.text }}>{s.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-xs" style={{ color: C.textMuted }}>{s.count} quizuri</span>
                        <span className="text-xs font-bold" style={{ color: scoreColor(s.avg) }}>{s.avg}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--divider)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${s.avg}%`, backgroundColor: scoreColor(s.avg) }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {flashcardsData.due > 0 && (
            <button onClick={onGoFlashcards}
              className="rounded-2xl p-4 text-left transition-all"
              style={{ backgroundColor: "rgba(245,158,11,0.09)", border: "1px solid rgba(245,158,11,0.25)" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(245,158,11,0.14)"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "rgba(245,158,11,0.09)"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.25)"; }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(245,158,11,0.18)" }}>
                  <Layers size={15} style={{ color: C.amber }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: "#fcd34d" }}>{flashcardsData.due} carduri azi</p>
                  <p className="text-xs" style={{ color: C.textSub }}>Programate pentru revizuire</p>
                </div>
                <ChevronRight size={14} style={{ color: C.textMuted }} />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

//  Dashboard principal
export default function Dashboard({ onLogout }) {
  const [active,        setActive]       = useState("dashboard");
  const [user,          setUser]         = useState(null);
  const [activeQuiz,    setActiveQuiz]   = useState(null);
  const [avatarMood,    setAvatarMood]   = useState("idle");
  const [lastScore,     setLastScore]    = useState(null);
  const [wordleStatus,  setWordleStatus] = useState(null);
  const [avatarConfig,  setAvatarConfig] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setUser).catch(() => {});
    fetch(`${API_URL}/avatar/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setAvatarConfig).catch(() => {});
  }, []);

  const handleLogout    = () => { logoutUser(); onLogout(); };
  const handleStartQuiz = (quiz) => { setActiveQuiz(quiz); setActive("quiz-runner"); setAvatarMood("thinking"); };
  const handleExitQuiz  = (score = null, total = null, previewOnly = false) => {
    if (score !== null && total !== null) {
      const pct = Math.round((score / total) * 100);
      setLastScore(pct);
      if (pct >= 90) setAvatarMood("celebrating");
      else if (pct >= 70) setAvatarMood("happy");
      else setAvatarMood("sad");
    } else { setAvatarMood("idle"); }
    if (!previewOnly) { setActiveQuiz(null); setActive("quizzes"); }
  };

  const handleGoWordle = (status) => {
    setWordleStatus(status);
    setActive("wordle");
  };

  // Callback pasat la AvatarCustomizer — actualizeaza avatarul in sidebar instant
  const handleAvatarSave = (updatedConfig) => {
    setAvatarConfig(updatedConfig);
  };

  const renderContent = () => {
    if (active === "quiz-runner" && activeQuiz)
      return <QuizRunner quiz={activeQuiz} onExit={handleExitQuiz} />;
    switch (active) {
      case "dashboard":  return <DashboardHome user={user} onGoMaterials={() => setActive("materials")} onGoFlashcards={() => setActive("flashcards")} onGoProgress={() => setActive("progress")} onGoQuizzes={() => setActive("quizzes")} onGoWordle={handleGoWordle} />;
      case "materials":  return <Materials onStartQuiz={handleStartQuiz} />;
      case "quizzes":    return <Quizzes onStartQuiz={handleStartQuiz} />;
      case "flashcards": return <FlashcardsPage />;
      case "progress":   return <Progress />;
      case "admin":      return <Admin />;
      case "profile":    return <Profile user={user} onUserUpdate={(u) => setUser(u)} />;
      case "quiz-ml":    return <QuizML onStartQuiz={handleStartQuiz} />;
      case "quiz-ml-v5": return <QuizMLV5 onStartQuiz={handleStartQuiz} />;
      case "compare":    return <CompareQuiz />;
      case "prediction": return <Prediction />;
      case "games":      return <Games />;
      case "avatar":     return <AvatarCustomizer onSave={handleAvatarSave} />;
      case "wordle":     return <WordleGame onBack={() => setActive("dashboard")} challengeId={wordleStatus?.challenge_id} wordLength={wordleStatus?.word_length || 5} previousGuesses={wordleStatus?.guesses || []} alreadySolved={!!(wordleStatus?.already_played && wordleStatus?.solved)} />;
      default:           return <DashboardHome user={user} onGoMaterials={() => setActive("materials")} onGoFlashcards={() => setActive("flashcards")} onGoProgress={() => setActive("progress")} onGoQuizzes={() => setActive("quizzes")} onGoWordle={handleGoWordle} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg)" }}>
      <Sidebar
        active={active}
        setActive={setActive}
        user={user}
        onLogout={handleLogout}
        avatarMood={avatarMood}
        lastScore={lastScore}
        avatarColor={avatarConfig?.color}
        equippedAccessories={avatarConfig?.equipped_accessories || []}
      />
      <main className="flex-1 p-8 overflow-y-auto" style={{ marginLeft: "232px" }}>
        {renderContent()}
      </main>
      <MusicPlayer />
    </div>
  );
}