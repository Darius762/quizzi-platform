// frontend/src/pages/Admin.jsx
import { useState, useEffect } from "react";
import { getToken } from "../api/auth";
import {
  Users, FileText, ClipboardList, Target, ShieldCheck,
  Globe, Trash2, UserCog, Plus, Search, Loader2,
  BookOpen, Clock, ListChecks, ChevronRight,
  X, AlertCircle, Check, User, Mail, Lock,
  BarChart2, TrendingUp, Eye, EyeOff, Sword
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Eroare"); }
  return res.status === 204 ? null : res.json();
};


const C = {
  card:       "var(--card)",
  cardBorder: "var(--card-border)",
  text:       "var(--text)",
  textSub:    "var(--text-sub)",
  textMuted:  "var(--text-muted)",
  divider:    "var(--divider)",
  green:  "#22c55e", greenBg:  "rgba(34,197,94,0.1)",
  blue:   "#3b82f6", blueBg:   "rgba(59,130,246,0.1)",
  purple: "#a855f7", purpleBg: "rgba(168,85,247,0.1)",
  amber:  "#f59e0b", amberBg:  "rgba(245,158,11,0.1)",
  red:    "#ef4444", redBg:    "rgba(239,68,68,0.1)",
  cyan:   "#06b6d4", cyanBg:   "rgba(6,182,212,0.1)",
};


const diffConfig = {
  easy:   { label: "Ușor",  color: C.green  },
  medium: { label: "Mediu", color: C.amber  },
  hard:   { label: "Greu",  color: C.red    },
};
const modeConfig = {
  practice: { label: "Practică", Icon: BookOpen,   color: C.blue   },
  test:     { label: "Test",     Icon: ListChecks, color: C.purple },
  exam:     { label: "Examen",   Icon: Clock,      color: C.amber  },
};

// Stat Card
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: `${accent}12`, border: `1px solid ${accent}28` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent, opacity: 0.8 }}>{label}</p>
      </div>
      <p className="text-3xl font-black" style={{ color: C.text }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: C.textSub }}>{sub}</p>}
    </div>
  );
}

