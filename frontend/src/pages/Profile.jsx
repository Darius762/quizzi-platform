// frontend/src/pages/Profile.jsx
import { useState } from "react";
import { getToken } from "../api/auth";
import { User, Mail, Lock, ShieldCheck, Check, AlertCircle, Eye, EyeOff } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || "Eroare"); }
  return res.json();
};

// Palette
const C = {
  card:       "var(--card)",
  cardBorder: "var(--card-border)",
  text:       "var(--text)",
  textSub:    "var(--text-sub)",
  textMuted:  "var(--text-muted)",
  green:      "#22c55e",
  red:        "#ef4444",
};


const hideNativeEyeStyle = `
  input::-ms-reveal, input::-ms-clear { display: none !important; }
  input::-webkit-credentials-auto-fill-button { display: none !important; }
  input[type="password"]::-webkit-textfield-decoration-container { display: none !important; }
`;

// Input
function Input({ label, type = "text", value, onChange, placeholder, error, icon: Icon, rightEl }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: C.textSub }}>{label}</label>
      <div className="relative">
        {Icon && (
          <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: C.textMuted }} />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-xl text-sm focus:outline-none transition-all"
          style={{
            paddingLeft: Icon ? "2.5rem" : "1rem",
            paddingRight: rightEl ? "2.75rem" : "1rem",
            paddingTop: "0.75rem", paddingBottom: "0.75rem",
            backgroundColor: "var(--card)",
            border: `1px solid ${error ? "rgba(239,68,68,0.45)" : C.cardBorder}`,
            color: C.text,
          }}
          onFocus={e => e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.6)" : "rgba(34,197,94,0.45)"}
          onBlur={e => e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.45)" : C.cardBorder}
        />
        {rightEl && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: "#f87171" }}>
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  );
}

