// frontend/src/pages/Login.jsx
import { useState } from "react";
import { loginUser } from "../api/auth";
import { ArrowLeft, Mail, Lock, LogIn } from "lucide-react";

export default function Login({ onLogin, onGoRegister, onGoLanding }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginUser(form);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundColor: "#080c14",
        backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,197,94,0.06) 0%, transparent 70%)",
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Back */}
        <button
          onClick={onGoLanding}
          className="flex items-center gap-1.5 text-sm mb-8 transition-all"
          style={{ color: "#475569" }}
          onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"}
          onMouseLeave={e => e.currentTarget.style.color = "#475569"}
        >
          <ArrowLeft size={14} />
          Înapoi
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <img src="/logo.webp" alt="Quizzi" className="w-8 h-8 rounded-lg" />
            <span
              className="font-black tracking-widest text-lg"
              style={{ color: "#f1f5f9", letterSpacing: "0.12em" }}
            >
              QUIZZI
            </span>
          </div>
          <h2 className="font-bold text-xl mb-1" style={{ color: "#f1f5f9" }}>
            Bine ai revenit
          </h2>
          <p className="text-sm" style={{ color: "#475569" }}>
            Autentifică-te pentru a continua
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          <form onSubmit={submit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "#64748b" }}>
                EMAIL
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "#475569" }}
                />
                <input
                  type="email" name="email" value={form.email} onChange={handle} required
                  placeholder="adresa@email.com"
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm transition-all focus:outline-none"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#f1f5f9",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "#64748b" }}>
                PAROLĂ
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "#475569" }}
                />
                <input
                  type="password" name="password" value={form.password} onChange={handle} required
                  placeholder="••••••••"
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm transition-all focus:outline-none"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#f1f5f9",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  backgroundColor: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#f87171",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all mt-1 disabled:opacity-50"
              style={{ backgroundColor: "#22c55e", color: "#000" }}
              onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = "#16a34a")}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}
            >
              {loading ? (
                <span>Se autentifică...</span>
              ) : (
                <>
                  <LogIn size={15} />
                  Autentificare
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
            <span className="text-xs" style={{ color: "#334155" }}>sau</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
          </div>

          <p className="text-center text-sm" style={{ color: "#475569" }}>
            Nu ai cont?{" "}
            <button
              onClick={onGoRegister}
              className="font-semibold transition-all"
              style={{ color: "#22c55e" }}
              onMouseEnter={e => e.currentTarget.style.color = "#4ade80"}
              onMouseLeave={e => e.currentTarget.style.color = "#22c55e"}
            >
              Înregistrează-te
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}