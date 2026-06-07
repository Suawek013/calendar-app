// modal.jsx — block edit/add modal + color picker
// Exposes: EditModal, ColorSwatches

import React from 'react';
import { GRID_START, GRID_END, habitById, HABITS, min12, DAYS, HABIT_PALETTE } from './data.jsx';
import { Icon, hexA, Segmented, StatusDot } from './components.jsx';
import { useTranslation } from './i18n.jsx';
function timeOptions() {
  const out = [];
  for (let m = GRID_START; m <= GRID_END; m += 30) out.push(m);
  return out;
}

function EditModal({ block, isNew, onSave, onDelete, onClose, accent }) {
  const { t } = useTranslation();
  const initH = habitById(block.habitId);
  const [b, setB] = React.useState({ ...block, label: block.label || (initH ? initH.name : "") });
  const set = (k, v) => setB(p => ({ ...p, [k]: v }));
  const h = habitById(b.habitId) || { color: b.color || "#7d8aa0", icon: b.icon || "✨", name: b.label || "Block" };
  const times = timeOptions();

  function toggleDay(d) {
    // only meaningful for repeat=custom — store on b._days
    const days = new Set(b._days || [b.day]);
    days.has(d) ? days.delete(d) : days.add(d);
    set("_days", [...days]);
  }
  const days = b._days || [b.day];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-kicker">{isNew ? t("block.modal.new") : t("block.modal.edit")}</span>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <input className="modal-label" placeholder={t("block.modal.placeholder")} value={b.label}
          autoFocus onChange={(e) => set("label", e.target.value)} />
        <input className="modal-sub" placeholder={t("block.modal.note")} value={b.sublabel || ""}
          onChange={(e) => set("sublabel", e.target.value)} />

        <div className="modal-section-label">{t("block.modal.cat")}</div>
        <div className="cat-grid">
          {HABITS.map(hh => (
            <button key={hh.id} className={"cat-pill" + (b.habitId === hh.id ? " on" : "")}
              onClick={() => {
                const oldH = habitById(b.habitId);
                const isUnedited = !b.label || (oldH && b.label === oldH.name);
                setB(p => ({ ...p, habitId: hh.id, label: isUnedited ? hh.name : p.label }));
              }}
              style={b.habitId === hh.id ? { borderColor: hh.color, background: hexA(hh.color, 0.16) } : {}}>
              <span className="qa-swatch" style={{ background: hh.color }} />{hh.icon} {hh.name}
            </button>
          ))}
        </div>

        <div className="modal-row">
          <div style={{ flex: 1 }}>
            <div className="modal-section-label">{t("block.modal.start")}</div>
            <select className="time-select" value={b.start} onChange={(e) => {
              const ns = +e.target.value; const dur = Math.max(30, b.dur);
              setB(p => ({ ...p, start: ns, dur: Math.min(dur, GRID_END - ns) })); }}>
              {times.slice(0, -1).map(m => <option key={m} value={m}>{min12(m)}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div className="modal-section-label">{t("block.modal.end")}</div>
            <select className="time-select" value={b.start + b.dur} onChange={(e) => set("dur", +e.target.value - b.start)}>
              {times.filter(m => m > b.start).map(m => <option key={m} value={m}>{m >= 24*60 ? "Midnight" : min12(m)}</option>)}
            </select>
          </div>
        </div>

        <div className="modal-section-label">{t("block.modal.repeat")}</div>
        <Segmented value={b.repeat || "this"} onChange={(v) => set("repeat", v)}
          options={[{value:"this",label:t("block.rep.this")},{value:"every",label:t("block.rep.every")},{value:"custom",label:t("block.rep.custom")}]} />

        {b.repeat === "custom" && (
          <div className="day-toggle">
            {DAYS.map((d, i) => (
              <button key={d} className={"day-btn" + (days.includes(i) ? " on" : "")}
                onClick={() => toggleDay(i)}
                style={days.includes(i) ? { borderColor: accent, background: hexA(accent, 0.16), color: "var(--text)" } : {}}>{d}</button>
            ))}
          </div>
        )}

        <div className="modal-section-label">{t("block.modal.status")}</div>
        <div className="status-row">
          {[["planned",t("block.stat.planned")],["done",t("block.stat.done")],["skipped",t("block.stat.skipped")]].map(([s, lbl]) => (
            <button key={s} className={"status-pill" + (b.status === s ? " on" : "")}
              onClick={() => set("status", s)}
              style={b.status === s ? { borderColor: h.color, background: hexA(h.color, 0.14) } : {}}>
              <StatusDot status={s} color={h.color} size={15} /> {lbl}
            </button>
          ))}
        </div>

        <div className="modal-actions">
          {!isNew && <button className="del-btn" onClick={() => onDelete(b.id)}><Icon name="trash" size={15} /> {t("block.modal.delete")}</button>}
          <div style={{ flex: 1 }} />
          <button className="ghost-btn" onClick={onClose}>{t("block.modal.cancel")}</button>
          <button className="save-btn" style={{ background: accent }} onClick={() => onSave(b)}>
            {isNew ? t("block.modal.add") : t("block.modal.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ColorSwatches({ value, onChange }) {
  return (
    <div className="swatch-grid">
      {HABIT_PALETTE.map(c => (
        <button key={c} className="swatch" onClick={() => onChange(c)}
          style={{ background: c, outline: value === c ? "2px solid #fff" : "2px solid transparent",
            outlineOffset: 2 }} />
      ))}
    </div>
  );
}

export { EditModal, ColorSwatches };
