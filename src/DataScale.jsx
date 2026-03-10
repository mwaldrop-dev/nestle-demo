import { useState, useRef, useCallback, useEffect } from "react";
import html2canvas from "html2canvas";

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

/* ─── Export helpers ────────────────────────────────────────────────── */
const btnStyle = (busy) => ({
  padding: "6px 12px", borderRadius: 6, cursor: busy ? "wait" : "pointer",
  border: `1px solid ${T.border}`,
  background: T.surface2, color: T.sub,
  fontWeight: 600, fontSize: 11,
  fontFamily: "'IBM Plex Mono', monospace",
  display: "flex", alignItems: "center", gap: 5,
  opacity: busy ? 0.5 : 1, transition: "opacity 0.2s",
});

function ExportButtons({ targetRef, filename }) {
  const [busy, setBusy] = useState(null); // null | "png" | "svg"

  const exportPng = useCallback(async () => {
    if (!targetRef.current || busy) return;
    setBusy("png");
    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: "#0E1117",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    } finally {
      setBusy(null);
    }
  }, [targetRef, filename, busy]);

  const exportSvg = useCallback(() => {
    if (!targetRef.current || busy) return;
    setBusy("svg");
    try {
      const el = targetRef.current;
      const rect = el.getBoundingClientRect();
      const clone = el.cloneNode(true);

      // Inline all computed styles so SVG renders standalone
      const inlineStyles = (source, target) => {
        const computed = window.getComputedStyle(source);
        for (let i = 0; i < computed.length; i++) {
          const prop = computed[i];
          target.style.setProperty(prop, computed.getPropertyValue(prop));
        }
        const srcChildren = source.children;
        const tgtChildren = target.children;
        for (let i = 0; i < srcChildren.length; i++) {
          inlineStyles(srcChildren[i], tgtChildren[i]);
        }
      };
      inlineStyles(el, clone);

      const svgNs = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNs, "svg");
      svg.setAttribute("xmlns", svgNs);
      svg.setAttribute("width", rect.width);
      svg.setAttribute("height", rect.height);
      svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);

      const fo = document.createElementNS(svgNs, "foreignObject");
      fo.setAttribute("width", "100%");
      fo.setAttribute("height", "100%");
      fo.setAttribute("x", "0");
      fo.setAttribute("y", "0");

      const body = document.createElement("div");
      body.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
      body.appendChild(clone);
      fo.appendChild(body);
      svg.appendChild(fo);

      const blob = new Blob(
        ['<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(svg)],
        { type: "image/svg+xml" }
      );
      const link = document.createElement("a");
      link.download = `${filename}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("SVG export failed:", err);
    } finally {
      setBusy(null);
    }
  }, [targetRef, filename, busy]);

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button onClick={exportPng} disabled={!!busy} style={btnStyle(busy === "png")}>
        <span style={{ fontSize: 13 }}>⬇</span>
        {busy === "png" ? "Exporting…" : "PNG (2×)"}
      </button>
      <button onClick={exportSvg} disabled={!!busy} style={btnStyle(busy === "svg")}>
        <span style={{ fontSize: 13 }}>⬇</span>
        {busy === "svg" ? "Exporting…" : "SVG"}
      </button>
    </div>
  );
}

/* ─── Data flow animation for ERD ──────────────────────────────────── */
const ANIMATION_CSS = `
@keyframes erd-entity-glow {
  0%, 100% { filter: none; }
  50% { filter: drop-shadow(0 0 16px ${T.primary}) drop-shadow(0 0 8px ${T.primary}); }
}
@keyframes erd-line-glow {
  0%   { stroke: #5A7A9A; stroke-width: 1px; }
  50%  { stroke: ${T.primary}; stroke-width: 2.5px; }
  100% { stroke: #5A7A9A; stroke-width: 1px; }
}
@keyframes erd-dot-pulse {
  0%, 100% { r: 12; opacity: 0.9; }
  50% { r: 18; opacity: 1; }
}
.erd-entity-active { animation: erd-entity-glow 1.2s ease-in-out; }
.erd-line-active { stroke: ${T.primary} !important; stroke-width: 3px !important;
  filter: drop-shadow(0 0 8px ${T.primary}); }
`;

const GLOW_FILTER = `
<filter id="data-flow-glow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="3" result="blur"/>
  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>`;

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function parseRelationships(svgEl) {
  const paths = svgEl.querySelectorAll("path.relationshipLine");
  const rels = [];
  paths.forEach(p => {
    const id = p.getAttribute("id") || "";
    // ID format: id_entity-SOURCE-N_entity-TARGET-M_SEQ
    const m = id.match(/^id_(entity-[^_]+(?:_[^_]+)*-\d+)_(entity-[^_]+(?:_[^_]+)*-\d+)_(\d+)$/);
    if (m) rels.push({ pathId: id, sourceId: m[1], targetId: m[2] });
  });
  return rels;
}

function animateDot(pathEl, svgEl, duration) {
  return new Promise(resolve => {
    const ns = "http://www.w3.org/2000/svg";
    const totalLen = pathEl.getTotalLength();
    const dot = document.createElementNS(ns, "circle");
    dot.setAttribute("r", "14");
    dot.setAttribute("fill", T.primary);
    dot.setAttribute("filter", "url(#data-flow-glow)");
    dot.setAttribute("data-flow-dot", "");
    dot.style.animation = "erd-dot-pulse 0.6s ease-in-out infinite";
    const trail = document.createElementNS(ns, "circle");
    trail.setAttribute("r", "24");
    trail.setAttribute("fill", "none");
    trail.setAttribute("stroke", T.primary);
    trail.setAttribute("stroke-width", "3");
    trail.setAttribute("opacity", "0.3");
    trail.setAttribute("data-flow-dot", "");
    svgEl.appendChild(trail);
    svgEl.appendChild(dot);

    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeInOut(progress);
      const pt = pathEl.getPointAtLength(eased * totalLen);
      dot.setAttribute("cx", pt.x);
      dot.setAttribute("cy", pt.y);
      const trailPt = pathEl.getPointAtLength(Math.max(0, eased - 0.06) * totalLen);
      trail.setAttribute("cx", trailPt.x);
      trail.setAttribute("cy", trailPt.y);
      if (progress < 1) requestAnimationFrame(step);
      else { dot.remove(); trail.remove(); resolve(); }
    }
    requestAnimationFrame(step);
  });
}

function highlightEntity(entityId, svgEl) {
  const g = svgEl.querySelector(`[id="${entityId}"]`);
  if (!g) return;
  g.classList.add("erd-entity-active");
  // Flash random attribute rows
  const rows = g.querySelectorAll('g[class*="row-rect"]');
  const arr = Array.from(rows).sort(() => Math.random() - 0.5).slice(0, 3);
  arr.forEach((row, i) => {
    setTimeout(() => {
      const fill = row.querySelector("path[fill], rect[fill]");
      if (fill) {
        const orig = fill.getAttribute("fill");
        fill.setAttribute("fill", "rgba(59,158,255,0.18)");
        setTimeout(() => fill.setAttribute("fill", orig), 500);
      }
    }, i * 120);
  });
}

function unhighlightEntity(entityId, svgEl) {
  const g = svgEl.querySelector(`[id="${entityId}"]`);
  if (g) g.classList.remove("erd-entity-active");
}

function useDataFlowAnimation(containerRef, svgReady, isAnimating) {
  const cancelRef = useRef(true);

  useEffect(() => {
    if (!svgReady || !isAnimating) { cancelRef.current = true; return; }
    cancelRef.current = false;
    const container = containerRef.current;
    if (!container) return;
    const svgEl = container.querySelector("svg");
    if (!svgEl) return;

    const rels = parseRelationships(svgEl);
    if (!rels.length) return;

    let idx = 0;
    async function run() {
      while (!cancelRef.current) {
        const rel = rels[idx % rels.length];
        const pathEl = svgEl.querySelector(`[id="${rel.pathId}"]`);

        // Phase 1: highlight source
        highlightEntity(rel.sourceId, svgEl);
        await delay(600);
        if (cancelRef.current) break;

        // Phase 2: animate dot along path
        if (pathEl) {
          pathEl.classList.add("erd-line-active");
          await animateDot(pathEl, svgEl, 1200);
        }
        if (cancelRef.current) break;

        // Phase 3: highlight target
        highlightEntity(rel.targetId, svgEl);
        await delay(600);
        if (cancelRef.current) break;

        // Phase 4: cooldown
        unhighlightEntity(rel.sourceId, svgEl);
        unhighlightEntity(rel.targetId, svgEl);
        if (pathEl) pathEl.classList.remove("erd-line-active");
        await delay(300);

        idx++;
      }
    }
    run();

    return () => {
      cancelRef.current = true;
      if (svgEl) {
        svgEl.querySelectorAll(".erd-entity-active").forEach(el => el.classList.remove("erd-entity-active"));
        svgEl.querySelectorAll(".erd-line-active").forEach(el => el.classList.remove("erd-line-active"));
        svgEl.querySelectorAll("[data-flow-dot]").forEach(el => el.remove());
      }
    };
  }, [containerRef, svgReady, isAnimating]);
}

/* ─── Main page ────────────────────────────────────────────────────── */
export default function DataScale() {
  const [view, setView] = useState("close");
  const captureRef = useRef(null);
  const [svgContent, setSvgContent] = useState(null);
  const [animating, setAnimating] = useState(true);
  const [svgReady, setSvgReady] = useState(false);
  const svgContainerRef = useRef(null);

  // Fetch SVG for inline rendering — patch width/height to scale in container
  useEffect(() => {
    if (view === "table") {
      fetch("/erd_procurement.svg").then(r => r.text()).then(text => {
        // Replace fixed width/height so SVG scales to container
        let patched = text
          .replace(/(<svg[^>]*)\swidth="[^"]*"/, '$1 width="100%"')
          .replace(/(<svg[^>]*)\sheight="[^"]*"/, '$1 height="100%"');
        // Inject glow filter into existing <defs> or after <svg> opening tag
        const glowDef = `<defs><filter id="data-flow-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
        patched = patched.replace(/(<svg[^>]*>)/, `$1${glowDef}`);
        setSvgContent(patched);
      });
    } else {
      setSvgContent(null);
      setSvgReady(false);
    }
  }, [view]);

  // Inject animation CSS + glow filter into inlined SVG
  useEffect(() => {
    if (!svgContent || !svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;

    const ns = "http://www.w3.org/2000/svg";
    const styleEl = document.createElementNS(ns, "style");
    styleEl.textContent = ANIMATION_CSS;
    svgEl.insertBefore(styleEl, svgEl.firstChild);

    setSvgReady(true);
  }, [svgContent]);

  useDataFlowAnimation(svgContainerRef, svgReady, animating);

  const views = [
    { id: "close",   label: "① Close-up (5 rows)" },
    { id: "medium",  label: "② 200 rows" },
    { id: "table",   label: "③ Single ERD table" },
    { id: "mega",    label: "④ Full ERD (1 image)" },
    { id: "full",    label: "⑤ All 10 domains" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, padding: 24,
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
    }}>
      {/* Tab bar + export */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
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
        <div style={{ marginLeft: "auto" }}>
          <ExportButtons targetRef={captureRef} filename={`nestle-data-scale-${view}`} />
        </div>
      </div>

      {/* Capture wrapper — everything inside here gets exported */}
      <div ref={captureRef} style={{ background: T.bg, padding: 4 }}>

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

      {/* ③ Single domain ERD — Procurement with data flow animation */}
      {view === "table" && (
        <div>
          <div style={{
            padding: "16px 24px",
            background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`,
          }}>
            <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: "'IBM Plex Mono', monospace" }}>
                  Procurement Domain — ERD
                </span>
                <span style={{ fontSize: 11, color: T.muted, marginLeft: 12 }}>9 tables · foreign keys to master data</span>
              </div>
              <button
                onClick={() => setAnimating(a => !a)}
                style={{
                  ...btnStyle(false),
                  background: animating ? T.primary + "22" : T.surface2,
                  borderColor: animating ? T.primary : T.border,
                  color: animating ? T.primary : T.sub,
                }}
              >
                <span style={{ fontSize: 13 }}>{animating ? "⏸" : "▶"}</span>
                {animating ? "Pause Flow" : "Animate Flow"}
              </button>
            </div>
            <div
              ref={svgContainerRef}
              dangerouslySetInnerHTML={{ __html: svgContent || "" }}
              style={{ overflow: "auto", borderRadius: 4, height: 600 }}
            />
          </div>
        </div>
      )}

      {/* ④ Full ERD — Mermaid-rendered single image */}
      {view === "mega" && (
        <div style={{
          background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`,
          overflow: "hidden",
        }}>
          <div style={{
            padding: "12px 20px", borderBottom: `1px solid ${T.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: "'IBM Plex Mono', monospace" }}>
              Full Schema — 100 tables · 226 relationships
            </span>
            <span style={{ fontSize: 11, color: T.muted }}>Nestlé Supply Chain Operations</span>
          </div>
          <div style={{ padding: 16, overflow: "auto", maxHeight: "75vh" }}>
            <img
              src="/erd_overview_mermaid.svg"
              alt="Full ERD — 100 tables"
              style={{ width: 14853, height: 4519, maxWidth: "none" }}
            />
          </div>
        </div>
      )}

      {/* ⑤ All 10 domains tiled */}
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
      {/* end capture wrapper */}
    </div>
  );
}
