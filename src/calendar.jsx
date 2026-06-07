// calendar.jsx — weekly planner: drag-drop, context menu, copy/paste,
//                 week-start ordering, calendar switcher, read-only sharing, partner overlay
// Exposes: CalendarView

import React from 'react';
import { GRID_END, GRID_START, weekDates, weekColsOrder, habitById, DAYS, min12, TODAY_INDEX, HABITS } from './data.jsx';
import { Icon, StatusDot, hexA } from './components.jsx';
import { areaById, goalStatus, fmtNum } from './goals-data.jsx';
import { useTranslation } from './i18n.jsx';
const GUTTER = 58;
const MOD = (typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)) ? "\u2318" : "Ctrl";

function CalendarView({
  blocks, weekOffset, setWeekOffset, onUpdate, onDelete, onAdd,
  onReset, onEdit, accent, blockStyle, slot, today, tintToday,
  clipboard, setClipboard, onCreateBlock,
  readOnly, overlayBlocks, partner, cals, activeCal, onPickCal, onOpenProfile,
  overlayOn, setOverlay, partnerEnabled, goalsByHabit,
}) {
  const { t } = useTranslation();
  const SLOT = slot;
  const totalSlots = (GRID_END - GRID_START) / 30;
  const totalH = totalSlots * SLOT;
  const dates = weekDates(weekOffset);
  const order = weekColsOrder();                      // semantic weekday per display column
  const wdToCol = {}; order.forEach((wd, i) => { wdToCol[wd] = i; });

  const scrollRef = React.useRef(null);
  const bodyRef = React.useRef(null);
  const [bodyW, setBodyW] = React.useState(900);
  React.useLayoutEffect(() => {
    if (!bodyRef.current) return;
    const ro = new ResizeObserver(() => setBodyW(bodyRef.current.offsetWidth));
    ro.observe(bodyRef.current); setBodyW(bodyRef.current.offsetWidth);
    return () => ro.disconnect();
  }, []);
  const colW = (bodyW - GUTTER) / 7;

  const [drag, setDrag] = React.useState(null);
  const [quick, setQuick] = React.useState(null);
  const [menu, setMenu] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const dragInfo = React.useRef(null);
  const previewRef = React.useRef(null);
  const hoverBlockRef = React.useRef(null);
  const hoverCellRef = React.useRef(null);
  const toastTimer = React.useRef(null);

  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  function flash(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1700);
  }

  // ---- clipboard ops ----
  function copyBlock(b) {
    const h = habitById(b.habitId) || {};
    setClipboard({ habitId: b.habitId, label: b.label, sublabel: b.sublabel, dur: b.dur,
      color: b.color || h.color, icon: b.icon || h.icon });
    flash(readOnly ? t("cal.copied.ro", {label: b.label}) : t("cal.copied", {label: b.label}));
  }
  function pasteAt(cell) {
    if (!clipboard || !cell) return;
    const dur = clipboard.dur || 60;
    const start = Math.max(GRID_START, Math.min(GRID_END - dur, cell.start));
    onCreateBlock(weekOffset, { ...clipboard, day: cell.day, start, status: "planned" });
    flash(t("cal.pasted", {label: clipboard.label}));
  }
  function duplicate(b) {
    const start = Math.min(GRID_END - b.dur, b.start + b.dur);
    onCreateBlock(weekOffset, { habitId: b.habitId, label: b.label, sublabel: b.sublabel,
      color: b.color, icon: b.icon, dur: b.dur, day: b.day, start, status: "planned" });
    flash(t("cal.duplicated", {label: b.label}));
  }
  function cutBlock(b) { copyBlock(b); onDelete(b.id); }

  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 1.5 * SLOT; }, []);

  function geom() {
    const r = bodyRef.current.getBoundingClientRect();
    return { left: r.left, top: r.top, scroll: scrollRef.current.scrollTop };
  }

  function startDrag(e, b, mode) {
    if (readOnly) return;
    if (e.button != null && e.button !== 0) return;
    e.stopPropagation();
    const g = geom();
    const blockLeft = GUTTER + wdToCol[b.day] * colW + 3;
    const blockTop = (b.start - GRID_START) / 30 * SLOT;
    dragInfo.current = {
      id: b.id, mode, dur: b.dur,
      grabDX: (e.clientX - g.left) - blockLeft,
      grabDY: (e.clientY - g.top) - blockTop,
      startX: e.clientX, startY: e.clientY,
      originalDay: b.day,
    };
    setDrag({ id: b.id, day: b.day, start: b.start, dur: b.dur, moved: false, mode, isClone: false });
    previewRef.current = { day: b.day, start: b.start, dur: b.dur, moved: false, isClone: false };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onMove(e) {
    const di = dragInfo.current; if (!di) return;
    const g = geom();
    const moved = Math.abs(e.clientX - di.startX) > 4 || Math.abs(e.clientY - di.startY) > 4;
    if (di.mode === "move") {
      const px = (e.clientX - g.left) - di.grabDX;
      const py = (e.clientY - g.top) - di.grabDY;
      let ci = Math.round((px - GUTTER) / colW); ci = Math.max(0, Math.min(6, ci));
      const day = order[ci];
      let slotIx = Math.round(py / SLOT);
      let start = GRID_START + slotIx * 30;
      start = Math.max(GRID_START, Math.min(GRID_END - di.dur, start));
      const isClone = e.altKey || day !== di.originalDay;
      previewRef.current = { day, start, dur: di.dur, moved, isClone };
      setDrag(d => ({ ...d, day, start, moved, isClone }));
    } else {
      const py = (e.clientY - g.top);
      const b = blocks.find(x => x.id === di.id);
      const topPx = (b.start - GRID_START) / 30 * SLOT;
      let slots = Math.max(1, Math.round((py - topPx) / SLOT));
      let dur = Math.min(slots * 30, GRID_END - b.start);
      previewRef.current = { day: b.day, start: b.start, dur, moved, isClone: false };
      setDrag(d => ({ ...d, day: b.day, start: b.start, dur, moved, isClone: false }));
    }
  }

  function onUp() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    const di = dragInfo.current; const d = previewRef.current;
    dragInfo.current = null; previewRef.current = null;
    setDrag(null);
    if (!di || !d) return;
    if (!d.moved) { onEdit(di.id); return; }
    
    if (d.isClone && di.mode === "move") {
      const b = blocks.find(x => x.id === di.id);
      onCreateBlock(weekOffset, { ...b, day: d.day, start: d.start, dur: d.dur, status: "planned", id: undefined });
    } else {
      if (di.mode === "move") onUpdate(di.id, { day: d.day, start: d.start, template: false });
      else onUpdate(di.id, { dur: d.dur, template: false });
    }
  }

  function cycleStatus(e, b) {
    e.stopPropagation();
    if (readOnly) return;
    const next = b.status === "planned" ? "done" : b.status === "done" ? "skipped" : "planned";
    onUpdate(b.id, { status: next });
  }

  function cellAt(e, day) {
    const g = geom();
    const py = (e.clientY - g.top);
    let slotIx = Math.floor(py / SLOT);
    let start = Math.max(GRID_START, Math.min(GRID_END - 30, GRID_START + slotIx * 30));
    return { day, start };
  }
  function emptyClick(e, day) {
    if (drag || readOnly) return;
    const c = cellAt(e, day);
    setQuick({ day, start: Math.min(c.start, GRID_END - 60), x: e.clientX, y: e.clientY });
  }
  function trackCell(e, day) { hoverCellRef.current = cellAt(e, day); }
  function colContext(e, day) {
    e.preventDefault();
    if (readOnly) return;
    const cell = cellAt(e, day);
    setMenu({ x: e.clientX, y: e.clientY, kind: "grid", day: cell.day, start: cell.start });
  }
  function blockContext(e, b) {
    e.preventDefault(); e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, kind: "block", block: b });
  }

  // ---- keyboard shortcuts ----
  React.useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (!mod) { if (e.key === "Escape") { setMenu(null); setQuick(null); } return; }
      const k = e.key.toLowerCase();
      if (k === "c") {
        const id = hoverBlockRef.current;
        const b = id && blocks.find(x => x.id === id);
        if (b) { copyBlock(b); e.preventDefault(); }
      } else if (k === "x" && !readOnly) {
        const id = hoverBlockRef.current;
        const b = id && blocks.find(x => x.id === id);
        if (b) { cutBlock(b); e.preventDefault(); }
      } else if (k === "v" && !readOnly) {
        if (clipboard && hoverCellRef.current) { pasteAt(hoverCellRef.current); e.preventDefault(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blocks, clipboard, weekOffset, readOnly]);

  const hours = [];
  for (let m = GRID_START; m <= GRID_END; m += 60) hours.push(m);

  return (
    <div className="cal-wrap">
      <CalToolbar weekOffset={weekOffset} setWeekOffset={setWeekOffset} dates={dates}
        onReset={onReset} accent={accent} readOnly={readOnly} partner={partner}
        cals={cals} activeCal={activeCal} onPickCal={onPickCal} onOpenProfile={onOpenProfile}
        overlayOn={overlayOn} setOverlay={setOverlay} partnerEnabled={partnerEnabled} />

      {readOnly && partner && (
        <div className="cal-ro-banner" style={{ borderColor: hexA(partner.color, 0.45) }}>
          <span className="rob-l">
            <span className="cp-av sm" style={{ background: partner.color }}>{partner.initial}</span>
            {t("cal.ro.viewing")} <b>{t("cal.ro.calOf", {name: partner.name})}</b> · {t("cal.ro.viewOnly")}
          </span>
          <span className="rob-hint"><Icon name="copy" size={13} /> {t("cal.ro.hint")}</span>
        </div>
      )}

      <div className="cal-head" style={{ paddingLeft: GUTTER }}>
        {order.map((wd, i) => {
          const isToday = weekOffset === 0 && wd === today;
          return (
            <div key={i} className="cal-day-head" style={{
              borderTop: isToday ? `2px solid ${accent}` : "2px solid transparent" }}>
              <span className="cal-day-name" style={{ color: isToday ? accent : "var(--muted)" }}>{DAYS[wd]}</span>
              <span className="cal-day-num" style={{ color: isToday ? "var(--text)" : "var(--muted2)" }}>{dates[i].getDate()}</span>
            </div>
          );
        })}
      </div>

      <div className="cal-scroll" ref={scrollRef}>
        <div className="cal-body" ref={bodyRef} style={{ height: totalH }}>
          {hours.map(m => {
            const top = (m - GRID_START) / 30 * SLOT;
            return (
              <React.Fragment key={m}>
                <div className="cal-hline" style={{ top, left: GUTTER }} />
                <div className="cal-hlabel" style={{ top: top - 6 }}>{m < GRID_END ? min12(m) : ""}</div>
              </React.Fragment>
            );
          })}
          {order.map((wd, i) => {
            const isToday = weekOffset === 0 && wd === today;
            return (
              <div key={i} className={"cal-col" + (readOnly ? " ro" : "")} onClick={(e) => emptyClick(e, wd)}
                onContextMenu={(e) => colContext(e, wd)}
                onMouseMove={(e) => trackCell(e, wd)}
                style={{ left: GUTTER + i * colW, width: colW,
                  background: (isToday && tintToday) ? "rgba(255,255,255,0.018)" : "transparent" }} />
            );
          })}

          {/* current time line */}
          {weekOffset === 0 && wdToCol[today] !== undefined && (() => {
            const nowMins = now.getHours() * 60 + now.getMinutes();
            if (nowMins < GRID_START || nowMins > GRID_END) return null;
            return (
              <div className="cal-now-line" style={{
                top: (nowMins - GRID_START) / 30 * SLOT,
                left: GUTTER + wdToCol[today] * colW,
                width: colW,
                borderTopColor: accent,
              }}>
                <div className="cal-now-dot" style={{ background: accent }} />
              </div>
            );
          })()}

          {/* partner overlay ghosts (behind my blocks) */}
          {overlayBlocks && overlayBlocks.map(b => {
            const top = (b.start - GRID_START) / 30 * SLOT, height = b.dur / 30 * SLOT;
            const left = GUTTER + wdToCol[b.day] * colW + 3, width = colW - 6;
            return (
              <div key={"g" + b.id} className="cal-ghost"
                style={{ top, left, width, height, background: hexA(partner.color, 0.1),
                  borderColor: hexA(partner.color, 0.5), color: partner.color }}>
                <span className="ghost-label">{partner.initial} · {b.label}</span>
              </div>
            );
          })}

          {drag && drag.moved && drag.mode === "move" && (
            <div className="cal-drop" style={{
              left: GUTTER + wdToCol[drag.day] * colW + 2, width: colW - 4,
              top: (drag.start - GRID_START) / 30 * SLOT,
              height: drag.dur / 30 * SLOT, borderColor: accent }} />
          )}

          {blocks.map(b => {
            const isDragging = drag && drag.id === b.id;
            const isCloning = isDragging && drag.isClone;
            
            const orig = (
              <Block key={b.id + (isCloning ? "_orig" : "")} b={b} colW={colW} SLOT={SLOT} 
                col={wdToCol[isDragging && !isCloning ? drag.day : b.day]} 
                start={isDragging && !isCloning ? drag.start : b.start} 
                dur={isDragging && !isCloning ? drag.dur : b.dur}
                style={blockStyle} dragging={isDragging && drag.moved && !isCloning} readOnly={readOnly}
                onDown={startDrag} onStatus={cycleStatus}
                onCtx={blockContext} onHover={(id) => { hoverBlockRef.current = id; }}
                goals={goalsByHabit && goalsByHabit[b.habitId]} />
            );

            if (!isCloning) return orig;

            const clone = (
              <Block key={b.id + "_clone"} b={b} colW={colW} SLOT={SLOT} col={wdToCol[drag.day]} start={drag.start} dur={drag.dur}
                style={blockStyle} dragging={drag.moved} readOnly={readOnly}
                onDown={()=>{}} onStatus={()=>{}} onCtx={()=>{}} onHover={()=>{}}
                goals={goalsByHabit && goalsByHabit[b.habitId]} />
            );
            
            return <React.Fragment key={b.id}>{orig}{clone}</React.Fragment>;
          })}
        </div>
      </div>

      {quick && <QuickAdd info={quick} accent={accent}
        onClose={() => setQuick(null)}
        onAdd={(habitId) => { onAdd(weekOffset, { ...quick, habitId }); setQuick(null); }} />}

      {menu && <ContextMenu menu={menu} accent={accent} hasClip={!!clipboard} clip={clipboard} readOnly={readOnly}
        onClose={() => setMenu(null)}
        onCopy={copyBlock} onDuplicate={duplicate} onCut={cutBlock} onPaste={pasteAt}
        onEdit={onEdit} onStatus={(b, s) => onUpdate(b.id, { status: s })} onDelete={onDelete}
        onNew={(day, start, x, y) => setQuick({ day, start, x, y })} />}

      {toast && <div className="cal-toast"><Icon name="check" size={14} stroke={2.6} style={{ color: accent }} />{toast}</div>}
    </div>
  );
}

