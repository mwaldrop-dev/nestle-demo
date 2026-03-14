import { useState, useEffect, createContext, useContext } from "react";
import {
  ComposedChart, BarChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

/* ─── Theme definitions ───────────────────────────────────────────── */
const DARK = {
  bg:"#0B0E14",surface:"#141821",surface2:"#111520",border:"#1F2533",borderDark:"#2A3145",
  nav:"#111520",navText:"#8B95A8",navActive:"#60A5FA",navActiveBg:"#1A2540",navBorder:"#3B82F6",
  headerBg:"#070A10",headerText:"#FFFFFF",headerTab:"#64748B",headerTabAct:"#F1F5F9",
  primary:"#3B82F6",primaryLight:"#172554",red:"#F87171",amber:"#FBBF24",green:"#34D399",
  teal:"#2DD4BF",pink:"#F472B6",
  barBlue:"#60A5FA",barRed:"#F87171",lineOrange:"#FB923C",
  pieCoral:"#F87171",pieBlue:"#60A5FA",pieYellow:"#FBBF24",pieGreen:"#34D399",pieRed:"#EF4444",piePurple:"#A78BFA",piePink:"#F472B6",pieTeal:"#2DD4BF",
  text:"#E2E8F0",sub:"#94A3B8",muted:"#64748B",nestle:"#E8002A",
  toggleBg:"#1E293B",toggleKnob:"#F1F5F9",toggleIcon:"☀️",
};
const LIGHT = {
  bg:"#F5F6FA",surface:"#FFFFFF",surface2:"#F0F1F5",border:"#E0E3EB",borderDark:"#CBD0DC",
  nav:"#FFFFFF",navText:"#6B7280",navActive:"#1D4ED8",navActiveBg:"#EFF6FF",navBorder:"#2563EB",
  headerBg:"#1E293B",headerText:"#FFFFFF",headerTab:"#94A3B8",headerTabAct:"#FFFFFF",
  primary:"#2563EB",primaryLight:"#DBEAFE",red:"#EF4444",amber:"#F59E0B",green:"#10B981",
  teal:"#0D9488",pink:"#EC4899",
  barBlue:"#3B82F6",barRed:"#EF4444",lineOrange:"#F97316",
  pieCoral:"#F87171",pieBlue:"#3B82F6",pieYellow:"#FBBF24",pieGreen:"#10B981",pieRed:"#DC2626",piePurple:"#8B5CF6",piePink:"#EC4899",pieTeal:"#0D9488",
  text:"#111827",sub:"#6B7280",muted:"#9CA3AF",nestle:"#E8002A",
  toggleBg:"#CBD5E1",toggleKnob:"#1E293B",toggleIcon:"🌙",
};
const ThemeCtx = createContext(DARK);
const useT = () => useContext(ThemeCtx);
const F = "'IBM Plex Sans', sans-serif";

/* ─── Number obfuscation helper ──────────────────────────────────── */
const obf = (v) => {
  if (v == null) return v;
  return String(v).replace(/\d/g, "\u2022");
};
const Obf = ({ children }) => <span style={{ userSelect: "none" }}>{obf(children)}</span>;

/* ─── Shared navigation data ──────────────────────────────────────── */
const MAIN_TABS = ["Executive Summary","Order to Delivery","Delivery to Billing","Billing to POD","Admin","Historical Alert"];
const SUB_TABS = ["Overview","Order to Delivery","Delivery to Billing","Billing to POD"];
const SIDEBAR_ITEMS = [
  "Admin Page","Overview","Order to Delivery","Delivery to Billing","Billing to POD",
  "Order to Delivery Deep Dive","Delivery to Billing Deep Dive","Billing to POD Deep Dive",
  "History Alerts - OTD","History Alerts - DTB","History Alerts - BTP",
];
const VIEW_BY_OPTIONS = ["Count","PUM","Value","Weight"];

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 1 — Executive Summary Overview
   ═══════════════════════════════════════════════════════════════════ */
const EXEC_COUNT_DATA = [
  { plant: "1184_BR DC CORDEIROPOLIS", totalOrders: 1434, riskyOrders: 700 },
];
const EXEC_RISK_BUCKETS = [
  { bucket: "40-60", orders: 34, color: "amber" },
  { bucket: "60-80", orders: 131, color: "piePink" },
  { bucket: "80-100", orders: 535, color: "red" },
];
const EXEC_TIMELINE_DATA = [
  { period: "Today", orders: 700 },
  { period: "Next Day", orders: 88 },
  { period: "Beyond Next Day", orders: 244 },
];

function ExecSummaryOverview({ viewBy, onViewBy }) {
  const t = useT();
  const card = { border: `1px solid ${t.borderDark}`, borderRadius: 6, background: t.surface, padding: 16, fontFamily: F };
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
      <DateControlsBar />
      <ViewByToggle active={viewBy} onSelect={onViewBy} />
      <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 14 }}>Order to Delivery</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Count of Orders */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 6 }}>Count Of Orders</div>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: t.sub, marginBottom: 6 }}>
            <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: t.barBlue, marginRight: 4 }} />Total Orders</span>
            <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: t.pieCoral, marginRight: 4 }} />Risky Orders</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={EXEC_COUNT_DATA} margin={{ top: 20, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="plant" tick={{ fill: t.sub, fontSize: 9 }} />
              <YAxis tick={{ fill: t.sub, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => obf(v)} label={{ value: "Orders", angle: -90, position: "insideLeft", style: { fill: t.sub, fontSize: 11 } }} />
              <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, fontSize: 12, color: t.text }} formatter={v => obf(v)} />
              <Bar dataKey="totalOrders" fill={t.barBlue} radius={[2,2,0,0]} barSize={50} label={{ position: "top", fill: t.text, fontSize: 11, fontWeight: 700, formatter: v => obf(v) }} />
              <Bar dataKey="riskyOrders" fill={t.pieCoral} radius={[2,2,0,0]} barSize={50} label={{ position: "top", fill: t.red, fontSize: 11, formatter: v => obf(v) }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Risk Distribution of Open Orders */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 10 }}>Risk Distribution of Open Orders</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={EXEC_RISK_BUCKETS} margin={{ top: 20, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="bucket" tick={{ fill: t.sub, fontSize: 10 }} label={{ value: "Risk Buckets", position: "insideBottom", offset: -2, style: { fill: t.sub, fontSize: 11 } }} />
              <YAxis tick={{ fill: t.sub, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => obf(v)} label={{ value: "Orders", angle: -90, position: "insideLeft", style: { fill: t.sub, fontSize: 11 } }} />
              <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, fontSize: 12, color: t.text }} formatter={v => obf(v)} />
              <Bar dataKey="orders" radius={[2,2,0,0]} barSize={60} label={{ position: "top", fill: t.text, fontSize: 11, fontWeight: 700, formatter: v => obf(v) }}>
                {EXEC_RISK_BUCKETS.map((e, i) => <Cell key={i} fill={t[e.color]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Risk distribution by Timeline */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 10 }}>Risk distribution by Timeline</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={EXEC_TIMELINE_DATA} margin={{ top: 20, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="period" tick={{ fill: t.sub, fontSize: 10 }} />
            <YAxis tick={{ fill: t.sub, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => obf(v)} label={{ value: "Orders", angle: -90, position: "insideLeft", style: { fill: t.sub, fontSize: 11 } }} />
            <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, fontSize: 12, color: t.text }} formatter={v => obf(v)} />
            <Bar dataKey="orders" fill={t.barBlue} radius={[2,2,0,0]} barSize={80} label={{ position: "top", fill: t.text, fontSize: 11, fontWeight: 700, formatter: v => obf(v) }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 2 — OTD Overview (Order to Delivery main tab > Overview)
   ═══════════════════════════════════════════════════════════════════ */
const OTD_OV_DELAY = [
  { label: "Previous Day", value: 752 },
  { label: "Today", value: 700 },
  { label: "Next Day", value: 88 },
  { label: "Beyond Next Day", value: 244 },
];
const OTD_OV_PIE = [
  { name: "Expected Order Delay", value: 33.29, colorKey: "pieCoral" },
  { name: "Orders on Time", value: 66.71, colorKey: "pieTeal" },
];

function OtdOverviewScreen({ viewBy, onViewBy }) {
  const t = useT();
  const card = { border: `1px solid ${t.borderDark}`, borderRadius: 6, background: t.surface, padding: 16, fontFamily: F };
  const pieData = OTD_OV_PIE.map(d => ({ ...d, color: t[d.colorKey] }));
  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, outerRadius, name, value }) => {
    const r = outerRadius + 30;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (<text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central"
      style={{ fontSize: 12, fill: t.text, fontFamily: F }}>{name} {obf(value)}%</text>);
  };
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
      <DateControlsBar />
      <ViewByToggle active={viewBy} onSelect={onViewBy} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Left column: Risky Orders KPI + Expected Order Delay */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 10 }}>Risky Orders</div>
            <div style={{ display: "flex", gap: 16 }}>
              {[{ l: "Count of orders", v: "1,784" },{ l: "Net Weight", v: "3M" },{ l: "Net Value", v: "105M" },{ l: "Volume", v: "9,897" },{ l: "PUM", v: "513K" }].map(m => (
                <div key={m.l}><div style={{ fontSize: 10, color: t.sub, marginBottom: 2 }}>{m.l}</div><div style={{ fontSize: 18, fontWeight: 800, color: t.text }}><Obf>{m.v}</Obf></div></div>
              ))}
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 12 }}>Expected Order Delay</div>
            {OTD_OV_DELAY.map(d => (
              <div key={d.label} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                <div style={{ flex: 1, padding: "8px 12px", background: t.border, borderRadius: 4, fontSize: 13, color: t.text, textAlign: "center" }}>{d.label}</div>
                <div style={{ flex: 1, padding: "8px 12px", background: t.border, borderRadius: 4, fontSize: 16, fontWeight: 700, color: t.text, textAlign: "center", marginLeft: 8 }}><Obf>{d.value}</Obf></div>
              </div>
            ))}
          </div>
        </div>
        {/* Right column: Donut pie */}
        <div style={card}>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: t.sub, marginBottom: 4 }}>
            {pieData.map(d => (<span key={d.name}><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: d.color, marginRight: 4 }} />{d.name}</span>))}
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={120}
                label={renderLabel} labelLine={{ stroke: t.muted, strokeWidth: 1 }}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, fontSize: 12, color: t.text }} formatter={v => [obf(v) + "%", "Share"]} />
              {/* Center label */}
              <text x="50%" y="44%" textAnchor="middle" style={{ fontSize: 13, fill: t.sub, fontFamily: F }}>Total Count</text>
              <text x="50%" y="53%" textAnchor="middle" style={{ fontSize: 22, fontWeight: 800, fill: t.text, fontFamily: F }}>{obf("5,359")}</text>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Order Milestone + Search */}
      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Order Milestone</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: t.sub }}>Search Sales Doc</span>
          <input placeholder="Enter 'SALESDOCUMENT' Values" style={{
            padding: "6px 10px", border: `1px solid ${t.borderDark}`, borderRadius: 4,
            background: t.surface2, color: t.text, fontSize: 12, width: 240, fontFamily: F,
          }} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 3 — Order to Delivery (existing, with sidebar)
   Data & components
   ═══════════════════════════════════════════════════════════════════ */
