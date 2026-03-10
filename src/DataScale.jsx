import { useState } from "react";

/* ─── Design tokens (same as dashboard) ────────────────────────────── */
const T = {
  bg:      "#0E1117",
  surface: "#161B26",
  surface2:"#1C2333",
  border:  "#2A3347",
  primary: "#3B9EFF",
  red:     "#F05252",
  amber:   "#FBBF24",
  green:   "#34D399",
  text:    "#E2EAF4",
  sub:     "#7A95B0",
  muted:   "#445566",
  nestle:  "#E8002A",
};

/* ─── Fake order data generator ────────────────────────────────────── */
const CUSTOMERS = [
  "Carrefour SA","Tesco PLC","Walmart Inc","Aldi Süd","Lidl Stiftung",
  "Ahold Delhaize","Casino Group","Metro AG","Rewe Group","Coop Switzerland",
  "Migros","Edeka","Spar International","Woolworths","Costco","Kroger",
  "Leclerc","Intermarché","Colruyt","Mercadona","Esselunga","Conad",
  "Kesko","ICA Gruppen","Loblaws","Sobeys","Coles","Pick n Pay",
  "Shoprite","Seven & i Holdings","Aeon","JD.com","Alibaba Fresh",
];
const PRODUCTS = [
  "KitKat 4-Finger 45g","Nescafé Gold 200g","Maggi 2-Min Noodles","Purina ONE Chicken 1.5kg",
  "Perrier Sparkling 750ml","Häagen-Dazs Vanilla 460ml","Nido Fortified 900g","Milo Active-Go 400g",
  "Garden Gourmet Burger 2pk","S.Pellegrino 500ml","Smarties Box 120g","Carnation Evap 410g",
  "Nestlé Pure Life 1.5L","Coffee-mate 400g","Cheerios Multigrain 375g","Aero Mint 36g",
  "Buitoni Fettuccine 500g","Toll House Morsels 350g","Gerber Organic Pouch","Lean Cuisine 300g",
  "After Eight 200g","Milkybar 25g","Nespresso Lungo 10pk","Vittel 1L",
];
const STATUSES = ["confirmed","processing","shipped","delivered","invoiced"];
const PRIORITIES = ["standard","high","urgent","express"];
const CURRENCIES = ["EUR","USD","GBP","CHF","JPY","AUD","CAD","BRL","CNY"];
const SITES = [
  "Vevey CH","Frankfurt DE","York UK","Glendale US","São Paulo BR",
  "Shanghai CN","Kuala Lumpur MY","Dubai AE","Lagos NG","Mexico City MX",
  "Toronto CA","Tokyo JP","Sydney AU","Mumbai IN","Paris FR",
];

function fakeOrder(i) {
  const d = new Date(2026, 2, 10, 6, 0);
  d.setMinutes(d.getMinutes() - i * 7 - Math.floor(Math.random() * 5));
  return {
    order_id:       900000 + i,
    order_number:   `SO-2026-${String(900000 + i).slice(-6)}`,
    customer:       CUSTOMERS[i % CUSTOMERS.length],
    order_date:     d.toISOString().replace("T", " ").slice(0, 19),
    requested_date: new Date(d.getTime() + (2 + Math.floor(Math.random() * 12)) * 86400000)
                      .toISOString().slice(0, 10),
    ship_to:        SITES[i % SITES.length],
    total_amount:   (500 + Math.random() * 95000).toFixed(2),
    currency:       CURRENCIES[i % CURRENCIES.length],
    priority:       PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
    status:         STATUSES[Math.floor(Math.random() * STATUSES.length)],
    lines:          1 + Math.floor(Math.random() * 12),
    product_sample: PRODUCTS[i % PRODUCTS.length],
  };
}

