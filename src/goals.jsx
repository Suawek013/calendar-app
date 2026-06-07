// goals.jsx — Goals overview: year + stats, behind-pace alert, area sections, goal cards.
// Exposes: GoalsView, GoalCard, StatusBadge, ConnectedDots, HabitStrip, goalAccent

import React from 'react';
import { areaById, goalStatus, fmtNum, fmtDeadline, fmtCountdown, goalsRollup, GOAL_YEAR, LIFE_AREAS } from './goals-data.jsx';
import { habitById } from './data.jsx';
import { Icon, hexA } from './components.jsx';
import { useTranslation } from './i18n.jsx';
function goalAccent(g) { return areaById(g.areaId).color; }

function StatusBadge({ st, size = "reg" }) {
  const { t } = useTranslation();
  const map = {
    on:    { cls: "on",    label: t("goals.status.on") },
    ahead: { cls: "ahead", label: t("goals.status.ahead") },
    behind:{ cls: "behind", label: st && st.slight ? t("goals.status.behindSlight") : t("goals.status.behind") },
    done:  { cls: "done",  label: t("goals.status.done") },
  };
  const m = map[st.status] || map.on;
  return (
    <span className={"gbadge " + m.cls + (size === "sm" ? " sm" : "")}>
      {st.status === "done"
        ? <Icon name="check" size={size === "sm" ? 11 : 12} stroke={2.8} />
        : <span className="gbadge-dot" />}
      {m.label}
    </span>
  );
}

function ConnectedDots({ ids }) {
  const { t } = useTranslation();
  if (!ids || !ids.length) return null;
  return (
    <span className="gc-habits" title={t("goals.connHabits")}>
      <Icon name="link" size={11} />
      {ids.map(id => {
        const h = habitById(id); if (!h) return null;
        return <span key={id} className="gc-habit-dot" style={{ background: h.color }} title={h.name} />;
      })}
    </span>
  );
}

// last-N-weeks bars for a habit goal; filled when the week hit target
function HabitStrip({ weeks, target, color }) {
  const { t } = useTranslation();
  const max = Math.max(target, ...weeks, 1);
  return (
    <div className="hstrip" title={weeks.join(" · ") + " " + t("goals.sessions")}>
      {weeks.map((w, i) => {
        const hit = w >= target;
        return (
          <div key={i} className="hstrip-col">
            <div className="hstrip-track">
              <div className="hstrip-fill" style={{
                height: Math.max(8, (w / max) * 100) + "%",
                background: hit ? color : hexA(color, 0.32),
                border: hit ? "none" : `1px solid ${hexA(color, 0.5)}`,
              }} />
            </div>
            <span className="hstrip-n" style={{ color: hit ? "var(--text)" : "var(--muted)" }}>{w}</span>
          </div>
        );
      })}
    </div>
  );
}

function GoalCard({ goal, onOpen }) {
  const { t } = useTranslation();
  const area = areaById(goal.areaId);
  const st = goalStatus(goal);
  const [showDate, setShowDate] = React.useState(false);
  const color = area.color;

  return (
    <button className={"goal-card" + (st.status === "done" ? " is-done" : "")}
      style={{ borderLeftColor: color }} onClick={() => onOpen(goal.id)}>
      <div className="gc-top">
        <div className="gc-title">
          <span className="gc-icon">{goal.icon}</span>
          <span className="gc-name">{goal.name}</span>
        </div>
        <StatusBadge st={st} size="sm" />
      </div>

      <div className="gc-meta">
        <span className="gc-area" style={{ color, background: hexA(color, 0.13), borderColor: hexA(color, 0.3) }}>
          {area.icon} {area.name}
        </span>
        <span className="gc-deadline" onMouseEnter={() => setShowDate(true)} onMouseLeave={() => setShowDate(false)}>
          <Icon name={st.status === "done" ? "check" : "clock"} size={12} />
          {st.status === "done"
            ? (goal.completedDate ? t("goals.card.done") + fmtDeadline(goal.completedDate).replace(/, \d+$/, "") : t("goals.card.completed"))
            : goal.deadline ? (showDate ? fmtDeadline(goal.deadline) : fmtCountdown(goal.deadline)) : t("goals.card.ongoing")}
        </span>
      </div>

      {/* progress, by type */}
      {st.kind === "quant" && (
        <div className="gc-prog">
          <div className="gc-bar"><div className="gc-bar-fill"
            style={{ width: (st.pct * 100) + "%", background: color }} /></div>
          <div className="gc-prog-row">
            <span className="gc-prog-val"><b>{fmtNum(goal.current)}</b> / {fmtNum(goal.target)} {goal.unit}</span>
            <span className="gc-prog-pct">{Math.round(st.pct * 100)}%</span>
          </div>
        </div>
      )}

      {st.kind === "milestone" && (
        <div className="gc-prog">
          <div className="gc-steps-dots">
            {goal.steps.map(s => (
              <span key={s.id} className={"gc-step-dot" + (s.done ? " done" : "")}
                style={s.done ? { background: color, borderColor: color } : {}} />
            ))}
          </div>
          <div className="gc-prog-row">
            <span className="gc-prog-val">{t("goals.card.stepsDone", {done: st.done, total: st.total})}</span>
            {st.noDue > 0 && st.status !== "done" && <span className="gc-flag">{t("goals.card.unsched", {count: st.noDue})}</span>}
          </div>
        </div>
      )}

      {st.kind === "habit" && (
        <div className="gc-prog">
          <HabitStrip weeks={st.weeks} target={st.target} color={color} />
          <div className="gc-prog-row">
            <span className="gc-prog-val">{t("goals.card.targetWeek", {target: st.target})}</span>
            <span className="gc-prog-pct">{t("goals.card.thisMonth", {count: st.sessionsThisMonth})}</span>
          </div>
        </div>
      )}

      <div className="gc-foot">
        <ConnectedDots ids={goal.linkedHabits} />
        <span className="gc-open"><Icon name="chevR" size={15} /></span>
      </div>
    </button>
  );
}

