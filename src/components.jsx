// components.jsx — shared UI primitives
// Exposes: Icon, StatusDot, ActivityGrid, Donut, ProgressArc, Segmented

import React from 'react';
import { DAYS, currentStreak } from './data.jsx';
function Icon({ name, size = 18, stroke = 2, style }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", style };
  switch (name) {
    case "dashboard": return (<svg {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>);
    case "calendar": return (<svg {...p}><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></svg>);
    case "setup": return (<svg {...p}><path d="M5 6h14M5 12h14M5 18h14"/><circle cx="9" cy="6" r="2.2" fill="var(--surface)"/><circle cx="15" cy="12" r="2.2" fill="var(--surface)"/><circle cx="8" cy="18" r="2.2" fill="var(--surface)"/></svg>);
    case "chevL": return (<svg {...p}><path d="M15 6l-6 6 6 6"/></svg>);
    case "chevR": return (<svg {...p}><path d="M9 6l6 6-6 6"/></svg>);
    case "chevD": return (<svg {...p}><path d="M6 9l6 6 6-6"/></svg>);
    case "plus": return (<svg {...p}><path d="M12 5v14M5 12h14"/></svg>);
    case "check": return (<svg {...p}><path d="M20 6L9 17l-5-5"/></svg>);
    case "x": return (<svg {...p}><path d="M18 6L6 18M6 6l12 12"/></svg>);
    case "minus": return (<svg {...p}><path d="M5 12h14"/></svg>);
    case "flame": return (<svg {...p} fill="currentColor" stroke="none"><path d="M12 2c1 3-1 4-1 6 0 1 1 2 2 2 0-1 1-2 1-2 2 2 3 4 3 6a6 6 0 11-12 0c0-3 2-5 4-7 1-1 2-2 0-5 1 0 2 .5 3 .5z"/></svg>);
    case "bell": return (<svg {...p}><path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10.5 19a2 2 0 003 0"/></svg>);
    case "clock": return (<svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>);
    case "edit": return (<svg {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>);
    case "trash": return (<svg {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>);
    case "grip": return (<svg {...p}><circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/></svg>);
    case "bolt": return (<svg {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>);
    case "copy": return (<svg {...p}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>);
    case "paste": return (<svg {...p}><path d="M16 4h2a2 2 0 012 2v13a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2.5" width="8" height="4" rx="1.4"/></svg>);
    case "user": return (<svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/></svg>);
    case "users": return (<svg {...p}><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.4 2.9-5 6.5-5s6.5 1.6 6.5 5"/><path d="M16 5.2a3.4 3.4 0 010 6.4M18 20c0-2.6-1-4-2.5-4.6"/></svg>);
    case "link": return (<svg {...p}><path d="M10 13a4 4 0 005.7 0l3-3A4 4 0 0013 4.3l-1.5 1.5"/><path d="M14 11a4 4 0 00-5.7 0l-3 3A4 4 0 0011 19.7l1.5-1.5"/></svg>);
    case "mail": return (<svg {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>);
    case "eye": return (<svg {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>);
    case "share": return (<svg {...p}><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.7l7.4-4.3M8.3 13.3l7.4 4.3"/></svg>);
    case "logout": return (<svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>);
    case "arrowUp": return (<svg {...p}><path d="M12 19V5M6 11l6-6 6 6"/></svg>);
    case "arrowDown": return (<svg {...p}><path d="M12 5v14M6 13l6 6 6-6"/></svg>);
    case "arrowLeft": return (<svg {...p}><path d="M19 12H5M11 18l-6-6 6-6"/></svg>);
    case "target": return (<svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>);
    case "flag": return (<svg {...p}><path d="M5 21V4M5 4h11l-1.5 4L16 12H5"/></svg>);
    case "repeat": return (<svg {...p}><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>);
    case "gauge": return (<svg {...p}><path d="M12 14l4-4"/><path d="M4.5 19a9 9 0 1115 0"/><circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none"/></svg>);
    case "trending": return (<svg {...p}><path d="M3 17l6-6 4 4 7-7"/><path d="M17 8h4v4"/></svg>);
    case "sparkle": return (<svg {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>);
    case "calendar2": return (<svg {...p}><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4M12 13v4M10 15h4"/></svg>);
    default: return null;
  }
}

function StatusDot({ status, color, size = 16 }) {
  const s = { width: size, height: size, borderRadius: 999, display: "inline-flex",
    alignItems: "center", justifyContent: "center", flexShrink: 0 };
  if (status === "done")
    return <span style={{ ...s, background: color, color: "#0b0b10" }}><Icon name="check" size={size - 5} stroke={3} /></span>;
  if (status === "skipped")
    return <span style={{ ...s, background: "transparent", color: "var(--muted)", border: "1.5px solid var(--border)" }}><Icon name="minus" size={size - 5} stroke={2.5} /></span>;
  return <span style={{ ...s, border: `1.5px solid ${color}`, opacity: 0.7 }} />;
}

// GitHub-style 7-col activity grid. grid = [week][day], value 0/1/2
function ActivityGrid({ grid, color, cell = 12, gap = 4, fill }) {
  const cols = fill ? "repeat(7, 1fr)" : `repeat(7, ${cell}px)`;
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap, width: fill ? "100%" : undefined }}>
      {grid.flatMap((row, w) =>
        row.map((v, d) => {
          let bg = "rgba(255,255,255,0.04)", border = "1px solid rgba(255,255,255,0.05)";
          if (v === 2) { bg = color; border = "1px solid transparent"; }
          else if (v === 1) { bg = hexA(color, 0.18); border = "1px solid " + hexA(color, 0.25); }
          const sz = fill ? { aspectRatio: "1", width: "100%" } : { width: cell, height: cell };
          return <div key={w + "-" + d} title={DAYS[d]} style={{ ...sz, borderRadius: 3, background: bg, border }} />;
        })
      )}
    </div>
  );
}

// GitHub-style full-year heatmap. grid = [week][day], value 0/1/2.
// Columns = weeks (oldest→newest), rows = Mon..Sun. `labels` adds month + weekday gutters.
const YH_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YH_WD = ["Mon","","Wed","","Fri","",""];
function yhCellDate(weeks, w, d) {
  const dt = new Date(2026, 5, 1); // current week's Monday
  dt.setDate(dt.getDate() - (weeks - 1 - w) * 7 + d);
  return dt;
}
function YearHeatmap({ grid, color, cell = 12, gap = 3, labels = false }) {
  const weeks = grid.length;
  const wdW = 24, gut = 6;
  // month label columns
  const monthLabels = [];
  let prevM = -1;
  for (let w = 0; w < weeks; w++) {
    const m = yhCellDate(weeks, w, 0).getMonth();
    if (m !== prevM) {
      const last = monthLabels[monthLabels.length - 1];
      if (!last || w - last.col >= 3) monthLabels.push({ col: w, text: YH_MONTHS[m] });
      prevM = m;
    }
  }
  const cells = (
    <div style={{ display: "grid", gridTemplateRows: `repeat(7, ${cell}px)`,
      gridAutoFlow: "column", gridAutoColumns: `${cell}px`, gap }}>
      {grid.flatMap((row, w) =>
        row.map((v, d) => {
          let bg = "rgba(255,255,255,0.045)", border = "1px solid rgba(255,255,255,0.05)";
          if (v === 2) { bg = color; border = "1px solid transparent"; }
          else if (v === 1) { bg = hexA(color, 0.2); border = "1px solid " + hexA(color, 0.28); }
          const dt = yhCellDate(weeks, w, d);
          const title = dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
            + (v === 2 ? " · done" : v === 1 ? " · missed" : " · off");
          return <div key={w + "-" + d} title={title}
            style={{ borderRadius: 2.5, background: bg, border }} />;
        })
      )}
    </div>
  );
  if (!labels) return cells;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${weeks}, ${cell}px)`, gap,
        marginLeft: wdW + gut, marginBottom: 5 }}>
        {Array.from({ length: weeks }).map((_, w) => {
          const lab = monthLabels.find(l => l.col === w);
          return <div key={w} style={{ position: "relative", height: 12 }}>
            {lab && <span style={{ position: "absolute", left: 0, top: 0, fontSize: 10.5,
              color: "var(--muted)", whiteSpace: "nowrap", fontWeight: 600 }}>{lab.text}</span>}
          </div>;
        })}
      </div>
      <div style={{ display: "flex", gap: gut }}>
        <div style={{ display: "grid", gridTemplateRows: `repeat(7, ${cell}px)`, gap, width: wdW }}>
          {YH_WD.map((w, i) => <div key={i} style={{ fontSize: 10, color: "var(--muted)",
            lineHeight: cell + "px", textAlign: "right" }}>{w}</div>)}
        </div>
        {cells}
      </div>
    </div>
  );
}

// stats over a year grid (value 0 off / 1 missed / 2 done)
function yearStats(grid) {
  let done = 0, sched = 0, best = 0, run = 0;
  const flat = [];
  grid.forEach(row => row.forEach(v => { if (v !== 0) { sched++; flat.push(v); if (v === 2) done++; } }));
  flat.forEach(v => { if (v === 2) { run++; best = Math.max(best, run); } else run = 0; });
  return { done, sched, best, cur: currentStreak(grid), pct: sched ? Math.round(done / sched * 100) : 0 };
}

// Donut chart. segments: [{label, value, color}]
function Donut({ segments, size = 180, thickness = 26, centerTop, centerBottom }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.color}
              strokeWidth={thickness} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc}
              strokeLinecap="butt" />
          );
          acc += len; return el;
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2 }}>
        <div style={{ fontFamily: "var(--head)", fontSize: 30, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>{centerTop}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: ".06em", textTransform: "uppercase" }}>{centerBottom}</div>
      </div>
    </div>
  );
}

// Small circular progress arc
function ProgressArc({ value, max, color, size = 34 }) {
  const r = (size - 5) / 2, c = 2 * Math.PI * r;
  const len = (Math.min(value, max) / max) * c;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${len} ${c - len}`} strokeLinecap="round" />
    </svg>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 9, padding: 3, gap: 2 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          border: "none", cursor: "pointer", borderRadius: 6, padding: "5px 12px",
          fontSize: 12.5, fontWeight: 600, fontFamily: "var(--body)", whiteSpace: "nowrap",
          background: value === o.value ? "var(--surface-3)" : "transparent",
          color: value === o.value ? "var(--text)" : "var(--muted)",
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function hexA(hex, a) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map(x => x + x).join("") : h;
  const r = parseInt(n.slice(0,2),16), g = parseInt(n.slice(2,4),16), b = parseInt(n.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

export { Icon, StatusDot, ActivityGrid, YearHeatmap, yearStats, Donut, ProgressArc, Segmented, hexA };