const KPI_OTD = [
  { title: "Orders", metrics: [{ l:"Count of orders",v:"4,984" },{ l:"Net Weight",v:"8M" },{ l:"Net Value",v:"311M" },{ l:"Volume",v:"31K" },{ l:"PUM",v:"1M" }] },
  { title: "Orders at Risk", metrics: [{ l:"Count of orders",v:"1,638" },{ l:"Net Weight",v:"2M" },{ l:"Net Value",v:"99M" },{ l:"Volume",v:"9,167" },{ l:"PUM",v:"448K" }] },
  { title: "Recommendation", metrics: [{ l:"Count of orders",v:"1,638" },{ l:"Net Weight",v:"2M" },{ l:"Net Value",v:"99M" },{ l:"Volume",v:"9,167" },{ l:"PUM",v:"448K" }] },
];
const COMBO_OTD = [
  { plant: "1184_BR DC CORDEIROPOLIS", total: 2801, atRisk: 685, pctRisky: 24.46 },
  { plant: "1202_BR DC SAO BERNARDO", total: 1291, atRisk: 569, pctRisky: 44.07 },
  { plant: "3052_BR DC Feira de Santana", total: 907, atRisk: 394, pctRisky: 43.44 },
];
const PIE_OTD = [
  { name: "Auto Exception", value: 58.45, colorKey: "pieCoral" },
  { name: "Calendar", value: 21.46, colorKey: "pieBlue" },
  { name: "Manual Exception", value: 9.50, colorKey: "pieYellow" },
  { name: "Routing Process T2", value: 5.38, colorKey: "pieGreen" },
  { name: "Manual Block", value: 4.61, colorKey: "pieRed" },
  { name: "Opened sales do...", value: 0.60, colorKey: "piePurple" },
];
const TABLE_OTD = [
  { exception: "Auto Exception", block: 312, openSales: 245, calendar: 189, routing: 67 },
  { exception: "Manual Exception", block: 45, openSales: 32, calendar: 28, routing: 12 },
  { exception: "Calendar Deviation", block: 0, openSales: 156, calendar: 198, routing: 34 },
  { exception: "Routing Process T2", block: 18, openSales: 22, calendar: 15, routing: 56 },
  { exception: "Manual Block", block: 67, openSales: 0, calendar: 12, routing: 8 },
  { exception: "Opened Sales Doc", block: 5, openSales: 89, calendar: 14, routing: 3 },
];

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 4 — Delivery to Billing
   ═══════════════════════════════════════════════════════════════════ */
