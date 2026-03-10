import { useState, useRef, useCallback, useEffect } from "react";
import html2canvas from "html2canvas";
import { GIFEncoder, quantize, applyPalette } from "gifenc";

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

/* ─── Animated GIF export ──────────────────────────────────────────── */
const GIF_FPS = 6;
const GIF_DURATION_S = 5;
const GIF_TOTAL_FRAMES = GIF_FPS * GIF_DURATION_S; // 30
const GIF_FRAME_DELAY = Math.round(1000 / GIF_FPS);  // 167ms

function GifExportButton({ animWrapperRef, animating, setAnimating, gifState, setGifState }) {
  const abortRef = useRef(false);

  const startRecording = useCallback(async () => {
    if (!animWrapperRef.current || gifState) return;
    abortRef.current = false;

    // Force animation on if paused
    if (!animating) setAnimating(true);

    setGifState({ phase: "capturing", frame: 0, total: GIF_TOTAL_FRAMES });

    const wrapperEl = animWrapperRef.current;
    const frames = []; // store captured canvases

    // Capture frames
    for (let i = 0; i < GIF_TOTAL_FRAMES; i++) {
      if (abortRef.current) break;
      const t0 = performance.now();

      // Hide recording overlay during capture
      const ov = wrapperEl.querySelector("[data-gif-overlay]");
      if (ov) ov.style.display = "none";

      try {
        const canvas = await html2canvas(wrapperEl, {
          backgroundColor: "#0E1117",
          scale: 1,
          useCORS: true,
          logging: false,
        });
        frames.push(canvas);
      } catch (err) {
        console.error("Frame capture failed:", err);
      }

      if (ov) ov.style.display = "";


      setGifState({ phase: "capturing", frame: i + 1, total: GIF_TOTAL_FRAMES });

      // Wait to maintain ~real-time capture pace
      const elapsed = performance.now() - t0;
      const wait = Math.max(0, GIF_FRAME_DELAY - elapsed);
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
    }

    if (abortRef.current || frames.length === 0) {
      setGifState(null);
      return;
    }

    // Encoding phase
    setGifState({ phase: "encoding", frame: frames.length, total: GIF_TOTAL_FRAMES });

    // Small yield to let React render the "Encoding" state
    await new Promise(r => setTimeout(r, 50));

    try {
      const w = frames[0].width;
      const h = frames[0].height;
      const gif = GIFEncoder();

      for (let i = 0; i < frames.length; i++) {
        const ctx = frames[i].getContext("2d");
        const { data } = ctx.getImageData(0, 0, w, h);
        const palette = quantize(data, 256, { format: "rgba4444" });
        const index = applyPalette(data, palette, "rgba4444");
        gif.writeFrame(index, w, h, { palette, delay: GIF_FRAME_DELAY, dispose: 2 });

        // Yield every few frames to keep UI responsive
        if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
      }

      gif.finish();
      const blob = new Blob([gif.bytes()], { type: "image/gif" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `nestle-erd-data-flow-${Date.now()}.gif`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("GIF encoding failed:", err);
    }

    // Free memory
    frames.length = 0;
    setGifState(null);
  }, [animWrapperRef, animating, setAnimating, gifState, setGifState]);

  const cancel = useCallback(() => {
    abortRef.current = true;
  }, []);

  const recording = !!gifState;
  const label = !gifState
    ? "GIF"
    : gifState.phase === "capturing"
    ? `REC ${gifState.frame}/${gifState.total}`
    : "Encoding…";

  return (
    <button
      onClick={recording ? cancel : startRecording}
      style={{
        ...btnStyle(gifState?.phase === "encoding"),
        background: recording ? "#F0525222" : T.surface2,
        borderColor: recording ? "#F05252" : T.border,
        color: recording ? "#F05252" : T.sub,
        minWidth: 90,
      }}
    >
      <span style={{ fontSize: 13 }}>
        {!gifState ? "⬇" : gifState.phase === "capturing" ? "⏺" : "⏳"}
      </span>
      {recording ? label : "GIF"}
      {recording && gifState.phase === "capturing" && (
        <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.6 }}>cancel</span>
      )}
    </button>
  );
}

