import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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

/* ─── Refresh cycle (5-min) ──────────────────────────────────────────── */
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

function useDataRefresh() {
  const [tick, setTick] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(() => new Date(Date.now() - 5 * 60 * 60 * 1000));
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      setLastRefresh(new Date());
    }, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return { tick, lastRefresh, isRefreshing };
}

/* ─── Animated value wrapper ─────────────────────────────────────────── */
function AnimVal({ children, tick }) {
  const [flash, setFlash] = useState(false);
  const prevTick = useRef(tick);
  useEffect(() => {
    if (tick !== prevTick.current) {
      setFlash(true);
      prevTick.current = tick;
      const id = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(id);
    }
  }, [tick]);
  return (
    <span style={{
      transition: "color 0.4s",
      color: flash ? "#3B9EFF" : "inherit",
    }}>{children}</span>
  );
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
  const base = [
    { material: "Cocoa",    base: 18, min: 14 },
    { material: "Palm Oil", base: 11, min: 10 },
    { material: "Sugar",    base: 24, min: 12 },
    { material: "Milk Pwd", base: 8,  min: 10 },
    { material: "Wheat",    base: 21, min: 12 },
    { material: "Hazelnuts",base: 15, min: 8  },
  ];
  return base.map(b => {
    const days = Math.max(1, b.base + Math.round((Math.random() - 0.5) * 4));
    const status = days <= b.min * 0.8 ? "critical" : days <= b.min ? "low" : "ok";
    return { material: b.material, days, min: b.min, status };
  });
}

function makeSuppliers() {
  const base = [
    { id:"S-01", name:"40178234",  material:"Cocoa",    region:"Côte d'Ivoire", baseOtd:94, shipments:3 },
    { id:"S-02", name:"40178509",  material:"Cocoa",    region:"Netherlands",   baseOtd:89, shipments:1 },
    { id:"S-03", name:"50234871",  material:"Palm Oil", region:"Singapore",     baseOtd:91, shipments:2 },
    { id:"S-04", name:"50234996",  material:"Sugar",    region:"Germany",       baseOtd:98, shipments:4 },
    { id:"S-05", name:"60391047",  material:"Milk Pwd", region:"New Zealand",   baseOtd:72, shipments:2 },
    { id:"S-06", name:"60391283",  material:"Wheat",    region:"Ukraine",       baseOtd:97, shipments:3 },
  ];
  return base.map(s => {
    const otd = Math.min(100, Math.max(50, s.baseOtd + Math.round((Math.random() - 0.5) * 6)));
    const status = otd < 80 ? "delayed" : otd < 90 ? "at-risk" : "on-time";
    return { ...s, otd, status };
  });
}

function makeColdChain() {
  const base = [
    { id:"TRK-441", route:"Lyon → Geneva",       baseTemp:2.9, eta:"14:30" },
    { id:"TRK-443", route:"Hamburg → Berlin",    baseTemp:3.4, eta:"15:10" },
    { id:"TRK-447", route:"Zürich → Milan",      baseTemp:3.8, eta:"16:45" },
    { id:"TRK-451", route:"Paris → Brussels",    baseTemp:2.1, eta:"13:55" },
    { id:"TRK-458", route:"Rotterdam → Cologne", baseTemp:3.7, eta:"14:20" },
  ];
  return base.map(r => {
    const temp = +(r.baseTemp + (Math.random() - 0.4) * 0.6).toFixed(1);
    const status = temp > 3.5 ? "watch" : "nominal";
    return { ...r, temp, status };
  });
}

function makeAlerts() {
  const now = new Date();
  const fmt = d => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return [
    { id:1, time: fmt(now),                       sev:"critical", msg:"Milk Pwd stock below safety threshold — cover remaining", category:"Inventory" },
    { id:2, time: fmt(new Date(now - 18*60000)), sev:"warning",  msg:"60391047 OTD dropped — shipments delayed",                 category:"Supplier"  },
    { id:3, time: fmt(new Date(now - 32*60000)), sev:"warning",  msg:"TRK-447 temp trending toward 4°C ceiling — monitor advised", category:"Cold Chain"},
    { id:4, time: fmt(new Date(now - 89*60000)), sev:"info",     msg:"Palm Oil inventory approaching reorder point",             category:"Inventory" },
    { id:5, time: fmt(new Date(now - 195*60000)),sev:"info",     msg:"50234996 delivery confirmed — shipments on schedule",      category:"Supplier"  },
  ];
}

