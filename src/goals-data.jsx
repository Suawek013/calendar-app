// goals-data.jsx — life areas, sample goals, and the honest pace/status math.
// Exposes: LIFE_AREAS, GOALS_SEED, areaById, goalStatus, fmtNum, fmtDeadline,
//          daysUntil, GOAL_YEAR, GOAL_TODAY

const GOAL_YEAR = 2026;
const GOAL_TODAY = new Date(2026, 5, 5);   // Thursday, June 5 2026 (matches app "today")

// Life areas — the user-defined organizing layer. Colors drawn from HABIT_PALETTE.
const LIFE_AREAS = [
  { id: "health",   name: "Health",        icon: "💪", color: "#36c5cf" },
  { id: "finance",  name: "Finance",       icon: "💰", color: "#f0c145" },
  { id: "business", name: "Business Side", icon: "🚀", color: "#f08a3c" },
  { id: "learning", name: "Learning",      icon: "🎓", color: "#5b8def" },
  { id: "relation", name: "Relationship",  icon: "❤️", color: "#ef7fc4" },
];
const areaById = (id) => LIFE_AREAS.find(a => a.id === id) || LIFE_AREAS[0];

// ---- sample goals ---------------------------------------------------------
// type: "quant" | "milestone" | "habit"
// quant:     target, unit, startValue, current, series[{m,v}], logs[{value,note,date,icon}]
// milestone: steps[{id,name,due,done,note}]
// habit:     weeklyTarget, recent[4 weeks of session counts], habitId
// shared:     deadline ("YYYY-MM-DD" or null), areaId, linkedHabits[], notes
const GOALS_SEED = [];

// ---- formatting -----------------------------------------------------------
function fmtNum(n) {
  if (n == null) return "0";
  return Math.round(n).toLocaleString("en-US");
}
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function parseDate(s) { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); }
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
function daysUntil(dateStr) { return daysBetween(GOAL_TODAY, parseDate(dateStr)); }
function fmtDeadline(dateStr) {
  if (!dateStr) return "Ongoing";
  const d = parseDate(dateStr);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function fmtCountdown(dateStr) {
  if (!dateStr) return "No deadline";
  const n = daysUntil(dateStr);
  if (n < 0) return `${Math.abs(n)} days overdue`;
  if (n === 0) return "Due today";
  if (n < 45) return `in ${n} days`;
  const months = Math.round(n / 30);
  return `in ~${months} months`;
}

// ---- the honest math ------------------------------------------------------
// Every status object carries: kind, status ('on'|'behind'|'done'), pct (0..1), and label.
function goalStatus(g) {
  if (g.type === "quant") return quantStatus(g);
  if (g.type === "habit") return habitStatus(g);
  return milestoneStatus(g);
}

function quantStatus(g) {
  const start = parseDate(`${GOAL_YEAR}-01-01`);
  const end = parseDate(g.deadline);
  const totalDays = Math.max(1, daysBetween(start, end));
  const elapsed = Math.min(totalDays, Math.max(1, daysBetween(start, GOAL_TODAY)));
  const frac = elapsed / totalDays;
  const span = g.target - g.startValue;
  const expected = g.startValue + span * frac;
  const pct = Math.max(0, Math.min(1, (g.current - g.startValue) / span));
  const remainingUnits = Math.max(0, g.target - g.current);
  const remainingDays = Math.max(0, daysBetween(GOAL_TODAY, end));
  const behindUnits = expected - g.current;            // + = behind, - = ahead
  const curRate = (g.current - g.startValue) / elapsed; // units / day so far
  const reqRate = remainingUnits / Math.max(1, remainingDays); // units / day needed
  // days-per-unit framing (nice for "1 book every 10 days")
  const reqDaysPerUnit = remainingUnits > 0 ? remainingDays / remainingUnits : 0;
  const curDaysPerUnit = (g.current - g.startValue) > 0 ? elapsed / (g.current - g.startValue) : 0;
  let status = "on";
  if (g.current >= g.target) status = "done";
  else if (behindUnits > span * 0.04) status = "behind";
  else if (behindUnits < -span * 0.04) status = "ahead";
  return {
    kind: "quant", status, pct, expected, behindUnits,
    remainingUnits, remainingDays, curRate, reqRate,
    reqDaysPerUnit, curDaysPerUnit,
    monthsLeft: Math.round(remainingDays / 30),
  };
}

function habitStatus(g) {
  const weeks = g.recent || [];
  const target = g.weeklyTarget;
  const total = weeks.reduce((a, b) => a + b, 0);
  const targetTotal = target * weeks.length;
  const deficit = Math.max(0, targetTotal - total);
  const surplus = Math.max(0, total - targetTotal);
  const lastWeek = weeks[weeks.length - 1] || 0;
  const pct = Math.max(0, Math.min(1, total / (targetTotal || 1)));
  let status = "on";
  if (deficit >= target) status = "behind";        // a full week (or more) under
  else if (deficit > 0) status = "behind-slight";
  else if (surplus > 0) status = "ahead";
  return { kind: "habit", status: status === "behind-slight" ? "behind" : status,
    slight: status === "behind-slight", pct, weeks, target, total, targetTotal,
    deficit, surplus, lastWeek, sessionsThisMonth: total };
}

function milestoneStatus(g) {
  const steps = g.steps || [];
  const done = steps.filter(s => s.done).length;
  const total = steps.length;
  const pct = total ? done / total : 0;
  const remainingDays = daysUntil(g.deadline);
  const noDue = steps.filter(s => !s.done && !s.due).length;
  const overdue = steps.filter(s => !s.done && s.due && daysUntil(s.due) < 0).length;
  let status = "on";
  if (done === total && total > 0) status = "done";
  else if (overdue > 0 || remainingDays < 0) status = "behind";
  return { kind: "milestone", status, pct, done, total, remainingDays, noDue, overdue };
}

// rollups for a set of goals (used by overview stats + area headers)
function goalsRollup(goals) {
  let active = 0, completed = 0, on = 0, behind = 0;
  goals.forEach(g => {
    const st = goalStatus(g).status;
    if (st === "done") completed++;
    else {
      active++;
      if (st === "behind") behind++; else on++;
    }
  });
  return { active, completed, on, behind, total: goals.length };
}

export {
  GOAL_YEAR, GOAL_TODAY, LIFE_AREAS, GOALS_SEED, areaById,
  goalStatus, goalsRollup, fmtNum, fmtDeadline, fmtCountdown, daysUntil,
  MONTHS, parseDate,
};