/* ─── Data flow animation for ERD ──────────────────────────────────── */
const NV = "#76B900"; // Nvidia green
const NV2 = "#9AE62E"; // lighter Nvidia green for accents

const ANIMATION_CSS = `
@keyframes erd-entity-glow {
  0%, 100% { filter: none; }
  50% { filter: drop-shadow(0 0 20px ${NV}) drop-shadow(0 0 10px ${NV}); }
}
@keyframes erd-dot-pulse {
  0%, 100% { r: 12; opacity: 0.85; }
  50% { r: 20; opacity: 1; }
}
@keyframes erd-row-flash {
  0% { fill: rgba(118,185,0,0); }
  30% { fill: rgba(118,185,0,0.25); }
  100% { fill: rgba(118,185,0,0); }
}
.erd-entity-active { animation: erd-entity-glow 1s ease-in-out; }
.erd-line-active { stroke: ${NV} !important; stroke-width: 3px !important;
  filter: drop-shadow(0 0 10px ${NV}); transition: stroke 0.3s, stroke-width 0.3s; }
`;

const GLOW_FILTER = `
<filter id="data-flow-glow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="4" result="blur"/>
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
    const m = id.match(/^id_(entity-[^_]+(?:_[^_]+)*-\d+)_(entity-[^_]+(?:_[^_]+)*-\d+)_(\d+)$/);
    if (m) rels.push({ pathId: id, sourceId: m[1], targetId: m[2] });
  });
  return rels;
}

function animateDot(pathEl, svgEl, duration, cancelled) {
  return new Promise(resolve => {
    const ns = "http://www.w3.org/2000/svg";
    const totalLen = pathEl.getTotalLength();

    // Main dot
    const dot = document.createElementNS(ns, "circle");
    dot.setAttribute("r", "14");
    dot.setAttribute("fill", NV);
    dot.setAttribute("filter", "url(#data-flow-glow)");
    dot.setAttribute("data-flow-dot", "");
    dot.style.animation = "erd-dot-pulse 0.5s ease-in-out infinite";

    // Outer ring trail
    const trail = document.createElementNS(ns, "circle");
    trail.setAttribute("r", "26");
    trail.setAttribute("fill", "none");
    trail.setAttribute("stroke", NV);
    trail.setAttribute("stroke-width", "2");
    trail.setAttribute("opacity", "0.35");
    trail.setAttribute("data-flow-dot", "");

    // Comet tail — a second trailing dot
    const tail = document.createElementNS(ns, "circle");
    tail.setAttribute("r", "8");
    tail.setAttribute("fill", NV2);
    tail.setAttribute("opacity", "0.5");
    tail.setAttribute("data-flow-dot", "");

    svgEl.appendChild(trail);
    svgEl.appendChild(tail);
    svgEl.appendChild(dot);

    const start = performance.now();
    function step(now) {
      if (cancelled()) { dot.remove(); trail.remove(); tail.remove(); resolve(); return; }
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeInOut(progress);
      const pt = pathEl.getPointAtLength(eased * totalLen);
      dot.setAttribute("cx", pt.x);
      dot.setAttribute("cy", pt.y);
      const trailPt = pathEl.getPointAtLength(Math.max(0, eased - 0.04) * totalLen);
      trail.setAttribute("cx", trailPt.x);
      trail.setAttribute("cy", trailPt.y);
      const tailPt = pathEl.getPointAtLength(Math.max(0, eased - 0.10) * totalLen);
      tail.setAttribute("cx", tailPt.x);
      tail.setAttribute("cy", tailPt.y);
      if (progress < 1) requestAnimationFrame(step);
      else { dot.remove(); trail.remove(); tail.remove(); resolve(); }
    }
    requestAnimationFrame(step);
  });
}

function highlightEntity(entityId, svgEl) {
  const g = svgEl.querySelector(`[id="${entityId}"]`);
  if (!g) return;
  // Remove first in case it's already active (resets the animation)
  g.classList.remove("erd-entity-active");
  void g.offsetWidth; // force reflow to restart animation
  g.classList.add("erd-entity-active");
  // Auto-remove glow after animation completes
  setTimeout(() => g.classList.remove("erd-entity-active"), 1200);
  const rows = g.querySelectorAll('g[class*="row-rect"]');
  const arr = Array.from(rows).sort(() => Math.random() - 0.5).slice(0, 4);
  arr.forEach((row, i) => {
    setTimeout(() => {
      const fill = row.querySelector("path[fill], rect[fill]");
      if (fill) {
        const orig = fill.getAttribute("fill");
        fill.setAttribute("fill", "rgba(118,185,0,0.22)");
        setTimeout(() => fill.setAttribute("fill", orig), 600);
      }
    }, i * 100);
  });
}

function unhighlightEntity(entityId, svgEl) {
  const g = svgEl.querySelector(`[id="${entityId}"]`);
  if (g) g.classList.remove("erd-entity-active");
}

// After a path animation, launch a visible HTML dot from the entity upward through
// the CPU or GPU processor box, then continue to the SQL Engine box.
function launchUpliftDot(entityId, svgEl, cancelled, wrapperEl, phase) {
  if (cancelled() || !wrapperEl) return;
  const g = svgEl.querySelector(`[id="${entityId}"]`);
  if (!g) return;

  const selector = phase === "gpu" ? "[data-gpu-box]" : "[data-cpu-box]";
  const procBox = wrapperEl.querySelector(selector);
  if (!procBox) return;

  const gRect = g.getBoundingClientRect();
  const wrapRect = wrapperEl.getBoundingClientRect();
  const procRect = procBox.getBoundingClientRect();

  // Start: center-top of entity box
  const startX = gRect.left + gRect.width / 2 - wrapRect.left;
  const startY = gRect.top - wrapRect.top;

  // Midpoint: center of the processor box (CPU or GPU)
  const midX = procRect.left + procRect.width / 2 - wrapRect.left;
  const midY = procRect.top + procRect.height / 2 - wrapRect.top;

  // End: center of the SQL Engine box (top of wrapper, ~35px)
  const endX = wrapRect.width / 2;
  const endY = 25;

  const dotColor = phase === "gpu" ? NV2 : "#7EC8FF"; // green for GPU, light blue for CPU
  const glowColor = phase === "gpu" ? NV : CPU_COLOR;

  const dot = document.createElement("div");
  Object.assign(dot.style, {
    position: "absolute",
    left: `${startX}px`,
    top: `${startY}px`,
    width: "12px",
    height: "12px",
    marginLeft: "-6px",
    marginTop: "-6px",
    borderRadius: "50%",
    background: dotColor,
    boxShadow: `0 0 14px ${glowColor}, 0 0 6px ${glowColor}`,
    zIndex: "10",
    pointerEvents: "none",
  });
  dot.setAttribute("data-uplift-dot", "");

  const streak = document.createElement("div");
  Object.assign(streak.style, {
    position: "absolute",
    left: `${startX}px`,
    top: `${startY}px`,
    width: "3px",
    marginLeft: "-1.5px",
    height: "0px",
    borderRadius: "2px",
    background: glowColor,
    opacity: "0.5",
    zIndex: "9",
    pointerEvents: "none",
  });
  streak.setAttribute("data-uplift-dot", "");

  wrapperEl.appendChild(streak);
  wrapperEl.appendChild(dot);

  // Two-segment animation: entity → processor box → SQL engine
  // Segment 1 ends at 0.5 progress (arrive at processor box)
  // Segment 2 ends at 1.0 progress (arrive at SQL engine)
  const totalDuration = phase === "gpu" ? (700 + Math.random() * 200) : (1200 + Math.random() * 400);
  const startTime = performance.now();

  function step(now) {
    if (cancelled()) { dot.remove(); streak.remove(); return; }
    const progress = Math.min((now - startTime) / totalDuration, 1);
    const eased = progress * progress * (3 - 2 * progress);

    let x, y;
    if (eased < 0.5) {
      // Segment 1: entity → processor box center
      const seg = eased / 0.5; // 0..1 within segment
      x = startX + (midX - startX) * seg;
      y = startY + (midY - startY) * seg;
    } else {
      // Segment 2: processor box center → SQL engine
      const seg = (eased - 0.5) / 0.5; // 0..1 within segment
      x = midX + (endX - midX) * seg;
      y = midY + (endY - midY) * seg;
    }

    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.style.opacity = String(1 - progress * 0.3);
    const size = 12 * (1 - progress * 0.25);
    dot.style.width = dot.style.height = `${size}px`;
    dot.style.marginLeft = `${-size / 2}px`;
    dot.style.marginTop = `${-size / 2}px`;

    const streakLen = Math.min(50 * Math.sin(progress * Math.PI), 50);
    streak.style.left = `${x}px`;
    streak.style.top = `${y}px`;
    streak.style.height = `${Math.max(0, streakLen)}px`;
    streak.style.opacity = String(0.6 * (1 - progress * 0.5));

    if (progress < 1) requestAnimationFrame(step);
    else { dot.remove(); streak.remove(); }
  }
  requestAnimationFrame(step);
}

// Phase-specific animation parameters
const PHASE_CONFIG = {
  cpu: { flows: 1, dotDuration: 1200, laneStagger: 0, gapMin: 800, gapMax: 1200, target: "cpu" },
  gpu: { flows: 6, dotDuration: 400,  laneStagger: 100, gapMin: 100, gapMax: 200,  target: "gpu" },
};

// Run a single relationship flow (source glow → dot travel → target glow → uplift → fade)
async function runOneFlow(rel, svgEl, cancelled, wrapperEl, phase) {
  const cfg = PHASE_CONFIG[phase] || PHASE_CONFIG.cpu;
  const pathEl = svgEl.querySelector(`[id="${rel.pathId}"]`);
  if (!pathEl || cancelled()) return;

  highlightEntity(rel.sourceId, svgEl);
  await delay(phase === "cpu" ? 400 : 150);
  if (cancelled()) return;

  if (pathEl) {
    pathEl.classList.add("erd-line-active");
    await animateDot(pathEl, svgEl, cfg.dotDuration, cancelled);
  }
  if (cancelled()) return;

  highlightEntity(rel.targetId, svgEl);
  // Launch an uplift dot from the target entity toward the processor box
  launchUpliftDot(rel.targetId, svgEl, cancelled, wrapperEl, phase);
  await delay(phase === "cpu" ? 400 : 100);
  if (cancelled()) return;

  if (pathEl) pathEl.classList.remove("erd-line-active");
}

function useDataFlowAnimation(containerRef, wrapperRef, svgReady, isAnimating, animPhase) {
  const cancelRef = useRef(true);

  useEffect(() => {
    if (!svgReady || !isAnimating) { cancelRef.current = true; return; }
    cancelRef.current = false;
    const container = containerRef.current;
    const wrapperEl = wrapperRef?.current;
    if (!container) return;
    const svgEl = container.querySelector("svg");
    if (!svgEl) return;

    const rels = parseRelationships(svgEl);
    if (!rels.length) return;

    const cfg = PHASE_CONFIG[animPhase] || PHASE_CONFIG.cpu;
    const shuffled = [...rels].sort(() => Math.random() - 0.5);
    const cancelled = () => cancelRef.current;

    // Launch N staggered concurrent flow lanes
    const lanes = [];
    for (let lane = 0; lane < cfg.flows; lane++) {
      let idx = lane * Math.floor(shuffled.length / cfg.flows);
      const runLane = async () => {
        await delay(lane * cfg.laneStagger);
        while (!cancelled()) {
          const rel = shuffled[idx % shuffled.length];
          await runOneFlow(rel, svgEl, cancelled, wrapperEl, animPhase);
          if (cancelled()) break;
          await delay(cfg.gapMin + Math.random() * (cfg.gapMax - cfg.gapMin));
          idx++;
        }
      };
      lanes.push(runLane());
    }

    return () => {
      cancelRef.current = true;
      if (svgEl) {
        svgEl.querySelectorAll(".erd-entity-active").forEach(el => el.classList.remove("erd-entity-active"));
        svgEl.querySelectorAll(".erd-line-active").forEach(el => el.classList.remove("erd-line-active"));
        svgEl.querySelectorAll("[data-flow-dot]").forEach(el => el.remove());
      }
      if (wrapperEl) {
        wrapperEl.querySelectorAll("[data-uplift-dot]").forEach(el => el.remove());
      }
    };
  }, [containerRef, wrapperRef, svgReady, isAnimating, animPhase]);
}

/* ─── SQL Engine visual + rising dots ──────────────────────────────── */
const CPU_COLOR = T.primary; // "#3B9EFF" blue
const ENGINE_CSS = `
@keyframes engine-pulse {
  0%, 100% { box-shadow: 0 0 15px ${NV}44, 0 0 30px ${NV}22, inset 0 0 15px ${NV}11; }
  50%      { box-shadow: 0 0 25px ${NV}66, 0 0 50px ${NV}33, inset 0 0 25px ${NV}22; }
}
@keyframes engine-bar {
  0%   { width: 20%; opacity: 0.4; }
  50%  { width: 90%; opacity: 1; }
  100% { width: 20%; opacity: 0.4; }
}
@keyframes cpu-pulse {
  0%, 100% { box-shadow: 0 0 12px ${CPU_COLOR}44, 0 0 24px ${CPU_COLOR}22; }
  50%      { box-shadow: 0 0 20px ${CPU_COLOR}88, 0 0 40px ${CPU_COLOR}44; }
}
@keyframes gpu-pulse {
  0%, 100% { box-shadow: 0 0 12px ${NV}44, 0 0 24px ${NV}22; }
  50%      { box-shadow: 0 0 20px ${NV}88, 0 0 40px ${NV}44; }
}
`;

function SQLEngineBox({ animating }) {
  return (
    <div style={{
      position: "relative", zIndex: 2,
      margin: "0 auto 0", width: "fit-content", minWidth: 340,
      padding: "10px 28px 12px",
      background: T.surface2,
      border: `2px solid ${T.border}`,
      borderRadius: 10,
      boxShadow: animating ? `0 0 20px ${T.border}` : "none",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    }}>
      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>⚡</span>
        <span style={{
          fontSize: 15, fontWeight: 800, letterSpacing: 2,
          fontFamily: "'IBM Plex Mono', monospace",
          color: T.text, textTransform: "uppercase",
        }}>SQL Engine</span>
        <span style={{ fontSize: 18 }}>⚡</span>
      </div>
      {/* Activity bars */}
      <div style={{ display: "flex", gap: 4, width: "100%" }}>
        {[0, 0.4, 0.8, 1.2].map((d, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: `${T.muted}44`, overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: 2,
              background: NV,
              animation: animating ? `engine-bar ${1.8 + i * 0.3}s ease-in-out ${d}s infinite` : "none",
              width: "20%",
            }} />
          </div>
        ))}
      </div>
      {/* Subtitle */}
      <span style={{
        fontSize: 9, color: T.muted, fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: 1, textTransform: "uppercase",
      }}>Query Processing</span>
    </div>
  );
}

function ProcessorBoxes({ animPhase, animating }) {
  const cpuActive = animating && animPhase === "cpu";
  const gpuActive = animating && animPhase === "gpu";

  const boxBase = {
    flex: 1, maxWidth: 180, padding: "8px 16px 10px",
    borderRadius: 8, display: "flex", flexDirection: "column",
    alignItems: "center", gap: 4,
    transition: "opacity 0.6s, box-shadow 0.6s, border-color 0.6s",
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 24, margin: "12px auto 0", maxWidth: 420 }}>
      {/* CPU Box */}
      <div data-cpu-box style={{
        ...boxBase,
        background: cpuActive ? `${CPU_COLOR}11` : T.surface2,
        border: `2px solid ${cpuActive ? CPU_COLOR : T.border}`,
        opacity: gpuActive ? 0.3 : 1,
        animation: cpuActive ? "cpu-pulse 2s ease-in-out infinite" : "none",
      }}>
        <span style={{
          fontSize: 13, fontWeight: 800, letterSpacing: 2,
          fontFamily: "'IBM Plex Mono', monospace",
          color: cpuActive ? CPU_COLOR : T.sub, textTransform: "uppercase",
        }}>CPU</span>
        {/* Single activity bar (serial) */}
        <div style={{ width: "100%", height: 3, borderRadius: 2, background: `${CPU_COLOR}22`, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: CPU_COLOR,
            animation: cpuActive ? "engine-bar 2.5s ease-in-out infinite" : "none",
            width: "20%",
          }} />
        </div>
        <span style={{
          fontSize: 8, color: cpuActive ? `${CPU_COLOR}99` : T.muted,
          fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1, textTransform: "uppercase",
        }}>Serial Processing</span>
      </div>

      {/* GPU Box */}
      <div data-gpu-box style={{
        ...boxBase,
        background: gpuActive ? `${NV}11` : T.surface2,
        border: `2px solid ${gpuActive ? NV : T.border}`,
        opacity: cpuActive ? 0.3 : 1,
        animation: gpuActive ? "gpu-pulse 2s ease-in-out infinite" : "none",
      }}>
        <span style={{
          fontSize: 13, fontWeight: 800, letterSpacing: 2,
          fontFamily: "'IBM Plex Mono', monospace",
          color: gpuActive ? NV : T.sub, textTransform: "uppercase",
        }}>GPU</span>
        {/* Multiple activity bars (parallel) */}
        <div style={{ display: "flex", gap: 3, width: "100%" }}>
          {[0, 0.3, 0.6, 0.9, 1.2].map((d, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: `${NV}22`, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 2,
                background: NV,
                animation: gpuActive ? `engine-bar ${1.2 + i * 0.2}s ease-in-out ${d}s infinite` : "none",
                width: "20%",
              }} />
            </div>
          ))}
        </div>
        <span style={{
          fontSize: 8, color: gpuActive ? `${NV}99` : T.muted,
          fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1, textTransform: "uppercase",
        }}>Parallel Processing</span>
      </div>
    </div>
  );
}

function RisingDots({ animating, height }) {
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!animating || !containerRef.current) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const el = containerRef.current;

    function spawnDot() {
      const dot = document.createElement("div");
      const x = 15 + Math.random() * 70; // 15-85% horizontal
      const size = 4 + Math.random() * 6;
      const duration = 1.8 + Math.random() * 1.2;
      Object.assign(dot.style, {
        position: "absolute",
        bottom: "0",
        left: `${x}%`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: Math.random() > 0.3 ? NV : NV2,
        boxShadow: `0 0 ${size * 2}px ${NV}`,
        animation: `dot-rise ${duration}s ease-in forwards`,
        pointerEvents: "none",
      });
      el.appendChild(dot);
      setTimeout(() => dot.remove(), duration * 1000);
    }

    // Spawn immediately a few
    for (let i = 0; i < 3; i++) setTimeout(spawnDot, i * 200);
    intervalRef.current = setInterval(spawnDot, 350 + Math.random() * 200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [animating]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: height || 70,
        pointerEvents: "none",
        zIndex: 1,
        overflow: "hidden",
      }}
    />
  );
}

/* ─── Main page ────────────────────────────────────────────────────── */
export default function DataScale() {
  const [view, setView] = useState("close");
  const captureRef = useRef(null);
  const [svgContent, setSvgContent] = useState(null);
  const [animating, setAnimating] = useState(true);
  const [svgReady, setSvgReady] = useState(false);
  const svgContainerRef = useRef(null);
  const animWrapperRef = useRef(null);
  const [erdZoom, setErdZoom] = useState(0.08);
  const erdScrollRef = useRef(null);
  const [gifState, setGifState] = useState(null); // null | { phase, frame, total }
  const [animPhase, setAnimPhase] = useState("cpu"); // "cpu" | "gpu"

  // Cycle animPhase between "cpu" and "gpu" every 8 seconds while animating on ERD view
  useEffect(() => {
    if (!animating || view !== "table") { setAnimPhase("cpu"); return; }
    // Reset to CPU when entering the view
    setAnimPhase("cpu");
    const interval = setInterval(() => {
      setAnimPhase(p => p === "cpu" ? "gpu" : "cpu");
    }, 8000);
    return () => clearInterval(interval);
  }, [animating, view]);

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

  useDataFlowAnimation(svgContainerRef, animWrapperRef, svgReady, animating, animPhase);

  // Abort GIF recording if view changes away from "table"
  useEffect(() => {
    if (view !== "table" && gifState) setGifState(null);
  }, [view, gifState]);

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
          <style>{ENGINE_CSS}</style>
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
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => setAnimating(a => !a)}
                  disabled={!!gifState}
                  style={{
                    ...btnStyle(false),
                    background: animating ? NV + "22" : T.surface2,
                    borderColor: animating ? NV : T.border,
                    color: animating ? NV : T.sub,
                    opacity: gifState ? 0.4 : 1,
                  }}
                >
                  <span style={{ fontSize: 13 }}>{animating ? "⏸" : "▶"}</span>
                  {animating ? "Pause Flow" : "Animate Flow"}
                </button>
                <GifExportButton
                  animWrapperRef={animWrapperRef}
                  animating={animating}
                  setAnimating={setAnimating}
                  gifState={gifState}
                  setGifState={setGifState}
                />
              </div>
            </div>

            {/* SQL Engine + rising dots + ERD */}
            <div ref={animWrapperRef} style={{ position: "relative", overflow: "hidden" }}>
              {/* Recording overlay */}
              {gifState && (
                <div data-gif-overlay style={{
                  position: "absolute", top: 8, right: 8, zIndex: 20,
                  background: "rgba(0,0,0,0.75)", borderRadius: 6, padding: "4px 12px",
                  display: "flex", alignItems: "center", gap: 6, pointerEvents: "none",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: gifState.phase === "capturing" ? "#F05252" : "#FBBF24",
                    animation: "engine-pulse 1s infinite",
                  }} />
                  <span style={{ fontSize: 10, color: "#fff", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {gifState.phase === "capturing"
                      ? `REC ${gifState.frame}/${gifState.total}`
                      : "Encoding…"}
                  </span>
                </div>
              )}
              <SQLEngineBox animating={animating} />
              <ProcessorBoxes animPhase={animPhase} animating={animating} />
              <div style={{ height: 20 }} />
              <div
                ref={svgContainerRef}
                dangerouslySetInnerHTML={{ __html: svgContent || "" }}
                style={{ overflow: "auto", borderRadius: 4, height: 500 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ④ Full ERD — Mermaid-rendered single image with zoom */}
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setErdZoom(z => Math.max(0.03, z / 1.3))} style={btnStyle(false)} title="Zoom out">
                <span style={{ fontSize: 15, lineHeight: 1 }}>−</span>
              </button>
              <span style={{ fontSize: 11, color: T.sub, fontFamily: "'IBM Plex Mono', monospace", minWidth: 48, textAlign: "center" }}>
                {Math.round(erdZoom * 100)}%
              </span>
              <button onClick={() => setErdZoom(z => Math.min(1, z * 1.3))} style={btnStyle(false)} title="Zoom in">
                <span style={{ fontSize: 15, lineHeight: 1 }}>+</span>
              </button>
              <button onClick={() => setErdZoom(0.08)} style={{ ...btnStyle(false), marginLeft: 4 }} title="Reset zoom">
                Fit
              </button>
              <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>Ctrl+scroll to zoom</span>
            </div>
          </div>
          <div
            ref={erdScrollRef}
            onWheel={e => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                setErdZoom(z => {
                  const next = e.deltaY < 0 ? z * 1.12 : z / 1.12;
                  return Math.min(1, Math.max(0.03, next));
                });
              }
            }}
            style={{ padding: 16, overflow: "auto", maxHeight: "80vh", cursor: "grab" }}
          >
            <img
              src="/erd_overview_mermaid.svg"
              alt="Full ERD — 100 tables"
              style={{
                width: Math.round(14853 * erdZoom),
                height: Math.round(4519 * erdZoom),
                maxWidth: "none",
                transition: "width 0.15s ease, height 0.15s ease",
              }}
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