/* ─── Alert action modal data ────────────────────────────────────────── */
const ACTION_MODAL_DATA = {
  Inventory: {
    heading: "Alternate Suppliers — Milk Powder",
    aiRec: "Activate 70482310 (France) — lowest lead time with adequate stock. Split remaining shortfall to 70482517 for cost efficiency.",
    aiConfidence: 94,
    actionLabel: "Activate Supplier",
    suppliers: [
      { name: "70482310",  region: "France",        leadTime: "3 days",  costPremium: "+4%",  availQty: "12 MT", aiScore: 96 },
      { name: "70482517",  region: "Netherlands",   leadTime: "4 days",  costPremium: "+2%",  availQty: "18 MT", aiScore: 91 },
      { name: "80193624",  region: "India",         leadTime: "8 days",  costPremium: "-5%",  availQty: "25 MT", aiScore: 78 },
      { name: "80193801",  region: "Canada",        leadTime: "7 days",  costPremium: "+7%",  availQty: "10 MT", aiScore: 72 },
      { name: "90274156",  region: "Denmark",       leadTime: "5 days",  costPremium: "+3%",  availQty: "14 MT", aiScore: 88 },
    ],
  },
  Supplier: {
    heading: "Response Actions — Supplier Delay",
    aiRec: "Expedite current 60391047 shipment via air freight — estimated delivery improves from 12 days to 4 days at +$8,200 cost.",
    aiConfidence: 87,
    actionLabel: "Execute Action",
    actions: [
      { icon: "✈", label: "Expedite Shipment",   desc: "Switch to air freight for pending orders. Reduces lead time by 60%.", tag: "+$8.2K" },
      { icon: "🔄", label: "Switch to Alternate", desc: "Reroute demand to next-best qualified supplier (70482310).",         tag: "2-day setup" },
      { icon: "✂", label: "Split Order",          desc: "Distribute remaining PO across 2 backup suppliers to reduce risk.",  tag: "Balanced" },
    ],
  },
  "Cold Chain": {
    heading: "Cold Chain Intervention",
    aiRec: "Reroute TRK-447 to Zürich hub — current trajectory breaches 4°C ceiling within 45 min. Backup reefer available at hub.",
    aiConfidence: 91,
    actionLabel: "Execute Action",
    actions: [
      { icon: "📍", label: "Reroute to Nearest Hub", desc: "Divert vehicle to Zürich cold-storage hub (18 km). ETA 22 min.",    tag: "Fastest" },
      { icon: "🚛", label: "Dispatch Backup Reefer",  desc: "Send replacement reefer from Milan depot. Swap cargo on-route.",    tag: "45 min" },
      { icon: "📞", label: "Alert Receiver",           desc: "Notify receiving warehouse of potential temp exceedance on arrival.", tag: "Inform" },
    ],
  },
};

function makeFactories() {
  const base = [
    { name:"Broc (CH)",         lines:6, baseOee:93, running:6 },
    { name:"Hamburg (DE)",      lines:4, baseOee:87, running:4 },
    { name:"York (GB)",         lines:5, baseOee:78, running:4 },
    { name:"Biessenhofen (DE)", lines:3, baseOee:95, running:3 },
  ];
  return base.map(f => {
    const oee = Math.min(100, Math.max(60, f.baseOee + Math.round((Math.random() - 0.5) * 6)));
    const status = oee < 80 ? "warning" : "ok";
    return { ...f, oee, status };
  });
}

