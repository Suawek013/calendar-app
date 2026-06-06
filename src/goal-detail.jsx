// goal-detail.jsx — single goal detail: smart callout, progress ring, pace chart,
// log entries, milestone steps, connected habits.
// Exposes: GoalDetail, GoalRing, PaceChart, SmartCallout

import React from 'react';
import { habitById, historyFor, HABITS } from './data.jsx';
import { Icon, hexA } from './components.jsx';
import { parseDate, MONTHS, goalStatus, fmtNum, fmtCountdown, daysUntil, areaById, GOAL_YEAR, fmtDeadline } from './goals-data.jsx';
import { StatusBadge, HabitStrip } from './goals.jsx';
function GoalRing({ pct, color, size = 152, thickness = 14, big, sub }) {
  const r = (size - thickness) / 2, c = 2 * Math.PI * r;
  const len = Math.max(0, Math.min(1, pct)) * c;
  return (
    <div className="gring" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={thickness} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={`${len} ${c - len}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray .5s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div className="gring-c">
        <div className="gring-pct" style={{ fontFamily: "var(--head)" }}>{big}</div>
        {sub && <div className="gring-sub">{sub}</div>}
      </div>
    </div>
  );
}

// actual cumulative vs ideal-pace line
function PaceChart({ goal, color }) {
  const W = 340, H = 150, padL = 10, padR = 10, padT = 14, padB = 22;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const maxX = 11; // Dec
  const maxY = goal.target;
  const xOf = (m) => padL + (m / maxX) * innerW;
  const yOf = (v) => padT + innerH - (v / maxY) * innerH;
  const dlMonth = parseDate(goal.deadline).getMonth();
  const todayFrac = 5 + 4 / 30; // June 5

  const actualPts = goal.series.map(p => [xOf(p.m), yOf(p.v)]);
  const actualLine = actualPts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const areaPath = actualLine + ` L${actualPts[actualPts.length-1][0].toFixed(1)} ${yOf(0).toFixed(1)} L${actualPts[0][0].toFixed(1)} ${yOf(0).toFixed(1)} Z`;
  const idealLine = `M${xOf(0)} ${yOf(goal.startValue)} L${xOf(dlMonth)} ${yOf(goal.target)}`;
  const labels = [0, 3, 6, 9, 11];

  return (
    <div className="pace-chart">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: "block" }}>
        <defs>
          <linearGradient id={"pg_" + goal.id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* baseline */}
        <line x1={padL} y1={yOf(0)} x2={W-padR} y2={yOf(0)} stroke="rgba(255,255,255,.08)" strokeWidth="1" />
        {/* ideal pace */}
        <path d={idealLine} fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.8" />
        {/* today marker */}
        <line x1={xOf(todayFrac)} y1={padT} x2={xOf(todayFrac)} y2={yOf(0)} stroke="rgba(255,255,255,.14)" strokeWidth="1" strokeDasharray="2 3" />
        {/* actual */}
        <path d={areaPath} fill={`url(#pg_${goal.id})`} stroke="none" />
        <path d={actualLine} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {actualPts.map((p, i) => i === actualPts.length - 1 && (
          <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={color} stroke="var(--surface)" strokeWidth="2" />
        ))}
        {labels.map(m => (
          <text key={m} x={xOf(m)} y={H - 6} fill="var(--muted)" fontSize="9.5" textAnchor="middle"
            fontFamily="var(--body)">{MONTHS[m]}</text>
        ))}
      </svg>
      <div className="pace-legend">
        <span className="pl-item">
          <svg width="18" height="6" style={{ overflow: "visible" }}><line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth="2.5" strokeLinecap="round" /></svg> Actual
        </span>
        <span className="pl-item">
          <svg width="18" height="6" style={{ overflow: "visible" }}><line x1="0" y1="3" x2="18" y2="3" stroke="var(--muted)" strokeWidth="2" strokeDasharray="4 3" /></svg> Target pace
        </span>
      </div>
    </div>
  );
}

function SmartCallout({ goal, color }) {
  const st = goalStatus(goal);
  let body, tone = st.status;

  if (st.kind === "quant") {
    const books = goal.unit === "books";
    const needPhrase = books
      ? <>about <b>1 {goal.unit.replace(/s$/,"")} every {Math.max(1, Math.round(st.reqDaysPerUnit))} days</b></>
      : <><b>{fmtNum(st.reqRate * 30)} {goal.unit}/month</b></>;
    const curPhrase = books
      ? <>1 every <b>{Math.round(st.curDaysPerUnit)} days</b></>
      : <><b>{fmtNum(st.curRate * 30)} {goal.unit}/month</b></>;
    const off = Math.abs(st.behindUnits);
    body = (
      <>
        You've logged <b>{fmtNum(goal.current)} of {fmtNum(goal.target)} {goal.unit}</b>.{" "}
        <b>{st.monthsLeft} months</b> remaining. To finish on time you need {needPhrase} — you're
        currently managing {curPhrase}.{" "}
        {st.status === "done"
          ? <>You've already hit the target. 🎉</>
          : st.status === "behind"
            ? <>That puts you <b>{fmtNum(off)} {goal.unit} behind pace.</b></>
            : <>You're <b>{fmtNum(off)} {goal.unit} ahead of pace.</b></>}
      </>
    );
  } else if (st.kind === "habit") {
    body = (
      <>
        You're aiming for <b>{st.target} sessions per week</b>. Last {st.weeks.length} weeks:{" "}
        <b>{st.weeks.join(" · ")}</b>.{" "}
        {st.deficit > 0
          ? <>You're <b>{st.deficit} {st.deficit === 1 ? "session" : "sessions"} under target</b> across the month{st.slight ? " — slightly behind." : "."}</>
          : st.surplus > 0
            ? <>That's <b>{st.surplus} over target</b> — comfortably ahead.</>
            : <>You're <b>right on pace.</b></>}
      </>
    );
  } else {
    const dl = fmtCountdown(goal.deadline);
    body = (
      <>
        <b>{st.done} of {st.total} steps</b> complete. Deadline <b>{dl}</b>.{" "}
        {st.status === "done"
          ? <>Every step is done — nicely finished. ✅</>
          : st.overdue > 0
            ? <><b>{st.overdue} {st.overdue === 1 ? "step is" : "steps are"} overdue.</b> {st.noDue > 0 && <>{st.noDue} more have no due date.</>}</>
            : st.noDue > 0
              ? <><b>{st.noDue} {st.noDue === 1 ? "step has" : "steps have"} no due date set</b> — consider scheduling them.</>
              : <>You're on track to finish in time.</>}
      </>
    );
  }

  return (
    <div className={"callout tone-" + tone} style={{ borderLeftColor: color }}>
      <div className="callout-head">
        <span className="callout-ico" style={{ color }}>
          <Icon name={st.status === "behind" ? "gauge" : st.status === "done" ? "check" : "trending"} size={16} stroke={2.4} />
        </span>
        <span className="callout-kicker">
          {st.status === "done" ? "Completed" : st.status === "behind" ? "Behind pace" : st.status === "ahead" ? "Ahead of pace" : "On track"}
        </span>
      </div>
      <p className="callout-body">{body}</p>
    </div>
  );
}

// ---- logging (quant) ----
function LogForm({ color, onLog }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [note, setNote] = React.useState("");
  const [date, setDate] = React.useState("2026-06-05");
  const submit = () => {
    const v = parseFloat(value);
    if (!v) return;
    onLog({ value: v, note: note.trim(), date });
    setValue(""); setNote(""); setOpen(false);
  };
  if (!open) return (
    <button className="log-add" style={{ borderColor: hexA(color, 0.5), color }} onClick={() => setOpen(true)}>
      <Icon name="plus" size={15} stroke={2.5} /> Log progress
    </button>
  );
  return (
    <div className="log-form">
      <input className="lf-value" type="number" placeholder="Amount" value={value} autoFocus
        onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
      <input className="lf-note" placeholder="Note (optional)" value={note}
        onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
      <input className="lf-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
      <button className="lf-go" style={{ background: color }} onClick={submit}><Icon name="check" size={15} stroke={2.8} /></button>
      <button className="lf-cancel" onClick={() => setOpen(false)}><Icon name="x" size={15} /></button>
    </div>
  );
}

function LogRow({ log, unit, color }) {
  const d = parseDate(log.date);
  return (
    <div className="log-row">
      <span className="log-ico">{log.icon || "•"}</span>
      <span className="log-main">{log.note || "Progress"}</span>
      <span className="log-val" style={{ color }}>+{fmtNum(log.value)} {unit}</span>
      <span className="log-date">{MONTHS[d.getMonth()]} {d.getDate()}</span>
    </div>
  );
}

// ---- steps (milestone) ----
function StepRow({ step, color, idx, onToggle, onDrag }) {
  const overdue = !step.done && step.due && daysUntil(step.due) < 0;
  return (
    <div className="step-row" draggable onDragStart={e => onDrag.start(e, idx)}
      onDragOver={e => onDrag.over(e, idx)} onDrop={e => onDrag.drop(e, idx)}>
      <span className="step-grip"><Icon name="grip" size={15} /></span>
      <button className={"step-check" + (step.done ? " done" : "")}
        style={step.done ? { background: color, borderColor: color } : {}}
        onClick={() => onToggle(step.id)}>
        {step.done && <Icon name="check" size={12} stroke={3} />}
      </button>
      <span className={"step-name" + (step.done ? " done" : "")}>{step.name}</span>
      {step.note && <span className="step-note">{step.note}</span>}
      {step.due && (
        <span className={"step-due" + (overdue ? " over" : "")}>
          <Icon name="clock" size={11} /> {MONTHS[parseDate(step.due).getMonth()]} {parseDate(step.due).getDate()}
        </span>
      )}
      {!step.done && !step.due && <span className="step-nodue">no date</span>}
    </div>
  );
}

function StepsSection({ goal, color, onToggleStep, onAddStep, onReorderSteps }) {
  const [adding, setAdding] = React.useState("");
  const [showDone, setShowDone] = React.useState(false);
  const dragIx = React.useRef(null);
  const drag = {
    start: (e, i) => { dragIx.current = i; e.dataTransfer.effectAllowed = "move"; },
    over: (e) => { e.preventDefault(); },
    drop: (e, i) => { e.preventDefault(); if (dragIx.current != null && dragIx.current !== i) onReorderSteps(dragIx.current, i); dragIx.current = null; },
  };
  const active = goal.steps.map((s, i) => ({ s, i })).filter(x => !x.s.done);
  const done = goal.steps.filter(s => s.done);
  const commit = () => { const n = adding.trim(); if (n) onAddStep(n); setAdding(""); };

  return (
    <div className="steps-list">
      {active.map(({ s, i }) => (
        <StepRow key={s.id} step={s} idx={i} color={color} onToggle={onToggleStep} onDrag={drag} />
      ))}
      <div className="step-add">
        <span className="step-add-plus"><Icon name="plus" size={15} stroke={2.4} /></span>
        <input className="step-add-input" placeholder="Add a step…" value={adding}
          onChange={e => setAdding(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") commit(); }} onBlur={commit} />
      </div>
      {done.length > 0 && (
        <>
          <button className="steps-toggle" onClick={() => setShowDone(v => !v)}>
            <Icon name={showDone ? "chevD" : "chevR"} size={14} /> {done.length} completed
          </button>
          {showDone && goal.steps.map((s, i) => s.done && (
            <StepRow key={s.id} step={s} idx={i} color={color} onToggle={onToggleStep} onDrag={drag} />
          ))}
        </>
      )}
    </div>
  );
}

// ---- connected habits (all types) ----
function ConnectedHabits({ goal, color, onLink, onUnlink }) {
  const [picking, setPicking] = React.useState(false);
  const linked = (goal.linkedHabits || []).map(habitById).filter(Boolean);
  const available = HABITS.filter(h => !(goal.linkedHabits || []).includes(h.id));
  return (
    <div className="linked">
      {linked.length === 0 && !picking && (
        <div className="linked-empty">
          <span>No habits linked yet.</span>
          <span className="linked-empty-sub">Want a recurring habit to support this goal?</span>
        </div>
      )}
      {linked.map(h => {
        const grid = historyFor(h, 4);
        const sessions = grid.flat().filter(v => v === 2).length;
        return (
          <div key={h.id} className="linked-row">
            <span className="linked-dot" style={{ background: h.color }} />
            <span className="linked-ico">{h.icon}</span>
            <span className="linked-name">{h.name}</span>
            <span className="linked-stat">contributing <b>{sessions}</b> sessions this month</span>
            <button className="linked-x" onClick={() => onUnlink(h.id)} title="Unlink"><Icon name="x" size={14} /></button>
          </div>
        );
      })}
      {picking ? (
        <div className="habit-picker">
          {available.length === 0 && <div className="hp-empty">All habits already linked.</div>}
          {available.map(h => (
            <button key={h.id} className="hp-item" onClick={() => { onLink(h.id); setPicking(false); }}>
              <span className="linked-dot" style={{ background: h.color }} />{h.icon} {h.name}
            </button>
          ))}
          <button className="hp-cancel" onClick={() => setPicking(false)}>Cancel</button>
        </div>
      ) : (
        <button className="linked-add" style={{ borderColor: hexA(color, 0.5), color }} onClick={() => setPicking(true)}>
          <Icon name="link" size={14} /> Link a habit
        </button>
      )}
    </div>
  );
}

function GoalDetail({ goal, onBack, onEdit, onLog, onToggleStep, onAddStep, onReorderSteps, onLink, onUnlink, accent }) {
  const area = areaById(goal.areaId);
  const color = area.color;
  const st = goalStatus(goal);
  const [month, setMonth] = React.useState("all");

  const logs = (goal.logs || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const logMonths = [...new Set(logs.map(l => parseDate(l.date).getMonth()))];
  const shownLogs = month === "all" ? logs : logs.filter(l => parseDate(l.date).getMonth() === +month);

  return (
    <div className="goal-detail">
      <div className="gd-bar">
        <button className="gd-back" onClick={onBack}><Icon name="arrowLeft" size={17} /> All goals</button>
        <button className="ghost-btn gd-edit" onClick={() => onEdit(goal.id)}><Icon name="edit" size={14} /> Edit</button>
      </div>

      <header className="gd-head">
        <span className="gd-icon" style={{ background: hexA(color, 0.14), borderColor: hexA(color, 0.3) }}>{goal.icon}</span>
        <div className="gd-headmain">
          <h1 className="gd-name">{goal.name}</h1>
          <div className="gd-meta">
            <span className="gc-area" style={{ color, background: hexA(color, 0.13), borderColor: hexA(color, 0.3) }}>{area.icon} {area.name}</span>
            <span className="gd-deadline"><Icon name="clock" size={13} /> {fmtDeadline(goal.deadline)} · {fmtCountdown(goal.deadline)}</span>
            <StatusBadge st={st} />
          </div>
        </div>
      </header>

      <SmartCallout goal={goal} color={color} />

      {st.kind === "quant" && (
        <>
          <div className="gd-quant">
            <section className="dash-block gd-ringcard">
              <GoalRing pct={st.pct} color={color} big={Math.round(st.pct * 100) + "%"}
                sub={`${fmtNum(goal.current)} / ${fmtNum(goal.target)}`} />
              <div className="gd-ring-unit">{goal.unit}</div>
            </section>
            <section className="dash-block gd-chartcard">
              <div className="dash-block-head"><h2 className="sec-title">Progress vs pace</h2><span className="sec-sub">{GOAL_YEAR}</span></div>
              <PaceChart goal={goal} color={color} />
            </section>
          </div>

          <section className="dash-block">
            <div className="dash-block-head">
              <h2 className="sec-title">Log</h2>
              <div className="gd-log-tools">
                <select className="month-filter" value={month} onChange={e => setMonth(e.target.value)}>
                  <option value="all">All months</option>
                  {logMonths.map(m => <option key={m} value={m}>{MONTHS[m]}</option>)}
                </select>
                <LogForm color={color} onLog={onLog} />
              </div>
            </div>
            <div className="log-list">
              {shownLogs.length === 0 && <div className="log-empty">No entries{month !== "all" ? " this month" : " yet"}.</div>}
              {shownLogs.map((l, i) => <LogRow key={i} log={l} unit={goal.unit} color={color} />)}
            </div>
          </section>
        </>
      )}

      {st.kind === "milestone" && (
        <section className="dash-block">
          <div className="dash-block-head"><h2 className="sec-title">Steps</h2>
            <span className="sec-sub">{st.done}/{st.total} done</span></div>
          <StepsSection goal={goal} color={color} onToggleStep={onToggleStep}
            onAddStep={onAddStep} onReorderSteps={onReorderSteps} />
        </section>
      )}

      {st.kind === "habit" && (
        <section className="dash-block">
          <div className="dash-block-head"><h2 className="sec-title">Weekly consistency</h2>
            <span className="sec-sub">last {st.weeks.length} weeks</span></div>
          <div className="gd-habit">
            <div className="gd-habit-strip"><HabitStrip weeks={st.weeks} target={st.target} color={color} /></div>
            <div className="gd-habit-side">
              <div className="ghs-num" style={{ color }}>{st.sessionsThisMonth}</div>
              <div className="ghs-lbl">sessions this month · target {st.targetTotal}</div>
            </div>
          </div>
        </section>
      )}

      <section className="dash-block">
        <div className="dash-block-head"><h2 className="sec-title">Connected habits</h2>
          <span className="sec-sub">tracked from calendar</span></div>
        <ConnectedHabits goal={goal} color={color} onLink={onLink} onUnlink={onUnlink} />
      </section>

      {goal.notes && (
        <section className="dash-block gd-notes">
          <div className="dash-block-head"><h2 className="sec-title">Notes</h2></div>
          <p className="gd-notes-body">{goal.notes}</p>
        </section>
      )}
    </div>
  );
}

export default GoalDetail;
export { GoalRing, PaceChart, SmartCallout };