function Block({ b, colW, SLOT, col, start, dur, style, dragging, readOnly, onDown, onStatus, onCtx, onHover, goals }) {
  const { t } = useTranslation();
  const h = habitById(b.habitId) || {};
  const color = b.color || h.color || "#7d8aa0";
  const icon = b.icon || h.icon || "";
  const top = (start - GRID_START) / 30 * SLOT;
  const height = dur / 30 * SLOT;
  const left = GUTTER + col * colW + 3, width = colW - 6;
  const tall = height >= SLOT * 2.6, mid = height >= SLOT * 1.4;
  const skipped = b.status === "skipped";
  const done = b.status === "done";

  let bg, borderLeft, border, textCol = "var(--text)";
  if (style === "outline") {
    bg = "var(--surface)"; border = `1px solid ${hexA(color, 0.55)}`; borderLeft = `3px solid ${color}`;
  } else if (style === "solid") {
    bg = hexA(color, 0.9); border = "1px solid transparent"; borderLeft = `3px solid ${color}`; textCol = "#0b0b10";
  } else {
    bg = hexA(color, 0.16); border = `1px solid ${hexA(color, 0.22)}`; borderLeft = `3px solid ${color}`;
  }

  return (
    <div className={"cal-block" + (dragging ? " dragging" : "") + (skipped ? " skipped" : "") + (done ? " done" : "") + (readOnly ? " ro" : "")}
      style={{
        top, left, width, height, background: bg, border, borderLeft,
        opacity: skipped ? 0.5 : 1,
        boxShadow: dragging ? "0 12px 28px rgba(0,0,0,.5)" : "none",
        zIndex: dragging ? 50 : 2, color: textCol,
      }}
      onPointerDown={(e) => onDown(e, b, "move")}
      onContextMenu={(e) => onCtx(e, b)}
      onMouseEnter={() => onHover && onHover(b.id)}
      onMouseLeave={() => onHover && onHover(null)}>
      <div className="cal-block-top">
        <span className="cal-block-label" style={{ textDecoration: skipped ? "line-through" : "none" }}>
          {icon} {b.label}
        </span>
        {!readOnly && (
          <button className="cal-status" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => onStatus(e, b)}>
            <StatusDot status={b.status} color={style === "solid" ? "#0b0b10" : color} size={15} />
          </button>
        )}
      </div>
      {mid && b.sublabel && <div className="cal-block-sub" style={{ color: style === "solid" ? "rgba(0,0,0,.6)" : "var(--muted)" }}>{b.sublabel}</div>}
      {tall && <div className="cal-block-time" style={{ color: style === "solid" ? "rgba(0,0,0,.55)" : "var(--muted)" }}>{min12(start)} – {min12(start + dur)}</div>}
      {!b.template && <span className="cal-dot-custom" style={{ background: style === "solid" ? "rgba(0,0,0,.4)" : color }} />}
      {done && <span className="cal-done-mark" aria-hidden="true"><Icon name="check" size={tall ? 26 : 16} stroke={3} /></span>}
      {goals && goals.length > 0 && (() => {
        const gColor = areaById(goals[0].areaId).color;
        const gs0 = goalStatus(goals[0]);
        const prog = gs0.kind === "quant" ? ` · ${fmtNum(goals[0].current)}/${fmtNum(goals[0].target)}` : "";
        const tip = t("cal.block.contributing", {goals: goals.map(g => g.name).join(", "), prog});
        return <span className="cal-goal-dot" style={{ background: gColor }} title={tip} />;
      })()}
      {!readOnly && <div className="cal-resize" onPointerDown={(e) => onDown(e, b, "resize")} />}
    </div>
  );
}