function makeKpis(inv, suppliers, coldChain, factories) {
  const avgOtd = (suppliers.reduce((s, x) => s + x.otd, 0) / suppliers.length).toFixed(1);
  const riskSkus = inv.filter(i => i.status !== "ok").length;
  const watchVehicles = coldChain.filter(c => c.status === "watch").length;
  const totalLines = factories.reduce((s, f) => s + f.lines, 0);
  const runningLines = factories.reduce((s, f) => s + f.running, 0);
  const avgThroughput = (12200 + Math.round(Math.random() * 300)).toLocaleString();
  return [
    { label: "On-Time Delivery", value: avgOtd + "%", delta: "vs 90% target",   status: +avgOtd >= 90 ? "ok" : "warning" },
    { label: "Lines Running",    value: `${runningLines}/${totalLines}`, delta: `${totalLines - runningLines} stopped`, status: runningLines < totalLines ? "warning" : "ok" },
    { label: "Alerts Open",      value: "5",      delta: "2 new today",    status: "warning" },
    { label: "Cold Chain OK",    value: `${coldChain.length - watchVehicles}/${coldChain.length}`, delta: `${watchVehicles} on watch`, status: watchVehicles > 0 ? "watch" : "ok" },
    { label: "Inventory Risk",   value: `${riskSkus} SKU${riskSkus !== 1 ? "s" : ""}`, delta: inv.filter(i => i.status !== "ok").map(i => i.material).join(", ") || "—", status: riskSkus > 0 ? "critical" : "ok" },
    { label: "Throughput",       value: avgThroughput, delta: "units/hr avg",  status: "ok" },
  ];
}

/* ─── Central data hook — regenerates every tick ────────────────────── */
function useDashboardData(tick) {
  const [data, setData] = useState(() => generateAll());

  function generateAll() {
    const throughput = makeThroughput();
    const otdHistory = makeOtdHistory();
    const inventory  = makeInventoryDays();
    const suppliers  = makeSuppliers();
    const coldChain  = makeColdChain();
    const alerts     = makeAlerts();
    const factories  = makeFactories();
    const kpis       = makeKpis(inventory, suppliers, coldChain, factories);
    return { throughput, otdHistory, inventory, suppliers, coldChain, alerts, factories, kpis };
  }

  useEffect(() => {
    setData(generateAll());
  }, [tick]);

  return data;
}

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
function KpiStrip({ kpis, tick }) {
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
            transition: "border-color 0.5s",
          }}>
            <div style={{ fontSize: 10, color: T.sub, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.text, lineHeight: 1, fontFamily: "'IBM Plex Sans', sans-serif" }}><AnimVal tick={tick}>{k.value}</AnimVal></div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>{k.delta}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Alerts panel ───────────────────────────────────────────────────── */
function AlertsPanel({ alerts, onAct, accelOn }) {
  const [filter, setFilter] = useState("All");
  const [criticalArrived, setCriticalArrived] = useState(false);
  const justArrived = useRef(false);

  useEffect(() => {
    if (!accelOn) { setCriticalArrived(false); return; }
    const id = setTimeout(() => {
      justArrived.current = true;
      setCriticalArrived(true);
      setTimeout(() => { justArrived.current = false; }, 1200);
    }, 2500);
    return () => clearTimeout(id);
  }, [accelOn]);

  const cats = ["All", "Supplier", "Inventory", "Cold Chain"];
  const displayAlerts = criticalArrived ? alerts : alerts.filter(a => a.id !== 1);
  const visible = filter === "All" ? displayAlerts : displayAlerts.filter(a => a.category === filter);
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
            ...(a.id === 1 && criticalArrived ? { animation: "alertSlideIn 0.4s ease-out" } : {}),
          }}>
            <span style={{ fontSize: 12, marginTop: 1 }}>{sevIcon[a.sev]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: T.text, lineHeight: 1.45 }}>{a.msg}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 10, color: T.muted, fontFamily: "monospace" }}>{a.id === 1 ? "Just now" : a.time}</span>
                <Badge status={a.sev === "critical" ? "critical" : a.sev === "warning" ? "warning" : "ok"} label={a.category} />
              </div>
            </div>
            <span onClick={() => onAct && onAct(a)} style={{ fontSize: 11, color: T.primary, cursor: "pointer", whiteSpace: "nowrap", fontWeight: 600 }}>Act →</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Supplier table ─────────────────────────────────────────────────── */
