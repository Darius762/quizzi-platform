// frontend/src/pages/AvatarCustomizer.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { getToken } from "../api/auth";
import { Lock, Check, Loader2, Sparkles } from "lucide-react";
import StudyAvatar from "../components/StudyAvatar";

const API_URL = "http://127.0.0.1:8000/api";

function getAuthHeaders() {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

function UnlockProgress({ acc, stats }) {
  const progressMap = {
    hat_student:  { val: Math.min(stats.quizzes_completed, 5),   max: 5,  label: "quizuri" },
    glasses_cool: { val: Math.min(stats.perfect_score, 1),        max: 1,  label: "scor 100%" },
    crown:        { val: Math.min(stats.quizzes_completed, 20),  max: 20, label: "quizuri" },
    star:         { val: Math.round(stats.avg_score_10 || 0),     max: 80, label: "% medie" },
    backpack:     { val: Math.min(stats.materials_uploaded, 3),   max: 3,  label: "materiale" },
    trophy:       { val: Math.min(stats.quizzes_completed, 50),  max: 50, label: "quizuri" },
    card:         { val: Math.min(stats.flashcards_created || 0, 10), max: 10, label: "flashcard-uri" },
    flame:        { val: Math.min(stats.streak_days || 0, 7),    max: 7,  label: "zile consecutive" },
    diamond:      { val: Math.min(stats.streak_days || 0, 14),   max: 14, label: "zile consecutive" },
  };
  const prog = progressMap[acc.id];
  if (!prog) return null;
  const pct = Math.min((prog.val / prog.max) * 100, 100);
  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {prog.val}/{prog.max} {prog.label}
        </span>
        <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "var(--divider)" }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? "#22c55e" : "#6366f1" }} />
      </div>
    </div>
  );
}

