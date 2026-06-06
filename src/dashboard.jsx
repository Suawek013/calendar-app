// dashboard.jsx — life overview: habit cards, time distribution, week snapshot
// Exposes: DashboardView

import React from 'react';
import { HABITS, GRID_END, GRID_START, TODAY_INDEX, habitById, historyFor, currentStreak, DAYS } from './data.jsx';
import { Icon, Segmented, Donut, YearHeatmap, yearStats, ActivityGrid, hexA } from './components.jsx';
import { GOAL_YEAR, goalStatus, areaById, fmtNum } from './goals-data.jsx';
function DashboardView({ blocks, weekOffset, onGoCalendar, onMarkHabits, onAdd, accent, period, setPeriod, goals, onOpenGoal, onGoGoals }) {
  const tracked = HABITS.filter(h => h.tracked !== false);
  const doneCount = blocks.filter(b => b.status === "done").length;
  const schedCount = blocks.filter(b => b.status !== "skipped").length;
  const pct = schedCount ? Math.round(doneCount / schedCount * 100) : 0;

  // time distribution from this week's blocks
  const byHabit = {};
  blocks.forEach(b => {
    if (b.status === "skipped") return;
    byHabit[b.habitId] = (byHabit[b.habitId] || 0) + b.dur;
  });
  const mult = period === "month" ? 4.2 : 1;
  let segs = HABITS.map(h => ({
    id: h.id, label: h.name, color: h.color, icon: h.icon,
    hours: Math.round(((byHabit[h.id] || 0) / 60) * mult),
  })).filter(s => s.hours > 0).sort((a, b) => b.hours - a.hours);
  const sleep = { id: "sleep", label: "Sleep", color: "#3a3a48", icon: "🌙",
    hours: Math.round((24 - (GRID_END - GRID_START) / 60) * 7 * mult) };
  const allSegs = [...segs, sleep];
  const total = allSegs.reduce((a, s) => a + s.hours, 0);
  const waking = total - sleep.hours;

  const trends = { uni: +2, work: 0, gym: -1, side: +3, read: 0, couple: +1, game: -2, sleep: 0 };

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <div className="dash-greet">Good evening, Sławek</div>
          <div className="dash-date">Thursday, June 4 · <span style={{ color: accent }}>{tracked.length} habits tracked</span></div>
        </div>
        <div className="dash-headstat">
          <div className="hs-num" style={{ fontFamily: "var(--head)" }}>{doneCount}<span className="hs-den">/{schedCount}</span></div>
          <div className="hs-lbl">habits done this week · {pct}% on track</div>
        </div>
      </header>

      <HabitActivity accent={accent} />

      {goals && goals.length > 0 && <DashGoals goals={goals} onOpenGoal={onOpenGoal} onGoGoals={onGoGoals} />}

      <div className="dash-cols">
        <section className="dash-block">
          <div className="dash-block-head">
            <h2 className="sec-title">Where time goes</h2>
            <Segmented value={period} onChange={setPeriod}
              options={[{value:"week",label:"Last 7 days"},{value:"month",label:"Last 30 days"}]} />
          </div>
          <div className="dist">
            <Donut size={186} thickness={26}
              segments={allSegs.map(s => ({ value: s.hours, color: s.color }))}
              centerTop={waking + "h"} centerBottom="awake" />
            <ul className="dist-list">
              {allSegs.map(s => {
                const pct = Math.round((s.hours / total) * 100);
                const t = trends[s.id] || 0;
                return (
                  <li key={s.id}>
                    <span className="dist-dot" style={{ background: s.color }} />
                    <span className="dist-name">{s.label}</span>
                    <span className="dist-hrs">{s.hours}h</span>
                    <span className="dist-pct">{pct}%</span>
                    <span className="dist-trend" style={{ color: t > 0 ? "var(--good)" : t < 0 ? "var(--bad)" : "var(--muted)" }}>
                      {t === 0 ? "—" : <>{t > 0 ? <Icon name="arrowUp" size={11} stroke={2.5}/> : <Icon name="arrowDown" size={11} stroke={2.5}/>}{Math.abs(t)}h</>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="dash-block">
          <div className="dash-block-head"><h2 className="sec-title">This week</h2><span className="sec-sub">tap a day to plan</span></div>
          <WeekSnapshot blocks={blocks} onGoCalendar={onGoCalendar} accent={accent} />
          <div className="quick-actions">
            <button className="qa-action primary" style={{ background: accent }} onClick={onMarkHabits}>
              <Icon name="check" size={16} stroke={2.5} /> Mark today's habits
            </button>
            <button className="qa-action" onClick={() => onGoCalendar(TODAY_INDEX)}>
              <Icon name="calendar" size={16} /> This week's calendar
            </button>
            <button className="qa-action" onClick={onAdd}>
              <Icon name="plus" size={16} stroke={2.4} /> Add one-off event
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function HabitActivity({ accent }) {
  const tracked = HABITS.filter(h => h.tracked !== false);
  const [focus, setFocus] = React.useState("all");
  const years = React.useMemo(
    () => Object.fromEntries(HABITS.map(h => [h.id, historyFor(h, 53)])), []);

  const focusHabit = focus === "all" ? null : habitById(focus);

  return (
    <section className="dash-block">
      <div className="dash-block-head">
        <h2 className="sec-title">Habit activity</h2>
        <span className="sec-sub">past 12 months</span>
      </div>

      <div className="ha-switch">
        <button className={"ha-chip" + (focus === "all" ? " on" : "")}
          onClick={() => setFocus("all")}
          style={focus === "all" ? { borderColor: accent, color: accent } : {}}>
          <Icon name="dashboard" size={13} /> All habits
        </button>
        {tracked.map(h => (
          <button key={h.id} className={"ha-chip" + (focus === h.id ? " on" : "")}
            onClick={() => setFocus(h.id)}
            style={focus === h.id ? { borderColor: h.color, color: h.color } : {}}>
            <span className="ha-chip-ico">{h.icon}</span>{h.name}
          </button>
        ))}
      </div>

      {focus === "all" ? (
        <div className="ha-rows">
          {tracked.map(h => {
            const g = years[h.id]; const st = yearStats(g);
            return (
              <button className="ha-row" key={h.id} onClick={() => setFocus(h.id)}>
                <div className="ha-row-label">
                  <span className="ha-row-name"><span className="ha-row-ico">{h.icon}</span>{h.name}</span>
                  <span className="ha-row-meta">{st.done} done · {st.pct}%</span>
                </div>
                <div className="ha-row-grid"><YearHeatmap grid={g} color={h.color} cell={9} gap={2.5} /></div>
                <span className="ha-row-streak" style={{ color: st.cur > 0 ? h.color : "var(--muted)" }}>
                  <span style={{ filter: st.cur > 0 ? "none" : "grayscale(1) opacity(.5)" }}>🔥</span> {st.cur}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="ha-focus">
          <div className="ha-stats">
            {(() => {
              const st = yearStats(years[focus]);
              const items = [
                { l: "Current streak", v: st.cur + "d", c: focusHabit.color },
                { l: "Best streak", v: st.best + "d" },
                { l: "Completed", v: st.done },
                { l: "Consistency", v: st.pct + "%" },
              ];
              return items.map(it => (
                <div className="ha-stat" key={it.l}>
                  <div className="ha-stat-v" style={it.c ? { color: it.c } : {}}>{it.v}</div>
                  <div className="ha-stat-l">{it.l}</div>
                </div>
              ));
            })()}
          </div>
          <div className="ha-bigheat">
            <YearHeatmap grid={years[focus]} color={focusHabit.color} cell={13} gap={3} labels />
          </div>
          <div className="ha-legend">
            <span>Less</span>
            <span className="ha-leg-sw" style={{ background: "rgba(255,255,255,0.045)" }} />
            <span className="ha-leg-sw" style={{ background: hexA(focusHabit.color, 0.2) }} />
            <span className="ha-leg-sw" style={{ background: focusHabit.color }} />
            <span>More</span>
          </div>
        </div>
      )}
    </section>
  );
}

function HabitCard({ habit, blocks, accent }) {
  const grid = React.useMemo(() => historyFor(habit, 4), [habit.id]);
  const streak = React.useMemo(() => currentStreak(grid), [grid]);
  const mine = blocks.filter(b => b.habitId === habit.id);
  const doneN = mine.filter(b => b.status === "done").length;
  const totalN = mine.length || habit.schedule.reduce((a, s) => a + s.days.length, 0);
  return (
    <div className="habit-card">
      <div className="hc-head">
        <span className="hc-name"><span className="hc-icon">{habit.icon}</span>{habit.name}</span>
        <span className="hc-streak" title={streak + " day streak"}>
          <span className="hc-flame" style={{ filter: streak > 0 ? "none" : "grayscale(1) opacity(0.5)" }}>🔥</span>
          <span className="hc-streak-n" style={{ color: streak > 0 ? habit.color : "var(--muted)" }}>{streak}</span>
        </span>
      </div>
      <ActivityGrid grid={grid} color={habit.color} fill gap={5} />
      <div className="hc-foot">
        <span className="hc-comp">{doneN}/{totalN} <span className="hc-comp-lbl">this week</span></span>
        <div className="hc-bar"><div className="hc-bar-fill" style={{ width: (totalN ? doneN/totalN*100 : 0) + "%", background: habit.color }} /></div>
      </div>
    </div>
  );
}

function WeekSnapshot({ blocks, onGoCalendar, accent }) {
  return (
    <div className="snap">
      {DAYS.map((d, i) => {
        const dayBlocks = blocks.filter(b => b.day === i).sort((a, b) => a.start - b.start);
        const isToday = i === TODAY_INDEX;
        return (
          <button key={d} className={"snap-day" + (isToday ? " today" : "")} onClick={() => onGoCalendar(i)}
            style={isToday ? { borderColor: accent } : {}}>
            <span className="snap-name" style={{ color: isToday ? accent : "var(--muted)" }}>{d}</span>
            <div className="snap-track">
              {dayBlocks.map(b => {
                const h = habitById(b.habitId);
                const top = (b.start - GRID_START) / (GRID_END - GRID_START) * 100;
                const ht = b.dur / (GRID_END - GRID_START) * 100;
                return <span key={b.id} className="snap-seg" style={{
                  top: top + "%", height: Math.max(ht, 2) + "%", background: h.color,
                  opacity: b.status === "skipped" ? 0.3 : b.status === "done" ? 1 : 0.6 }} />;
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DashGoals({ goals, onOpenGoal, onGoGoals }) {
  const rank = (g) => { const s = goalStatus(g).status; return s === "behind" ? 0 : s === "done" ? 2 : 1; };
  const ranked = [...goals].sort((a, b) => rank(a) - rank(b)).slice(0, 4);
  const behind = goals.filter(g => goalStatus(g).status === "behind");
  return (
    <section className="dash-block">
      <div className="dash-block-head">
        <h2 className="sec-title">{GOAL_YEAR} Goals</h2>
        <button onClick={onGoGoals} style={{ background: "transparent", border: "none", color: "var(--muted2)",
          fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          See all <Icon name="chevR" size={13} />
        </button>
      </div>
      {behind.length > 0 && (
        <button className="dash-behind" onClick={onGoGoals}>
          <span className="bb-ico">⚠</span>
          <span className="bb-text">
            <b>{behind.length} {behind.length === 1 ? "goal" : "goals"} behind pace</b>
            <span className="bb-names">{behind.map(g => g.name).join(", ")}</span>
          </span>
          <span className="bb-go" style={{ color: "var(--warn)" }}>Review <Icon name="chevR" size={13} /></span>
        </button>
      )}
      <div className="dash-goals-grid">
        {ranked.map(g => <DashGoalCard key={g.id} goal={g} onOpen={onOpenGoal} />)}
      </div>
    </section>
  );
}

function DashGoalCard({ goal, onOpen }) {
  const area = areaById(goal.areaId);
  const st = goalStatus(goal);
  const color = area.color;
  let label;
  if (st.kind === "quant") label = <><b>{fmtNum(goal.current)}</b>/{fmtNum(goal.target)} {goal.unit}</>;
  else if (st.kind === "milestone") label = <><b>{st.done}</b>/{st.total} steps</>;
  else label = <><b>{st.total}</b>/{st.targetTotal} sessions</>;
  const badgeColor = st.status === "behind" ? "var(--warn)" : st.status === "done" ? "var(--muted2)" : "var(--good)";
  const badgeTxt = st.status === "done" ? "Done" : st.status === "behind" ? "Behind" : st.status === "ahead" ? "Ahead" : "On track";
  return (
    <button className="dg-card" style={{ borderLeftColor: color }} onClick={() => onOpen(goal.id)}>
      <div className="dg-top">
        <span className="dg-icon">{goal.icon}</span>
        <span className="dg-name">{goal.name}</span>
        <span className="gbadge-dot" style={{ background: badgeColor }} />
      </div>
      <div className="dg-bar"><div className="dg-bar-fill" style={{ width: (st.pct * 100) + "%", background: color }} /></div>
      <div className="dg-foot">
        <span className="dg-val">{label}</span>
        <span className="dg-val" style={{ color: badgeColor, fontWeight: 700 }}>{badgeTxt}</span>
      </div>
    </button>
  );
}

export default DashboardView;