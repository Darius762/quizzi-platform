// frontend/src/pages/Progress.jsx


import { useState, useEffect, useRef } from "react";
import { getToken } from "../api/auth";
import {
  TrendingUp, TrendingDown, Target, Trophy, Flame,
  Clock, BarChart2, Calendar, Zap, BookOpen,
  Activity, Sun, Moon, ChevronUp, ChevronDown,
  Minus, FileQuestion, ListChecks, Star
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);

const API_URL = "http://127.0.0.1:8000/api";

// Palette
const C = {
  card:       "var(--card)",
  cardBorder: "var(--card-border)",
  text:       "var(--text)",
  textSub:    "var(--text-sub)",
  textMuted:  "var(--text-muted)",
  green:  "#22c55e", greenBg: "rgba(34,197,94,0.1)",
  blue:   "#3b82f6", blueBg:  "rgba(59,130,246,0.1)",
  purple: "#a855f7",
  amber:  "#f59e0b", amberBg: "rgba(245,158,11,0.1)",
  red:    "#ef4444", redBg:   "rgba(239,68,68,0.1)",
  cyan:   "#06b6d4",
};

const sc  = p => p >= 70 ? C.green  : p >= 50 ? C.amber  : C.red;
const scb = p => p >= 70 ? C.greenBg : p >= 50 ? C.amberBg : C.redBg;

//  Ora locală
function toLocalDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function todayStr() { return toLocalDate(new Date().toISOString()); }
function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (n-1-i));
    return toLocalDate(d.toISOString());
  });
}

// Counter animat
function AnimVal({ to, suffix = "" }) {
  const [val, setVal] = useState(0);
  const raf = useRef(null), t0 = useRef(null);
  useEffect(() => {
    if (!to) return;
    t0.current = null;
    const run = ts => {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / 900, 1);
      setVal(Math.round((1 - Math.pow(1-p, 3)) * to));
      if (p < 1) raf.current = requestAnimationFrame(run);
    };
    raf.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf.current);
  }, [to]);
  return <>{val}{suffix}</>;
}

//  Stat Card
function StatCard({ icon: Icon, label, value, sub, accent, trend, trendLabel }) {
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: `${accent}12`, border: `1px solid ${accent}28` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
            <Icon size={14} style={{ color: accent }} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent, opacity: 0.85 }}>{label}</p>
        </div>
        {trend !== undefined && trend !== null && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold"
            style={{
              backgroundColor: trend > 0 ? "rgba(34,197,94,0.12)" : trend < 0 ? "rgba(239,68,68,0.12)" : "var(--card-hover)",
              color: trend > 0 ? C.green : trend < 0 ? C.red : C.textSub,
            }}>
            {trend > 0 ? <ChevronUp size={10}/> : trend < 0 ? <ChevronDown size={10}/> : <Minus size={10}/>}
            {trendLabel}
          </div>
        )}
      </div>
      <p className="text-2xl font-black" style={{ color: C.text }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: C.textSub }}>{sub}</p>}
    </div>
  );
}

