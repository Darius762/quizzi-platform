// frontend/src/pages/Materials.jsx
import { useState, useEffect, useRef } from "react";
import { getToken } from "../api/auth";
import {
  Upload, FileText, Search, Trash2, BookOpen,
  Sparkles, X, Copy, Check, Globe, Tag,
  ChevronDown, FolderOpen, AlertCircle, Loader2,
  Plus
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

//  API
const h  = () => ({ Authorization: `Bearer ${getToken()}` });
const hj = () => ({ ...h(), "Content-Type": "application/json" });

async function fetchMaterials() {
  const r = await fetch(`${API_URL}/materials/`, { headers: h() });
  if (!r.ok) throw new Error("Eroare");
  return r.json();
}
async function uploadMaterial(fd) {
  const r = await fetch(`${API_URL}/materials/upload`, { method: "POST", headers: h(), body: fd });
  if (!r.ok) { const e = await r.json(); throw new Error(e.detail || "Eroare"); }
  return r.json();
}
async function deleteMaterial(id) {
  const r = await fetch(`${API_URL}/materials/${id}`, { method: "DELETE", headers: h() });
  if (!r.ok) throw new Error("Eroare");
}
async function generateQuiz(payload) {
  const r = await fetch(`${API_URL}/quizzes/generate`, { method: "POST", headers: hj(), body: JSON.stringify(payload) });
  if (!r.ok) { const e = await r.json(); throw new Error(e.detail || "Eroare"); }
  return r.json();
}
async function fetchSummary(id) {
  const r = await fetch(`${API_URL}/materials/${id}/summary`, { method: "POST", headers: h() });
  if (!r.ok) { const e = await r.json(); throw new Error(e.detail || "Eroare"); }
  return r.json();
}

// Helpers
function groupBySubject(materials) {
  const groups = {};
  materials.forEach(m => {
    const key = m.subject?.trim() || "Fără materie";
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });

  return Object.entries(groups).sort(([a], [b]) => {
    if (a === "Fără materie") return 1;
    if (b === "Fără materie") return -1;
    return a.localeCompare(b);
  });
}

//  Modal shell
function Modal({ children, onClose, maxW = "max-w-md" }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`w-full ${maxW} rounded-2xl shadow-2xl overflow-hidden`}
        style={{ backgroundColor: "var(--modal)", border: "1px solid var(--input-border)" }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, sub, onClose }) {
  return (
    <div className="flex items-start justify-between px-6 py-5"
      style={{ borderBottom: "1px solid var(--divider)" }}>
      <div>
        <h2 className="font-bold text-base" style={{ color: "var(--text)" }}>{title}</h2>
        {sub && <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "var(--text-sub)" }}>{sub}</p>}
      </div>
      <button onClick={onClose}
        className="ml-4 p-1.5 rounded-lg transition-all flex-shrink-0"
        style={{ color: "var(--text-sub)" }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--divider)"; e.currentTarget.style.color = "var(--text)"; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--text-sub)"; }}>
        <X size={15} />
      </button>
    </div>
  );
}

//  BtnGroup
function BtnGroup({ label, options, value, onChange, accent = "#22c55e" }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-sub)" }}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(o => {
          const on = value === o.value;
          return (
            <button key={o.value} onClick={() => onChange(o.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: on ? `${accent}18` : "var(--card)",
                border: `1px solid ${on ? `${accent}45` : "var(--card-border)"}`,
                color: on ? accent : "var(--text-sub)",
              }}
              onMouseEnter={e => { if (!on) { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}}
              onMouseLeave={e => { if (!on) { e.currentTarget.style.color = "var(--text-sub)"; e.currentTarget.style.borderColor = "var(--card-border)"; }}}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Summary Modal
function SummaryModal({ material, onClose }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    fetchSummary(material.id)
      .then(d => setSummary(d.summary))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSummary = (text) =>
    text.split("\n").map((line, i) => {
      if (line.startsWith("## "))
        return <p key={i} className="font-bold text-sm mt-5 mb-1" style={{ color: "#22c55e" }}>{line.replace("## ", "")}</p>;
      if (!line.trim()) return <div key={i} className="h-1.5" />;
      return <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--text-sub)" }}>{line}</p>;
    });

  return (
    <Modal onClose={onClose} maxW="max-w-2xl">
      <ModalHeader title="Rezumat AI" sub={material.title} onClose={onClose} />
      <div className="overflow-y-auto p-6" style={{ maxHeight: "58vh" }}>
        {loading ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Loader2 size={26} className="animate-spin" style={{ color: "#22c55e" }} />
            <p className="text-sm" style={{ color: "var(--text-sub)" }}>Se generează cu AI...</p>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />{error}
          </div>
        ) : (
          <div>{renderSummary(summary)}</div>
        )}
      </div>
      {summary && !loading && (
        <div className="px-6 pb-5" style={{ borderTop: "1px solid var(--divider)", paddingTop: "1rem" }}>
          <button onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: copied ? "rgba(34,197,94,0.12)" : "var(--card)",
              border: `1px solid ${copied ? "rgba(34,197,94,0.35)" : "var(--card-border)"}`,
              color: copied ? "#22c55e" : "var(--text-sub)",
            }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copiat!" : "Copiază rezumatul"}
          </button>
        </div>
      )}
    </Modal>
  );
}