const KPI_DTB = [
  { title: "Shipments", metrics: [{ l:"Count of Shipments",v:"132" },{ l:"Net Weight",v:"1M" },{ l:"Net Value",v:"46M" },{ l:"Volume",v:"4,115" },{ l:"PUM",v:"207K" }] },
  { title: "Shipments at Risk", metrics: [{ l:"Count of Shipments",v:"20" },{ l:"Net Weight",v:"271K" },{ l:"Net Value",v:"12M" },{ l:"Volume",v:"1K" },{ l:"PUM",v:"59K" }] },
  { title: "Recommendation", metrics: [{ l:"Count of Shipments",v:"20" },{ l:"Net Weight",v:"271K" },{ l:"Net Value",v:"12M" },{ l:"Volume",v:"1K" },{ l:"PUM",v:"59K" }] },
];
const COMBO_DTB = [
  { plant: "1184_BR DC CORDEIROPOLIS", total: 710000, atRisk: 120000, pctRisky: 16.89 },
  { plant: "1202_BR DC SAO BERNARDO", total: 280000, atRisk: 80000, pctRisky: 28.16 },
  { plant: "3052_BR DC Feira de Santana", total: 110000, atRisk: 40000, pctRisky: 34.48 },
];
const PIE_DTB = [
  { name: "Transportation", value: 44.37, colorKey: "pieBlue" },
  { name: "Warehouse", value: 55.63, colorKey: "piePink" },
];

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 5 — Billing to POD
   ═══════════════════════════════════════════════════════════════════ */
