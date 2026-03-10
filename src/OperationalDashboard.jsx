import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell
} from "recharts";

/* ─── Design tokens — dark mode ─────────────────────────────────────── */
const T = {
  bg:       "#0E1117",
  surface:  "#161B26",
  surface2: "#1C2333",
  border:   "#2A3347",
  nav:      "#0B0F1A",
  navText:  "#5A7A9A",
  navActive:"#FFFFFF",
  primary:  "#3B9EFF",
  red:      "#F05252",
  amber:    "#FBBF24",
  green:    "#34D399",
  greenBg:  "#0D2E22",
  redBg:    "#2A1215",
  amberBg:  "#2A1F0A",
  text:     "#E2EAF4",
  sub:      "#7A95B0",
  muted:    "#445566",
  nestle:   "#E8002A",
};

/* ─── Clock ─────────────────────────────────────────────────────────── */
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/* ─── Fake data ──────────────────────────────────────────────────────── */
function makeThroughput() {
  const labels = ["06:00","06:30","07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00"];
  return labels.map((label, i) => ({
    label,
    actual:  Math.round(12400 + Math.sin(i * 0.7) * 380 + (Math.random() - 0.5) * 200),
    target:  12500,
  }));
}

function makeOtdHistory() {
  const labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun","Mon","Tue","Wed","Thu","Fri","Today"];
  return labels.map((label, i) => ({
    label,
    score: +(95 + Math.sin(i * 0.8) * 3 + (Math.random() - 0.5) * 2).toFixed(1),
  }));
}

function makeInventoryDays() {
  return [
    { material: "Cocoa",    days: 18, min: 14, status: "ok" },
    { material: "Palm Oil", days: 11, min: 10, status: "low" },
    { material: "Sugar",    days: 24, min: 12, status: "ok" },
    { material: "Milk Pwd", days: 8,  min: 10, status: "critical" },
    { material: "Wheat",    days: 21, min: 12, status: "ok" },
    { material: "Hazelnuts",days: 15, min: 8,  status: "ok" },
  ];
}

const THROUGHPUT  = makeThroughput();
const OTD_HISTORY = makeOtdHistory();
const INVENTORY   = makeInventoryDays();

const SUPPLIERS = [
  { id:"S-01", name:"Olam International",  material:"Cocoa",    region:"Côte d'Ivoire", otd:94, shipments:3, status:"on-time"  },
  { id:"S-02", name:"ADM Cocoa",            material:"Cocoa",    region:"Netherlands",   otd:89, shipments:1, status:"on-time"  },
  { id:"S-03", name:"Wilmar International", material:"Palm Oil", region:"Singapore",     otd:91, shipments:2, status:"at-risk"  },
  { id:"S-04", name:"Südzucker AG",         material:"Sugar",    region:"Germany",       otd:98, shipments:4, status:"on-time"  },
  { id:"S-05", name:"Fonterra",             material:"Milk Pwd", region:"New Zealand",   otd:72, shipments:2, status:"delayed"  },
  { id:"S-06", name:"Olam Agri",            material:"Wheat",    region:"Ukraine",       otd:97, shipments:3, status:"on-time"  },
];

const COLD_CHAIN = [
  { id:"TRK-441", route:"Lyon → Geneva",       temp:2.9, status:"nominal",  eta:"14:30" },
  { id:"TRK-443", route:"Hamburg → Berlin",    temp:3.4, status:"nominal",  eta:"15:10" },
  { id:"TRK-447", route:"Zürich → Milan",      temp:3.8, status:"watch",    eta:"16:45" },
  { id:"TRK-451", route:"Paris → Brussels",    temp:2.1, status:"nominal",  eta:"13:55" },
  { id:"TRK-458", route:"Rotterdam → Cologne", temp:3.7, status:"watch",    eta:"14:20" },
];