//  Generate Quiz Modal
function GenerateQuizModal({ material, onClose, onGenerated }) {
  const [cfg, setCfg] = useState({ num_questions: 10, difficulty: "medium", mode: "practice", topic: "", time_limit_sec: 1800 });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const set = (k, v) => setCfg(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const quiz = await generateQuiz({
        material_id: material.id,
        num_questions: cfg.num_questions,
        difficulty: cfg.difficulty,
        mode: cfg.mode,
        topic: cfg.topic || "toate conceptele importante",
        time_limit_sec: cfg.mode === "exam" ? cfg.time_limit_sec : null,
      });
      onGenerated(quiz); onClose();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const modeDesc = {
    practice: "Feedback imediat după fiecare răspuns — ideal pentru învățare activă.",
    test: "Fără feedback pe parcurs. Scorul apare la final.",
    exam: `Cronometru ${cfg.time_limit_sec / 60} minute, condiții de examen simulate.`,
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Configurează quiz" sub={material.title} onClose={onClose} />
      <div className="p-6 space-y-5">
        <BtnGroup label="Întrebări" value={cfg.num_questions} onChange={v => set("num_questions", v)}
          options={[{value:5,label:"5"},{value:10,label:"10"},{value:15,label:"15"},{value:20,label:"20"}]} />
        <BtnGroup label="Dificultate" value={cfg.difficulty} onChange={v => set("difficulty", v)}
          options={[{value:"easy",label:"Ușor"},{value:"medium",label:"Mediu"},{value:"hard",label:"Greu"}]} />
        <BtnGroup label="Mod" value={cfg.mode} onChange={v => set("mode", v)}
          options={[{value:"practice",label:"Practică"},{value:"test",label:"Test"},{value:"exam",label:"Examen"}]} />
        {cfg.mode === "exam" && (
          <BtnGroup label="Timp limită" value={cfg.time_limit_sec} onChange={v => set("time_limit_sec", v)}
            options={[{value:900,label:"15 min"},{value:1800,label:"30 min"},{value:2700,label:"45 min"},{value:3600,label:"1h"}]} />
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-sub)" }}>
            Subiect specific <span style={{ color: "var(--text-muted)", textTransform: "none", fontWeight: "400" }}>(opțional)</span>
          </p>
          <input type="text" value={cfg.topic} onChange={e => set("topic", e.target.value)}
            placeholder="ex: pointeri, recursivitate..."
            className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)", color: "var(--text)" }}
            onFocus={e => e.currentTarget.style.borderColor = "rgba(34,197,94,0.5)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--card-border)"} />
        </div>
        <div className="rounded-xl px-4 py-3 text-xs leading-relaxed"
          style={{ backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", color: "var(--text-sub)" }}>
          {modeDesc[cfg.mode]}
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
            style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            <AlertCircle size={13} />{error}
          </div>
        )}
        {loading && (
          <div className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: "#22c55e" }} />
            <p className="text-xs" style={{ color: "#22c55e" }}>Se generează... poate dura 10–30 secunde</p>
          </div>
        )}
      </div>
      <div className="flex gap-3 px-6 pb-6">
        <button onClick={onClose} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-sub)"}>
          Anulează
        </button>
        <button onClick={submit} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
          style={{ backgroundColor: "#22c55e", color: "#000" }}
          onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = "#16a34a")}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}>
          {loading ? "Se generează..." : "Generează quiz →"}
        </button>
      </div>
    </Modal>
  );
}