function CalToolbar({ weekOffset, setWeekOffset, dates, onReset, accent, readOnly, partner,
  cals, activeCal, onPickCal, onOpenProfile, overlayOn, setOverlay, partnerEnabled }) {
  const { t } = useTranslation();
  const start = dates[0], end = dates[6];
  const mo = (d) => d.toLocaleString("en-US", { month: "short" });
  const range = mo(start) === mo(end)
    ? `${mo(start)} ${start.getDate()} – ${end.getDate()}`
    : `${mo(start)} ${start.getDate()} – ${mo(end)} ${end.getDate()}`;
  const sub = readOnly ? t("cal.tb.partnerWeek", {name: partner.name})
    : weekOffset === 0 ? t("cal.tb.thisWeek") : weekOffset > 0 ? t("cal.tb.planning", {offset: weekOffset}) : t("cal.tb.ago", {offset: Math.abs(weekOffset)});
  return (
    <div className="cal-toolbar">
      <div className="cal-tb-left">
        <CalPicker cals={cals} activeCal={activeCal} onPick={onPickCal} onOpenProfile={onOpenProfile} accent={accent} />
        <div className="cal-titles">
          <h1 className="cal-title">{range}</h1>
          <span className="cal-year">{sub}</span>
        </div>
      </div>
      <div className="cal-tb-right">
        {!readOnly && partnerEnabled && partner && (
          <button className={"overlay-toggle" + (overlayOn ? " on" : "")} onClick={() => setOverlay(!overlayOn)}
            title="Show partner's busy times on your week">
            <span className="ot-av" style={{ background: partner.color }}>{partner.initial}</span>
            <span className="ot-lbl">{t("cal.tb.showPartner", {name: partner.name})}</span>
            <span className={"ot-sw" + (overlayOn ? " on" : "")} style={overlayOn ? { background: partner.color } : {}}><span className="ot-knob" /></span>
          </button>
        )}
        {!readOnly && <button className="ghost-btn" onClick={onReset} title="Restore auto-generated blocks">{t("cal.tb.reset")}</button>}
        <div className="cal-nav">
          <button onClick={() => setWeekOffset(weekOffset - 1)}><Icon name="chevL" size={18} /></button>
          <button className="cal-today-btn" onClick={() => setWeekOffset(0)}>{t("cal.tb.today")}</button>
          <button onClick={() => setWeekOffset(weekOffset + 1)}><Icon name="chevR" size={18} /></button>
        </div>
      </div>
    </div>
  );
}