function SupplierTable({ suppliers }) {
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
          {suppliers.map((s, i) => {
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
function ColdChainTable({ coldChain }) {
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
          {coldChain.map(r => (
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
function InventoryPanel({ inventory }) {
  return (
    <Card title="Ingredient Cover" subtitle="Days of inventory on hand vs. safety stock minimum">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {inventory.map(item => {
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
function FactoryPanel({ factories }) {
  return (
    <Card title="Factory OEE — Today" subtitle="4 production sites">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {factories.map(f => {
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
function ThroughputChart({ throughput }) {
  return (
    <Card title="KitKat Line Throughput — Today" subtitle="Factory Broc · 6 lines · units/hr">
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={throughput} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
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
function OtdTrendChart({ otdHistory }) {
  return (
    <Card title="Network OTD — Rolling 14 Days" subtitle="All Tier-1 suppliers · avg on-time delivery %">
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={otdHistory} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
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

/* ─── Action Modal ──────────────────────────────────────────────────── */
function ActionModal({ alert, onClose, onDismiss }) {
  const [selected, setSelected] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | confirming | success

  const modalData = ACTION_MODAL_DATA[alert.category];
  if (!modalData) return null;

  const isSupplierTable = !!modalData.suppliers;

  // Keyboard: Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleAction = () => {
    if (phase !== "idle") return;
    setPhase("confirming");
    setTimeout(() => {
      setPhase("success");
      if (onDismiss) onDismiss(alert.id);
      setTimeout(() => onClose(), 1500);
    }, 800);
  };

  const sevColor = alert.sev === "critical" ? T.red : alert.sev === "warning" ? T.amber : T.primary;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "modalBackdropIn 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 14, width: "100%", maxWidth: 640,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          animation: "modalFadeIn 0.25s ease-out",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", marginTop: 5,
            background: sevColor, boxShadow: `0 0 8px ${sevColor}`,
            flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.4 }}>{alert.msg}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Badge status={alert.sev === "critical" ? "critical" : alert.sev === "warning" ? "warning" : "ok"} label={alert.category} />
              <span style={{ fontSize: 10, color: T.muted, fontFamily: "monospace" }}>{alert.time}</span>
            </div>
          </div>
          <span
            onClick={onClose}
            style={{
              fontSize: 18, color: T.muted, cursor: "pointer", lineHeight: 1,
              padding: "2px 6px", borderRadius: 4,
            }}
          >✕</span>
        </div>

        {/* AI Recommendation */}
        <div style={{
          margin: "16px 20px 0", padding: "12px 16px",
          background: `${T.primary}12`, border: `1px solid ${T.primary}33`,
          borderRadius: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: 1.2, color: T.primary,
              fontFamily: "'IBM Plex Mono', monospace",
            }}>AI RECOMMENDATION</span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: T.primary,
              background: `${T.primary}22`, borderRadius: 10, padding: "1px 8px",
              fontFamily: "monospace",
            }}>{modalData.aiConfidence}% confidence</span>
          </div>
          <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{modalData.aiRec}</div>
        </div>

        {/* Content area */}
        <div style={{ padding: "16px 20px" }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 10,
            textTransform: "uppercase", letterSpacing: 0.8,
            fontFamily: "'IBM Plex Mono', monospace",
          }}>{modalData.heading}</div>

          {isSupplierTable ? (
            /* Supplier selection table */
            <div style={{ borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {["", "Supplier", "Region", "Lead Time", "Cost", "Avail.", "AI Score"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "8px 10px", fontSize: 9,
                        color: T.muted, textTransform: "uppercase", letterSpacing: 1,
                        fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
                        borderBottom: `1px solid ${T.border}`,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modalData.suppliers.map((s, i) => {
                    const isSelected = selected === i;
                    return (
                      <tr
                        key={s.name}
                        onClick={() => setSelected(i)}
                        style={{
                          cursor: "pointer",
                          background: isSelected ? `${T.primary}15` : "transparent",
                          transition: "background 0.15s",
                        }}
                      >
                        <td style={{ padding: "9px 10px", borderBottom: `1px solid ${T.border}`, width: 30 }}>
                          <div style={{
                            width: 16, height: 16, borderRadius: "50%",
                            border: `2px solid ${isSelected ? T.primary : T.muted}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "border-color 0.15s",
                          }}>
                            {isSelected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.primary }} />}
                          </div>
                        </td>
                        <td style={{ padding: "9px 10px", color: T.text, fontWeight: isSelected ? 700 : 400, borderBottom: `1px solid ${T.border}` }}>{s.name}</td>
                        <td style={{ padding: "9px 10px", color: T.sub, borderBottom: `1px solid ${T.border}` }}>{s.region}</td>
                        <td style={{ padding: "9px 10px", color: T.sub, fontFamily: "monospace", borderBottom: `1px solid ${T.border}` }}>{s.leadTime}</td>
                        <td style={{ padding: "9px 10px", color: s.costPremium.startsWith("-") ? T.green : T.amber, fontFamily: "monospace", fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{s.costPremium}</td>
                        <td style={{ padding: "9px 10px", color: T.sub, fontFamily: "monospace", borderBottom: `1px solid ${T.border}` }}>{s.availQty}</td>
                        <td style={{ padding: "9px 10px", borderBottom: `1px solid ${T.border}` }}>
                          <span style={{
                            fontFamily: "monospace", fontWeight: 700, fontSize: 12,
                            color: s.aiScore >= 90 ? T.green : s.aiScore >= 80 ? T.amber : T.sub,
                          }}>{s.aiScore}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Action cards */
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {modalData.actions.map((a, i) => {
                const isSelected = selected === i;
                return (
                  <div
                    key={a.label}
                    onClick={() => setSelected(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 8, cursor: "pointer",
                      border: `1.5px solid ${isSelected ? T.primary : T.border}`,
                      background: isSelected ? `${T.primary}12` : T.bg,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{a.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{a.label}</div>
                      <div style={{ fontSize: 11, color: T.sub, marginTop: 2, lineHeight: 1.4 }}>{a.desc}</div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: T.primary,
                      background: `${T.primary}18`, borderRadius: 6, padding: "3px 10px",
                      fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap",
                    }}>{a.tag}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 20px", borderTop: `1px solid ${T.border}`,
          display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14,
        }}>
          {phase === "success" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18, color: T.green }}>✓</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>Action confirmed</span>
            </div>
          ) : (
            <>
              <span
                onClick={onClose}
                style={{ fontSize: 12, color: T.muted, cursor: "pointer", padding: "6px 4px" }}
              >Cancel</span>
              <button
                onClick={handleAction}
                disabled={phase === "confirming"}
                style={{
                  background: phase === "confirming" ? T.muted : T.primary,
                  color: "#fff", border: "none", borderRadius: 8,
                  padding: "9px 22px", fontSize: 12, fontWeight: 700,
                  cursor: phase === "confirming" ? "wait" : "pointer",
                  transition: "background 0.2s",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                {phase === "confirming" ? "Processing…" : modalData.actionLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Root ───────────────────────────────────────────────────────────── */
/* ─── Refresh timer display ─────────────────────────────────────────── */
function RefreshTimer({ lastRefresh, isRefreshing, now }) {
  const elapsed = Math.floor((now - lastRefresh) / 1000);
  const elapsedHrs = Math.floor(elapsed / 3600);
  const elapsedMin = Math.floor((elapsed % 3600) / 60);
  const elapsedSec = elapsed % 60;
  const remaining = Math.max(0, 5 * 60 - (elapsed % (5 * 60)));
  const remainingMin = Math.floor(remaining / 60);
  const remainingSec = remaining % 60;
  const progress = Math.min((elapsed % (5 * 60)) / (5 * 60), 1);

  const agoStr = elapsedHrs > 0
    ? `${elapsedHrs}h ${elapsedMin}m ago`
    : elapsedMin > 0
      ? `${elapsedMin}m ${elapsedSec}s ago`
      : `${elapsedSec}s ago`;
  const nextStr = remaining > 0
    ? `${remainingMin}m ${remainingSec}s`
    : "now";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {isRefreshing && (
        <span style={{
          fontSize: 10, color: T.primary, fontWeight: 700,
          animation: "pulse 0.8s ease-in-out infinite",
        }}>REFRESHING…</span>
      )}
      <div style={{ fontSize: 11, color: T.muted }}>
        Refreshed <strong style={{ color: T.text }}>{agoStr}</strong> · next in {nextStr}
      </div>
      {/* Mini progress bar */}
      <div style={{ width: 60, height: 3, background: T.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${progress * 100}%`,
          background: progress > 0.9 ? T.amber : T.primary,
          borderRadius: 2, transition: "width 1s linear",
        }} />
      </div>
    </div>
  );
}

/* ─── Toggle switch ─────────────────────────────────────────────────── */
function ToggleSwitch({ on, onToggle, label, accentColor }) {
  const c = accentColor || T.primary;
  return (
    <div
      onClick={onToggle}
      style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
    >
      <div style={{
        width: 34, height: 18, borderRadius: 9, position: "relative",
        background: on ? c : "#2A3347",
        transition: "background 0.25s",
        boxShadow: on ? `0 0 8px ${c}55` : "none",
      }}>
        <div style={{
          position: "absolute", top: 2, left: on ? 18 : 2,
          width: 14, height: 14, borderRadius: "50%",
          background: on ? "#fff" : "#7A95B0",
          transition: "left 0.25s, background 0.25s",
        }} />
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 1,
        fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase",
        color: on ? c : T.muted, transition: "color 0.25s",
      }}>{label}</span>
    </div>
  );
}

/* ─── Accelerated-time helper ───────────────────────────────────────── */
const ACCEL_SIM_STEP = 5 * 60 * 1000;   // 5 simulated minutes per tick
const ACCEL_TICK_MS  = 2000;             // tick every 2 real seconds

function generateAllData() {
  const throughput = makeThroughput();
  const otdHistory = makeOtdHistory();
  const inventory  = makeInventoryDays();
  const suppliers  = makeSuppliers();
  const coldChain  = makeColdChain();
  const alerts     = makeAlerts();
  const factories  = makeFactories();
  const kpis       = makeKpis(inventory, suppliers, coldChain, factories);
  return { throughput, otdHistory, inventory, suppliers, coldChain, alerts, factories, kpis };
}

/* ─── Dashboard (accepts optional simulated time + data) ────────────── */
function Dashboard({ simTime, overrideData, overrideTick, frozen }) {
  const realNow = useClock();
  const { tick: autoTick, lastRefresh: autoLast, isRefreshing: autoRefreshing } = useDataRefresh();
  const autoData = useDashboardData(frozen ? 0 : (overrideTick ?? autoTick));

  // ── Action modal ──
  const [actionAlert, setActionAlert] = useState(null);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  // ── Accelerated time mode (toggle) ──
  const [accelOn, setAccelOn] = useState(false);
  const [accelTick, setAccelTick] = useState(0);
  const [accelTime, setAccelTime] = useState(() => new Date());
  const [accelData, setAccelData] = useState(null);

  // Reset simulated time when toggled on
  const handleToggle = useCallback(() => {
    setAccelOn(prev => {
      if (!prev) {
        // Turning ON — seed from now
        setAccelTime(new Date());
        setAccelTick(0);
        setAccelData(generateAllData());
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (!accelOn) return;
    const id = setInterval(() => {
      setAccelTime(prev => new Date(prev.getTime() + ACCEL_SIM_STEP));
      setAccelTick(t => t + 1);
      setAccelData(generateAllData());
    }, ACCEL_TICK_MS);
    return () => clearInterval(id);
  }, [accelOn]);

  // Decide which source of truth to use
  const useAccel = accelOn && !frozen && !overrideData;
  const now = simTime || (useAccel ? accelTime : realNow);
  const data = overrideData || (useAccel ? accelData : autoData);
  const tick = overrideTick ?? (useAccel ? accelTick : autoTick);
  const isRefreshing = frozen ? false : (!useAccel && autoRefreshing);
  const lastRefresh = frozen ? now : (useAccel ? accelTime : autoLast);

  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif", background: T.bg,
      /* no full-screen flash — individual values animate instead */
    }}>

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
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Accelerated-time toggle (hidden when used inside DemoView) */}
            {!frozen && !overrideData && (
              <ToggleSwitch on={accelOn} onToggle={handleToggle} label="GPU Acceleration" accentColor="#76B900" />
            )}

            {/* Status pill */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              background: useAccel ? "#3B9EFF18" : T.greenBg,
              border: `1px solid ${useAccel ? T.primary + "44" : T.green + "33"}`,
              borderRadius: 20, padding: "4px 12px",
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: useAccel ? T.primary : T.green,
                boxShadow: `0 0 6px ${useAccel ? T.primary : T.green}`,
              }} />
              <span style={{
                fontSize: 11, fontWeight: 700, fontFamily: "monospace",
                color: useAccel ? T.primary : T.green,
              }}>{useAccel ? "ACCEL" : "LIVE"}</span>
              <span style={{ fontSize: 11, color: T.sub, fontFamily: "monospace" }}>{timeStr}</span>
              {useAccel && (
                <span style={{ fontSize: 10, color: T.muted, fontFamily: "monospace" }}>
                  · 5m/{ACCEL_TICK_MS / 1000}s
                </span>
              )}
            </div>

            {!useAccel && <RefreshTimer lastRefresh={lastRefresh} isRefreshing={isRefreshing} now={now} />}
            {useAccel && (
              <span style={{ fontSize: 11, color: T.muted, fontFamily: "monospace" }}>
                {accelTick} refreshes
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "16px 20px 32px" }}>
          {/* KPI strip */}
          <KpiStrip kpis={data.kpis} tick={tick} />

          {/* Row 2: alerts + supplier table */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 14, marginTop: 14 }}>
            <AlertsPanel alerts={data.alerts.filter(a => !dismissedAlerts.has(a.id))} onAct={setActionAlert} accelOn={accelOn} />
            <SupplierTable suppliers={data.suppliers} />
          </div>

          {/* Row 3: throughput + OTD trend + inventory + factory */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
            <ThroughputChart throughput={data.throughput} />
            <OtdTrendChart otdHistory={data.otdHistory} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
            <InventoryPanel inventory={data.inventory} />
            <FactoryPanel factories={data.factories} />
          </div>

          {/* Row 4: cold chain */}
          <div style={{ marginTop: 14 }}>
            <ColdChainTable coldChain={data.coldChain} />
          </div>
        </div>
      </div>

      {/* Action modal */}
      {actionAlert && <ActionModal alert={actionAlert} onClose={() => setActionAlert(null)} onDismiss={(id) => setDismissedAlerts(prev => new Set(prev).add(id))} />}
    </div>
  );
}

/* ─── Demo mode: side-by-side with accelerated time ─────────────────── */
function DemoView() {
  const FIVE_HOURS = 5 * 60 * 60 * 1000;
  const SIM_STEP   = 5 * 60 * 1000;       // each tick = 5 simulated minutes
  const TICK_MS    = 2000;                 // tick every 2 real seconds

  // Frozen left-side data (generated once)
  const [frozenData] = useState(() => {
    const throughput = makeThroughput();
    const otdHistory = makeOtdHistory();
    const inventory  = makeInventoryDays();
    const suppliers  = makeSuppliers();
    const coldChain  = makeColdChain();
    const alerts     = makeAlerts();
    const factories  = makeFactories();
    const kpis       = makeKpis(inventory, suppliers, coldChain, factories);
    return { throughput, otdHistory, inventory, suppliers, coldChain, alerts, factories, kpis };
  });

  const frozenTime = useRef(new Date(Date.now() - FIVE_HOURS));

  // Accelerated right side
  const [simTick, setSimTick] = useState(0);
  const [simTime, setSimTime] = useState(() => new Date(Date.now() - FIVE_HOURS));
  const [liveData, setLiveData] = useState(() => {
    const throughput = makeThroughput();
    const otdHistory = makeOtdHistory();
    const inventory  = makeInventoryDays();
    const suppliers  = makeSuppliers();
    const coldChain  = makeColdChain();
    const alerts     = makeAlerts();
    const factories  = makeFactories();
    const kpis       = makeKpis(inventory, suppliers, coldChain, factories);
    return { throughput, otdHistory, inventory, suppliers, coldChain, alerts, factories, kpis };
  });
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setIsFlashing(true);
      setTimeout(() => {
        setSimTime(prev => new Date(prev.getTime() + SIM_STEP));
        setSimTick(t => t + 1);
        // Regenerate data
        const throughput = makeThroughput();
        const otdHistory = makeOtdHistory();
        const inventory  = makeInventoryDays();
        const suppliers  = makeSuppliers();
        const coldChain  = makeColdChain();
        const alerts     = makeAlerts();
        const factories  = makeFactories();
        const kpis       = makeKpis(inventory, suppliers, coldChain, factories);
        setLiveData({ throughput, otdHistory, inventory, suppliers, coldChain, alerts, factories, kpis });
        setIsFlashing(false);
      }, 300);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // How many simulated minutes have elapsed
  const simElapsed = simTick * 5;
  const simHrs = Math.floor(simElapsed / 60);
  const simMins = simElapsed % 60;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#000", overflow: "hidden" }}>
      {/* Top banner */}
      <div style={{
        padding: "10px 24px", background: "#0B0F1A",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid #2A3347", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src="/nestle-logo.svg" alt="Nestlé" style={{ width: 50, height: "auto" }} />
          <span style={{ color: "#E2EAF4", fontSize: 16, fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Supply Chain Operations — Live Data Demo
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ color: "#7A95B0", fontSize: 12, fontFamily: "monospace" }}>
            Simulated: +{simHrs}h {simMins}m elapsed ({simTick} refreshes)
          </span>
          <span style={{ color: "#FBBF24", fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>
            5 min / 2 sec
          </span>
        </div>
      </div>

      {/* Side by side dashboards */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: frozen */}
        <div style={{ flex: 1, position: "relative", borderRight: "2px solid #2A3347", overflow: "hidden" }}>
          <div style={{
            position: "absolute", top: 0, left: 0, zIndex: 10,
            width: "100%", padding: "6px 0", textAlign: "center",
            background: "linear-gradient(180deg, rgba(42,51,71,0.95) 0%, rgba(42,51,71,0) 100%)",
          }}>
            <span style={{
              color: "#7A95B0", fontSize: 11, fontWeight: 700, letterSpacing: 2,
              fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase",
            }}>⏸ Snapshot — 5 Hours Ago</span>
          </div>
          <div style={{
            transform: "scale(0.52)", transformOrigin: "top left",
            width: "192%", height: "192%", opacity: 0.6,
            filter: "saturate(0.5)",
          }}>
            <Dashboard simTime={frozenTime.current} overrideData={frozenData} overrideTick={0} frozen />
          </div>
        </div>

        {/* Right: accelerated live */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <div style={{
            position: "absolute", top: 0, left: 0, zIndex: 10,
            width: "100%", padding: "6px 0", textAlign: "center",
            background: "linear-gradient(180deg, rgba(14,17,23,0.95) 0%, rgba(14,17,23,0) 100%)",
          }}>
            <span style={{
              color: T.green, fontSize: 11, fontWeight: 700, letterSpacing: 2,
              fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase",
            }}>▶ Live — Accelerated Refresh</span>
          </div>
          <div style={{
            transform: "scale(0.52)", transformOrigin: "top left",
            width: "192%", height: "192%",
            /* no full-panel flash */
          }}>
            <Dashboard simTime={simTime} overrideData={liveData} overrideTick={simTick} frozen />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Route: ?demo → split view, otherwise normal ──────────────────── */
export default function OperationalDashboard() {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(new URLSearchParams(window.location.search).has("demo"));

    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      @keyframes alertSlideIn { from { opacity:0; transform:translateY(-10px); max-height:0; } to { opacity:1; transform:translateY(0); max-height:120px; } }
      @keyframes modalFadeIn { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      @keyframes modalBackdropIn { from { opacity:0; } to { opacity:1; } }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return isDemo ? <DemoView /> : <Dashboard />;
}