// Upload Modal
function UploadModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ title: "", subject: "", chapter: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [drag, setDrag]       = useState(false);
  const fileRef = useRef();

  const handleFile = f => {
    if (f?.type === "application/pdf") {
      setFile(f); setError("");
      if (!form.title) setForm(p => ({ ...p, title: f.name.replace(/\.pdf$/i, "") }));
    } else setError("Doar fișiere PDF sunt acceptate");
  };

  const submit = async () => {
    if (!file) return setError("Selectează un fișier PDF");
    if (!form.title.trim()) return setError("Titlul este obligatoriu");
    setError(""); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("title", form.title);
      fd.append("subject", form.subject); fd.append("chapter", form.chapter);
      await uploadMaterial(fd); onSuccess(); onClose();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const inp = "w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all";
  const inpStyle = { backgroundColor: "var(--card)", border: "1px solid var(--card-border)", color: "var(--text)" };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Adaugă material" onClose={onClose} />
      <div className="p-6 space-y-4">
        {/* Drop zone */}
        <div
          onClick={() => fileRef.current.click()}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          className="rounded-xl p-5 text-center cursor-pointer transition-all"
          style={{
            border: `2px dashed ${file ? "rgba(34,197,94,0.5)" : drag ? "rgba(34,197,94,0.35)" : "var(--input-border)"}`,
            backgroundColor: file ? "rgba(34,197,94,0.06)" : drag ? "var(--surface-1)" : "transparent",
          }}>
          <input ref={fileRef} type="file" accept=".pdf" onChange={e => handleFile(e.target.files[0])} className="hidden" />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(34,197,94,0.12)" }}>
                <FileText size={16} style={{ color: "#22c55e" }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium" style={{ color: "#22c55e" }}>{file.name}</p>
                <p className="text-xs" style={{ color: "var(--text-sub)" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          ) : (
            <>
              <Upload size={20} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-sub)" }}>
                Trage PDF-ul aici sau <span style={{ color: "#22c55e" }}>selectează</span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Max 50MB</p>
            </>
          )}
        </div>

        {/* Titlu */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-sub)" }}>
            Titlu <span style={{ color: "#ef4444" }}>*</span>
          </p>
          <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="ex: Curs Algoritmi" className={inp} style={inpStyle}
            onFocus={e => e.currentTarget.style.borderColor = "rgba(34,197,94,0.5)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--card-border)"} />
        </div>

        {/* Materie + Capitol */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "subject", label: "Materie", placeholder: "ex: Informatică" },
            { key: "chapter", label: "Capitol", placeholder: "ex: Capitolul 3" },
          ].map(f => (
            <div key={f.key}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-sub)" }}>{f.label}</p>
              <input type="text" value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder} className={inp} style={inpStyle}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(34,197,94,0.5)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--card-border)"} />
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
            style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            <AlertCircle size={13} />{error}
          </div>
        )}
      </div>
      <div className="flex gap-3 px-6 pb-6">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-sub)"}>
          Anulează
        </button>
        <button onClick={submit} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
          style={{ backgroundColor: "#22c55e", color: "#000" }}
          onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = "#16a34a")}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}>
          {loading ? <><Loader2 size={13} className="animate-spin" />Se uploadează...</> : <><Upload size={13} />Adaugă</>}
        </button>
      </div>
    </Modal>
  );
}