function CalPicker({ cals, activeCal, onPick, onOpenProfile, accent }) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [open]);
  const cur = cals.find(c => c.id === activeCal) || cals[0];
  return (
    <div className="cal-picker" ref={ref}>
      <button className="cal-picker-btn" onClick={() => setOpen(o => !o)}>
        <span className="cp-av" style={{ background: cur.color }}>{cur.initial}</span>
        <span className="cp-name">{cur.name}{cur.access !== "owner" && <span className="cp-ro">{t("cal.picker.viewOnly")}</span>}</span>
        <Icon name="chevD" size={15} style={{ color: "var(--muted)" }} />
      </button>
      {open && (
        <div className="cal-picker-menu">
          <div className="cpm-label">{t("cal.picker.cals")}</div>
          {cals.map(c => (
            <button key={c.id} className={"cpm-item" + (c.id === activeCal ? " on" : "")}
              onClick={() => { onPick(c.id); setOpen(false); }}>
              <span className="cp-av sm" style={{ background: c.color }}>{c.initial}</span>
              <span className="cpm-name">{c.name}<span className="cpm-sub">{c.access === "owner" ? t("cal.picker.owner") : t("cal.picker.shared")}</span></span>
              {c.id === activeCal && <Icon name="check" size={15} style={{ color: accent }} />}
            </button>
          ))}
          <div className="cpm-div" />
          <button className="cpm-manage" onClick={() => { setOpen(false); onOpenProfile(); }}>
            <Icon name="share" size={14} /> {t("cal.picker.manage")}
          </button>
        </div>
      )}
    </div>
  );
}