const KPI_BTP = [
  { title: "Shipments", metrics: [{ l:"Count of Shipments",v:"2,271" },{ l:"Net Weight",v:"131M" },{ l:"Net Value",v:"477M" },{ l:"Volume",v:"41K" },{ l:"PUM",v:"2M" }] },
  { title: "Shipments at Risk", metrics: [{ l:"Count of Shipments",v:"116" },{ l:"Net Weight",v:"4M" },{ l:"Net Value",v:"16M" },{ l:"Volume",v:"1,276" },{ l:"PUM",v:"62K" }] },
  { title: "Recommendation", metrics: [{ l:"Count of Shipments",v:"116" },{ l:"Net Weight",v:"4M" },{ l:"Net Value",v:"16M" },{ l:"Volume",v:"1,276" },{ l:"PUM",v:"62K" }] },
];
const COMBO_BTP = [
  { plant: "1184_BR DC CORDEIROPOLIS", total: 1081, atRisk: 34, pctRisky: 3.15 },
  { plant: "1202_BR DC SAO BERNARDO", total: 961, atRisk: 76, pctRisky: 7.91 },
  { plant: "3052_BR DC Feira de Santana", total: 201, atRisk: 6, pctRisky: 2.99 },
];
const PIE_BTP = [
  { name: "Monitoring", value: 100, colorKey: "pieGreen" },
];