//  Material Row (inside accordion)
function MaterialRow({ material, onDelete, onGenerate, onSummary }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [hov, setHov] = useState(false);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
      style={{
        backgroundColor: hov ? "var(--card)" : "transparent",
        border: `1px solid ${hov ? "var(--card-border)" : "transparent"}`,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "var(--surface-2)" }}>
        <FileText size={14} style={{ color: "var(--text-sub)" }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{material.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {material.chapter && (
            <span className="text-xs" style={{ color: "var(--text-sub)" }}>{material.chapter}</span>
          )}
          {material.is_global && (
            <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>
              <Globe size={9} />Global
            </span>
          )}
        </div>
      </div>

      {/* Actions — visibili la hover */}
      <div className={`flex items-center gap-1.5 transition-all ${hov ? "opacity-100" : "opacity-0"}`}>
        <button onClick={() => onSummary(material)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-sub)"; e.currentTarget.style.borderColor = "var(--card-border)"; }}>
          <Sparkles size={11} />Rezumat
        </button>
        <button onClick={() => onGenerate(material)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.18)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.1)"}>
          <BookOpen size={11} />Generează quiz
        </button>

        {!confirmDel ? (
          <button onClick={() => setConfirmDel(true)}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.backgroundColor = "transparent"; }}>
            <Trash2 size={13} />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={() => onDelete(material.id)}
              className="px-2 py-1 rounded-lg text-xs font-medium transition-all"
              style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.2)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.12)"}>
              Șterge
            </button>
            <button onClick={() => setConfirmDel(false)}
              className="px-2 py-1 rounded-lg text-xs transition-all"
              style={{ color: "var(--text-sub)" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-sub)"}>
              Nu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Subject Accordion
function SubjectAccordion({ subjectName, materials, onDelete, onGenerate, onSummary, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);


  const colors = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#06b6d4", "#ec4899", "#f97316"];
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) hash = (hash + subjectName.charCodeAt(i)) % colors.length;
  const accent = subjectName === "Fără materie" ? "var(--text-sub)" : colors[hash];

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${open ? `${accent}25` : "var(--divider)"}`, transition: "border-color 0.2s" }}>

      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 transition-all text-left"
        style={{ backgroundColor: open ? `${accent}08` : "var(--surface-1)" }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.backgroundColor = "var(--card)"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = "var(--surface-1)"; }}>

        {/* Color dot */}
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />

        {/* Subject name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-semibold text-sm" style={{ color: open ? accent : "var(--text)" }}>
            {subjectName}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${accent}12`,
              color: accent,
              border: `1px solid ${accent}25`,
            }}>
            {materials.length} {materials.length === 1 ? "material" : "materiale"}
          </span>
        </div>

        {/* Chevron */}
        <ChevronDown size={15} style={{
          color: "var(--text-sub)",
          transform: open ? "rotate(180deg)" : "rotate(0)",
          transition: "transform 0.2s",
          flexShrink: 0,
        }} />
      </button>

      {/* Materials list */}
      {open && (
        <div className="px-3 pb-3 pt-1"
          style={{ borderTop: `1px solid var(--surface-2)` }}>
          {materials.map(m => (
            <MaterialRow key={m.id} material={m}
              onDelete={onDelete} onGenerate={onGenerate} onSummary={onSummary} />
          ))}
        </div>
      )}
    </div>
  );
}

// Materials Page
export default function Materials({ onStartQuiz }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showUpload, setShowUpload]   = useState(false);
  const [generateFor, setGenerateFor] = useState(null);
  const [summaryFor, setSummaryFor]   = useState(null);
  const [search, setSearch]           = useState("");

  const load = async () => {
    setLoading(true);
    try { setMaterials(await fetchMaterials()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async id => {
    try { await deleteMaterial(id); setMaterials(p => p.filter(m => m.id !== id)); }
    catch (e) { console.error(e); }
  };

  const filtered = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.subject?.toLowerCase().includes(search.toLowerCase()) ||
    m.chapter?.toLowerCase().includes(search.toLowerCase())
  );

  const groups = groupBySubject(filtered);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Materiale</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-sub)" }}>
            {materials.length} material{materials.length !== 1 ? "e" : ""} · {groups.length} {groups.length === 1 ? "materie" : "materii"}
          </p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{ backgroundColor: "#22c55e", color: "#000", boxShadow: "0 0 24px rgba(34,197,94,0.18)" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#16a34a"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}>
          <Plus size={15} />Adaugă PDF
        </button>
      </div>

      {/* Search */}
      {materials.length > 0 && (
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Caută materiale..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)", color: "var(--text)" }}
            onFocus={e => e.currentTarget.style.borderColor = "rgba(34,197,94,0.45)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--card-border)"} />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={26} className="animate-spin" style={{ color: "#22c55e" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl"
          style={{ border: "1px dashed var(--divider)" }}>
          <FileText size={32} className="mx-auto mb-3" style={{ color: "var(--text-faint)" }} />
          <p className="font-medium text-sm" style={{ color: "var(--text-sub)" }}>
            {search ? "Niciun rezultat" : "Niciun material încă"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {search ? "Încearcă alt termen de căutare" : "Adaugă primul PDF pentru a începe"}
          </p>
          {!search && (
            <button onClick={() => setShowUpload(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.16)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.1)"}>
              <Plus size={13} />Adaugă PDF
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(([subject, mats], i) => (
            <SubjectAccordion
              key={subject}
              subjectName={subject}
              materials={mats}
              onDelete={handleDelete}
              onGenerate={setGenerateFor}
              onSummary={setSummaryFor}

            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showUpload  && <UploadModal onClose={() => setShowUpload(false)} onSuccess={load} />}
      {generateFor && <GenerateQuizModal material={generateFor} onClose={() => setGenerateFor(null)} onGenerated={q => onStartQuiz?.(q)} />}
      {summaryFor  && <SummaryModal material={summaryFor} onClose={() => setSummaryFor(null)} />}
    </div>
  );
}