function StatChip({ n, label, tone }) {
  return (
    <div className={"gstat " + (tone || "")}>
      <span className="gstat-n">{n}</span>
      <span className="gstat-lbl">{label}</span>
    </div>
  );
}

function BehindBanner({ goals, onClick }) {
  const { t } = useTranslation();
  const behind = goals.filter(g => goalStatus(g).status === "behind");
  if (!behind.length) return null;
  const names = behind.map(g => g.name).join(", ");
  return (
    <button className="behind-banner" onClick={onClick}>
      <span className="bb-ico">⚠</span>
      <span className="bb-text">
        <b>{behind.length === 1 ? t("goals.bb.behind1") : t("goals.bb.behindN", {count: behind.length})}</b>
        <span className="bb-names">{names}</span>
      </span>
      <span className="bb-go">{t("goals.bb.review")} <Icon name="chevR" size={14} /></span>
    </button>
  );
}

function GoalsView({ goals, year, setYear, onOpen, onAdd, accent }) {
  const { t } = useTranslation();
  const [filter, setFilter] = React.useState("all"); // all | behind
  const yearGoals = goals; // (single seeded year; year switch shows empty otherwise)
  const hasYear = year === GOAL_YEAR && yearGoals.length > 0;
  const roll = goalsRollup(yearGoals);

  const shown = filter === "behind"
    ? yearGoals.filter(g => goalStatus(g).status === "behind")
    : yearGoals;

  // group by area, preserving LIFE_AREAS order
  const byArea = LIFE_AREAS.map(a => ({
    area: a,
    items: shown.filter(g => g.areaId === a.id),
  })).filter(grp => grp.items.length > 0);

  return (
    <div className="goals">
      <header className="goals-head">
        <div className="goals-head-top">
          <div className="year-nav">
            <button onClick={() => setYear(year - 1)}><Icon name="chevL" size={18} /></button>
            <span className="year-val">{year}</span>
            <button onClick={() => setYear(year + 1)}><Icon name="chevR" size={18} /></button>
          </div>
          <button className="goals-add" style={{ background: accent }} onClick={onAdd}>
            <Icon name="plus" size={16} stroke={2.5} /> {t("goals.head.add")}
          </button>
        </div>
        {hasYear && (
          <div className="goals-stats">
            <StatChip n={roll.active} label={t("goals.stat.active")} />
            <StatChip n={roll.on} label={t("goals.stat.on")} tone="good" />
            <StatChip n={roll.behind} label={t("goals.stat.behind")} tone="warn" />
            <StatChip n={roll.completed} label={t("goals.stat.done")} tone="muted" />
          </div>
        )}
      </header>

      {!hasYear && (
        <div className="goals-empty">
          <div className="ge-ico"><Icon name="target" size={30} /></div>
          <div className="ge-title">{t("goals.empty.title", {year})}</div>
          <div className="ge-sub">{t("goals.empty.sub")}</div>
          <button className="goals-add" style={{ background: accent, marginTop: 16 }} onClick={onAdd}>
            <Icon name="plus" size={16} stroke={2.5} /> {t("goals.empty.add", {year})}
          </button>
        </div>
      )}

      {hasYear && (
        <>
          {filter === "all"
            ? <BehindBanner goals={yearGoals} onClick={() => setFilter("behind")} />
            : (
              <div className="filter-bar">
                <span className="filter-label">{t("goals.filter.showing", {count: shown.length})}</span>
                <button className="filter-clear" onClick={() => setFilter("all")}>
                  <Icon name="x" size={13} /> {t("goals.filter.clear")}
                </button>
              </div>
            )}

          {byArea.map(({ area, items }) => {
            const r = goalsRollup(items);
            const areaPct = r.total ? Math.round(r.completed / r.total * 100) : 0;
            return (
              <section key={area.id} className="area-sec">
                <div className="area-head">
                  <span className="area-dot" style={{ background: area.color }} />
                  <span className="area-name">{area.icon} {area.name}</span>
                  <span className="area-count">{items.length === 1 ? t("goals.area.goal1") : t("goals.area.goalN", {count: items.length})}</span>
                  <span className="area-spacer" />
                  <span className="area-pct">{t("goals.area.complete", {pct: areaPct})}</span>
                </div>
                <div className="goals-grid">
                  {items.map(g => <GoalCard key={g.id} goal={g} onOpen={onOpen} />)}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

export { GoalsView, GoalCard, StatusBadge, ConnectedDots, HabitStrip, BehindBanner, goalAccent };