const ALERTS = [
  { id:1, time:"11:47", sev:"critical", msg:"Milk Pwd stock below safety threshold — 8 days cover remaining", category:"Inventory" },
  { id:2, time:"11:32", sev:"warning",  msg:"Fonterra OTD dropped to 72% — 2 shipments delayed 18h",          category:"Supplier"  },
  { id:3, time:"10:58", sev:"warning",  msg:"TRK-447 temp trending toward 4°C ceiling — monitor advised",      category:"Cold Chain"},
  { id:4, time:"09:41", sev:"info",     msg:"Palm Oil inventory approaching reorder point (11 days cover)",    category:"Inventory" },
  { id:5, time:"08:15", sev:"info",     msg:"Südzucker AG delivery confirmed — 3 shipments on schedule",       category:"Supplier"  },
];

const FACTORIES = [
  { name:"Broc (CH)",       lines:6, oee:93, running:6, status:"ok"      },
  { name:"Hamburg (DE)",    lines:4, oee:87, running:4, status:"ok"      },
  { name:"York (GB)",       lines:5, oee:78, running:4, status:"warning" },
  { name:"Biessenhofen (DE)",lines:3,oee:95, running:3, status:"ok"      },
];

/* ─── Helpers ────────────────────────────────────────────────────────── */
function $f(n) { return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 }); }

function statusColor(s) {
  if (s === "critical" || s === "delayed") return T.red;
  if (s === "warning"  || s === "at-risk" || s === "watch" || s === "low") return T.amber;
  return T.green;
}
function statusBg(s) {
  if (s === "critical" || s === "delayed") return T.redBg;
  if (s === "warning"  || s === "at-risk" || s === "watch" || s === "low") return T.amberBg;
  return T.greenBg;
}

function Badge({ status, label }) {
  const c = statusColor(status);
  const bg = statusBg(status);
  const text = label || status.toUpperCase();
  return (
    <span style={{
      background: bg, color: c, border: `1px solid ${c}33`,
      borderRadius: 4, padding: "2px 8px", fontSize: 10,
      fontWeight: 700, letterSpacing: 0.8, whiteSpace: "nowrap",
      fontFamily: "'IBM Plex Mono', monospace",
    }}>{text}</span>
  );
}

function Card({ title, subtitle, action, children, style = {} }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 10, overflow: "hidden",
      boxShadow: "0 1px 6px rgba(0,0,0,0.4)",
      ...style,
    }}>
      {title && (
        <div style={{
          padding: "13px 18px 12px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: "'IBM Plex Sans', sans-serif" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{subtitle}</div>}
          </div>
          {action && <span style={{ fontSize: 11, color: T.primary, cursor: "pointer", fontWeight: 600 }}>{action}</span>}
        </div>
      )}
      <div style={{ padding: "14px 18px" }}>{children}</div>
    </div>
  );
}