// Section Header
function SH({ icon: Icon, title, sub, accent = C.textSub, right }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}15` }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: C.text }}>{title}</h3>
          {sub && <p className="text-xs" style={{ color: C.textSub }}>{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

// Modal
function Modal({ children, onClose, maxW = "max-w-md" }) {
  useEffect(() => {
    const esc = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`w-full ${maxW} rounded-2xl overflow-hidden shadow-2xl`}
        style={{ backgroundColor: "var(--modal)", border: "1px solid var(--input-border)" }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, sub, onClose }) {
  return (
    <div className="flex items-start justify-between px-6 py-5" style={{ borderBottom: `1px solid ${C.divider}` }}>
      <div>
        <h2 className="font-bold text-base" style={{ color: C.text }}>{title}</h2>
        {sub && <p className="text-xs mt-0.5" style={{ color: C.textSub }}>{sub}</p>}
      </div>
      <button onClick={onClose} className="p-1.5 rounded-lg transition-all ml-4 flex-shrink-0" style={{ color: C.textSub }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--divider)"; e.currentTarget.style.color = C.text; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.textSub; }}>
        <X size={15} />
      </button>
    </div>
  );
}

// Field input
function Field({ label, type = "text", value, onChange, placeholder, icon: Icon, right }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textSub }}>{label}</p>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.textMuted }} />}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          className="w-full rounded-xl text-sm focus:outline-none transition-all"
          style={{ paddingLeft: Icon ? "2.5rem" : "0.875rem", paddingRight: right ? "2.5rem" : "0.875rem", paddingTop: "0.65rem", paddingBottom: "0.65rem", backgroundColor: "var(--card)", border: `1px solid ${C.cardBorder}`, color: C.text }}
          onFocus={e => e.currentTarget.style.borderColor = "rgba(34,197,94,0.45)"}
          onBlur={e => e.currentTarget.style.borderColor = C.cardBorder} />
        {right && <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
    </div>
  );
}

// Create User Modal
function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const submit = async () => {
    if (!form.name || !form.email || !form.password) return setError("Completează toate câmpurile");
    setError(""); setLoading(true);
    try { const u = await apiFetch("/admin/users", { method: "POST", body: JSON.stringify(form) }); onCreated(u); onClose(); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Creează cont utilizator" onClose={onClose} />
      <div className="p-6 space-y-4">
        <Field label="Nume complet" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Ion Popescu" icon={User} />
        <Field label="Email" type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="ion@example.com" icon={Mail} />
        <Field label="Parolă" type={showPw?"text":"password"} value={form.password} onChange={e => setForm({...form,password:e.target.value})} placeholder="••••••••" icon={Lock}
          right={<button onClick={() => setShowPw(v=>!v)} style={{ color: C.textSub }}
            onMouseEnter={e => e.currentTarget.style.color = C.text}
            onMouseLeave={e => e.currentTarget.style.color = C.textSub}>
            {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
          </button>} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: C.textSub }}>Rol</p>
          <div className="flex gap-2">
            {[
              { val: "user",  label: "Student", Icon: User,        color: C.green  },
              { val: "admin", label: "Admin",   Icon: ShieldCheck, color: C.purple },
            ].map(r => (
              <button key={r.val} onClick={() => setForm({...form,role:r.val})}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  backgroundColor: form.role === r.val ? `${r.color}15` : "var(--card)",
                  border: `1px solid ${form.role === r.val ? `${r.color}40` : C.cardBorder}`,
                  color: form.role === r.val ? r.color : C.textSub,
                }}>
                <r.Icon size={14} />{r.label}
              </button>
            ))}
          </div>
        </div>
        {error && <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs" style={{ backgroundColor: C.redBg, border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}><AlertCircle size={13}/>{error}</div>}
      </div>
      <div className="flex gap-3 px-6 pb-6">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ backgroundColor: "var(--card)", border: `1px solid ${C.cardBorder}`, color: C.textSub }}
          onMouseEnter={e => e.currentTarget.style.color = C.text}
          onMouseLeave={e => e.currentTarget.style.color = C.textSub}>Anulează</button>
        <button onClick={submit} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
          style={{ backgroundColor: C.green, color: "#000" }}
          onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = "#16a34a")}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = C.green}>
          {loading ? <><Loader2 size={13} className="animate-spin"/>Se creează...</> : <><Plus size={13}/>Creează cont</>}
        </button>
      </div>
    </Modal>
  );
}

// Delete confirm inline
function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onConfirm}
        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
        style={{ backgroundColor: C.redBg, border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.18)"}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.redBg}>Șterge</button>
      <button onClick={onCancel}
        className="px-2.5 py-1 rounded-lg text-xs transition-all"
        style={{ color: C.textSub }}
        onMouseEnter={e => e.currentTarget.style.color = C.text}
        onMouseLeave={e => e.currentTarget.style.color = C.textSub}>Nu</button>
    </div>
  );
}

// Stats Tab
function StatsTab({ stats }) {
  if (!stats) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: C.green }}/></div>;

  const globalPct = stats.total_materials > 0 ? Math.round((stats.global_materials / stats.total_materials) * 100) : 0;
  const privatePct = 100 - globalPct;

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users}         label="Utilizatori"  accent={C.green}  value={stats.total_users}    sub="conturi active" />
        <StatCard icon={FileText}      label="Materiale"    accent={C.blue}   value={stats.total_materials} sub={`${stats.global_materials} globale`} />
        <StatCard icon={ClipboardList} label="Quizuri"      accent={C.purple} value={stats.total_quizzes}  sub="generate total" />
        <StatCard icon={Target}        label="Tentative"    accent={C.amber}  value={stats.total_attempts} sub="pe platformă" />
      </div>

      {/* Distribuție materiale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}` }}>
          <SH icon={Globe} title="Distribuție materiale" sub="Globale vs private" accent={C.blue} />
          <div className="space-y-3">
            {[
              { label: "Materiale globale", value: stats.global_materials, pct: globalPct, color: C.blue },
              { label: "Materiale private", value: stats.total_materials - stats.global_materials, pct: privatePct, color: C.purple },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium" style={{ color: C.text }}>{s.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: C.textMuted }}>{s.value}</span>
                    <span className="text-xs font-bold" style={{ color: s.color }}>{s.pct}%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--divider)" }}>
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Raport general */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}` }}>
          <SH icon={BarChart2} title="Raport general" sub="Medii per utilizator" accent={C.green} />
          <div className="space-y-3">
            {[
              { label: "Materiale / utilizator",  value: stats.total_users > 0 ? (stats.total_materials / stats.total_users).toFixed(1) : 0,  icon: FileText,      color: C.blue   },
              { label: "Quizuri / utilizator",    value: stats.total_users > 0 ? (stats.total_quizzes  / stats.total_users).toFixed(1) : 0,  icon: ClipboardList, color: C.purple },
              { label: "Tentative / utilizator",  value: stats.total_users > 0 ? (stats.total_attempts / stats.total_users).toFixed(1) : 0,  icon: Target,        color: C.amber  },
              { label: "Quizuri / material",      value: stats.total_materials > 0 ? (stats.total_quizzes / stats.total_materials).toFixed(1) : 0, icon: TrendingUp, color: C.cyan },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: "var(--surface-1)" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${s.color}12` }}>
                    <Icon size={13} style={{ color: s.color }} />
                  </div>
                  <p className="flex-1 text-sm" style={{ color: C.textSub }}>{s.label}</p>
                  <p className="text-sm font-bold" style={{ color: C.text }}>{s.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Users Tab
function UsersTab() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [search, setSearch]         = useState("");

  useEffect(() => {
    apiFetch("/admin/users").then(setUsers).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleRoleToggle = async (u) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    try {
      const updated = await apiFetch(`/admin/users/${u.id}/role`, { method: "PATCH", body: JSON.stringify({ role: newRole }) });
      setUsers(p => p.map(x => x.id === u.id ? updated : x));
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    try { await apiFetch(`/admin/users/${id}`, { method: "DELETE" }); setUsers(p => p.filter(u => u.id !== id)); setConfirmDel(null); }
    catch (e) { alert(e.message); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const adminCount = users.filter(u => u.role === "admin").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.textMuted }}/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Caută după nume sau email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, color: C.text }}
            onFocus={e => e.currentTarget.style.borderColor = "rgba(34,197,94,0.45)"}
            onBlur={e => e.currentTarget.style.borderColor = C.cardBorder} />
        </div>
        <div className="flex items-center gap-2 text-xs flex-shrink-0" style={{ color: C.textSub }}>
          <span>{users.length} total</span>
          <span style={{ color: C.textMuted }}>·</span>
          <span style={{ color: C.purple }}>{adminCount} admini</span>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0"
          style={{ backgroundColor: C.green, color: "#000" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#16a34a"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = C.green}>
          <Plus size={14}/>Cont nou
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: C.green }}/></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => {
            const isAdmin = u.role === "admin";
            return (
              <div key={u.id} className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all"
                style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}` }}>
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    backgroundColor: isAdmin ? "rgba(168,85,247,0.15)" : "rgba(34,197,94,0.12)",
                    color: isAdmin ? C.purple : C.green,
                  }}>
                  {u.name[0].toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{u.name}</p>
                  <p className="text-xs truncate" style={{ color: C.textSub }}>{u.email}</p>
                </div>
                {/* Role badge */}
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: isAdmin ? "rgba(168,85,247,0.1)" : "var(--surface-2)",
                    border: `1px solid ${isAdmin ? "rgba(168,85,247,0.25)" : C.cardBorder}`,
                    color: isAdmin ? C.purple : C.textSub,
                  }}>
                  {isAdmin ? <ShieldCheck size={10}/> : <User size={10}/>}
                  {isAdmin ? "Admin" : "Student"}
                </span>
                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleRoleToggle(u)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ backgroundColor: "var(--card)", border: `1px solid ${C.cardBorder}`, color: C.textSub }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.textSub; e.currentTarget.style.borderColor = C.cardBorder; }}>
                    <UserCog size={12}/>
                    {isAdmin ? "→ Student" : "→ Admin"}
                  </button>
                  {confirmDel === u.id
                    ? <DeleteConfirm onConfirm={() => handleDelete(u.id)} onCancel={() => setConfirmDel(null)} />
                    : <button onClick={() => setConfirmDel(u.id)}
                        className="p-1.5 rounded-lg transition-all" style={{ color: C.textMuted }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.backgroundColor = C.redBg; }}
                        onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.backgroundColor = "transparent"; }}>
                        <Trash2 size={14}/>
                      </button>
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={u => setUsers(p => [u, ...p])} />}
    </div>
  );
}

// Materials Tab
function MaterialsTab() {
  const [materials, setMaterials]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [confirmDel, setConfirmDel] = useState(null);
  const [search, setSearch]         = useState("");

  useEffect(() => {
    apiFetch("/admin/materials").then(setMaterials).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleToggleGlobal = async (m) => {
    try {
      const updated = await apiFetch(`/admin/materials/${m.id}/global`, { method: "PATCH" });
      setMaterials(p => p.map(x => x.id === m.id ? { ...x, is_global: updated.is_global } : x));
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    try { await apiFetch(`/admin/materials/${id}`, { method: "DELETE" }); setMaterials(p => p.filter(m => m.id !== id)); setConfirmDel(null); }
    catch (e) { alert(e.message); }
  };

  const filtered = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.subject?.toLowerCase().includes(search.toLowerCase())
  );
  const globalCount = materials.filter(m => m.is_global).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.textMuted }}/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Caută după titlu sau materie..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, color: C.text }}
            onFocus={e => e.currentTarget.style.borderColor = "rgba(34,197,94,0.45)"}
            onBlur={e => e.currentTarget.style.borderColor = C.cardBorder} />
        </div>
        <div className="flex items-center gap-2 text-xs flex-shrink-0" style={{ color: C.textSub }}>
          <span>{materials.length} total</span>
          <span style={{ color: C.textMuted }}>·</span>
          <span style={{ color: C.blue }}>{globalCount} globale</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: C.green }}/></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <div key={m.id} className="flex items-center gap-4 px-4 py-3 rounded-xl"
              style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <FileText size={15} style={{ color: C.green }}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{m.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs" style={{ color: C.textSub }}>User ID: {m.uploaded_by}</p>
                  {m.subject && (
                    <span className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: "rgba(34,197,94,0.08)", color: C.green }}>{m.subject}</span>
                  )}
                  {m.chapter && (
                    <span className="text-xs" style={{ color: C.textMuted }}>{m.chapter}</span>
                  )}
                </div>
              </div>
              <button onClick={() => handleToggleGlobal(m)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
                style={{
                  backgroundColor: m.is_global ? "rgba(59,130,246,0.1)" : "var(--card)",
                  border: `1px solid ${m.is_global ? "rgba(59,130,246,0.3)" : C.cardBorder}`,
                  color: m.is_global ? C.blue : C.textSub,
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; }}>
                <Globe size={12}/>{m.is_global ? "Global" : "Fă global"}
              </button>
              {confirmDel === m.id
                ? <DeleteConfirm onConfirm={() => handleDelete(m.id)} onCancel={() => setConfirmDel(null)} />
                : <button onClick={() => setConfirmDel(m.id)}
                    className="p-1.5 rounded-lg transition-all flex-shrink-0" style={{ color: C.textMuted }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.backgroundColor = C.redBg; }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.backgroundColor = "transparent"; }}>
                    <Trash2 size={14}/>
                  </button>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Quizzes Tab
function QuizzesTab() {
  const [quizzes, setQuizzes]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [confirmDel, setConfirmDel] = useState(null);
  const [search, setSearch]         = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [filterDiff, setFilterDiff] = useState("all");

  useEffect(() => {
    apiFetch("/admin/quizzes").then(setQuizzes).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try { await apiFetch(`/admin/quizzes/${id}`, { method: "DELETE" }); setQuizzes(p => p.filter(q => q.id !== id)); setConfirmDel(null); }
    catch (e) { alert(e.message); }
  };

  const filtered = quizzes.filter(q =>
    q.title?.toLowerCase().includes(search.toLowerCase()) &&
    (filterMode === "all" || q.mode === filterMode) &&
    (filterDiff === "all" || q.difficulty === filterDiff)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.textMuted }}/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Caută quiz..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, color: C.text }}
            onFocus={e => e.currentTarget.style.borderColor = "rgba(34,197,94,0.45)"}
            onBlur={e => e.currentTarget.style.borderColor = C.cardBorder} />
        </div>
        {/* Filter mod */}
        <div className="flex gap-1">
          {["all","practice","test","exam"].map(m => (
            <button key={m} onClick={() => setFilterMode(m)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                backgroundColor: filterMode === m ? "rgba(59,130,246,0.12)" : "var(--card)",
                border: `1px solid ${filterMode === m ? "rgba(59,130,246,0.35)" : C.cardBorder}`,
                color: filterMode === m ? C.blue : C.textSub,
              }}>
              {m === "all" ? "Toate" : m === "practice" ? "Practică" : m === "test" ? "Test" : "Examen"}
            </button>
          ))}
        </div>
        {/* Filter dificultate */}
        <div className="flex gap-1">
          {["all","easy","medium","hard"].map(d => (
            <button key={d} onClick={() => setFilterDiff(d)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                backgroundColor: filterDiff === d ? `${d === "all" ? C.purple : diffConfig[d]?.color || C.purple}12` : "var(--card)",
                border: `1px solid ${filterDiff === d ? `${d === "all" ? C.purple : diffConfig[d]?.color || C.purple}35` : C.cardBorder}`,
                color: filterDiff === d ? (d === "all" ? C.purple : diffConfig[d]?.color) : C.textSub,
              }}>
              {d === "all" ? "Toate" : diffConfig[d]?.label}
            </button>
          ))}
        </div>
        <span className="text-xs flex-shrink-0" style={{ color: C.textSub }}>{filtered.length} quizuri</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: C.green }}/></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(q => {
            const diff = diffConfig[q.difficulty] || { label: q.difficulty, color: C.textSub };
            const mode = modeConfig[q.mode] || { label: q.mode, Icon: ClipboardList, color: C.textSub };
            const MIcon = mode.Icon;
            return (
              <div key={q.id} className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${mode.color}10`, border: `1px solid ${mode.color}22` }}>
                  <MIcon size={15} style={{ color: mode.color }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{q.title || "Quiz fără titlu"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs" style={{ color: C.textSub }}>User ID: {q.created_by}</p>
                    <span className="text-xs" style={{ color: C.textMuted }}>·</span>
                    <span className="text-xs" style={{ color: C.textSub }}>{q.num_questions} întrebări</span>
                  </div>
                </div>
                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs px-2 py-1 rounded-lg font-medium"
                    style={{ backgroundColor: `${mode.color}10`, border: `1px solid ${mode.color}22`, color: mode.color }}>
                    {mode.label}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-lg font-medium"
                    style={{ backgroundColor: `${diff.color}10`, border: `1px solid ${diff.color}22`, color: diff.color }}>
                    {diff.label}
                  </span>
                </div>
                {confirmDel === q.id
                  ? <DeleteConfirm onConfirm={() => handleDelete(q.id)} onCancel={() => setConfirmDel(null)} />
                  : <button onClick={() => setConfirmDel(q.id)}
                      className="p-1.5 rounded-lg transition-all flex-shrink-0" style={{ color: C.textMuted }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.backgroundColor = C.redBg; }}
                      onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <Trash2 size={14}/>
                    </button>
                }
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Admin Page

// Wordle Tab
function WordleTab() {
  const [word,    setWord]    = useState("");
  const [loading, setLoading] = useState(false);
  const [info,    setInfo]    = useState(null);
  const [msg,     setMsg]     = useState("");
  const [error,   setError]   = useState("");

  const fetchInfo = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/wordle/admin/info", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) setInfo(await res.json());
      else setInfo(null);
    } catch { setInfo(null); }
  };

  useEffect(() => { fetchInfo(); }, []);

  const handleSet = async () => {
    if (!word.trim()) return;
    setLoading(true); setMsg(""); setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/wordle/set-word", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim() }),
      });
      const data = await res.json();
      if (res.ok) { setMsg(data.message); setWord(""); fetchInfo(); }
      else setError(data.detail || "Eroare");
    } catch { setError("Eroare de rețea."); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5 max-w-xl">
      {/* Set word */}
      <div className="rounded-2xl p-5 space-y-4"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Sword size={16} style={{ color: "#22c55e" }} />
          <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>Setează cuvântul zilei</h3>
        </div>
        <p className="text-xs" style={{ color: "var(--text-sub)" }}>
          Cuvântul va fi vizibil tuturor utilizatorilor. Challenge-ul anterior se închide automat.
        </p>
        <div className="flex gap-3">
          <input
            type="text" value={word}
            onChange={e => setWord(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSet()}
            placeholder="Scrie cuvântul (ex: PLANETA)"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold tracking-widest uppercase focus:outline-none"
            style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--card-border)", color: "var(--text)" }}
            onFocus={e => e.currentTarget.style.borderColor = "rgba(34,197,94,0.45)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--card-border)"}
          />
          <button onClick={handleSet} disabled={loading || !word.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ backgroundColor: "#22c55e", color: "#000" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#4ade80"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}>
            {loading ? "..." : "Setează"}
          </button>
        </div>
        {msg && <p className="text-xs font-semibold" style={{ color: "#22c55e" }}>{msg}</p>}
        {error && <p className="text-xs font-semibold" style={{ color: "#f87171" }}>{error}</p>}
      </div>

      {/* Current challenge info */}
      {info ? (
        <div className="rounded-2xl p-5 space-y-3"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
          <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>Challenge activ</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Cuvânt",    val: info.word },
              { label: "Jucători", val: info.players },
              { label: "Ghicite",  val: `${info.solvers} / ${info.players}` },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ backgroundColor: "var(--surface-1)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                <p className="font-black text-lg tracking-widest" style={{ color: "var(--text)" }}>{s.val}</p>
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Setat la {info.created_at}</p>
        </div>
      ) : (
        <div className="rounded-2xl p-5 text-center"
          style={{ backgroundColor: "var(--surface-1)", border: "1px dashed var(--card-border)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Niciun challenge activ momentan</p>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [tab, setTab]     = useState("stats");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiFetch("/admin/stats").then(setStats).catch(console.error);
  }, []);

  const tabs = [
    { id: "stats",     label: "Statistici",  icon: BarChart2,    accent: C.green  },
    { id: "users",     label: "Utilizatori", icon: Users,         accent: C.blue   },
    { id: "materials", label: "Materiale",   icon: FileText,      accent: C.purple },
    { id: "quizzes",   label: "Quizuri",     icon: ClipboardList, accent: C.amber  },
    { id: "wordle",    label: "Wordle",      icon: Sword,         accent: C.green  },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", color: C.purple }}>
              <ShieldCheck size={11}/>Admin
            </span>
          </div>
          <h1 className="text-2xl font-black" style={{ color: C.text }}>Panou de administrare</h1>
          <p className="text-sm mt-0.5" style={{ color: C.textSub }}>
            Gestionează utilizatori, materiale și quizuri
          </p>
        </div>
        {stats && (
          <div className="flex items-center gap-3 text-xs" style={{ color: C.textSub }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: C.green }}/>
              Platformă activă
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ backgroundColor: "var(--surface-1)", border: `1px solid ${C.divider}` }}>
        {tabs.map(t => {
          const on = tab === t.id;
          const TIcon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: on ? `${t.accent}14` : "transparent",
                border: `1px solid ${on ? `${t.accent}30` : "transparent"}`,
                color: on ? t.accent : C.textSub,
              }}
              onMouseEnter={e => { if (!on) { e.currentTarget.style.backgroundColor = "var(--card)"; e.currentTarget.style.color = C.text; }}}
              onMouseLeave={e => { if (!on) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.textSub; }}}>
              <TIcon size={15} strokeWidth={1.8}/>{t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === "stats"     && <StatsTab stats={stats} />}
      {tab === "users"     && <UsersTab />}
      {tab === "materials" && <MaterialsTab />}
      {tab === "quizzes"   && <QuizzesTab />}
      {tab === "wordle"    && <WordleTab />}
    </div>
  );
}