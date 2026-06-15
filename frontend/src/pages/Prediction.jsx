// frontend/src/pages/Prediction.jsx
import { useState, useEffect } from "react";
import { getToken } from "../api/auth";
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, BookOpen, Clock, Users, Music2,
  Dumbbell, Heart, ChevronRight, Loader2, RotateCcw,
  GraduationCap, Target, Lightbulb, Star, Trophy, Info
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

function getGradeColor(nota) {
  if (nota >= 8.5) return { color: "#22c55e", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.25)"  };
  if (nota >= 7.0) return { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" };
  if (nota >= 5.0) return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" };
  return            { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)"  };
}

function getGradeIcon(nota) {
  if (nota >= 9.0) return { Icon: Trophy,      color: "#22c55e" };
  if (nota >= 8.0) return { Icon: Star,         color: "#3b82f6" };
  if (nota >= 7.0) return { Icon: TrendingUp,   color: "#3b82f6" };
  if (nota >= 5.0) return { Icon: TrendingUp,   color: "#f59e0b" };
  return                  { Icon: TrendingDown,  color: "#ef4444" };
}

const GRADE_EXPLANATIONS = {
  0: { ro: "9-10", desc: "Excelent — top 5% din studenți",        color: "#22c55e" },
  1: { ro: "8-9",  desc: "Foarte bine — performanță ridicată",    color: "#3b82f6" },
  2: { ro: "7-8",  desc: "Bine — peste medie",                    color: "#3b82f6" },
  3: { ro: "5-7",  desc: "Satisfăcător — sub medie",              color: "#f59e0b" },
  4: { ro: "1-5",  desc: "Insuficient — necesită îmbunătățire",   color: "#ef4444" },
};

function SliderField({ label, icon: Icon, value, onChange, min, max, step = 1, unit = "", accent = "#22c55e", marks }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${accent}15` }}>
            <Icon size={14} style={{ color: accent }} />
          </div>
          <label className="text-sm font-semibold" style={{ color: "var(--text)" }}>{label}</label>
        </div>
        <span className="text-sm font-black px-2.5 py-0.5 rounded-lg"
          style={{ backgroundColor: `${accent}15`, color: accent }}>
          {value}{unit}
        </span>
      </div>
      <div className="relative pt-1">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${accent} ${pct}%, var(--surface-2) ${pct}%)`,
            outline: "none",
          }} />
        {marks && (
  <div className="relative mt-1" style={{ height: "16px" }}>
    {marks.map(m => (
      <span key={m.val}
        className="absolute text-xs"
        style={{
          color: "var(--text-muted)",
          left: `${((m.val - min) / (max - min)) * 100}%`,
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
        }}>
        {m.label}
      </span>
    ))}
  </div>
)}
      </div>
    </div>
  );
}