export default function AvatarCustomizer({ onSave }) {
  const [data,      setData]    = useState(null);
  const [loading,   setLoading] = useState(true);
  const [saving,    setSaving]  = useState(false);
  const [saved,     setSaved]   = useState(false);
  const [error,     setError]   = useState("");
  const [color,     setColor]   = useState("purple");
  const [accs,      setAccs]    = useState([]);

  // Ref mereu sincronizat — fix pentru state async
  const colorRef = useRef("purple");
  const accsRef  = useRef([]);

  const loadAvatar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/avatar/`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Eroare ${res.status}`);
      const d = await res.json();
      setData(d);
      const c = d.color || "purple";
      const a = d.equipped_accessories || [];
      setColor(c);
      setAccs(a);
      colorRef.current = c;
      accsRef.current  = a;
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAvatar(); }, [loadAvatar]);

  const handleColorSelect = (colorId) => {
    setColor(colorId);
    colorRef.current = colorId;
    setSaved(false);
  };

  const handleToggleAcc = (accId, unlocked) => {
    if (!unlocked) return;
    setSaved(false);
    setAccs(prev => {
      const next = prev.includes(accId)
        ? prev.filter(a => a !== accId)
        : [...prev, accId];
      accsRef.current = next;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    // Citim din ref — mereu valoarea curenta, fara problema de async state
    const currentColor = colorRef.current;
    const currentAccs  = accsRef.current;
    try {
      const res = await fetch(`${API_URL}/avatar/`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          color: currentColor,
          equipped_accessories: currentAccs,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Eroare ${res.status}`);
      }
      const updated = await res.json();
      setData(updated);
      const c = updated.color || "purple";
      const a = updated.equipped_accessories || [];
      setColor(c);
      setAccs(a);
      colorRef.current = c;
      accsRef.current  = a;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      if (onSave) onSave(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin" style={{ color: "#6366f1" }} />
    </div>
  );

  const unlockedCount = data?.accessories?.filter(a => a.unlocked).length || 0;
  const totalCount    = data?.accessories?.length || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.28)" }}>
            <span className="text-lg">🎨</span>
          </div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Personalizare Avatar</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-sub)" }}>
          Deblochează accesorii completând quizuri și materiale.{" "}
          <span style={{ color: "#6366f1" }}>{unlockedCount}/{totalCount} deblocate.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl p-6 flex flex-col items-center gap-4 sticky top-6"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-sub)" }}>Preview</p>

            <div className="scale-150 my-4">
              <StudyAvatar
                mood="idle"
                avatarColor={color}
                equippedAccessories={accs}
              />
            </div>

            <div className="w-full space-y-1 mt-2" style={{ minHeight: "32px" }}>
              {accs.length > 0 ? (
                accs.map(accId => {
                  const acc = data?.accessories?.find(a => a.id === accId);
                  return acc ? (
                    <div key={accId} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                      <span className="text-sm">{acc.emoji}</span>
                      <span className="text-xs font-medium" style={{ color: "#818cf8" }}>{acc.label}</span>
                    </div>
                  ) : null;
                })
              ) : (
                <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  Niciun accesoriu echipat
                </p>
              )}
            </div>

            {error && (
              <p className="text-xs text-center px-2" style={{ color: "#f87171" }}>{error}</p>
            )}

            <button onClick={handleSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{
                backgroundColor: saved ? "#22c55e" : "#6366f1",
                color: "#fff",
                boxShadow: saved
                  ? "0 0 16px rgba(34,197,94,0.4)"
                  : "0 0 16px rgba(99,102,241,0.3)",
              }}>
              {saving ? (
                <><Loader2 size={14} className="animate-spin" />Se salvează...</>
              ) : saved ? (
                <><Check size={14} />Salvat!</>
              ) : (
                <><Sparkles size={14} />Salvează</>
              )}
            </button>
          </div>
        </div>

        {/* Selectii */}
        <div className="lg:col-span-2 space-y-5">

          {/* Culori */}
          <div className="rounded-2xl p-5"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
            <p className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>🎨 Culoare</p>
            <div className="grid grid-cols-4 gap-3">
              {data?.colors?.map(c => {
                const sel = color === c.id;
                return (
                  <button key={c.id} onClick={() => handleColorSelect(c.id)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                    style={{
                      backgroundColor: sel ? `${c.body}18` : "var(--surface-1)",
                      border: `2px solid ${sel ? c.body : "transparent"}`,
                    }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = `${c.body}50`; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = "transparent"; }}>
                    <div className="w-8 h-8 rounded-full relative flex-shrink-0"
                      style={{
                        backgroundColor: c.body,
                        boxShadow: sel ? `0 0 10px ${c.body}80` : "none",
                      }}>
                      {sel && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check size={14} color="white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium"
                      style={{ color: sel ? c.body : "var(--text-sub)" }}>
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accesorii */}
          <div className="rounded-2xl p-5"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
            <p className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>✨ Accesorii</p>
            <div className="grid grid-cols-2 gap-3">
              {data?.accessories?.map(acc => {
                const equipped = accs.includes(acc.id);
                return (
                  <button key={acc.id}
                    onClick={() => handleToggleAcc(acc.id, acc.unlocked)}
                    disabled={!acc.unlocked}
                    className="text-left p-4 rounded-xl transition-all relative"
                    style={{
                      backgroundColor: equipped ? "rgba(99,102,241,0.1)" : "var(--surface-1)",
                      border: `1px solid ${equipped ? "rgba(99,102,241,0.4)" : "var(--card-border)"}`,
                      opacity: acc.unlocked ? 1 : 0.55,
                      cursor: acc.unlocked ? "pointer" : "not-allowed",
                    }}
                    onMouseEnter={e => {
                      if (acc.unlocked && !equipped)
                        e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
                    }}
                    onMouseLeave={e => {
                      if (acc.unlocked && !equipped)
                        e.currentTarget.style.borderColor = "var(--card-border)";
                    }}>

                    {equipped && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#6366f1" }}>
                        <Check size={10} color="white" strokeWidth={3} />
                      </div>
                    )}
                    {!acc.unlocked && (
                      <div className="absolute top-2 right-2">
                        <Lock size={13} style={{ color: "var(--text-muted)" }} />
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{acc.emoji}</span>
                      <div>
                        <p className="text-sm font-bold"
                          style={{ color: acc.unlocked ? "var(--text)" : "var(--text-sub)" }}>
                          {acc.label}
                        </p>
                        {acc.unlocked ? (
                          <span className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                            Deblocat
                          </span>
                        ) : (
                          <span className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#f87171" }}>
                            Blocat
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {acc.description}
                    </p>

                    {!acc.unlocked && data?.stats && (
                      <UnlockProgress acc={acc} stats={data.stats} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}