const COLS = [
  { key: "order_id",       label: "ORDER_ID",       w: 80  },
  { key: "order_number",   label: "ORDER_NUMBER",    w: 140 },
  { key: "customer",       label: "CUSTOMER",        w: 160 },
  { key: "product_sample", label: "PRODUCT (TOP LINE)", w: 190 },
  { key: "order_date",     label: "ORDER_DATE",      w: 155 },
  { key: "requested_date", label: "REQUESTED_DATE",  w: 105 },
  { key: "ship_to",        label: "SHIP_TO_SITE",    w: 120 },
  { key: "total_amount",   label: "TOTAL_AMOUNT",    w: 100, align: "right" },
  { key: "currency",       label: "CURRENCY",        w: 70 },
  { key: "priority",       label: "PRIORITY",        w: 80 },
  { key: "status",         label: "STATUS",           w: 90 },
  { key: "lines",          label: "LINES",            w: 50, align: "right" },
];

/* ─── Status + Priority pills ──────────────────────────────────────── */
function statusColor(s) {
  if (s === "delivered" || s === "invoiced") return T.green;
  if (s === "shipped")      return T.primary;
  if (s === "processing")   return T.amber;
  return T.sub;
}
function prioColor(p) {
  if (p === "urgent" || p === "express") return T.red;
  if (p === "high") return T.amber;
  return T.sub;
}