//  Section Header
function SH({ icon: Icon, title, sub, accent = C.textSub }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}15` }}>
        <Icon size={14} style={{ color: accent }} />
      </div>
      <div>
        <h2 className="text-sm font-bold" style={{ color: C.text }}>{title}</h2>
        {sub && <p className="text-xs" style={{ color: C.textSub }}>{sub}</p>}
      </div>
    </div>
  );
}

// Chart options
const CT = { backgroundColor: "var(--bg)", borderColor: "var(--input-border)", borderWidth: 1, titleColor: "#fff", bodyColor: "#9ca3af", padding: 10 };
const yAxis = { grid: { color: "var(--surface-2)" }, ticks: { color: "#6b7280", font: { size: 10 }, callback: v => `${v}%`, stepSize: 25 }, border: { color: "var(--surface-2)" }, min: 0, max: 100 };
const xAxis = { grid: { color: "var(--surface-2)" }, ticks: { color: "#6b7280", font: { size: 10 }, maxRotation: 0 }, border: { color: "var(--surface-2)" } };

//  Evolution chart
function EvolutionChart({ attempts }) {
  const days = lastNDays(30);
  const points = days.map(ds => {
    const da = attempts.filter(a => a.completed_at && toLocalDate(a.completed_at) === ds);
    return da.length ? Math.round(da.reduce((s,a)=>s+(a.score/a.total*100),0)/da.length) : null;
  });
  const labels = days.map((ds, i) => {
    if (points[i] !== null || i === 0 || i === 29 || i % 7 === 0) {
      const d = new Date(ds); return `${d.getDate()}/${d.getMonth()+1}`;
    }
    return "";
  });
  if (!points.some(v => v !== null))
    return <div className="flex items-center justify-center h-48" style={{ color: C.textSub, fontSize: "13px" }}>Nicio tentativă în ultimele 30 de zile</div>;
  return (
    <div style={{ height: "200px" }}>
      <Line data={{ labels, datasets: [{
        data: points, borderColor: C.green, backgroundColor: "rgba(34,197,94,0.06)",
        pointBackgroundColor: points.map(v => v===null?"transparent":sc(v)),
        pointBorderColor: points.map(v => v===null?"transparent":sc(v)),
        pointRadius: points.map(v => v===null?0:4), pointHoverRadius: points.map(v=>v===null?0:6),
        borderWidth: 2, fill: true, tension: 0.4, spanGaps: true,
      }]}} options={{
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 1200, easing: "easeInOutQuart" },
        plugins: { legend: { display: false }, tooltip: { ...CT, callbacks: { label: ctx => ctx.raw !== null ? ` ${ctx.raw}%` : " Nicio tentativă" }}},
        scales: { x: xAxis, y: yAxis },
      }}/>
    </div>
  );
}

//Bar chart 14 zile
function BarChart14({ attempts }) {
  const days = lastNDays(14);
  const data = days.map(ds => {
    const da = attempts.filter(a => a.completed_at && toLocalDate(a.completed_at) === ds);
    return da.length ? Math.round(da.reduce((s,a)=>s+(a.score/a.total*100),0)/da.length) : null;
  });
  const labels = days.map(ds => { const d = new Date(ds); return `${d.getDate()}/${d.getMonth()+1}`; });
  if (!data.some(v => v !== null))
    return <div className="flex items-center justify-center h-40" style={{ color: C.textSub, fontSize: "13px" }}>Nicio tentativă în ultimele 14 zile</div>;
  return (
    <div style={{ height: "180px" }}>
      <Bar data={{ labels, datasets: [{
        data, borderRadius: 5,
        backgroundColor: data.map(v=>v===null?"var(--surface-1)":v>=70?"rgba(34,197,94,0.6)":v>=50?"rgba(245,158,11,0.6)":"rgba(239,68,68,0.6)"),
        borderColor: data.map(v=>v===null?"transparent":sc(v)), borderWidth: 1,
      }]}} options={{
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 900, easing: "easeOutBounce", delay: ctx => ctx.dataIndex * 35 },
        plugins: { legend: { display: false }, tooltip: { ...CT, callbacks: { label: ctx => ctx.raw !== null ? ` ${ctx.raw}%` : " Nicio tentativă" }}},
        scales: { x: { ...xAxis, grid: { display: false } }, y: yAxis },
      }}/>
    </div>
  );
}

//  Heatmap
function Heatmap({ attempts }) {
  const [tip, setTip] = useState(null);
  const today = todayStr();
  const weeks = Array.from({ length: 12 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const dt = new Date(); dt.setDate(dt.getDate() - ((11-w)*7 + (6-d)));
      const ds = toLocalDate(dt.toISOString());
      const da = attempts.filter(a => a.completed_at && toLocalDate(a.completed_at) === ds);
      return { date: ds, count: da.length, future: ds > today,
        avg: da.length ? Math.round(da.reduce((s,a)=>s+(a.score/a.total*100),0)/da.length) : null };
    })
  );
  const gc = c => {
    if (c.future || !c.count) return "var(--card)";
    const b = c.avg>=70?"34,197,94":c.avg>=50?"234,179,8":"239,68,68";
    return `rgba(${b},${Math.min(0.25+c.count*0.18,0.9)})`;
  };
  const gb = c => {
    if (c.future || !c.count) return "var(--card-hover)";
    return c.avg>=70?"rgba(34,197,94,0.45)":c.avg>=50?"rgba(234,179,8,0.45)":"rgba(239,68,68,0.45)";
  };
  const monthLabels = weeks.map(w => {
    const d = new Date(w[w.length-1].date);
    return d.getDate()<=7 ? d.toLocaleDateString("ro-RO",{month:"short"}) : "";
  });
  return (
    <div>
      <div style={{ display:"flex", gap:"4px", marginBottom:"6px", paddingLeft:"22px" }}>
        {monthLabels.map((l,i) => <div key={i} style={{ width:"16px",fontSize:"9px",color:C.textSub,textAlign:"center" }}>{l}</div>)}
      </div>
      <div style={{ display:"flex", gap:"4px" }}>
        <div style={{ display:"flex",flexDirection:"column",gap:"4px",marginRight:"2px" }}>
          {["D","","M","","J","","S"].map((l,i) => (
            <div key={i} style={{ width:"14px",height:"16px",fontSize:"9px",color:C.textMuted,display:"flex",alignItems:"center",justifyContent:"center" }}>{l}</div>
          ))}
        </div>
        {weeks.map((week,wi) => (
          <div key={wi} style={{ display:"flex",flexDirection:"column",gap:"4px" }}>
            {week.map((cell,di) => (
              <div key={di}
                onMouseEnter={e => cell.count>0 && setTip({cell,x:e.clientX,y:e.clientY})}
                onMouseLeave={() => setTip(null)}
                style={{ width:"16px",height:"16px",borderRadius:"3px",backgroundColor:gc(cell),border:`1px solid ${gb(cell)}`,cursor:cell.count>0?"pointer":"default",transition:"transform 0.1s" }}
                onMouseOver={e => { if(cell.count>0) e.currentTarget.style.transform="scale(1.3)"; }}
                onMouseOut={e => { e.currentTarget.style.transform="scale(1)"; }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:"8px",marginTop:"10px" }}>
        <span style={{ color:C.textSub,fontSize:"10px" }}>Mai puțin</span>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ width:"14px",height:"14px",borderRadius:"3px",backgroundColor:i===0?"var(--card)":`rgba(34,197,94,${0.2+i*0.18})`,border:`1px solid ${i===0?"var(--divider)":"rgba(34,197,94,0.4)"}` }}/>
        ))}
        <span style={{ color:C.textSub,fontSize:"10px" }}>Mai mult</span>
      </div>
      {tip && (
        <div style={{ position:"fixed",left:tip.x+12,top:tip.y-48,backgroundColor:"var(--bg)",border:"1px solid var(--input-border)",borderRadius:"10px",padding:"8px 12px",fontSize:"12px",color:C.text,pointerEvents:"none",zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 8px 24px rgba(0,0,0,0.5)" }}>
          <div style={{ fontWeight:"600",marginBottom:"2px" }}>{tip.cell.date}</div>
          <div style={{ color:C.textSub }}>
            {tip.cell.count} tentativ{tip.cell.count===1?"ă":"e"}
            {tip.cell.avg!==null && <span style={{ color:sc(tip.cell.avg),marginLeft:"6px" }}>· {tip.cell.avg}%</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// Calcule statistici
function computeAdv(attempts) {
  if (!attempts.length) return {};

  const daySet = new Set(attempts.filter(a=>a.completed_at).map(a=>toLocalDate(a.completed_at)));
  let streak = 0;
  const check = new Date();
  if (!daySet.has(toLocalDate(check.toISOString()))) check.setDate(check.getDate()-1);
  const checkCopy = new Date(check);
  while (daySet.has(toLocalDate(checkCopy.toISOString()))) {
    streak++; checkCopy.setDate(checkCopy.getDate()-1);
  }


  const sortedDays = [...daySet].sort();
  let maxStreak = 0, cur = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { cur = 1; }
    else {
      const prev = new Date(sortedDays[i-1]); prev.setDate(prev.getDate()+1);
      cur = toLocalDate(prev.toISOString()) === sortedDays[i] ? cur+1 : 1;
    }
    if (cur > maxStreak) maxStreak = cur;
  }


  const last30 = new Set(lastNDays(30));
  const activeDays = [...daySet].filter(d => last30.has(d)).length;
  const consistency = Math.round((activeDays / 30) * 100);


  const withTime = attempts.filter(a => a.time_seconds && a.time_seconds > 5);
  const avgTime = withTime.length > 0
    ? Math.round(withTime.reduce((s,a)=>s+a.time_seconds,0)/withTime.length) : null;


  const slots = {
    dimineata: { label:"Dimineața", range:"6–12",  icon: Sun,  check: h => h>=6  && h<12, scores:[] },
    pranz:     { label:"Prânz",     range:"12–18", icon: Sun,  check: h => h>=12 && h<18, scores:[] },
    seara:     { label:"Seara",     range:"18–23", icon: Moon, check: h => h>=18 && h<23, scores:[] },
    noapte:    { label:"Noaptea",   range:"23–6",  icon: Moon, check: h => h>=23 || h<6,  scores:[] },
  };
  attempts.forEach(a => {
    if (!a.completed_at) return;
    const h = new Date(a.completed_at).getHours(); // ORA LOCALA
    const pct = Math.round((a.score/a.total)*100);
    Object.values(slots).forEach(s => { if (s.check(h)) s.scores.push(pct); });
  });


  const sorted = [...attempts].filter(a=>a.completed_at).sort((a,b)=>new Date(a.completed_at)-new Date(b.completed_at));
  const half = Math.ceil(sorted.length/2);
  const avgFirst = half ? Math.round(sorted.slice(0,half).reduce((s,a)=>s+(a.score/a.total*100),0)/half) : 0;
  const avgLast  = half ? Math.round(sorted.slice(-half).reduce((s,a)=>s+(a.score/a.total*100),0)/half) : 0;
  const improvement = avgLast - avgFirst;


  const weeklyData = Array.from({ length:4 }, (_, wi) => {
    const weekDays = Array.from({ length:7 }, (__, di) => {
      const d = new Date(); d.setDate(d.getDate() - wi*7 - di);
      return toLocalDate(d.toISOString());
    });
    return attempts.filter(a => a.completed_at && weekDays.includes(toLocalDate(a.completed_at))).length;
  }).reverse();
  const weekTrend = weeklyData[3] - weeklyData[2];

  return { streak, maxStreak, consistency, avgTime, slots, improvement, avgFirst, avgLast, weeklyData, weekTrend };
}

// Pagina
export default function Progress() {
  const [stats, setStats]  = useState(null);
  const [attempts, setAll] = useState([]);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const tk = getToken();
        const hdr = { Authorization: `Bearer ${tk}` };
        const [s, a] = await Promise.all([
          fetch(`${API_URL}/attempts/stats`, { headers: hdr }).then(r=>r.json()),
          fetch(`${API_URL}/attempts/`,      { headers: hdr }).then(r=>r.json()),
        ]);
        setStats(s); setAll(a);
      } catch (e) { console.error(e); }
      finally { setLoad(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor:"rgba(34,197,94,0.2)",borderTopColor:C.green }}/>
    </div>
  );

  if (!stats || stats.total_attempts === 0) return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color:C.text }}>Progres</h1>
        <p className="text-sm mt-0.5" style={{ color:C.textSub }}>Statisticile tale de învățare</p>
      </div>
      <div className="text-center py-24 rounded-2xl" style={{ border:"1px dashed var(--divider)" }}>
        <BarChart2 size={36} className="mx-auto mb-3" style={{ color:C.textMuted }}/>
        <p className="font-medium text-sm" style={{ color:C.textSub }}>Nicio tentativă încă</p>
      </div>
    </div>
  );

  const adv = computeAdv(attempts);


  const byMode = attempts.reduce((acc,a) => { acc[a.mode]=(acc[a.mode]||0)+1; return acc; }, {});

  const recent = [...attempts].slice(0, 10).reverse();
  const globalPct = stats.total_questions_answered > 0
    ? Math.round(stats.correct_answers/stats.total_questions_answered*100) : 0;


  const slotsList = Object.entries(adv.slots||{})
    .filter(([,s]) => s.scores.length > 0)
    .map(([key,s]) => ({
      key, label: s.label, range: s.range, Icon: s.icon,
      avg: Math.round(s.scores.reduce((a,b)=>a+b,0)/s.scores.length),
      count: s.scores.length,
    }))
    .sort((a,b) => b.avg-a.avg);
  const bestSlot = slotsList[0]?.key;


  const totalMin = stats.total_study_time_min || 0;
  const totalTimeStr = totalMin >= 60
    ? `${Math.floor(totalMin/60)}h ${totalMin%60}min`
    : `${totalMin} min`;


  const avgTimeStr = adv.avgTime
    ? `${Math.floor(adv.avgTime/60)}m ${adv.avgTime%60}s`
    : "—";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color:C.text }}>Progres</h1>
          <p className="text-sm mt-0.5" style={{ color:C.textSub }}>
            {stats.total_attempts} tentative totale
            {attempts.filter(a => a.completed_at && toLocalDate(a.completed_at)===todayStr()).length > 0 &&
              <span style={{ color:C.green }}> · {attempts.filter(a=>a.completed_at&&toLocalDate(a.completed_at)===todayStr()).length} azi</span>
            }
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl text-xs" style={{ backgroundColor:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.18)",color:C.textSub }}>
          Graficele arată toate tentativele
        </div>
      </div>

      {/* ── Rând 1: 6 carduri — date din /stats/ (corecte, toate tentativele) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Target}    label="Tentative"   accent={C.green}
          value={<AnimVal to={stats.total_attempts}/>}
          sub="Toate quizurile" />
        <StatCard icon={TrendingUp} label="Scor mediu"  accent={C.blue}
          value={<><AnimVal to={Math.round(stats.avg_score_pct)}/>%</>}
          sub="Din toate tentativele"
          trend={adv.improvement||0}
          trendLabel={`${(adv.improvement||0)>0?"+":""}${adv.improvement||0}%`} />
        <StatCard icon={Trophy}     label="Cel mai bun" accent={C.purple}
          value={<><AnimVal to={Math.round(stats.best_score_pct)}/>%</>}
          sub="Scor maxim atins" />
        <StatCard icon={Flame}      label="Streak"      accent={C.amber}
          value={adv.streak||0}
          sub={`Record: ${adv.maxStreak||0} zile`} />
        <StatCard icon={Activity}   label="Consistență" accent={C.cyan}
          value={<><AnimVal to={adv.consistency||0}/>%</>}
          sub={`${Math.round((adv.consistency||0)*0.3)} zile / 30`} />
        <StatCard icon={Clock}      label="Timp studiu" accent={C.red}
          value={totalTimeStr}
          sub={`~${avgTimeStr} per quiz`} />
      </div>

      {/* ── Rând 2: evoluție + îmbunătățire + moduri ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ backgroundColor:C.card, border:`1px solid ${C.cardBorder}` }}>
          <SH icon={TrendingUp} title="Evoluție — ultimele 30 de zile" sub="Scor mediu per zi" accent={C.green}/>
          <EvolutionChart attempts={attempts}/>
        </div>

        <div className="flex flex-col gap-4">
          {/* Îmbunătățire */}
          <div className="rounded-2xl p-5 flex-1" style={{ backgroundColor:C.card, border:`1px solid ${C.cardBorder}` }}>
            <SH icon={Zap} title="Evoluția ta" sub="Prima vs ultima jumătate" accent={C.purple}/>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center p-3 rounded-xl" style={{ backgroundColor:"var(--surface-1)" }}>
                <p className="text-xs mb-1" style={{ color:C.textSub }}>Început</p>
                <p className="text-2xl font-black" style={{ color:sc(adv.avgFirst||0) }}>{adv.avgFirst||0}%</p>
              </div>
              <div className="px-2 py-1 rounded-lg text-sm font-black flex items-center gap-1"
                style={{ backgroundColor:(adv.improvement||0)>=0?C.greenBg:C.redBg, color:(adv.improvement||0)>=0?C.green:C.red }}>
                {(adv.improvement||0)>=0 ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
                {(adv.improvement||0)>0?"+":""}{adv.improvement||0}%
              </div>
              <div className="flex-1 text-center p-3 rounded-xl" style={{ backgroundColor:"var(--surface-1)" }}>
                <p className="text-xs mb-1" style={{ color:C.textSub }}>Acum</p>
                <p className="text-2xl font-black" style={{ color:sc(adv.avgLast||0) }}>{adv.avgLast||0}%</p>
              </div>
            </div>
          </div>

          {/* Moduri — din cele 50 */}
          <div className="rounded-2xl p-5" style={{ backgroundColor:C.card, border:`1px solid ${C.cardBorder}` }}>
            <SH icon={BookOpen} title="Moduri de quiz" sub="Din toate tentative" accent={C.blue}/>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode:"practice", label:"Practică", color:C.blue,   Icon:BookOpen },
                { mode:"test",     label:"Test",     color:C.purple, Icon:ListChecks },
                { mode:"exam",     label:"Examen",   color:C.amber,  Icon:Clock },
              ].map(m => {
                const MI = m.Icon;
                return (
                  <div key={m.mode} className="text-center p-3 rounded-xl"
                    style={{ backgroundColor:`${m.color}10`, border:`1px solid ${m.color}22` }}>
                    <MI size={16} className="mx-auto mb-1.5" style={{ color:m.color }}/>
                    <p className="text-xl font-black" style={{ color:m.color }}>{byMode[m.mode]||0}</p>
                    <p className="text-xs mt-0.5" style={{ color:C.textSub }}>{m.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Rând 3: bare 14 zile + moment productiv ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ backgroundColor:C.card, border:`1px solid ${C.cardBorder}` }}>
          <SH icon={BarChart2} title="Scoruri zilnice — 14 zile" sub="Scor mediu per zi, ora locală" accent={C.blue}/>
          <BarChart14 attempts={attempts}/>
        </div>

        <div className="rounded-2xl p-5" style={{ backgroundColor:C.card, border:`1px solid ${C.cardBorder}` }}>
          <SH icon={Sun} title="Moment productiv" sub="Ora locală — când ești cel mai bun" accent={C.amber}/>
          {slotsList.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color:C.textMuted }}>Date insuficiente</p>
          ) : (
            <div className="space-y-2.5">
              {slotsList.map(s => {
                const isBest = s.key === bestSlot;
                const SIcon = s.Icon;
                return (
                  <div key={s.key} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{
                      backgroundColor: isBest ? `${C.amber}10` : "var(--surface-1)",
                      border:`1px solid ${isBest?`${C.amber}28`:"var(--card-hover)"}`,
                    }}>
                    <SIcon size={14} style={{ color:isBest?C.amber:C.textSub, flexShrink:0 }}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color:isBest?C.text:C.textSub }}>
                        {s.label} <span style={{ color:C.textMuted }}>({s.range})</span>
                      </p>
                      <p className="text-xs" style={{ color:C.textMuted }}>{s.count} tentative</p>
                    </div>
                    <span className="text-sm font-bold" style={{ color:sc(s.avg) }}>{s.avg}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Rând 4: heatmap ── */}
      <div className="rounded-2xl p-5" style={{ backgroundColor:C.card, border:`1px solid ${C.cardBorder}` }}>
        <div className="flex items-center justify-between mb-5">
          <SH icon={Calendar} title="Activitate — 12 săptămâni" sub="Fiecare celulă = o zi" accent={C.green}/>
          <div className="flex items-center gap-4 text-xs">
            <span style={{ color:C.textSub }}>{adv.consistency}% activ / 30 zile</span>
            {(adv.streak||0) > 0 && (
              <div className="flex items-center gap-1" style={{ color:C.amber }}>
                <Flame size={12}/>{adv.streak} zile la rând
              </div>
            )}
          </div>
        </div>
        <Heatmap attempts={attempts}/>
      </div>

      {/* ── Rând 5: tentative/săptămână + rată succes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Tentative per săptămână */}
        <div className="rounded-2xl p-5" style={{ backgroundColor:C.card, border:`1px solid ${C.cardBorder}` }}>
          <SH icon={Activity} title="Tentative / săptămână" sub="Ultimele 4 săptămâni, ora locală" accent={C.cyan}/>
          <div className="flex items-end gap-3 mt-3" style={{ height:"80px" }}>
            {(adv.weeklyData||[0,0,0,0]).map((v,i) => {
              const isLast = i===3;
              const maxV = Math.max(...(adv.weeklyData||[1]),1);
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  <span className="text-xs font-bold" style={{ color:isLast?C.cyan:C.textSub }}>{v}</span>
                  <div className="w-full rounded-lg" style={{
                    height:`${Math.max(6,(v/maxV)*52)}px`,
                    backgroundColor:isLast?"rgba(6,182,212,0.55)":"var(--divider)",
                    border:isLast?"1px solid rgba(6,182,212,0.35)":"none",
                  }}/>
                  <span className="text-xs" style={{ color:C.textMuted }}>S{i+1}</span>
                </div>
              );
            })}
          </div>
          {(adv.weekTrend!==undefined) && (
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium"
              style={{ color:(adv.weekTrend||0)>=0?C.green:C.red }}>
              {(adv.weekTrend||0)>=0 ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
              {(adv.weekTrend||0)>=0?"+":""}{adv.weekTrend||0} față de săptămâna trecută
            </div>
          )}
        </div>

        {/* Rată succes — din /stats/ (toate tentativele, corect) */}
        <div className="rounded-2xl p-5" style={{ backgroundColor:C.card, border:`1px solid ${C.cardBorder}` }}>
          <SH icon={Target} title="Rată succes globală" sub="Din toate tentativele, via /stats/" accent={C.green}/>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--divider)" strokeWidth="10"/>
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke={sc(globalPct)} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${2*Math.PI*40}`}
                  strokeDashoffset={`${2*Math.PI*40*(1-globalPct/100)}`}
                  style={{ transition:"stroke-dashoffset 1.2s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-2xl font-black" style={{ color:sc(globalPct) }}>
                  <AnimVal to={globalPct} suffix="%"/>
                </p>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {[
                { label:"Răspunsuri corecte", val:stats.correct_answers,          color:C.green },
                { label:"Total întrebări",    val:stats.total_questions_answered, color:C.textSub },
                { label:"Total tentative",    val:stats.total_attempts,            color:C.blue },
              ].map(r => (
                <div key={r.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color:C.textSub }}>{r.label}</span>
                    <span className="font-bold" style={{ color:r.color }}>{r.val}</span>
                  </div>
                </div>
              ))}
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor:"var(--divider)" }}>
                <div className="h-full rounded-full" style={{ width:`${globalPct}%`,backgroundColor:sc(globalPct),transition:"width 1s ease" }}/>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ultimele 10 tentative ── */}
      <div className="rounded-2xl p-5" style={{ backgroundColor:C.card, border:`1px solid ${C.cardBorder}` }}>
        <SH icon={FileQuestion} title={`Ultimele ${recent.length} tentative`} accent={C.blue}/>
        <div className="space-y-2">
          {recent.map((a,i) => {
            const pct = Math.round((a.score/a.total)*100);
            const color = sc(pct);
            const modeMap = {
              practice: { label:"Practică", Icon:BookOpen,   color:C.blue   },
              test:     { label:"Test",     Icon:ListChecks, color:C.purple },
              exam:     { label:"Examen",   Icon:Clock,      color:C.amber  },
            };
            const m = modeMap[a.mode] || { label:a.mode, Icon:FileQuestion, color:C.textSub };
            const MI = m.Icon;
            const dateStr = a.completed_at ? new Date(a.completed_at).toLocaleDateString("ro-RO",{day:"2-digit",month:"short"}) : "";
            return (
              <div key={a.id||i} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor:"var(--surface-1)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor:`${m.color}12`, border:`1px solid ${m.color}20` }}>
                  <MI size={14} style={{ color:m.color }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color:C.text }}>{m.label}</p>
                  <p className="text-xs" style={{ color:C.textMuted }}>
                    {a.score}/{a.total} corecte
                    {dateStr && <span style={{ marginLeft:"8px" }}>{dateStr}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor:"var(--divider)" }}>
                    <div className="h-full rounded-full" style={{ width:`${pct}%`,backgroundColor:color }}/>
                  </div>
                  <div className="w-12 text-center text-xs font-bold py-1 rounded-lg"
                    style={{ backgroundColor:scb(pct),color }}>{pct}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}