function ToggleField({ label, icon: Icon, value, onChange, accent = "#22c55e" }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accent}15` }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{label}</span>
      </div>
      <button onClick={() => onChange(value === 1 ? 0 : 1)}
        className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
        style={{ backgroundColor: value === 1 ? accent : "var(--surface-2)" }}>
        <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300"
          style={{ left: value === 1 ? "calc(100% - 22px)" : "2px" }} />
      </button>
    </div>
  );
}

function DonutScore({ nota }) {
  const { color } = getGradeColor(nota);
  const pct = ((nota - 1) / 9) * 100;
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 128, height: 128 }}>
      <svg width="128" height="128" viewBox="0 0 128 128" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color }}>{nota.toFixed(1)}</span>
        <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>/10</span>
      </div>
    </div>
  );
}

function ResultsPanel({ result, onReset }) {
  const { color, bg, border } = getGradeColor(result.nota_ro);
  const { Icon: GradeIcon, color: iconColor } = getGradeIcon(result.nota_ro);
  const gradeExp = GRADE_EXPLANATIONS[result.grade_class] || GRADE_EXPLANATIONS[4];

  const barData = [
    { label: "Scor platformă", value: result.platform_avg_score ?? 0, max: 100, color: "#3b82f6", suffix: "%" },
    { label: "GPA (scală 0-4)", value: result.gpa_predicted, max: 4, color, suffix: " GPA" },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6 text-center relative overflow-hidden"
        style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 0%, ${color}20 0%, transparent 70%)` }} />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-sub)" }}>
            Predicție performanță academică
          </p>
          <div className="flex items-center justify-center gap-8 mb-6">
            <DonutScore nota={result.nota_ro} />
            <div className="text-left">
              <p className="text-xl font-black" style={{ color }}>{result.grade_label}</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-sub)" }}>
                GPA: <span className="font-bold" style={{ color: "var(--text)" }}>{result.gpa_predicted.toFixed(2)} / 4.00</span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Model: {result.model_name} · R²={result.model_r2}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="text-center px-4 py-2 rounded-xl" style={{ backgroundColor: "var(--surface-1)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Tentative platformă</p>
              <p className="font-bold" style={{ color: "var(--text)" }}>{result.platform_attempts}</p>
            </div>
            {result.platform_avg_score !== null && (
              <div className="text-center px-4 py-2 rounded-xl" style={{ backgroundColor: "var(--surface-1)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Scor mediu platformă</p>
                <p className="font-bold" style={{ color: "var(--text)" }}>{result.platform_avg_score.toFixed(1)}%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(59,130,246,0.12)" }}>
            <TrendingUp size={14} style={{ color: "#3b82f6" }} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>Indicatori de performanță</h3>
        </div>
        <div className="space-y-4">
          {barData.map(b => (
            <div key={b.label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: "var(--text-sub)" }}>{b.label}</span>
                <span className="font-bold" style={{ color: b.color }}>
                  {b.value.toFixed(b.max === 4 ? 2 : 0)}{b.suffix}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(b.value / b.max) * 100}%`, backgroundColor: b.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(245,158,11,0.12)" }}>
            <Lightbulb size={14} style={{ color: "#f59e0b" }} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>Recomandări personalizate</h3>
        </div>
        <div className="space-y-3">
          {result.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)" }}>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-sub)" }}>{rec}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onReset}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
        style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}
        onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.backgroundColor = "var(--card-hover)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "var(--text-sub)"; e.currentTarget.style.backgroundColor = "var(--surface-1)"; }}>
        <RotateCcw size={15} />Predicție nouă
      </button>
    </div>
  );
}

export default function Prediction() {
  const [form, setForm] = useState({
    study_time_weekly:  10,
    absences:           0,   // FIX: initial 0 in loc de 5
    tutoring:           0,
    parental_support:   2,
    extracurricular:    0,
    sports:             0,
    music:              0,
    volunteering:       0,
    age:                20,
    gender:             0,
    ethnicity:          0,
    parental_education: 2,
  });

  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState("");

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/predictions/predict`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Eroare la predicție");
      }
      setResult(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleReset = () => { setResult(null); setError(""); };
  const supportLabels = ["Niciun", "Scăzut", "Moderat", "Ridicat", "Foarte ridicat"];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)" }}>
              <GraduationCap size={20} style={{ color: "#a855f7" }} />
            </div>
            <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Predicție Academică</h1>
            <span className="text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider"
              style={{ backgroundColor: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", color: "#a855f7" }}>
              ML
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-sub)" }}>
            Completează câmpurile de mai jos pentru a primi o predicție a performanței tale academice.
          </p>
        </div>
      </div>

      <div className="rounded-2xl p-4 flex items-start gap-3"
        style={{ backgroundColor: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}>
        <Brain size={18} className="flex-shrink-0 mt-0.5" style={{ color: "#3b82f6" }} />
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-sub)" }}>
          Modelul a fost antrenat pe date de la <strong style={{ color: "var(--text)" }}>2.392 studenți</strong> și
          atinge un R²=0.95. Predicțiile combină datele introduse cu
          <strong style={{ color: "var(--text)" }}> activitatea ta din platformă</strong> (quiz-uri, scoruri).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="rounded-2xl p-5 space-y-6"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
              <Target size={15} style={{ color: "#a855f7" }} />
              <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Date de studiu</h2>
            </div>

            <SliderField
              label="Ore de studiu / săptămână"
              icon={BookOpen}
              value={form.study_time_weekly}
              onChange={v => set("study_time_weekly", v)}
              min={0} max={40} step={0.5} unit="h"
              accent="#22c55e"
              marks={[{val:0,label:"0h"},{val:10,label:"10h"},{val:20,label:"20h"},{val:30,label:"30h"},{val:40,label:"40h"}]}
            />

            {/* FIX: max=30 in loc de 50, marks mai clare, step=1 explicit */}
            <SliderField
              label="Absențe la cursuri"
              icon={Clock}
              value={form.absences}
              onChange={v => set("absences", v)}
              min={0} max={30} step={1} unit=" zile"
              accent="#ef4444"
              marks={[{val:0,label:"0"},{val:5,label:"5"},{val:10,label:"10"},{val:20,label:"20"},{val:30,label:"30"}]}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(245,158,11,0.12)" }}>
                    <Users size={14} style={{ color: "#f59e0b" }} />
                  </div>
                  <label className="text-sm font-semibold" style={{ color: "var(--text)" }}>Suport parental</label>
                </div>
                <span className="text-sm font-black px-2.5 py-0.5 rounded-lg"
                  style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
                  {supportLabels[form.parental_support]}
                </span>
              </div>
              <div className="flex gap-2">
                {supportLabels.map((label, i) => (
                  <button key={i} onClick={() => set("parental_support", i)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: form.parental_support === i ? "rgba(245,158,11,0.15)" : "var(--surface-1)",
                      border: `1px solid ${form.parental_support === i ? "rgba(245,158,11,0.4)" : "var(--card-border)"}`,
                      color: form.parental_support === i ? "#f59e0b" : "var(--text-muted)",
                    }}>{i}</button>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Niciun</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Foarte ridicat</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5 space-y-3"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
              <Star size={15} style={{ color: "#06b6d4" }} />
              <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Activități & suport</h2>
            </div>
            <ToggleField label="Meditații / tutoring" icon={GraduationCap}
              value={form.tutoring} onChange={v => set("tutoring", v)} accent="#3b82f6" />
            <ToggleField label="Activități extracurriculare" icon={Star}
              value={form.extracurricular} onChange={v => set("extracurricular", v)} accent="#22c55e" />
            <ToggleField label="Sport" icon={Dumbbell}
              value={form.sports} onChange={v => set("sports", v)} accent="#f59e0b" />
            <ToggleField label="Muzică" icon={Music2}
              value={form.music} onChange={v => set("music", v)} accent="#a855f7" />
            <ToggleField label="Voluntariat" icon={Heart}
              value={form.volunteering} onChange={v => set("volunteering", v)} accent="#ef4444" />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />{error}
            </div>
          )}

          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Info size={13} style={{ color: "var(--text-sub)" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-sub)" }}>
                Scala de notare
              </p>
            </div>
            <div className="space-y-1.5">
              {Object.entries(GRADE_EXPLANATIONS).map(([cls, info]) => (
                <div key={cls} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: "var(--surface-1)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: info.color }} />
                    <span style={{ color: "var(--text-sub)" }}>
                      {cls === "0" ? "A" : cls === "1" ? "B" : cls === "2" ? "C" : cls === "3" ? "D" : "F"}
                      {" "}({cls === "0" ? "3.5-4.0" : cls === "1" ? "3.0-3.5" : cls === "2" ? "2.5-3.0" : cls === "3" ? "2.0-2.5" : "<2.0"} GPA)
                    </span>
                  </div>
                  <span className="font-bold" style={{ color: info.color }}>{info.ro} RO · {info.desc.split("—")[0].trim()}</span>
                </div>
              ))}
            </div>
          </div>

          {!result && (
            <button onClick={handleSubmit} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ backgroundColor: "#a855f7", color: "#fff", boxShadow: "0 0 24px rgba(168,85,247,0.25)" }}
              onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = "#9333ea")}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#a855f7"}>
              {loading
                ? <><Loader2 size={16} className="animate-spin" />Se analizează...</>
                : <><Brain size={16} />Generează predicție</>
              }
            </button>
          )}
        </div>

        <div>
          {result ? (
            <ResultsPanel result={result} onReset={handleReset} />
          ) : (
            <div className="rounded-2xl h-full min-h-64 flex flex-col items-center justify-center text-center p-8"
              style={{ border: "1px dashed var(--card-border)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(168,85,247,0.08)" }}>
                <GraduationCap size={28} style={{ color: "var(--text-muted)" }} />
              </div>
              <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-sub)" }}>
                Completează formularul
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Predicția va apărea aici după ce apeși butonul
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}