/* ─── Reusable table ───────────────────────────────────────────────── */
function DataTable({ rows, fontSize = 12, rowHeight = 32, showRowNums = false, title, subtitle }) {
  const headerBg = "#0D1118";
  return (
    <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
      {title && (
        <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: "'IBM Plex Mono', monospace" }}>
            {title}
          </span>
          {subtitle && (
            <span style={{ fontSize: 11, color: T.muted, marginLeft: 12 }}>{subtitle}</span>
          )}
        </div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%", borderCollapse: "collapse",
          fontFamily: "'IBM Plex Mono', monospace", fontSize, color: T.text,
        }}>
          <thead>
            <tr style={{ background: headerBg }}>
              {showRowNums && (
                <th style={{ padding: "8px 6px", textAlign: "right", color: T.muted, fontWeight: 600, fontSize: fontSize - 1, borderBottom: `1px solid ${T.border}`, width: 40 }}>#</th>
              )}
              {COLS.map(c => (
                <th key={c.key} style={{
                  padding: "8px 10px", textAlign: c.align || "left",
                  color: T.sub, fontWeight: 600, fontSize: fontSize - 1,
                  borderBottom: `1px solid ${T.border}`,
                  whiteSpace: "nowrap", minWidth: c.w,
                }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.order_id} style={{
                height: rowHeight,
                background: i % 2 === 0 ? "transparent" : "#ffffff04",
                borderBottom: `1px solid ${T.border}22`,
              }}>
                {showRowNums && (
                  <td style={{ padding: "4px 6px", textAlign: "right", color: T.muted, fontSize: fontSize - 1 }}>{i + 1}</td>
                )}
                {COLS.map(c => {
                  let val = row[c.key];
                  let style = {
                    padding: "4px 10px", textAlign: c.align || "left",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    maxWidth: c.w,
                  };

                  // Color code status + priority
                  if (c.key === "status") {
                    return (
                      <td key={c.key} style={style}>
                        <span style={{
                          display: "inline-block", padding: "2px 8px", borderRadius: 10,
                          fontSize: fontSize - 1, fontWeight: 600,
                          background: statusColor(val) + "18", color: statusColor(val),
                        }}>{val}</span>
                      </td>
                    );
                  }
                  if (c.key === "priority") {
                    return (
                      <td key={c.key} style={style}>
                        <span style={{ color: prioColor(val), fontWeight: val === "standard" ? 400 : 600 }}>{val}</span>
                      </td>
                    );
                  }
                  if (c.key === "total_amount") {
                    return <td key={c.key} style={style}>{Number(val).toLocaleString("en", { minimumFractionDigits: 2 })}</td>;
                  }

                  return <td key={c.key} style={style}>{val}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Generate row sets ────────────────────────────────────────────── */
const ROWS_5   = Array.from({ length: 5 },   (_, i) => fakeOrder(i));
const ROWS_200 = Array.from({ length: 200 }, (_, i) => fakeOrder(i));

/* ─── Main page ────────────────────────────────────────────────────── */
export default function DataScale() {
  const [view, setView] = useState("close");

  const views = [
    { id: "close",   label: "① Close-up (5 rows)" },
    { id: "medium",  label: "② 200 rows" },
    { id: "table",   label: "③ Single ERD table" },
    { id: "full",    label: "④ Full ERD (100 tables)" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, padding: 24,
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
    }}>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {views.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            style={{
              padding: "8px 16px", borderRadius: 6, cursor: "pointer",
              border: `1px solid ${view === v.id ? T.primary : T.border}`,
              background: view === v.id ? T.primary + "22" : T.surface,
              color: view === v.id ? T.primary : T.sub,
              fontWeight: 600, fontSize: 13,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >{v.label}</button>
        ))}
      </div>

      {/* ① Close-up */}
      {view === "close" && (
        <div style={{ maxWidth: 1400 }}>
          <DataTable
            rows={ROWS_5}
            fontSize={13}
            rowHeight={38}
            title="sales_order"
            subtitle="5 of 847,293 rows · Nestlé Supply Chain Operations"
          />
        </div>
      )}

      {/* ② 200 rows — smaller font to sell the density */}
      {view === "medium" && (
        <div style={{ maxWidth: 1400 }}>
          <DataTable
            rows={ROWS_200}
            fontSize={9}
            rowHeight={20}
            showRowNums
            title="sales_order"
            subtitle="showing 200 of 847,293 rows"
          />
        </div>
      )}

      {/* ③ Single domain ERD — Procurement (contains sales_order) */}
      {view === "table" && (
        <div>
          <div style={{
            padding: "16px 24px",
            background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`,
          }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: "'IBM Plex Mono', monospace" }}>
                Procurement Domain — ERD
              </span>
              <span style={{ fontSize: 11, color: T.muted, marginLeft: 12 }}>9 tables · foreign keys to master data</span>
            </div>
            <div style={{ overflow: "auto", borderRadius: 4 }}>
              <img
                src="/erd_procurement.svg"
                alt="Procurement ERD"
                style={{ height: 600, width: "auto" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ④ All 10 domains tiled */}
      {view === "full" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: "'IBM Plex Mono', monospace" }}>
              Full Schema — 100 tables · 226 relationships · 10 domains
            </span>
            <span style={{ fontSize: 11, color: T.muted, marginLeft: 12 }}>Nestlé Supply Chain Operations</span>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
            gap: 12,
          }}>
            {[
              { file: "erd_master_data.svg",   label: "Master Data & Reference",    tables: 14 },
              { file: "erd_organization.svg",   label: "Organization & Personnel",   tables: 7  },
              { file: "erd_supplier_mgmt.svg",  label: "Supplier Management",        tables: 11 },
              { file: "erd_procurement.svg",     label: "Procurement",                tables: 9  },
              { file: "erd_inventory.svg",       label: "Inventory Management",       tables: 11 },
              { file: "erd_production.svg",      label: "Production & Manufacturing", tables: 14 },
              { file: "erd_quality.svg",         label: "Quality Control",            tables: 9  },
              { file: "erd_logistics.svg",       label: "Logistics & Cold Chain",     tables: 13 },
              { file: "erd_alerts.svg",          label: "Alerts & Monitoring",        tables: 4  },
              { file: "erd_kpis_demand.svg",     label: "KPIs, Analytics & Demand",   tables: 9  },
            ].map(d => (
              <div key={d.file} style={{
                background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`,
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "8px 14px", borderBottom: `1px solid ${T.border}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.text, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {d.label}
                  </span>
                  <span style={{ fontSize: 10, color: T.muted }}>{d.tables} tables</span>
                </div>
                <div style={{ padding: 8, overflow: "hidden" }}>
                  <img
                    src={`/${d.file}`}
                    alt={d.label}
                    style={{ width: "100%", height: "auto", borderRadius: 4 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