/* ═══════════════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */
function ThemeToggle({ isDark, onToggle }) {
  const t = useT();
  return (
    <div onClick={onToggle} title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", background: t.toggleBg, position: "relative", marginLeft: 16, transition: "background 0.25s", flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: t.toggleKnob, position: "absolute", top: 3,
        left: isDark ? 3 : 23, transition: "left 0.25s", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{t.toggleIcon}</div>
    </div>
  );
}

function HeaderBar({ activeTab, onTabClick, isDark, onThemeToggle }) {
  const t = useT();
  return (
    <div style={{ background: t.headerBg, display: "flex", alignItems: "center", height: 48, padding: "0 20px", fontFamily: F }}>
      <img src="/nestle-logo.svg" alt="Nestlé" style={{ height: 32, marginRight: 24, filter: "brightness(0) invert(1)", opacity: 0.9 }} />
      <div style={{ display: "flex", gap: 0, flex: 1 }}>
        {MAIN_TABS.map(tab => (
          <div key={tab} onClick={() => onTabClick(tab)} style={{
            padding: "12px 18px", cursor: "pointer", color: activeTab === tab ? t.headerTabAct : t.headerTab,
            fontWeight: activeTab === tab ? 700 : 400, fontSize: 13,
            borderBottom: activeTab === tab ? `2px solid ${t.primary}` : "2px solid transparent",
          }}>{tab}</div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: t.headerTab, whiteSpace: "nowrap", textAlign: "right" }}>
        <span style={{ fontWeight: 600 }}>Last Refresh</span><br />2026-03-11 08:00:02
      </div>
      <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
    </div>
  );
}

function SubHeaderTabs({ activeTab, onTabClick }) {
  const t = useT();
  return (
    <div style={{ background: t.surface, display: "flex", borderBottom: `2px solid ${t.border}`, fontFamily: F }}>
      {SUB_TABS.map(tab => (
        <div key={tab} onClick={() => onTabClick(tab)} style={{
          padding: "10px 24px", cursor: "pointer", fontSize: 13,
          color: activeTab === tab ? t.navActive : t.sub, fontWeight: activeTab === tab ? 600 : 400,
          borderBottom: activeTab === tab ? `2px solid ${t.navBorder}` : "2px solid transparent", marginBottom: -2,
        }}>{tab}</div>
      ))}
    </div>
  );
}

function SidebarNav({ active, onSelect }) {
  const t = useT();
  return (
    <div style={{ width: 200, minWidth: 200, background: t.nav, borderRight: `1px solid ${t.border}`, padding: "12px 0", fontFamily: F, overflowY: "auto" }}>
      {SIDEBAR_ITEMS.map(item => {
        const isActive = active === item;
        return (
          <div key={item} onClick={() => onSelect(item)} style={{
            padding: "9px 16px", cursor: "pointer", fontSize: 13,
            color: isActive ? t.navActive : t.navText, fontWeight: isActive ? 700 : 400,
            background: isActive ? t.navActiveBg : "transparent",
            borderLeft: isActive ? `3px solid ${t.navBorder}` : "3px solid transparent",
          }}>{item}</div>
        );
      })}
    </div>
  );
}

function DateControlsBar() {
  const t = useT();
  const btn = { padding: "6px 16px", border: `1px solid ${t.borderDark}`, borderRadius: 4, background: t.surface, color: t.text, fontSize: 12, cursor: "pointer", fontFamily: F };
  const dt = { padding: "6px 10px", border: `1px solid ${t.borderDark}`, borderRadius: 4, background: t.surface, color: t.text, fontSize: 12, minWidth: 90, fontFamily: F };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <button style={btn}>Today</button><button style={btn}>Next Day</button>
        <span style={{ fontSize: 12, color: t.sub, marginLeft: 16 }}>Custom Date</span>
        <span style={dt}>10/1/2025 &nbsp;📅</span><span style={dt}>3/31/2026 &nbsp;📅</span>
        <div style={{ flex: 1 }} />
        <button style={{ padding: "8px 28px", border: "none", borderRadius: 4, background: t.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F }}>Filters</button>
      </div>
      <div style={{ fontSize: 13, color: t.text, marginBottom: 14 }}><strong>Date Selected:</strong>&nbsp; 01/Oct/2025 to 31/Mar/2026</div>
    </div>
  );
}

