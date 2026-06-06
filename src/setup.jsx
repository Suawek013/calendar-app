// setup.jsx — habits config, template preview, colors, notifications
// Exposes: SetupView, HabitForm

import React from 'react';
import { HABITS, HABIT_PALETTE, DAYS, min12, GRID_START, GRID_END, CATEGORIES } from './data.jsx';
import { Icon, hexA } from './components.jsx';
import { ColorSwatches } from './modal.jsx';

function SetupView({ accent, onEditHabit, onAddHabit, bump, wake, bed, setWake, setBed }) {
  return (
    <div className="setup">
      <header className="setup-head">
        <h1 className="setup-title">Habits</h1>
        <p className="setup-lead">Define what matters. Every new week builds itself from these habits.</p>
      </header>

      <div className="setup-cols">
        <div className="setup-main">
          <section className="dash-block">
            <div className="dash-block-head">
              <h2 className="sec-title">Habits & routines</h2>
              <button className="add-habit" style={{ borderColor: accent, color: accent }} onClick={onAddHabit}>
                <Icon name="plus" size={15} stroke={2.4} /> New habit
              </button>
            </div>
            <div className="habit-list">
              {HABITS.map(h => <HabitRow key={h.id} h={h} onEdit={() => onEditHabit(h.id)} />)}
            </div>
          </section>

          <section className="dash-block">
            <div className="dash-block-head"><h2 className="sec-title">Quick recolor</h2><span className="sec-sub">colors are identity</span></div>
            <div className="recolor-grid">
              {HABITS.map(h => (
                <div key={h.id} className="recolor-item">
                  <span className="recolor-name"><span>{h.icon}</span>{h.name}</span>
                  <div className="recolor-swatches">
                    {HABIT_PALETTE.slice(0, 10).map(c => (
                      <button key={c} className="mini-swatch" onClick={() => { h.color = c; bump(); }}
                        style={{ background: c, outline: h.color === c ? "2px solid #fff" : "2px solid transparent", outlineOffset: 1 }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="setup-side">
          <SleepCard wake={wake} bed={bed} setWake={setWake} setBed={setBed} accent={accent} />

          <section className="dash-block">
            <div className="dash-block-head"><h2 className="sec-title">Template preview</h2></div>
            <p className="tmpl-note">This is what every new week starts as.</p>
            <TemplatePreview />
          </section>

          <section className="dash-block">
            <div className="dash-block-head"><h2 className="sec-title">Reminders</h2></div>
            <NotifRow label="Daily planning" sub="Plan tomorrow tonight" defOn time="21:00" accent={accent} />
            <NotifRow label="Habit check-in" sub="Did you go to the gym?" defOn time="20:00" accent={accent} />
            <NotifRow label="Weekly review" sub="Sunday evening recap" time="18:30" accent={accent} />
          </section>
        </div>
      </div>
    </div>
  );
}

function HabitRow({ h, onEdit }) {
  const sched = h.schedule.map(s => {
    const days = s.days.map(d => DAYS[d]).join(" ");
    return `${days} · ${min12(s.start)} · ${Math.round(s.dur/60*10)/10}h`;
  }).join("  ·  ");
  return (
    <button className="habit-listrow" onClick={onEdit}>
      <span className="hl-bar" style={{ background: h.color }} />
      <span className="hl-icon">{h.icon}</span>
      <span className="hl-main">
        <span className="hl-name">{h.name}<span className="hl-cat">{h.category}</span></span>
        <span className="hl-sched">{sched}</span>
      </span>
      {h.tracked === false ? <span className="hl-untrack">not tracked</span> : <span className="hl-track" style={{ color: h.color }}>● tracked</span>}
      <Icon name="chevR" size={16} style={{ color: "var(--muted)" }} />
    </button>
  );
}

function SleepCard({ wake, bed, setWake, setBed, accent }) {
  const wakeOpts = []; for (let m = 4*60; m <= 10*60; m += 30) wakeOpts.push(m);
  const bedOpts = []; for (let m = 20*60; m <= 24*60; m += 30) bedOpts.push(m);
  const lbl = (m) => m >= 24*60 ? "Midnight" : min12(m);
  const hrs = Math.round((bed - wake) / 60 * 10) / 10;
  return (
    <section className="dash-block">
      <div className="dash-block-head"><h2 className="sec-title">Waking hours</h2><span className="sec-sub">{hrs}h awake</span></div>
      <p className="tmpl-note">Your calendar only shows the hours you're awake.</p>
      <div className="sleep-row">
        <div className="sleep-field">
          <label className="sleep-lbl"><span className="sleep-ico">☀️</span> Wake up</label>
          <select className="time-select" value={wake} onChange={(e) => setWake(+e.target.value)}>
            {wakeOpts.map(m => <option key={m} value={m}>{min12(m)}</option>)}
          </select>
        </div>
        <div className="sleep-arrow"><Icon name="chevR" size={16} style={{ color: "var(--muted)" }} /></div>
        <div className="sleep-field">
          <label className="sleep-lbl"><span className="sleep-ico">🌙</span> Bedtime</label>
          <select className="time-select" value={bed} onChange={(e) => setBed(+e.target.value)}>
            {bedOpts.map(m => <option key={m} value={m}>{lbl(m)}</option>)}
          </select>
        </div>
      </div>
    </section>
  );
}

function TemplatePreview() {
  const SLOT = 1.0; // % scale handled by container
  return (
    <div className="tmpl">
      {DAYS.map((d, i) => {
        const dayBlocks = [];
        HABITS.forEach(h => h.schedule.forEach(s => { if (s.days.includes(i)) dayBlocks.push({ h, s }); }));
        return (
          <div key={d} className="tmpl-col">
            <span className="tmpl-day">{d[0]}</span>
            <div className="tmpl-track">
              {dayBlocks.map((x, k) => {
                const top = (x.s.start - GRID_START) / (GRID_END - GRID_START) * 100;
                const ht = x.s.dur / (GRID_END - GRID_START) * 100;
                return <span key={k} className="tmpl-seg" style={{ top: top + "%", height: Math.max(ht, 3) + "%", background: x.h.color }} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NotifRow({ label, sub, time, defOn, accent }) {
  const [on, setOn] = React.useState(!!defOn);
  return (
    <div className="notif-row">
      <div className="notif-main"><div className="notif-label">{label}</div><div className="notif-sub">{sub}</div></div>
      <div className="notif-time" style={{ opacity: on ? 1 : 0.4 }}><Icon name="clock" size={13} /> {time}</div>
      <button className={"toggle" + (on ? " on" : "")} onClick={() => setOn(!on)}
        style={on ? { background: accent } : {}}><span className="toggle-knob" /></button>
    </div>
  );
}

function HabitForm({ habit, isNew, onSave, onDelete, onClose, accent, onAddCategory }) {
  const [h, setH] = React.useState(() => ({ ...habit, schedule: habit.schedule.map(s => ({ ...s, days: [...s.days] })) }));
  const [newCat, setNewCat] = React.useState("");
  const [addingCat, setAddingCat] = React.useState(false);
  const set = (k, v) => setH(p => ({ ...p, [k]: v }));
  const s0 = h.schedule[0] || { days: [], start: 9*60, dur: 60 };
  const setSlot = (patch) => setH(p => ({ ...p, schedule: [{ ...s0, ...patch }] }));
  const toggleDay = (d) => {
    const days = new Set(s0.days); days.has(d) ? days.delete(d) : days.add(d);
    setSlot({ days: [...days].sort() });
  };
  const commitCat = () => {
    const name = newCat.trim();
    if (!name) { setAddingCat(false); return; }
    if (!CATEGORIES.includes(name)) onAddCategory && onAddCategory(name);
    set("category", name);
    setNewCat(""); setAddingCat(false);
  };
  const EMOJIS = ["💪","🔥","📚","🎓","❤️","🎮","💼","🏃","🧘","🎨","🍳","🌙","☕","🎸","💧","✍️"];
  const times = []; for (let m = GRID_START; m <= GRID_END; m += 30) times.push(m);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-kicker">{isNew ? "New habit" : "Edit habit"}</span>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div className="form-row">
          <input className="modal-label" placeholder="Habit name" value={h.name} autoFocus onChange={(e) => set("name", e.target.value)} />
        </div>

        <div className="modal-section-label">Icon</div>
        <div className="emoji-grid">
          {EMOJIS.map(e => (
            <button key={e} className={"emoji-btn" + (h.icon === e ? " on" : "")} onClick={() => set("icon", e)}
              style={h.icon === e ? { borderColor: accent, background: hexA(accent, 0.16) } : {}}>{e}</button>
          ))}
        </div>

        <div className="modal-section-label">Color</div>
        <ColorSwatches value={h.color} onChange={(c) => set("color", c)} />

        <div className="modal-section-label">Category</div>
        <div className="cat-row">
          {CATEGORIES.map(c => (
            <button key={c} className={"cat-chip" + (h.category === c ? " on" : "")} onClick={() => set("category", c)}
              style={h.category === c ? { borderColor: h.color, background: hexA(h.color, 0.14), color: "var(--text)" } : {}}>{c}</button>
          ))}
          {addingCat ? (
            <span className="cat-add-field">
              <input className="cat-add-input" autoFocus placeholder="Name…" value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") commitCat(); if (e.key === "Escape") { setNewCat(""); setAddingCat(false); } }}
                onBlur={commitCat} />
              <button className="cat-add-go" style={{ background: accent }} onMouseDown={(e) => { e.preventDefault(); commitCat(); }}><Icon name="check" size={13} stroke={2.8} /></button>
            </span>
          ) : (
            <button className="cat-chip cat-new" onClick={() => setAddingCat(true)}><Icon name="plus" size={13} stroke={2.6} /> New</button>
          )}
        </div>

        <div className="modal-section-label">Default schedule</div>
        <div className="day-toggle">
          {DAYS.map((d, i) => (
            <button key={d} className={"day-btn" + (s0.days.includes(i) ? " on" : "")} onClick={() => toggleDay(i)}
              style={s0.days.includes(i) ? { borderColor: h.color, background: hexA(h.color, 0.18), color: "var(--text)" } : {}}>{d}</button>
          ))}
        </div>
        <div className="modal-row" style={{ marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="modal-section-label">From</div>
            <select className="time-select" value={s0.start} onChange={(e) => {
              const ns = +e.target.value;
              setSlot({ start: ns, dur: Math.max(30, Math.min(s0.dur, GRID_END - ns)) }); }}>
              {times.slice(0, -1).map(m => <option key={m} value={m}>{min12(m)}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div className="modal-section-label">To</div>
            <select className="time-select" value={s0.start + s0.dur} onChange={(e) => setSlot({ dur: +e.target.value - s0.start })}>
              {times.filter(m => m > s0.start).map(m => <option key={m} value={m}>{m >= 24*60 ? "Midnight" : min12(m)}</option>)}
            </select>
          </div>
        </div>

        <div className="track-toggle-row">
          <div><div className="notif-label">Track on dashboard</div><div className="notif-sub">Show in activity graph</div></div>
          <button className={"toggle" + (h.tracked !== false ? " on" : "")} onClick={() => set("tracked", h.tracked === false)}
            style={h.tracked !== false ? { background: accent } : {}}><span className="toggle-knob" /></button>
        </div>

        <div className="modal-actions">
          {!isNew && <button className="del-btn" onClick={() => onDelete(h.id)}><Icon name="trash" size={15} /> Delete</button>}
          <div style={{ flex: 1 }} />
          <button className="ghost-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" style={{ background: accent }} onClick={() => onSave(h)}>{isNew ? "Create habit" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

export { SetupView, HabitForm };