function QuickAdd({ info, onClose, onAdd, accent }) {
  const { t } = useTranslation();
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("pointerdown", h), 0);
    return () => document.removeEventListener("pointerdown", h);
  }, []);
  const vw = window.innerWidth, x = Math.min(info.x, vw - 280);
  
  if (HABITS.length === 0) {
    return (
      <div ref={ref} className="quickadd" style={{ left: x, top: info.y + 8, padding: 15, color: "var(--text)" }}>
        {t("cal.qa.noHabits")}
      </div>
    );
  }

  return (
    <div ref={ref} className="quickadd" style={{ left: x, top: info.y + 8 }}>
      <div className="qa-time">{min12(info.start)} · {DAYS[info.day]}</div>
      <div className="qa-grid">
        {HABITS.map(h => (
          <button key={h.id} className="qa-pill"
            onClick={() => onAdd(h.id)}
            style={{ borderColor: "transparent", background: hexA(h.color, 0.16) }}>
            <span className="qa-swatch" style={{ background: h.color }} />{h.icon} {h.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function ContextMenu({ menu, accent, hasClip, clip, readOnly, onClose, onCopy, onDuplicate, onCut, onPaste, onEdit, onStatus, onDelete, onNew }) {
  const { t } = useTranslation();
  let items = [];
  if (menu.kind === "block") {
    const b = menu.block;
    if (readOnly) {
      items = [{ icon: "copy", label: t("cal.ctx.copyToMy"), hint: MOD + " C", onClick: () => onCopy(b) }];
    } else {
      items = [
        { icon: "copy", label: t("cal.ctx.copy"), hint: MOD + " C", onClick: () => onCopy(b) },
        { icon: "copy", label: t("cal.ctx.duplicate"), onClick: () => onDuplicate(b) },
        { icon: "x", label: t("cal.ctx.cut"), hint: MOD + " X", onClick: () => onCut(b) },
      ];
      if (hasClip) items.push({ icon: "paste", label: t("cal.ctx.pasteBelow"), onClick: () => onPaste({ day: b.day, start: Math.min(GRID_END - (clip.dur || 60), b.start + b.dur) }) });
      items.push("div");
      items.push({ icon: "edit", label: t("cal.ctx.edit"), onClick: () => onEdit(b.id) });
      if (b.status !== "done") items.push({ icon: "check", label: t("cal.ctx.markDone"), onClick: () => onStatus(b, "done") });
      if (b.status !== "skipped") items.push({ icon: "minus", label: t("cal.ctx.markSkipped"), onClick: () => onStatus(b, "skipped") });
      if (b.status !== "planned") items.push({ icon: "clock", label: t("cal.ctx.markPlanned"), onClick: () => onStatus(b, "planned") });
      items.push("div");
      items.push({ icon: "trash", label: t("cal.ctx.delete"), hint: "\u232b", danger: true, onClick: () => onDelete(b.id) });
    }
  } else {
    items = [
      { icon: "paste", label: hasClip ? t("cal.ctx.pasteHere", {label: clip.label}) : t("cal.ctx.paste"), hint: MOD + " V",
        disabled: !hasClip, onClick: () => onPaste({ day: menu.day, start: menu.start }) },
      { icon: "plus", label: t("cal.ctx.newBlock"), onClick: () => onNew(menu.day, menu.start, menu.x, menu.y) },
    ];
  }

  const count = items.filter(i => i !== "div").length;
  const divs = items.filter(i => i === "div").length;
  const W = 226;
  const H = count * 35 + divs * 11 + 12;
  const vw = window.innerWidth, vh = window.innerHeight;
  const x = Math.min(menu.x, vw - W - 8);
  const y = Math.min(menu.y, vh - H - 8);

  return (
    <div className="ctx-backdrop" onPointerDown={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} onWheel={onClose}>
      <div className="ctx-menu" style={{ left: x, top: y, width: W }} onPointerDown={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}>
        {items.map((it, i) => it === "div"
          ? <div key={i} className="ctx-div" />
          : (
            <button key={i} className={"ctx-item" + (it.danger ? " danger" : "") + (it.disabled ? " disabled" : "")}
              disabled={it.disabled}
              onClick={() => { if (it.disabled) return; it.onClick(); onClose(); }}>
              <span className="ctx-ico"><Icon name={it.icon} size={15} /></span>
              <span className="ctx-label">{it.label}</span>
              {it.hint && <span className="ctx-hint">{it.hint}</span>}
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default CalendarView;