// Toast
function Toast({ message, type, onClose }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl"
      style={{
        backgroundColor: type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
        border: `1px solid ${type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
        color: type === "success" ? C.green : C.red,
        backdropFilter: "blur(8px)",
      }}>
      {type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
        ✕
      </button>
    </div>
  );
}

//  Profile Page
export default function Profile({ user, onUserUpdate }) {
  if (typeof document !== "undefined" && !document.getElementById("hide-pw-eye")) {
    const s = document.createElement("style");
    s.id = "hide-pw-eye";
    s.textContent = hideNativeEyeStyle;
    document.head.appendChild(s);
  }

  const [profileForm, setProfileForm] = useState({ name: user?.name || "", email: user?.email || "" });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleProfileSave = async () => {
    if (!profileForm.name.trim()) return showToast("Numele nu poate fi gol", "error");
    setProfileLoading(true);
    try {
      const updated = await apiFetch("/profile/", {
        method: "PATCH",
        body: JSON.stringify({ name: profileForm.name, email: profileForm.email }),
      });
      onUserUpdate(updated);
      showToast("Profilul a fost actualizat!");
    } catch (err) { showToast(err.message, "error"); }
    finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password)
      return showToast("Completează toate câmpurile", "error");
    if (passwordForm.new_password !== passwordForm.confirm_password)
      return showToast("Parolele noi nu coincid", "error");
    if (passwordForm.new_password.length < 6)
      return showToast("Parola nouă trebuie să aibă cel puțin 6 caractere", "error");

    setPasswordLoading(true);
    try {
      await apiFetch("/profile/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: passwordForm.current_password, new_password: passwordForm.new_password }),
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      showToast("Parola a fost schimbată cu succes!");
    } catch (err) { showToast(err.message, "error"); }
    finally { setPasswordLoading(false); }
  };

  const profileUnchanged = profileForm.name === user?.name && profileForm.email === user?.email;
  const passwordMismatch = passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password;
  const initials = user?.name?.[0]?.toUpperCase() || "U";
  const isAdmin = user?.role === "admin";

  return (
    <div className="max-w-xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: C.text }}>Profilul meu</h1>
        <p className="text-sm mt-0.5" style={{ color: C.textSub }}>Gestionează informațiile contului tău</p>
      </div>

      {/* Avatar card */}
      <div className="rounded-2xl p-6 flex items-center gap-5"
        style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}` }}>
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
          style={{
            backgroundColor: isAdmin ? "rgba(168,85,247,0.15)" : "rgba(34,197,94,0.12)",
            border: `2px solid ${isAdmin ? "rgba(168,85,247,0.3)" : "rgba(34,197,94,0.25)"}`,
            color: isAdmin ? "#a855f7" : C.green,
          }}>
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg truncate" style={{ color: C.text }}>{user?.name}</p>
          <p className="text-sm truncate" style={{ color: C.textSub }}>{user?.email}</p>
          <div className="mt-2">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: isAdmin ? "rgba(168,85,247,0.1)" : "rgba(34,197,94,0.1)",
                border: `1px solid ${isAdmin ? "rgba(168,85,247,0.25)" : "rgba(34,197,94,0.25)"}`,
                color: isAdmin ? "#a855f7" : C.green,
              }}>
              {isAdmin ? <ShieldCheck size={11} /> : <User size={11} />}
              {isAdmin ? "Administrator" : "Student"}
            </span>
          </div>
        </div>
      </div>

      {/* Informații personale */}
      <div className="rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}` }}>
        <div style={{ borderBottom: `1px solid var(--card-hover)`, paddingBottom: "1rem", marginBottom: "0.25rem" }}>
          <h2 className="font-bold text-sm" style={{ color: C.text }}>Informații personale</h2>
          <p className="text-xs mt-0.5" style={{ color: C.textSub }}>Actualizează numele și adresa de email</p>
        </div>

        <Input label="Nume complet" value={profileForm.name} icon={User}
          onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
          placeholder="Numele tău complet" />

        <Input label="Adresă email" type="email" value={profileForm.email} icon={Mail}
          onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
          placeholder="adresa@email.com" />

        <button
          onClick={handleProfileSave}
          disabled={profileLoading || profileUnchanged}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: C.green, color: "#000" }}
          onMouseEnter={e => !profileUnchanged && !profileLoading && (e.currentTarget.style.backgroundColor = "#16a34a")}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = C.green}>
          {profileLoading ? (
            <span>Se salvează...</span>
          ) : (
            <><Check size={14} />Salvează modificările</>
          )}
        </button>
      </div>

      {/* Schimbare parolă */}
      <div className="rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}` }}>
        <div style={{ borderBottom: `1px solid var(--card-hover)`, paddingBottom: "1rem", marginBottom: "0.25rem" }}>
          <h2 className="font-bold text-sm" style={{ color: C.text }}>Schimbă parola</h2>
          <p className="text-xs mt-0.5" style={{ color: C.textSub }}>Parola trebuie să aibă cel puțin 6 caractere</p>
        </div>

        <Input label="Parola curentă"
          type={showCurrent ? "text" : "password"}
          value={passwordForm.current_password}
          onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
          placeholder="••••••••" icon={Lock}
          rightEl={
            <button onClick={() => setShowCurrent(v => !v)} style={{ color: C.textSub }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.textSub}>
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />

        <Input label="Parola nouă"
          type={showNew ? "text" : "password"}
          value={passwordForm.new_password}
          onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
          placeholder="Minim 6 caractere" icon={Lock}
          rightEl={
            <button onClick={() => setShowNew(v => !v)} style={{ color: C.textSub }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.textSub}>
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />

        <Input label="Confirmă parola nouă"
          type={showConfirm ? "text" : "password"}
          value={passwordForm.confirm_password}
          onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
          placeholder="••••••••" icon={Lock}
          error={passwordMismatch ? "Parolele nu coincid" : null}
          rightEl={
            <button onClick={() => setShowConfirm(v => !v)} style={{ color: C.textSub }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.textSub}>
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />

        <button
          onClick={handlePasswordChange}
          disabled={passwordLoading || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password || !!passwordMismatch}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--card-hover)",
            border: `1px solid ${C.cardBorder}`,
            color: C.text,
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--card-border)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--card-hover)"}>
          {passwordLoading ? (
            <span>Se schimbă...</span>
          ) : (
            <><Lock size={14} />Schimbă parola</>
          )}
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}