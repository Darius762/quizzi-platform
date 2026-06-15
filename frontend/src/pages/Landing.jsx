// frontend/src/pages/Landing.jsx
import {
  BrainCircuit, FlipHorizontal2, BarChart3,
  Clock, FolderOpen, Layers, ArrowRight,
  Sparkles, ChevronRight
} from "lucide-react";

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Quizuri generate automat",
    desc: "Pipeline RAG cu Llama 3.3 70B extrage conceptele cheie din orice PDF și construiește întrebări multiple choice, adevărat/fals sau completare.",
    accent: "#22c55e",
  },
  {
    icon: FlipHorizontal2,
    title: "Flashcard-uri inteligente",
    desc: "Algoritmul SM-2 de repetiție spațiată programează revizuirile optim, maximizând retenția pe termen lung.",
    accent: "#3b82f6",
  },
  {
    icon: BarChart3,
    title: "Statistici detaliate",
    desc: "Grafice de evoluție, heatmap de activitate și distribuție per mod de quiz — toate datele de performanță într-un singur loc.",
    accent: "#a855f7",
  },
  {
    icon: Clock,
    title: "Mod examen simulat",
    desc: "Cronometru configurabil, feedback ascuns pe parcurs și evaluare finală pentru condiții reale de examen.",
    accent: "#f59e0b",
  },
  {
    icon: FolderOpen,
    title: "Bibliotecă personală",
    desc: "Organizează materialele pe materii și capitole, cu suport pentru materiale globale partajate între utilizatori.",
    accent: "#06b6d4",
  },
  {
    icon: Layers,
    title: "Model BERT local",
    desc: "Motor secundar de generare fill-in-the-blank antrenat pe 72k exemple academice românești, fără dependențe externe.",
    accent: "#ec4899",
  },
];

const STEPS = [
  { num: "01", title: "Încarcă materialul", desc: "PDF-ul cursului tău devine sursa de cunoaștere a sistemului." },
  { num: "02", title: "Configurează quiz-ul", desc: "Alege dificultatea, tipul și numărul de întrebări." },
  { num: "03", title: "Studiază și urmărești", desc: "Răspunde, revizuiește greșelile și urmărești evoluția în timp." },
];