function ViewByToggle({ active, onSelect }) {
  const t = useT();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontFamily: F }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: t.text, marginRight: 4 }}>View By:</span>
      {VIEW_BY_OPTIONS.map(opt => {
        const on = active === opt;
        return (<button key={opt} onClick={() => onSelect(opt)} style={{
          padding: "5px 16px", borderRadius: 4, fontSize: 12, fontWeight: on ? 700 : 400,
          border: `1px solid ${on ? t.primary : t.borderDark}`, background: on ? t.primaryLight : t.surface,
          color: on ? t.primary : t.text, cursor: "pointer", fontFamily: F,
        }}>{opt}</button>);
      })}
    </div>
  );
}

/* Generic KPI row (3 cards) */
function KpiRow({ cards }) {
  const t = useT();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
      {cards.map(c => (
        <div key={c.title} style={{ border: `2px solid ${t.borderDark}`, borderRadius: 6, padding: "14px 18px", background: t.surface, fontFamily: F }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 10 }}>{c.title}</div>
          <div style={{ display: "flex", gap: 16 }}>
            {c.metrics.map(m => (<div key={m.l}><div style={{ fontSize: 10, color: t.sub, marginBottom: 2 }}>{m.l}</div><div style={{ fontSize: 18, fontWeight: 800, color: t.text }}><Obf>{m.v}</Obf></div></div>))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Generic combo chart (bars + line) — used by OTD, DTB, BTP */
function ComboChartCard({ title, data, barLabel1, barLabel2, lineLabel, yLabel, fmtY }) {
  const t = useT();
  const sel = { padding: "4px 8px", border: `1px solid ${t.borderDark}`, borderRadius: 4, fontSize: 11, color: t.text, background: t.surface, fontFamily: F };
  return (
    <div style={{ border: `1px solid ${t.borderDark}`, borderRadius: 6, background: t.surface, padding: 16, fontFamily: F }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{title}</div>
        <div style={{ display: "flex", gap: 10 }}>
          {[{ l: "Level1", v: "Plant" },{ l: "Level2", v: "Business" },{ l: "Level3", v: fmtY ? "Category" : "Market Cluster" }].map(f => (
            <div key={f.l} style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: t.muted, marginBottom: 2 }}>{f.l}</div>
              <select style={sel} defaultValue={f.v}><option>{f.v}</option></select></div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: t.sub, marginBottom: 8 }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: t.barBlue, marginRight: 4 }} />{barLabel1}</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: t.barRed, marginRight: 4 }} />{barLabel2}</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: t.lineOrange, marginRight: 4 }} />{lineLabel}</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
          <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="plant" tick={{ fill: t.sub, fontSize: 9 }} angle={-15} textAnchor="end" interval={0} height={60} />
          <YAxis yAxisId="left" tick={{ fill: t.sub, fontSize: 10 }} tickLine={false} axisLine={false}
            tickFormatter={v => obf(fmtY ? fmtY(v) : v)}
            label={{ value: yLabel || "Orders", angle: -90, position: "insideLeft", style: { fill: t.sub, fontSize: 11 } }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: t.sub, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => obf(v) + "%"} />
          <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, fontSize: 12, color: t.text }} labelStyle={{ color: t.text }} itemStyle={{ color: t.sub }}
            formatter={(v, name) => {
              if (name === "pctRisky") return [obf(v.toFixed(2)) + "%", "% Risky"];
              const fmt = fmtY ? fmtY(v) : v.toLocaleString();
              return [obf(fmt), name === "total" ? barLabel1 : barLabel2];
            }} />
          <Bar yAxisId="left" dataKey="total" fill={t.barBlue} radius={[2,2,0,0]} barSize={40} label={{ position: "top", fill: t.text, fontSize: 11, fontWeight: 700, formatter: v => obf(fmtY ? fmtY(v) : v) }} />
          <Bar yAxisId="left" dataKey="atRisk" fill={t.barRed} radius={[2,2,0,0]} barSize={40} label={{ position: "top", fill: t.red, fontSize: 10, formatter: v => obf(fmtY ? fmtY(v) : v) }} />
          <Line yAxisId="right" dataKey="pctRisky" stroke={t.lineOrange} strokeWidth={2} dot={{ r: 4, fill: t.lineOrange }}
            label={{ position: "top", fill: t.lineOrange, fontSize: 10, formatter: v => obf(v.toFixed(2)) + "%" }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* Generic donut pie card */
function DonutPieCard({ title, pieKeys, centerLabel, centerValue }) {
  const t = useT();
  const pieData = pieKeys.map(d => ({ ...d, color: t[d.colorKey] }));
  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, outerRadius, name, value }) => {
    const r = outerRadius + 25;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    if (value < 2) return null;
    return (<text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central"
      style={{ fontSize: 11, fill: t.text, fontFamily: F }}>{name} {obf(value)}%</text>);
  };
  return (
    <div style={{ border: `1px solid ${t.borderDark}`, borderRadius: 6, background: t.surface, padding: 16, fontFamily: F }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 4 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 10, color: t.sub, marginBottom: 4 }}>
        {pieData.map(d => (<span key={d.name}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: d.color, marginRight: 3 }} />{d.name}</span>))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={100}
            label={renderLabel} labelLine={{ stroke: t.muted, strokeWidth: 1 }}>
            {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
          </Pie>
          <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, fontSize: 12, color: t.text }} formatter={v => [obf(v) + "%", "Share"]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* Bottom table */
function BottomTable() {
  const t = useT();
  const cols = ["Exception","Block","Open Sales Document Time","Calendar","Routing Process"];
  const th = { textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `2px solid ${t.borderDark}`, fontFamily: "'IBM Plex Mono', monospace", background: t.surface2 };
  const td = i => ({ padding: "8px 12px", fontSize: 12, color: t.text, borderBottom: `1px solid ${t.border}`, background: i % 2 === 0 ? t.surface : t.surface2, fontFamily: F });
  return (
    <div style={{ border: `1px solid ${t.borderDark}`, borderRadius: 6, background: t.surface, overflow: "hidden", marginTop: 14 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{cols.map(c => <th key={c} style={th}>{c}</th>)}</tr></thead>
        <tbody>{TABLE_OTD.map((r, i) => (
          <tr key={r.exception}>
            <td style={{ ...td(i), fontWeight: 600 }}>{r.exception}</td>
            <td style={td(i)}><Obf>{r.block}</Obf></td><td style={td(i)}><Obf>{r.openSales}</Obf></td>
            <td style={td(i)}><Obf>{r.calendar}</Obf></td><td style={td(i)}><Obf>{r.routing}</Obf></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN: Order to Delivery (with sidebar)
   ═══════════════════════════════════════════════════════════════════ */
function OtdScreen({ viewBy, onViewBy }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
      <DateControlsBar />
      <KpiRow cards={KPI_OTD} />
      <ViewByToggle active={viewBy} onSelect={onViewBy} />
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 14 }}>
        <ComboChartCard title="Count of Orders at Risk" data={COMBO_OTD}
          barLabel1="Total Orders" barLabel2="Orders at Risk" lineLabel="(%) Risky Orders (OTD)" yLabel="Orders" />
        <DonutPieCard title="Distribution of Risk" pieKeys={PIE_OTD} />
      </div>
      <BottomTable />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN: Delivery to Billing
   ═══════════════════════════════════════════════════════════════════ */
const fmtM = v => { if (v >= 1000000) return (v / 1000000).toFixed(2) + "M"; if (v >= 1000) return (v / 1000).toFixed(0) + "K"; return v; };

function DtbScreen({ viewBy, onViewBy }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
      <DateControlsBar />
      <KpiRow cards={KPI_DTB} />
      <ViewByToggle active={viewBy} onSelect={onViewBy} />
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 14 }}>
        <ComboChartCard title="Weight of Shipments at Risk" data={COMBO_DTB}
          barLabel1="Total Shipments" barLabel2="Shipments with Risk" lineLabel="Percentage of Shipments at risk"
          yLabel="Shipments" fmtY={fmtM} />
        <DonutPieCard title="Distribution of Risk" pieKeys={PIE_DTB} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN: Billing to POD
   ═══════════════════════════════════════════════════════════════════ */
function BtpScreen({ viewBy, onViewBy }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
      <DateControlsBar />
      <KpiRow cards={KPI_BTP} />
      <ViewByToggle active={viewBy} onSelect={onViewBy} />
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 14 }}>
        <ComboChartCard title="Count of Shipments at Risk" data={COMBO_BTP}
          barLabel1="Total Shipments" barLabel2="Shipments at Risk" lineLabel="Percentage of Shipments at Risk"
          yLabel="Shipments" />
        <DonutPieCard title="Distribution of Risk" pieKeys={PIE_BTP} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN APP — routes sub-tabs to screens
   ═══════════════════════════════════════════════════════════════════ */
function OtdApp() {
  const [mainTab, setMainTab] = useState("Executive Summary");
  const [subTab, setSubTab] = useState("Overview");
  const [sidebar, setSidebar] = useState("Order to Delivery");
  const [viewBy, setViewBy] = useState("Count");
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? DARK : LIGHT;

  useEffect(() => { document.body.style.background = theme.bg; document.body.style.margin = "0"; }, [theme.bg]);

  /* Map between main tabs ↔ sub-tabs so they always stay in sync */
  const MAIN_TO_SUB = { "Executive Summary": "Overview", "Order to Delivery": "Overview", "Delivery to Billing": "Delivery to Billing", "Billing to POD": "Billing to POD" };

  const handleMainTab = (tab) => {
    const mapped = MAIN_TO_SUB[tab];
    if (mapped) { setMainTab(tab); setSubTab(mapped); }
    /* Admin & Historical Alert — no matching screen, ignore */
  };

  const handleSubTab = (tab) => {
    setSubTab(tab);
  };

  const renderContent = () => {
    /* Under Executive Summary, Overview shows the exec overview,
       all other sub-tabs show the OTD screen (orders perspective).
       DTB and BTP screens only appear via their own main tabs. */
    if (mainTab === "Executive Summary") {
      if (subTab === "Overview") return <ExecSummaryOverview viewBy={viewBy} onViewBy={setViewBy} />;
      if (subTab === "Billing to POD") return <DtbScreen viewBy={viewBy} onViewBy={setViewBy} />;
      return <OtdScreen viewBy={viewBy} onViewBy={setViewBy} />;
    }
    if (mainTab === "Order to Delivery") {
      if (subTab === "Overview") return <OtdOverviewScreen viewBy={viewBy} onViewBy={setViewBy} />;
      return <OtdScreen viewBy={viewBy} onViewBy={setViewBy} />;
    }
    if (mainTab === "Delivery to Billing") return <DtbScreen viewBy={viewBy} onViewBy={setViewBy} />;
    if (mainTab === "Billing to POD") return <BtpScreen viewBy={viewBy} onViewBy={setViewBy} />;
    return <ExecSummaryOverview viewBy={viewBy} onViewBy={setViewBy} />;
  };

  return (
    <ThemeCtx.Provider value={theme}>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: theme.bg, fontFamily: F, transition: "background 0.3s" }}>
        <HeaderBar activeTab={mainTab} onTabClick={handleMainTab} isDark={isDark} onThemeToggle={() => setIsDark(d => !d)} />
        <SubHeaderTabs activeTab={subTab} onTabClick={handleSubTab} />
        <div style={{ display: "flex", flex: 1 }}>
          {renderContent()}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}

export default function OtdDashboard() {
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.margin = "0";
    return () => { document.body.style.background = prev; };
  }, []);
  return <OtdApp />;
}
