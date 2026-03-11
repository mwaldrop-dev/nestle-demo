import { useState, useEffect } from "react";
import {
  ComposedChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

/* ─── Light theme tokens ───────────────────────────────────────────── */
const LT = {
  bg:         "#F5F6FA",
  surface:    "#FFFFFF",
  surface2:   "#F0F1F5",
  border:     "#E0E3EB",
  borderDark: "#CBD0DC",
  nav:        "#FFFFFF",
  navText:    "#6B7280",
  navActive:  "#1D4ED8",
  navActiveBg:"#EFF6FF",
  navBorder:  "#2563EB",
  headerBg:   "#1E293B",
  headerText: "#FFFFFF",
  headerTab:  "#94A3B8",
  headerTabAct:"#FFFFFF",
  primary:    "#2563EB",
  primaryLight:"#DBEAFE",
  red:        "#EF4444",
  amber:      "#F59E0B",
  green:      "#10B981",
  barBlue:    "#3B82F6",
  barRed:     "#EF4444",
  lineOrange: "#F97316",
  pieCoral:   "#F87171",
  pieBlue:    "#3B82F6",
  pieYellow:  "#FBBF24",
  pieGreen:   "#10B981",
  pieRed:     "#DC2626",
  piePurple:  "#8B5CF6",
  text:       "#111827",
  sub:        "#6B7280",
  muted:      "#9CA3AF",
  nestle:     "#E8002A",
};

/* ─── Static data ──────────────────────────────────────────────────── */
const MAIN_TABS = ["Executive Summary", "Order to Delivery", "Delivery to Billing", "Billing to POD", "Admin", "Historical Alert"];
const SUB_TABS = ["Overview", "Order to Delivery", "Delivery to Billing", "Billing to POD"];
const SIDEBAR_ITEMS = [
  "Admin Page", "Overview", "Order to Delivery", "Delivery to Billing", "Billing to POD",
  "Order to Delivery Deep Dive", "Delivery to Billing Deep Dive", "Billing to POD Deep Dive",
  "History Alerts - OTD", "History Alerts - DTB", "History Alerts - BTP",
];

const KPI_CARDS = [
  {
    title: "Orders", color: LT.primary,
    metrics: [
      { label: "Count of orders", value: "4,984" },
      { label: "Net Weight",      value: "8M" },
      { label: "Net Value",       value: "311M" },
      { label: "Volume",          value: "31K" },
      { label: "PUM",             value: "1M" },
    ],
  },
  {
    title: "Orders at Risk", color: LT.red,
    metrics: [
      { label: "Count of orders", value: "1,638" },
      { label: "Net Weight",      value: "2M" },
      { label: "Net Value",       value: "99M" },
      { label: "Volume",          value: "9,167" },
      { label: "PUM",             value: "448K" },
    ],
  },
  {
    title: "Recommendation", color: LT.primary,
    metrics: [
      { label: "Count of orders", value: "1,638" },
      { label: "Net Weight",      value: "2M" },
      { label: "Net Value",       value: "99M" },
      { label: "Volume",          value: "9,167" },
      { label: "PUM",             value: "448K" },
    ],
  },
];

const COMBO_DATA = [
  { plant: "1184_BR DC CORDEIROPOLIS",   total: 2801, atRisk: 685, pctRisky: 24.46 },
  { plant: "1202_BR DC SAO BERNARDO",    total: 1291, atRisk: 569, pctRisky: 44.07 },
  { plant: "3052_BR DC Feira de Santana", total: 907,  atRisk: 394, pctRisky: 43.44 },
];

const PIE_DATA = [
  { name: "Auto Exception",     value: 58.45, color: LT.pieCoral },
  { name: "Calendar",           value: 21.46, color: LT.pieBlue },
  { name: "Manual Exception",   value: 9.50,  color: LT.pieYellow },
  { name: "Routing Process T2", value: 5.38,  color: LT.pieGreen },
  { name: "Manual Block",       value: 4.61,  color: LT.pieRed },
  { name: "Opened sales do...", value: 0.60,  color: LT.piePurple },
];

const TABLE_DATA = [
  { exception: "Auto Exception",     block: 312, openSales: 245, calendar: 189, routing: 67  },
  { exception: "Manual Exception",   block: 45,  openSales: 32,  calendar: 28,  routing: 12  },
  { exception: "Calendar Deviation", block: 0,   openSales: 156, calendar: 198, routing: 34  },
  { exception: "Routing Process T2", block: 18,  openSales: 22,  calendar: 15,  routing: 56  },
  { exception: "Manual Block",       block: 67,  openSales: 0,   calendar: 12,  routing: 8   },
  { exception: "Opened Sales Doc",   block: 5,   openSales: 89,  calendar: 14,  routing: 3   },
];

const VIEW_BY_OPTIONS = ["Count", "PUM", "Value", "Weight"];

/* ─── Header bar ───────────────────────────────────────────────────── */
function HeaderBar({ activeTab, onTabClick }) {
  return (
    <div style={{
      background: LT.headerBg, display: "flex", alignItems: "center", height: 48,
      padding: "0 20px", fontFamily: "'IBM Plex Sans', sans-serif",
    }}>
      <img src="/nestle-logo.svg" alt="Nestlé" style={{ height: 32, marginRight: 24, filter: "brightness(0) invert(1)" }} />
      <div style={{ display: "flex", gap: 0, flex: 1 }}>
        {MAIN_TABS.map(tab => (
          <div key={tab} onClick={() => onTabClick(tab)} style={{
            padding: "12px 18px", cursor: "pointer",
            color: activeTab === tab ? LT.headerTabAct : LT.headerTab,
            fontWeight: activeTab === tab ? 700 : 400, fontSize: 13,
            borderBottom: activeTab === tab ? "2px solid #fff" : "2px solid transparent",
          }}>{tab}</div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: LT.headerTab, whiteSpace: "nowrap" }}>
        <span style={{ fontWeight: 600 }}>Last Refresh</span><br />
        2026-03-11 08:00:02
      </div>
    </div>
  );
}

/* ─── Sub-header tabs ──────────────────────────────────────────────── */
function SubHeaderTabs({ activeTab, onTabClick }) {
  return (
    <div style={{
      background: LT.surface, display: "flex", borderBottom: `2px solid ${LT.border}`,
      fontFamily: "'IBM Plex Sans', sans-serif",
    }}>
      {SUB_TABS.map(tab => (
        <div key={tab} onClick={() => onTabClick(tab)} style={{
          padding: "10px 24px", cursor: "pointer", fontSize: 13,
          color: activeTab === tab ? LT.navActive : LT.sub,
          fontWeight: activeTab === tab ? 600 : 400,
          borderBottom: activeTab === tab ? `2px solid ${LT.navBorder}` : "2px solid transparent",
          marginBottom: -2,
        }}>{tab}</div>
      ))}
    </div>
  );
}

/* ─── Sidebar ──────────────────────────────────────────────────────── */
function SidebarNav({ active, onSelect }) {
  return (
    <div style={{
      width: 200, minWidth: 200, background: LT.nav,
      borderRight: `1px solid ${LT.border}`, padding: "12px 0",
      fontFamily: "'IBM Plex Sans', sans-serif", overflowY: "auto",
    }}>
      {SIDEBAR_ITEMS.map(item => {
        const isActive = active === item;
        return (
          <div key={item} onClick={() => onSelect(item)} style={{
            padding: "9px 16px", cursor: "pointer", fontSize: 13,
            color: isActive ? LT.navActive : LT.navText,
            fontWeight: isActive ? 700 : 400,
            background: isActive ? LT.navActiveBg : "transparent",
            borderLeft: isActive ? `3px solid ${LT.navBorder}` : "3px solid transparent",
          }}>{item}</div>
        );
      })}
    </div>
  );
}

/* ─── Date controls ────────────────────────────────────────────────── */
function DateControlsBar() {
  const btnStyle = {
    padding: "6px 16px", border: `1px solid ${LT.borderDark}`, borderRadius: 4,
    background: LT.surface, color: LT.text, fontSize: 12, cursor: "pointer",
    fontFamily: "'IBM Plex Sans', sans-serif",
  };
  const dateStyle = {
    padding: "6px 10px", border: `1px solid ${LT.borderDark}`, borderRadius: 4,
    background: LT.surface, color: LT.text, fontSize: 12, minWidth: 90,
    fontFamily: "'IBM Plex Sans', sans-serif",
  };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <button style={btnStyle}>Today</button>
        <button style={btnStyle}>Next Day</button>
        <span style={{ fontSize: 12, color: LT.sub, marginLeft: 16 }}>Custom Date</span>
        <span style={dateStyle}>10/1/2025 &nbsp;📅</span>
        <span style={dateStyle}>3/31/2026 &nbsp;📅</span>
        <div style={{ flex: 1 }} />
        <button style={{
          padding: "8px 28px", border: "none", borderRadius: 4,
          background: LT.primary, color: "#fff", fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
        }}>Filters</button>
      </div>
      <div style={{ fontSize: 13, color: LT.text, marginBottom: 14 }}>
        <strong>Date Selected:</strong>&nbsp; 01/Oct/2025 to 31/Mar/2026
      </div>
    </div>
  );
}

/* ─── KPI cards ────────────────────────────────────────────────────── */
function KpiCardRow() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
      {KPI_CARDS.map(card => (
        <div key={card.title} style={{
          border: `2px solid ${LT.borderDark}`, borderRadius: 6, padding: "14px 18px",
          background: LT.surface, fontFamily: "'IBM Plex Sans', sans-serif",
        }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: LT.text, marginBottom: 10 }}>{card.title}</div>
          <div style={{ display: "flex", gap: 16 }}>
            {card.metrics.map(m => (
              <div key={m.label}>
                <div style={{ fontSize: 10, color: LT.sub, marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: LT.text }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── View By toggle ───────────────────────────────────────────────── */
function ViewByToggle({ active, onSelect }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: LT.text, marginRight: 4 }}>View By:</span>
      {VIEW_BY_OPTIONS.map(opt => {
        const isActive = active === opt;
        return (
          <button key={opt} onClick={() => onSelect(opt)} style={{
            padding: "5px 16px", borderRadius: 4, fontSize: 12, fontWeight: isActive ? 700 : 400,
            border: `1px solid ${isActive ? LT.primary : LT.borderDark}`,
            background: isActive ? LT.primaryLight : LT.surface,
            color: isActive ? LT.primary : LT.text, cursor: "pointer",
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}>{opt}</button>
        );
      })}
    </div>
  );
}

/* ─── Combo chart: Count of Orders at Risk ─────────────────────────── */
function OrdersAtRiskChart() {
  const selectStyle = {
    padding: "4px 8px", border: `1px solid ${LT.borderDark}`, borderRadius: 4,
    fontSize: 11, color: LT.text, background: LT.surface,
    fontFamily: "'IBM Plex Sans', sans-serif",
  };
  return (
    <div style={{
      border: `1px solid ${LT.borderDark}`, borderRadius: 6,
      background: LT.surface, padding: 16, fontFamily: "'IBM Plex Sans', sans-serif",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: LT.text }}>Count of Orders at Risk</div>
        <div style={{ display: "flex", gap: 10 }}>
          {[{ label: "Level1", val: "Plant" }, { label: "Level2", val: "Business" }, { label: "Level3", val: "Market Cluster" }].map(f => (
            <div key={f.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: LT.muted, marginBottom: 2 }}>{f.label}</div>
              <select style={selectStyle} defaultValue={f.val}>
                <option>{f.val}</option>
              </select>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: LT.sub, marginBottom: 8 }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: LT.barBlue, marginRight: 4 }} />Total Orders</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: LT.barRed, marginRight: 4 }} />Orders at Risk</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: LT.lineOrange, marginRight: 4 }} />(%) Risky Orders (OTD)</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={COMBO_DATA} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
          <CartesianGrid stroke={LT.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="plant" tick={{ fill: LT.sub, fontSize: 9 }} angle={-15} textAnchor="end" interval={0} height={60} />
          <YAxis yAxisId="left" tick={{ fill: LT.sub, fontSize: 10 }} tickLine={false} axisLine={false} label={{ value: "Orders", angle: -90, position: "insideLeft", style: { fill: LT.sub, fontSize: 11 } }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: LT.sub, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v + "%"} domain={[0, 50]} />
          <Tooltip
            contentStyle={{ background: LT.surface, border: `1px solid ${LT.border}`, borderRadius: 6, fontSize: 12 }}
            formatter={(v, name) => {
              if (name === "pctRisky") return [v.toFixed(2) + "%", "% Risky"];
              return [v.toLocaleString(), name === "total" ? "Total Orders" : "Orders at Risk"];
            }}
          />
          <Bar yAxisId="left" dataKey="total" fill={LT.barBlue} radius={[2, 2, 0, 0]} barSize={40} label={{ position: "top", fill: LT.text, fontSize: 11, fontWeight: 700 }} />
          <Bar yAxisId="left" dataKey="atRisk" fill={LT.barRed} radius={[2, 2, 0, 0]} barSize={40} label={{ position: "top", fill: LT.red, fontSize: 10 }} />
          <Line yAxisId="right" dataKey="pctRisky" stroke={LT.lineOrange} strokeWidth={2} dot={{ r: 4, fill: LT.lineOrange }} label={{ position: "top", fill: LT.lineOrange, fontSize: 10, formatter: v => v.toFixed(2) + "%" }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Pie chart: Distribution of Risk ──────────────────────────────── */
function RiskDistributionPie() {
  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, outerRadius, name, value }) => {
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (value < 2) return null;
    return (
      <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central"
        style={{ fontSize: 11, fill: LT.text, fontFamily: "'IBM Plex Sans', sans-serif" }}>
        {name} {value}%
      </text>
    );
  };

  return (
    <div style={{
      border: `1px solid ${LT.borderDark}`, borderRadius: 6,
      background: LT.surface, padding: 16, fontFamily: "'IBM Plex Sans', sans-serif",
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: LT.text, marginBottom: 4 }}>Distribution of Risk</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 10, color: LT.sub, marginBottom: 4 }}>
        {PIE_DATA.map(d => (
          <span key={d.name}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: d.color, marginRight: 3 }} />{d.name}</span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={PIE_DATA} dataKey="value" nameKey="name"
            cx="50%" cy="50%" innerRadius={55} outerRadius={100}
            label={renderLabel} labelLine={{ stroke: LT.muted, strokeWidth: 1 }}
          >
            {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: LT.surface, border: `1px solid ${LT.border}`, borderRadius: 6, fontSize: 12 }}
            formatter={(v) => [v + "%", "Share"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Bottom table ─────────────────────────────────────────────────── */
function BottomTable() {
  const cols = ["Exception", "Block", "Open Sales Document Time", "Calendar", "Routing Process"];
  const thStyle = {
    textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700,
    color: LT.sub, textTransform: "uppercase", letterSpacing: 0.8,
    borderBottom: `2px solid ${LT.borderDark}`,
    fontFamily: "'IBM Plex Mono', monospace",
    background: LT.surface2,
  };
  const tdStyle = (i) => ({
    padding: "8px 12px", fontSize: 12, color: LT.text,
    borderBottom: `1px solid ${LT.border}`,
    background: i % 2 === 0 ? LT.surface : LT.surface2,
    fontFamily: "'IBM Plex Sans', sans-serif",
  });
  return (
    <div style={{
      border: `1px solid ${LT.borderDark}`, borderRadius: 6,
      background: LT.surface, overflow: "hidden", marginTop: 14,
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{cols.map(c => <th key={c} style={thStyle}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {TABLE_DATA.map((row, i) => (
            <tr key={row.exception}>
              <td style={{ ...tdStyle(i), fontWeight: 600 }}>{row.exception}</td>
              <td style={tdStyle(i)}>{row.block}</td>
              <td style={tdStyle(i)}>{row.openSales}</td>
              <td style={tdStyle(i)}>{row.calendar}</td>
              <td style={tdStyle(i)}>{row.routing}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Main OTD App ─────────────────────────────────────────────────── */
function OtdApp() {
  const [mainTab, setMainTab] = useState("Order to Delivery");
  const [subTab, setSubTab] = useState("Order to Delivery");
  const [sidebar, setSidebar] = useState("Order to Delivery");
  const [viewBy, setViewBy] = useState("Count");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: LT.bg, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <HeaderBar activeTab={mainTab} onTabClick={setMainTab} />
      <SubHeaderTabs activeTab={subTab} onTabClick={setSubTab} />
      <div style={{ display: "flex", flex: 1 }}>
        <SidebarNav active={sidebar} onSelect={setSidebar} />
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          <DateControlsBar />
          <KpiCardRow />
          <ViewByToggle active={viewBy} onSelect={setViewBy} />
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 14 }}>
            <OrdersAtRiskChart />
            <RiskDistributionPie />
          </div>
          <BottomTable />
        </div>
      </div>
    </div>
  );
}

/* ─── Export with body background override ─────────────────────────── */
export default function OtdDashboard() {
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = LT.bg;
    document.body.style.margin = "0";
    return () => { document.body.style.background = prev; };
  }, []);
  return <OtdApp />;
}