export default function Landing({ onGoLogin, onGoRegister }) {
  return (
    <div
      className="min-h-screen text-white overflow-x-hidden"
      style={{
        backgroundColor: "#080d18",
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,197,94,0.07) 0%, transparent 70%),
          radial-gradient(ellipse 40% 30% at 80% 20%, rgba(59,130,246,0.05) 0%, transparent 60%)
        `,
      }}
    >
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
        style={{
          backgroundColor: "rgba(8,12,20,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-3">
          <img src="/logo.webp" alt="Quizzi" className="w-8 h-8 rounded-lg" />
          <span
            className="text-lg font-black tracking-widest"
            style={{ color: "#f1f5f9", letterSpacing: "0.12em" }}
          >
            QUIZZI
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onGoLogin}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ color: "#94a3b8" }}
            onMouseEnter={e => e.currentTarget.style.color = "#f1f5f9"}
            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}
          >
            Autentificare
          </button>
          <button
            onClick={onGoRegister}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: "#22c55e",
              color: "#000",
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#16a34a"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}
          >
            Înregistrare
            <ChevronRight size={14} />
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center text-center px-6 pt-28 pb-24">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Badge */}
        <div
          className="relative inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide"
          style={{
            backgroundColor: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            color: "#4ade80",
          }}
        >
          <Sparkles size={12} />
          Platformă educațională · Proiect de licență 2025
        </div>

        {/* Title */}
        <h1
          className="relative font-black leading-none tracking-tight mb-6"
          style={{
            fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
            fontFamily: "'Sora', 'DM Sans', sans-serif",
            maxWidth: "820px",
          }}
        >
          <span style={{ color: "#f1f5f9" }}>Generare automată de</span>
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #22c55e 0%, #4ade80 50%, #86efac 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            quizuri educaționale
          </span>
          <br />
          <span style={{ color: "#f1f5f9" }}>din materiale PDF</span>
        </h1>

        {/* Subtitle */}
        <p
          className="relative mb-10 leading-relaxed"
          style={{
            color: "#64748b",
            fontSize: "1.05rem",
            maxWidth: "520px",
          }}
        >
          Sistem bazat pe tehnici RAG și modele de limbaj pentru generarea
          automată de conținut de evaluare în limba română.
        </p>

        {/* CTA buttons */}
        <div className="relative flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={onGoRegister}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all"
            style={{
              backgroundColor: "#22c55e",
              color: "#000",
              boxShadow: "0 0 30px rgba(34,197,94,0.25)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#16a34a";
              e.currentTarget.style.boxShadow = "0 0 40px rgba(34,197,94,0.35)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "#22c55e";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(34,197,94,0.25)";
            }}
          >
            Accesează platforma
            <ArrowRight size={16} />
          </button>
          <button
            onClick={onGoLogin}
            className="px-7 py-3.5 rounded-xl font-semibold text-sm transition-all"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#cbd5e1",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            Am deja cont
          </button>
        </div>

        {/* Stats row */}
        <div
          className="relative flex items-center gap-8 mt-16 flex-wrap justify-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "2rem" }}
        >
          {[
            { value: "3", label: "tipuri de întrebări" },
            { value: "RAG", label: "arhitectură retrieval" },
            { value: "BERT", label: "model local antrenat" },
            { value: "SM-2", label: "algoritm flashcard-uri" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div
                className="font-black text-xl mb-0.5"
                style={{ color: "#22c55e", fontFamily: "'Sora', sans-serif" }}
              >
                {s.value}
              </div>
              <div className="text-xs" style={{ color: "#475569" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="px-8 py-20 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "#22c55e" }}
          >
            Flux de lucru
          </p>
          <h2
            className="font-black text-3xl"
            style={{ color: "#f1f5f9", fontFamily: "'Sora', sans-serif" }}
          >
            Simplu și eficient
          </h2>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div
            className="absolute top-8 left-0 right-0 h-px hidden md:block"
            style={{ background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)" }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="relative flex flex-col items-center text-center p-8 rounded-2xl"
                style={{
                  backgroundColor: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 font-black text-base"
                  style={{
                    backgroundColor: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    color: "#22c55e",
                    fontFamily: "'Sora', sans-serif",
                  }}
                >
                  {step.num}
                </div>
                <h3
                  className="font-bold text-base mb-2"
                  style={{ color: "#f1f5f9" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ──────────────────────────────────────────────── */}
      <section className="px-8 pb-24 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "#22c55e" }}
          >
            Funcționalități
          </p>
          <h2
            className="font-black text-3xl"
            style={{ color: "#f1f5f9", fontFamily: "'Sora', sans-serif" }}
          >
            Tot ce ai nevoie pentru pregătire
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group p-6 rounded-2xl transition-all duration-300 cursor-default"
                style={{
                  backgroundColor: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor = `${f.accent}33`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.025)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: `${f.accent}15`,
                    border: `1px solid ${f.accent}30`,
                  }}
                >
                  <Icon size={18} style={{ color: f.accent }} />
                </div>

                <h3
                  className="font-bold text-sm mb-2"
                  style={{ color: "#f1f5f9" }}
                >
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────────────────────── */}
      <section
        className="mx-8 mb-16 rounded-3xl px-12 py-16 text-center"
        style={{
          backgroundColor: "rgba(34,197,94,0.05)",
          border: "1px solid rgba(34,197,94,0.15)",
          backgroundImage: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(34,197,94,0.08) 0%, transparent 70%)",
        }}
      >
        <div
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.2)",
            color: "#4ade80",
          }}
        >
          <Sparkles size={12} />
          Proiect de licență · Facultatea de Informatică
        </div>

        <h2
          className="font-black text-3xl mb-3"
          style={{ color: "#f1f5f9", fontFamily: "'Sora', sans-serif" }}
        >
          Explorează platforma
        </h2>
        <p className="mb-8 text-sm" style={{ color: "#64748b", maxWidth: "400px", margin: "0 auto 2rem" }}>
          Sistem demonstrativ de generare automată a conținutului educațional
          cu tehnici moderne de NLP.
        </p>
        <button
          onClick={onGoRegister}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all"
          style={{
            backgroundColor: "#22c55e",
            color: "#000",
            boxShadow: "0 0 40px rgba(34,197,94,0.3)",
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#16a34a"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}
        >
          Creează cont
          <ArrowRight size={16} />
        </button>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer
        className="px-8 py-8 flex items-center justify-between flex-wrap gap-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2.5">
          <img src="/logo.webp" alt="Quizzi" className="w-6 h-6 rounded-md" />
          <span className="font-bold text-sm tracking-widest" style={{ color: "#334155" }}>
            QUIZZI
          </span>
        </div>
        <p className="text-xs" style={{ color: "#334155" }}>
          Lucrare de licență · 2025
        </p>
      </footer>
    </div>
  );
}