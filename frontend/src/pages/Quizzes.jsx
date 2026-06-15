// frontend/src/pages/Quizzes.jsx
import { useState, useEffect } from "react";
import { getToken } from "../api/auth";
import {
  Play, Trash2, Search, Loader2, Download,
  FileQuestion, Target, ListChecks, Clock
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const h = () => ({ Authorization: `Bearer ${getToken()}` });

async function fetchQuizzes() {
  const res = await fetch(`${API_URL}/quizzes/`, { headers: h() });
  if (!res.ok) throw new Error("Eroare la încărcarea quizurilor");
  return res.json();
}
async function fetchQuizWithQuestions(id) {
  const res = await fetch(`${API_URL}/quizzes/${id}`, { headers: h() });
  if (!res.ok) throw new Error("Eroare la încărcarea quiz-ului");
  return res.json();
}
async function deleteQuiz(id) {
  const res = await fetch(`${API_URL}/quizzes/${id}`, { method: "DELETE", headers: h() });
  if (!res.ok) throw new Error("Eroare la ștergere");
}

const difficultyConfig = {
  easy:   { label: "Ușor",  color: "#22c55e" },
  medium: { label: "Mediu", color: "#f59e0b" },
  hard:   { label: "Greu",  color: "#ef4444" },
};
const modeConfig = {
  practice: { label: "Practică", Icon: Target    },
  test:     { label: "Test",     Icon: ListChecks },
  exam:     { label: "Examen",   Icon: Clock      },
};

//Quiz Card
function QuizCard({ quiz, onStart, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [downloading, setDownloading]     = useState(false);
  const [hov, setHov]                     = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try { onStart(await fetchQuizWithQuestions(quiz.id)); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API_URL}/quizzes/${quiz.id}/export-pdf`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Eroare la export");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `quiz_${quiz.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
    finally { setDownloading(false); }
  };

  const diff    = difficultyConfig[quiz.difficulty] || { label: quiz.difficulty, color: "var(--text-sub)" };
  const mode    = modeConfig[quiz.mode] || { label: quiz.mode, Icon: FileQuestion };
  const ModeIcon = mode.Icon;

  return (
    <div className="rounded-2xl p-4 transition-all"
      style={{
        backgroundColor: hov ? "var(--card-hover)" : "var(--card)",
        border: `1px solid ${hov ? "rgba(34,197,94,0.22)" : "var(--card-border)"}`,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>

      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: hov ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.08)",
            border: `1px solid ${hov ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.15)"}`,
          }}>
          <FileQuestion size={18} style={{ color: "#22c55e" }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{quiz.title}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}>
              {quiz.num_questions} întrebări
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: diff.color }} />
              {diff.label}
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)", color: "var(--text-sub)" }}>
              <ModeIcon size={11} style={{ color: "var(--text-sub)" }} />
              {mode.label}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleStart} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}
            onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.2)")}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.1)"}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
            {loading ? "Se încarcă..." : "Începe"}
          </button>

          <button onClick={handleExport} disabled={downloading}
            className="p-2 rounded-xl transition-all disabled:opacity-50"
            title="Exportă ca PDF"
            style={{ color: "var(--text-sub)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#3b82f6"; e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-sub)"; e.currentTarget.style.backgroundColor = "transparent"; }}>
            {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          </button>

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-xl transition-all"
              style={{ color: "var(--text-sub)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-sub)"; e.currentTarget.style.backgroundColor = "transparent"; }}>
              <Trash2 size={15} />
            </button>
          ) : (
            <div className="flex items-center gap-1 p-1 rounded-xl"
              style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)" }}>
              <button onClick={() => onDelete(quiz.id)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.22)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.12)"}>
                Șterge
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1.5 rounded-lg text-xs transition-all"
                style={{ color: "var(--text-sub)" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-sub)"}>
                Anulează
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Quizzes Page
export default function Quizzes({ onStartQuiz }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  const load = async () => {
    setLoading(true);
    try { setQuizzes(await fetchQuizzes()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try { await deleteQuiz(id); setQuizzes(p => p.filter(q => q.id !== id)); }
    catch (err) { console.error(err); }
  };

  const filtered = quizzes.filter(q =>
    q.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Quizuri</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-sub)" }}>
          {quizzes.length} quiz{quizzes.length !== 1 ? "uri" : ""} generate
        </p>
      </div>

      {/* Search */}
      {quizzes.length > 0 && (
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Caută quiz după titlu..."
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
          style={{ border: "1px dashed var(--card-border)" }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)" }}>
            <FileQuestion size={26} style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="font-medium text-sm" style={{ color: "var(--text)" }}>
            {search ? "Niciun rezultat găsit" : "Niciun quiz generat încă"}
          </p>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-sub)" }}>
            {search ? "Încearcă alt termen de căutare" : "Mergi la Materiale și generează primul tău quiz."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(q => (
            <QuizCard key={q.id} quiz={q} onStart={onStartQuiz} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}