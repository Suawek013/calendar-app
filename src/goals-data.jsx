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
const GOALS_SEED = [
  {
    id: "g_read", name: "Read 50 books", icon: "📚", areaId: "learning",
    type: "quant", target: 50, unit: "books", startValue: 0, current: 18,
    deadline: "2026-12-31", linkedHabits: ["read"],
    notes: "Fiction counts. Audiobooks count if finished.",
    series: [{m:0,v:4},{m:1,v:7},{m:2,v:10},{m:3,v:14},{m:4,v:17},{m:5,v:18}],
    logs: [
      { value: 1, note: "Atomic Habits", date: "2026-05-28", icon: "📖" },
      { value: 1, note: "The Three-Body Problem", date: "2026-05-14", icon: "📖" },
      { value: 1, note: "Project Hail Mary", date: "2026-05-02", icon: "📖" },
      { value: 1, note: "Klara and the Sun", date: "2026-04-21", icon: "📖" },
      { value: 1, note: "Educated", date: "2026-04-09", icon: "📖" },
      { value: 1, note: "Dune", date: "2026-03-30", icon: "📖" },
    ],
  },
  {
    id: "g_run", name: "Run 500 km", icon: "🏃", areaId: "health",
    type: "quant", target: 500, unit: "km", startValue: 0, current: 156,
    deadline: "2026-12-31", linkedHabits: [],
    notes: "",
    series: [{m:0,v:22},{m:1,v:51},{m:2,v:78},{m:3,v:104},{m:4,v:138},{m:5,v:156}],
    logs: [
      { value: 8, note: "River loop", date: "2026-06-02", icon: "🏃" },
      { value: 5, note: "Easy recovery", date: "2026-05-30", icon: "🏃" },
      { value: 12, note: "Long run — felt strong", date: "2026-05-25", icon: "🏃" },
      { value: 6, note: "Intervals", date: "2026-05-21", icon: "🏃" },
    ],
  },
  {
    id: "g_save", name: "Save 100,000 zł", icon: "🏦", areaId: "finance",
    type: "quant", target: 100000, unit: "zł", startValue: 0, current: 58000,
    deadline: "2026-12-31", linkedHabits: [],
    notes: "Auto-transfer on payday + freelance overflow.",
    series: [{m:0,v:9000},{m:1,v:19000},{m:2,v:31000},{m:3,v:42000},{m:4,v:50000},{m:5,v:58000}],
    logs: [
      { value: 8000, note: "Freelance invoice", date: "2026-05-31", icon: "💸" },
      { value: 5500, note: "Payday auto-transfer", date: "2026-05-28", icon: "💸" },
      { value: 2500, note: "Sold old gear", date: "2026-05-12", icon: "💸" },
    ],
  },
  {
    id: "g_course", name: "Launch online course", icon: "🚀", areaId: "business",
    type: "milestone", deadline: "2026-07-22", linkedHabits: ["side"],
    notes: "Topic: shipping side projects without burning out.",
    steps: [
      { id: "s1", name: "Outline 6 modules", due: "2026-04-15", done: true },
      { id: "s2", name: "Record module 1–3", due: "2026-05-20", done: true },
      { id: "s3", name: "Build landing page", due: "2026-05-30", done: true, note: "Live, collecting emails" },
      { id: "s4", name: "Record module 4–6", due: "2026-06-25", done: true },
      { id: "s5", name: "Edit & caption all videos", due: null, done: false },
      { id: "s6", name: "Set up checkout + pricing", due: null, done: false },
      { id: "s7", name: "Launch email sequence", due: "2026-07-20", done: false },
    ],
  },
  {
    id: "g_gym", name: "Work out 4× per week", icon: "💪", areaId: "health",
    type: "habit", weeklyTarget: 4, recent: [4, 3, 4, 2], habitId: "gym",
    deadline: "2026-12-31", linkedHabits: ["gym"], notes: "",
  },
  {
    id: "g_date", name: "Weekly date night", icon: "🌙", areaId: "relation",
    type: "habit", weeklyTarget: 1, recent: [1, 1, 1, 1], habitId: "couple",
    deadline: "2026-12-31", linkedHabits: ["couple"], notes: "Friday nights, phones away.",
  },
  {
    id: "g_fund", name: "Build emergency fund", icon: "🛟", areaId: "finance",
    type: "milestone", deadline: "2026-05-31", linkedHabits: [], completedDate: "2026-05-18",
    notes: "Three months of expenses, parked in a separate account.",
    steps: [
      { id: "f1", name: "Calculate 3-month runway", due: "2026-02-10", done: true },
      { id: "f2", name: "Open separate savings account", due: "2026-02-20", done: true },
      { id: "f3", name: "Automate monthly transfer", due: "2026-03-01", done: true },
      { id: "f4", name: "Reach full target", due: "2026-05-31", done: true },
    ],
  },
];

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
