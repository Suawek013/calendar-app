// goal-modal.jsx — add / edit goal: prominent type selector + type-specific fields.
// Exposes: GoalModal

import React from 'react';
import { areaById, LIFE_AREAS } from './goals-data.jsx';
import { HABITS } from './data.jsx';
import { Icon, hexA } from './components.jsx';

const GOAL_TYPES = [
  { id: "quant",     label: "Quantitative", icon: "trending", desc: "Hit a number" },
  { id: "milestone", label: "Milestone",    icon: "flag",     desc: "Complete steps" },
  { id: "habit",     label: "Habit-based",  icon: "repeat",   desc: "Repeat weekly" },
];
const GOAL_EMOJIS = ["🎯","📚","🏃","💰","🏦","🚀","💪","🌙","✍️","🎓","🎨","🧘","🏔️","🌱","🎸","📈"];

function GoalModal({ goal, isNew, onSave, onDelete, onClose, accent }) {
  const [g, setG] = React.useState(() => ({
    linkedHabits: [], steps: [], logs: [], series: [], notes: "",
    target: 50, unit: "", startValue: 0, current: 0,
    weeklyTarget: 4, recent: [0, 0, 0, 0],
    deadline: "2026-12-31",
    ...goal,
  }));
  const [showNotes, setShowNotes] = React.useState(!!(goal && goal.notes));
  const [stepDraft, setStepDraft] = React.useState("");
  const set = (k, v) => setG(p => ({ ...p, [k]: v }));
  const area = areaById(g.areaId || "health");

  const addStep = () => {
    const n = stepDraft.trim(); if (!n) return;
    set("steps", [...(g.steps || []), { id: "s" + Date.now(), name: n, due: null, done: false }]);
    setStepDraft("");
  };
  const toggleHabit = (id) => {
    const has = (g.linkedHabits || []).includes(id);
    set("linkedHabits", has ? g.linkedHabits.filter(x => x !== id) : [...(g.linkedHabits || []), id]);
  };

  const save = () => {
    if (!g.name || !g.name.trim()) return;
    const out = { ...g, areaId: g.areaId || "health", type: g.type || "quant" };
    if (out.type === "quant" && (!out.series || !out.series.length)) {
      out.series = [{ m: 5, v: out.current || out.startValue || 0 }];
    }
    onSave(out);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide goal-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-kicker">{isNew ? "New goal" : "Edit goal"}</span>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        {/* name + icon */}
        <div className="gm-namerow">
          <button className="gm-iconbtn" onClick={() => {
            const i = GOAL_EMOJIS.indexOf(g.icon); set("icon", GOAL_EMOJIS[(i + 1) % GOAL_EMOJIS.length]);
          }} title="Click to change icon">{g.icon || "🎯"}</button>
          <input className="modal-label" placeholder="Name your goal" value={g.name || ""} autoFocus
            onChange={e => set("name", e.target.value)} />
        </div>
        <div className="emoji-grid gm-emoji">
          {GOAL_EMOJIS.map(e => (
            <button key={e} className={"emoji-btn" + (g.icon === e ? " on" : "")} onClick={() => set("icon", e)}
              style={g.icon === e ? { borderColor: accent, background: hexA(accent, 0.16) } : {}}>{e}</button>
          ))}
        </div>

        {/* type selector — the key decision */}
        <div className="modal-section-label">Goal type</div>
        <div className="type-sel">
          {GOAL_TYPES.map(t => (
            <button key={t.id} className={"type-card" + (g.type === t.id ? " on" : "")}
              onClick={() => set("type", t.id)}
              style={g.type === t.id ? { borderColor: area.color, background: hexA(area.color, 0.1) } : {}}>
              <span className="type-ico" style={{ color: g.type === t.id ? area.color : "var(--muted)" }}><Icon name={t.icon} size={19} /></span>
              <span className="type-label">{t.label}</span>
              <span className="type-desc">{t.desc}</span>
            </button>
          ))}
        </div>

        {/* life area */}
        <div className="modal-section-label">Life area</div>
        <div className="cat-row">
          {LIFE_AREAS.map(a => (
            <button key={a.id} className={"cat-chip" + (g.areaId === a.id ? " on" : "")} onClick={() => set("areaId", a.id)}
              style={g.areaId === a.id ? { borderColor: a.color, background: hexA(a.color, 0.14), color: "var(--text)" } : {}}>
              <span className="area-dot sm" style={{ background: a.color }} /> {a.icon} {a.name}
            </button>
          ))}
        </div>

        {/* deadline */}
        <div className="modal-section-label">Deadline</div>
        <div className="gm-deadline">
          <input className="time-select gm-date" type="date" value={g.deadline || ""}
            disabled={!g.deadline} onChange={e => set("deadline", e.target.value)} />
          <button className={"gm-ongoing" + (!g.deadline ? " on" : "")}
            onClick={() => set("deadline", g.deadline ? null : "2026-12-31")}
            style={!g.deadline ? { borderColor: accent, color: accent } : {}}>
            <span className={"toggle sm" + (!g.deadline ? " on" : "")} style={!g.deadline ? { background: accent } : {}}><span className="toggle-knob" /></span>
            No deadline
          </button>
        </div>

        {/* type-specific */}
        {(!g.type || g.type === "quant") && (
          <div className="gm-typefields">
            <div className="modal-row">
              <div style={{ flex: 1 }}>
                <div className="modal-section-label">Target</div>
                <input className="time-select" type="number" placeholder="50" value={g.target ?? ""}
                  onChange={e => set("target", +e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="modal-section-label">Unit</div>
                <input className="time-select" placeholder="books, km, zł…" value={g.unit || ""}
                  onChange={e => set("unit", e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="modal-section-label">Starting</div>
                <input className="time-select" type="number" placeholder="0" value={g.startValue ?? ""}
                  onChange={e => set("startValue", +e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {g.type === "milestone" && (
          <div className="gm-typefields">
            <div className="modal-section-label">First steps</div>
            <div className="gm-steps">
              {(g.steps || []).map((s, i) => (
                <div key={s.id} className="gm-step">
                  <span className="gm-step-dot" style={{ borderColor: area.color }} />
                  <span className="gm-step-name">{s.name}</span>
                  <button className="gm-step-x" onClick={() => set("steps", g.steps.filter(x => x.id !== s.id))}><Icon name="x" size={13} /></button>
                </div>
              ))}
              <div className="step-add">
                <span className="step-add-plus"><Icon name="plus" size={15} stroke={2.4} /></span>
                <input className="step-add-input" placeholder="Add a step…" value={stepDraft}
                  onChange={e => setStepDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addStep(); }} />
              </div>
            </div>
          </div>
        )}

        {g.type === "habit" && (
          <div className="gm-typefields">
            <div className="modal-row" style={{ alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <div className="modal-section-label">Times per week</div>
                <input className="time-select" type="number" min="1" max="7" value={g.weeklyTarget ?? 4}
                  onChange={e => set("weeklyTarget", +e.target.value)} />
              </div>
              <div style={{ flex: 2 }}>
                <div className="modal-section-label">Link to a habit</div>
                <select className="time-select" value={g.habitId || ""}
                  onChange={e => {
                    const id = e.target.value; set("habitId", id);
                    if (id) set("linkedHabits", [...new Set([...(g.linkedHabits || []), id])]);
                  }}>
                  <option value="">Choose a habit…</option>
                  {HABITS.map(h => <option key={h.id} value={h.id}>{h.icon} {h.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* connected habits (quant + milestone) */}
        {g.type !== "habit" && (
          <>
            <div className="modal-section-label">Connect habits <span className="ms-opt">optional</span></div>
            <div className="cat-row">
              {HABITS.map(h => (
                <button key={h.id} className={"cat-chip" + ((g.linkedHabits || []).includes(h.id) ? " on" : "")}
                  onClick={() => toggleHabit(h.id)}
                  style={(g.linkedHabits || []).includes(h.id) ? { borderColor: h.color, background: hexA(h.color, 0.14), color: "var(--text)" } : {}}>
                  <span className="area-dot sm" style={{ background: h.color }} /> {h.icon} {h.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* notes */}
        {showNotes ? (
          <>
            <div className="modal-section-label">Notes</div>
            <textarea className="gm-notes" placeholder="Anything to remember…" value={g.notes || ""}
              onChange={e => set("notes", e.target.value)} />
          </>
        ) : (
          <button className="gm-addnotes" onClick={() => setShowNotes(true)}><Icon name="plus" size={13} stroke={2.4} /> Add notes</button>
        )}

        <div className="modal-actions">
          {!isNew && <button className="del-btn" onClick={() => onDelete(g.id)}><Icon name="trash" size={15} /> Delete</button>}
          <div style={{ flex: 1 }} />
          <button className="ghost-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" style={{ background: accent }} onClick={save}>{isNew ? "Create goal" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

export default GoalModal;