/* ─── KPI strip ──────────────────────────────────────────────────────── */
function KpiStrip() {
  const kpis = [
    { label: "On-Time Delivery", value: "91.4%", delta: "+1.2%", trend: "up",   status: "ok"      },
    { label: "Lines Running",    value: "17/18",  delta: "1 planned stop",trend:"flat",status:"warning"},
    { label: "Alerts Open",      value: "5",      delta: "2 new today",  trend:"up",  status:"warning"},
    { label: "Cold Chain OK",    value: "21/23",  delta: "2 on watch",   trend:"flat",status:"watch" },
    { label: "Inventory Risk",   value: "2 SKUs", delta: "Milk, Palm Oil",trend:"up", status:"critical"},
    { label: "Throughput",       value: "12,340", delta: "units/hr avg", trend:"flat",status:"ok"    },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
      {kpis.map(k => {
        const c = statusColor(k.status);
        return (
          <div key={k.label} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderTop: `3px solid ${c}`,
            borderRadius: 8, padding: "12px 16px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.35)",
          }}>
            <div style={{ fontSize: 10, color: T.sub, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.text, lineHeight: 1, fontFamily: "'IBM Plex Sans', sans-serif" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>{k.delta}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Alerts panel ───────────────────────────────────────────────────── */
function AlertsPanel() {
  const [filter, setFilter] = useState("All");
  const cats = ["All", "Supplier", "Inventory", "Cold Chain"];
  const visible = filter === "All" ? ALERTS : ALERTS.filter(a => a.category === filter);
  const sevIcon = { critical: "🔴", warning: "🟡", info: "🔵" };
  return (
    <Card title="Active Alerts" subtitle="Last refreshed 2 min ago" action="View all →">
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            background: filter === c ? T.primary : T.bg,
            color: filter === c ? "#fff" : T.sub,
            border: `1px solid ${filter === c ? T.primary : T.border}`,
            borderRadius: 5, padding: "4px 10px", fontSize: 11,
            fontWeight: 600, cursor: "pointer",
          }}>{c}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {visible.map(a => (
          <div key={a.id} style={{
            display: "flex", gap: 10, alignItems: "flex-start",
            padding: "9px 12px", borderRadius: 6,
            background: a.sev === "critical" ? T.redBg : a.sev === "warning" ? T.amberBg : T.bg,
            border: `1px solid ${a.sev === "critical" ? T.red+"33" : a.sev === "warning" ? T.amber+"33" : T.border}`,
          }}>
            <span style={{ fontSize: 12, marginTop: 1 }}>{sevIcon[a.sev]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: T.text, lineHeight: 1.45 }}>{a.msg}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 10, color: T.muted, fontFamily: "monospace" }}>{a.time}</span>
                <Badge status={a.sev === "critical" ? "critical" : a.sev === "warning" ? "warning" : "ok"} label={a.category} />
              </div>
            </div>
            <span style={{ fontSize: 11, color: T.primary, cursor: "pointer", whiteSpace: "nowrap", fontWeight: 600 }}>Act →</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Supplier table ─────────────────────────────────────────────────── */
function SupplierTable() {
  const cols = ["ID", "Supplier", "Material", "Region", "OTD", "Shipments Due", "Status"];
  return (
    <Card title="Tier-1 Supplier Status" subtitle="47 active suppliers · showing flagged + recent" action="Full list →">
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c} style={{ textAlign: "left", padding: "0 10px 8px 0", fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'IBM Plex Mono', monospace", borderBottom: `1px solid ${T.border}`, fontWeight: 600 }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SUPPLIERS.map((s, i) => {
            const isDelayed = s.status === "delayed";
            const isRisk    = s.status === "at-risk";
            return (
              <tr key={s.id} style={{ background: isDelayed ? T.redBg : isRisk ? T.amberBg : "transparent" }}>
                <td style={{ padding: "9px 10px 9px 0", color: T.sub, fontFamily: "monospace", fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{s.id}</td>
                <td style={{ padding: "9px 10px 9px 0", color: T.text, fontWeight: isDelayed ? 700 : 400, borderBottom: `1px solid ${T.border}` }}>{s.name}</td>
                <td style={{ padding: "9px 10px 9px 0", color: T.sub, borderBottom: `1px solid ${T.border}` }}>{s.material}</td>
                <td style={{ padding: "9px 10px 9px 0", color: T.sub, borderBottom: `1px solid ${T.border}` }}>{s.region}</td>
                <td style={{ padding: "9px 10px 9px 0", fontFamily: "monospace", fontWeight: 700, color: s.otd < 80 ? T.red : s.otd < 90 ? T.amber : T.green, borderBottom: `1px solid ${T.border}` }}>{s.otd}%</td>
                <td style={{ padding: "9px 10px 9px 0", color: T.sub, borderBottom: `1px solid ${T.border}` }}>{s.shipments}</td>
                <td style={{ padding: "9px 0 9px 0", borderBottom: `1px solid ${T.border}` }}><Badge status={s.status} label={s.status === "on-time" ? "ON TIME" : s.status === "at-risk" ? "AT RISK" : "DELAYED"} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

/* ─── Cold chain table ───────────────────────────────────────────────── */
function ColdChainTable() {
  return (
    <Card title="Cold Chain — Active Routes" subtitle="23 refrigerated vehicles · 2 on watch" action="Map view →">
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {["Unit","Route","Temp (°C)","ETA","Status"].map(c => (
              <th key={c} style={{ textAlign: "left", padding: "0 10px 8px 0", fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'IBM Plex Mono', monospace", borderBottom: `1px solid ${T.border}`, fontWeight: 600 }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COLD_CHAIN.map(r => (
            <tr key={r.id} style={{ background: r.status === "watch" ? T.amberBg : "transparent" }}>
              <td style={{ padding: "9px 10px 9px 0", fontFamily: "monospace", color: T.primary, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{r.id}</td>
              <td style={{ padding: "9px 10px 9px 0", color: T.text, borderBottom: `1px solid ${T.border}` }}>{r.route}</td>
              <td style={{ padding: "9px 10px 9px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontFamily: "monospace", fontWeight: 700, color: r.temp > 3.5 ? T.amber : T.green }}>{r.temp.toFixed(1)}</span>
                <span style={{ fontSize: 10, color: T.muted }}> / 4.0 max</span>
              </td>
              <td style={{ padding: "9px 10px 9px 0", fontFamily: "monospace", color: T.sub, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{r.eta}</td>
              <td style={{ padding: "9px 0 9px 0", borderBottom: `1px solid ${T.border}` }}><Badge status={r.status} label={r.status === "nominal" ? "NOMINAL" : "WATCH"} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/* ─── Inventory bars ─────────────────────────────────────────────────── */
function InventoryPanel() {
  return (
    <Card title="Ingredient Cover" subtitle="Days of inventory on hand vs. safety stock minimum">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {INVENTORY.map(item => {
          const pct = Math.min((item.days / 30) * 100, 100);
          const minPct = (item.min / 30) * 100;
          const c = statusColor(item.status);
          return (
            <div key={item.material}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: T.text, fontWeight: item.status !== "ok" ? 700 : 400 }}>{item.material}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: c }}>{item.days}d</span>
                  <Badge status={item.status} label={item.status === "critical" ? "CRITICAL" : item.status === "low" ? "LOW" : "OK"} />
                </div>
              </div>
              <div style={{ height: 7, background: T.surface2, borderRadius: 4, position: "relative", border: `1px solid ${T.border}` }}>
                <div style={{ height: "100%", width: `${pct}%`, background: c, borderRadius: 4, transition: "width 0.4s" }} />
                <div style={{ position: "absolute", top: -2, left: `${minPct}%`, height: 11, width: 2, background: T.amber, borderRadius: 1 }} title="Safety min" />
              </div>
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 2, height: 12, background: T.amber, borderRadius: 1 }} />
            <span style={{ fontSize: 10, color: T.muted }}>Safety stock minimum</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Factory status ─────────────────────────────────────────────────── */
function FactoryPanel() {
  return (
    <Card title="Factory OEE — Today" subtitle="4 production sites">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {FACTORIES.map(f => {
          const c = f.oee >= 90 ? T.green : f.oee >= 80 ? T.amber : T.red;
          return (
            <div key={f.name} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "9px 12px", borderRadius: 6,
              background: f.status === "warning" ? T.amberBg : T.bg,
              border: `1px solid ${f.status === "warning" ? T.amber+"33" : T.border}`,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{f.name}</div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{f.running}/{f.lines} lines running</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: c, fontFamily: "monospace", lineHeight: 1 }}>{f.oee}%</div>
                <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>OEE</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ─── Throughput chart ───────────────────────────────────────────────── */
function ThroughputChart() {
  return (
    <Card title="KitKat Line Throughput — Today" subtitle="Factory Broc · 6 lines · units/hr">
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={THROUGHPUT} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="tpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={T.primary} stopOpacity={0.15} />
              <stop offset="95%" stopColor={T.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: T.muted, fontSize: 9 }} tickLine={false} />
          <YAxis domain={[11000, 14000]} tick={{ fill: T.muted, fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => (v/1000).toFixed(0)+"k"} />
          <Tooltip
            contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, color: T.text }}
            labelStyle={{ color: T.sub }}
            formatter={(v, n) => [v.toLocaleString() + " u/hr", n === "actual" ? "Actual" : "Target"]}
          />
          <ReferenceLine y={12500} stroke={T.amber} strokeDasharray="4 3" />
          <Area type="monotone" dataKey="actual" stroke={T.primary} strokeWidth={2} fill="url(#tpGrad)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* ─── OTD trend ──────────────────────────────────────────────────────── */
function OtdTrendChart() {
  return (
    <Card title="Network OTD — Rolling 14 Days" subtitle="All Tier-1 suppliers · avg on-time delivery %">
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={OTD_HISTORY} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
          <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: T.muted, fontSize: 9 }} tickLine={false} />
          <YAxis domain={[85, 100]} tick={{ fill: T.muted, fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => v + "%"} />
          <Tooltip
            contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, color: T.text }}
            labelStyle={{ color: T.sub }}
            formatter={(v) => [v + "%", "OTD Score"]}
          />
          <ReferenceLine y={90} stroke={T.amber} strokeDasharray="4 3" />
          <Line type="monotone" dataKey="score" stroke={T.green} strokeWidth={2} dot={{ r: 3, fill: T.green, stroke: T.surface, strokeWidth: 2 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* ─── Nav sidebar ────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { icon: "◉", label: "Overview",    active: true  },
  { icon: "↗", label: "Suppliers",   active: false },
  { icon: "❄", label: "Cold Chain",  active: false },
  { icon: "⬡", label: "Production",  active: false },
  { icon: "▦", label: "Inventory",   active: false },
  { icon: "⚡", label: "Alerts",      active: false },
  { icon: "↗", label: "Reports",     active: false },
];

/* ─── Root ───────────────────────────────────────────────────────────── */
export default function OperationalDashboard() {
  const now = useClock();
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif", background: T.bg }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 180, minWidth: 180, background: T.nav, display: "flex", flexDirection: "column" }}>
        {/* Logo */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #ffffff15" }}>
          <img src="/nestle-logo.svg" alt="Nestlé" style={{ width: 80, height: "auto", marginBottom: 8 }} />
          <div style={{ fontSize: 10, color: T.navText, lineHeight: 1.4 }}>Supply Chain<br/>Operations Centre</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px" }}>
          {NAV_ITEMS.map(item => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 6, marginBottom: 2,
              background: item.active ? "#ffffff18" : "transparent",
              borderLeft: item.active ? `3px solid ${T.nestle}` : "3px solid transparent",
              cursor: "pointer",
            }}>
              <span style={{ fontSize: 13, color: item.active ? "#fff" : T.navText }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: item.active ? T.navActive : T.navText, fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #ffffff15" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.nestle, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>SM</div>
          <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>Sarah Mueller</div>
          <div style={{ fontSize: 10, color: T.navText }}>Supply Chain Lead</div>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          background: T.surface, borderBottom: `1px solid ${T.border}`,
          padding: "12px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Operations Overview</span>
            <span style={{ fontSize: 12, color: T.muted, marginLeft: 12 }}>{dateStr}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              background: T.greenBg, border: `1px solid ${T.green}33`,
              borderRadius: 20, padding: "4px 12px",
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
              <span style={{ fontSize: 11, color: T.green, fontWeight: 700, fontFamily: "monospace" }}>LIVE</span>
              <span style={{ fontSize: 11, color: T.sub, fontFamily: "monospace" }}>{timeStr}</span>
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>
              Refreshed <strong style={{ color: T.text }}>2 min ago</strong> · next in 3 min
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "16px 20px 32px" }}>
          {/* KPI strip */}
          <KpiStrip />

          {/* Row 2: alerts + supplier table */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 14, marginTop: 14 }}>
            <AlertsPanel />
            <SupplierTable />
          </div>

          {/* Row 3: throughput + OTD trend + inventory + factory */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
            <ThroughputChart />
            <OtdTrendChart />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
            <InventoryPanel />
            <FactoryPanel />
          </div>

          {/* Row 4: cold chain */}
          <div style={{ marginTop: 14 }}>
            <ColdChainTable />
          </div>
        </div>
      </div>
    </div>
  );
}
