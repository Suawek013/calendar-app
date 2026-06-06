// data.jsx — mock data, week generation, dashboard history
// Exposes: HABIT_PALETTE, CATEGORIES, HABITS, DAYS, weekDates, generateWeek,
//          habitById, historyFor, minToLabel, GRID_START, GRID_END

export let GRID_START = 6 * 60;   // 06:00
export let GRID_END   = 24 * 60;  // 24:00
export function setGrid(w, b) { GRID_START = w; GRID_END = b; }

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_LONG = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// Curated dark-friendly, vibrant, distinguishable swatches
const HABIT_PALETTE = [
  "#f0586a", "#f08a3c", "#f0c145", "#9bd84a", "#3fb98a", "#36c5cf",
  "#5b8def", "#7c7ff0", "#a87ff0", "#ef7fc4", "#f06a8a", "#c98b5a",
  "#7d8aa0", "#5fd0a8", "#d9a441", "#6ad0e8",
];

const CATEGORIES = ["Work", "Health", "Personal", "Learning", "Social", "Side project"];

// Each habit: id, name, icon, color, category, tracked (dashboard), schedule[]
// schedule entry: { days:[0..6], start: minutes, dur: minutes }
const HABITS = [
  { id: "uni",   name: "University",    icon: "🎓", color: "#5b8def", category: "Learning",
    consistency: 0.82,
    schedule: [ { days:[0,2], start: 10*60, dur: 180 }, { days:[4], start: 14*60, dur: 120 } ] },
  { id: "work",  name: "Internship",    icon: "💼", color: "#7d8aa0", category: "Work",
    consistency: 0.95,
    schedule: [ { days:[1,3], start: 9*60, dur: 360 } ] },
  { id: "gym",   name: "Gym",           icon: "💪", color: "#36c5cf", category: "Health",
    consistency: 0.7,
    schedule: [ { days:[1,3], start: 16*60+30, dur: 90 } ] },
  { id: "side",  name: "Side Business", icon: "🔥", color: "#f08a3c", category: "Side project",
    consistency: 0.6,
    schedule: [ { days:[0,2], start: 19*60, dur: 120 }, { days:[5], start: 11*60, dur: 180 } ] },
  { id: "read",  name: "Reading",       icon: "📚", color: "#a87ff0", category: "Personal",
    consistency: 0.88,
    schedule: [ { days:[0,1,2,3,4,5,6], start: 22*60, dur: 30 } ] },
  { id: "couple",name: "Couple time",   icon: "❤️", color: "#ef7fc4", category: "Social",
    consistency: 0.9,
    schedule: [ { days:[4], start: 19*60, dur: 180 }, { days:[6], start: 17*60, dur: 180 } ] },
  { id: "game",  name: "Gaming",        icon: "🎮", color: "#7c7ff0", category: "Personal",
    consistency: 0.5, tracked: false,
    schedule: [ { days:[5], start: 21*60, dur: 120 } ] },
];

const habitById = (id) => HABITS.find(h => h.id === id);

// ---- Partner / shared calendars (read-only) ----
// Maja = Sławek's girlfriend. Her routine has its own colors & schedule.
// Couple time intentionally matches his (Fri eve, Sun afternoon) so overlay shows alignment.
const MAJA_HABITS = [
  { id:"m_hosp",   name:"Hospital shift", icon:"🏥", color:"#36c5cf", category:"Work",     sub:"Ward rounds", consistency:0.95,
    schedule:[ { days:[1,3], start:8*60,  dur:480 } ] },
  { id:"m_lect",   name:"Lectures",       icon:"🎓", color:"#5b8def", category:"Learning", sub:"Med school",  consistency:0.85,
    schedule:[ { days:[0,2], start:9*60,  dur:180 } ] },
  { id:"m_yoga",   name:"Yoga",           icon:"🧘", color:"#9bd84a", category:"Health",   sub:"Morning flow", consistency:0.8,
    schedule:[ { days:[0,2,4], start:7*60, dur:60 } ] },
  { id:"m_choir",  name:"Choir",          icon:"🎶", color:"#a87ff0", category:"Personal", sub:"Rehearsal",  consistency:0.9,
    schedule:[ { days:[2], start:18*60, dur:120 } ] },
  { id:"m_read",   name:"Reading",        icon:"📚", color:"#f0c145", category:"Personal", sub:"Before bed", consistency:0.9,
    schedule:[ { days:[0,1,2,3,4,5,6], start:22*60, dur:30 } ] },
  { id:"m_couple", name:"Couple time",    icon:"❤️", color:"#ef7fc4", category:"Social",   sub:"with Sławek", consistency:0.95,
    schedule:[ { days:[4], start:19*60, dur:180 }, { days:[6], start:17*60, dur:180 } ] },
  { id:"m_brunch", name:"Brunch",         icon:"🥂", color:"#f08a3c", category:"Social",   sub:"with friends", consistency:0.7,
    schedule:[ { days:[5], start:11*60, dur:120 } ] },
];

// Calendar registry. 'me' is the owner (editable); others are shared view-only.
const CALENDARS = {
  me:   { id:"me",   name:"Sławek", initial:"S", color:"#3fb98a", access:"owner", sub:"You",        email:"slawek@email.com" },
  maja: { id:"maja", name:"Maja",   initial:"M", color:"#ef7fc4", access:"view",  sub:"Shared with you · view only", email:"maja.k@email.com", habits: MAJA_HABITS, salt: 5 },
};

// Sublabels per habit for flavor
const SUBLABELS = {
  uni: "Lecture · Campus", work: "Remote · Deep work", gym: "Upper body",
  side: "Client work", read: "Before bed", couple: "Dinner + walk", game: "Co-op night",
};

// Deterministic pseudo-random
function rng(seed) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = s * 16807 % 2147483647) / 2147483647;
}

// Current week anchor: Monday June 1, 2026. Today = Thursday June 4 (index 3).
const TODAY_INDEX = 3;
const BASE_MONDAY = new Date(2026, 5, 1);

function weekDates(offset) {
  const cols = WEEK_COLS || [0,1,2,3,4,5,6];
  const shift = cols[0] === 6 ? -1 : 0;   // Sunday-start weeks begin a day earlier
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(BASE_MONDAY);
    d.setDate(BASE_MONDAY.getDate() + offset * 7 + shift + i);
    out.push(d);
  }
  return out;
}

let _uid = 1;
function generateWeek(offset) {
  const blocks = [];
  HABITS.forEach(h => {
    h.schedule.forEach(slot => {
      slot.days.forEach(day => {
        const r = rng((offset + 100) * 1000 + h.id.charCodeAt(0) * 37 + day * 7 + slot.start);
        let status = "planned";
        if (offset < 0) {
          status = r() < h.consistency ? "done" : (r() < 0.5 ? "skipped" : "planned");
        } else if (offset === 0) {
          if (day < TODAY_INDEX) status = r() < h.consistency ? "done" : "skipped";
          else if (day === TODAY_INDEX) status = r() < 0.5 ? "done" : "planned";
          else status = "planned";
        }
        blocks.push({
          id: "b" + (_uid++),
          habitId: h.id,
          label: h.name,
          sublabel: SUBLABELS[h.id] || "",
          day, start: slot.start, dur: slot.dur,
          status,
          template: true,
        });
      });
    });
  });
  // a couple one-off custom blocks in the current week for realism
  if (offset === 0) {
    blocks.push({ id:"b"+(_uid++), habitId:"couple", label:"Brunch", sublabel:"with Mum", day:6, start:11*60, dur:90, status:"planned", template:false });
    blocks.push({ id:"b"+(_uid++), habitId:"side", label:"Launch prep", sublabel:"ship landing page", day:3, start:20*60+30, dur:90, status:"planned", template:false });
  }
  return blocks;
}

// Generic week generator for an arbitrary habit list (used by shared calendars).
// Embeds color/icon/label on each block so rendering never needs the global HABITS.
function generateWeekFromHabits(habits, offset, salt) {
  salt = salt || 0;
  const blocks = [];
  habits.forEach(h => {
    h.schedule.forEach(slot => {
      slot.days.forEach(day => {
        const r = rng((offset + 100) * 1000 + h.id.charCodeAt(0) * 37 + day * 7 + slot.start + salt * 977);
        let status = "planned";
        const cons = h.consistency != null ? h.consistency : 0.8;
        if (offset < 0) status = r() < cons ? "done" : (r() < 0.5 ? "skipped" : "planned");
        else if (offset === 0) {
          if (day < TODAY_INDEX) status = r() < cons ? "done" : "skipped";
          else if (day === TODAY_INDEX) status = r() < 0.5 ? "done" : "planned";
          else status = "planned";
        }
        blocks.push({ id: "b" + (_uid++), habitId: h.id, color: h.color, icon: h.icon,
          label: h.name, sublabel: h.sub || "", day, start: slot.start, dur: slot.dur, status, template: true });
      });
    });
  });
  return blocks;
}
function generateSharedWeek(cal, offset) {
  return generateWeekFromHabits(cal.habits, offset, cal.salt || 3);
}
// value: 2 = done, 1 = planned/missed, 0 = not scheduled
function historyFor(habit, weeks = 8) {
  const scheduledDays = new Set();
  habit.schedule.forEach(s => s.days.forEach(d => scheduledDays.add(d)));
  // one continuous pseudo-random stream per habit (avoids per-cell banding)
  let seed = 7;
  for (let i = 0; i < habit.id.length; i++) seed = (seed * 31 + habit.id.charCodeAt(i)) % 2147483647;
  const r = rng(seed || 7);
  const grid = []; // [week][day]
  for (let w = 0; w < weeks; w++) {
    const row = [];
    // slight upward trend so recent weeks read a touch stronger than a year ago
    const target = Math.min(0.97, habit.consistency + (w / weeks) * 0.1 - 0.05);
    for (let d = 0; d < 7; d++) {
      if (!scheduledDays.has(d)) { row.push(0); continue; }
      // most recent week (w=weeks-1) is the live one — partial
      if (w === weeks - 1 && d > TODAY_INDEX) { row.push(0); continue; }
      row.push(r() < target ? 2 : 1);
    }
    grid.push(row);
  }
  return grid;
}

function currentStreak(grid) {
  // count back from today across the flattened scheduled sequence
  const flat = [];
  grid.forEach(row => row.forEach(v => { if (v !== 0) flat.push(v); }));
  let streak = 0;
  for (let i = flat.length - 1; i >= 0; i--) {
    if (flat[i] === 2) streak++; else break;
  }
  return streak;
}

function minToLabel(min) {
  const h = Math.floor(min / 60), m = min % 60;
  const hh = String(h).padStart(2, "0"), mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}
// clock-format-aware time label (reads CLOCK: "12" | "24")
export function min12(min) {
  let h = Math.floor(min / 60), m = min % 60;
  if (h >= 24) h -= 24;
  if (CLOCK === "24") return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  const ap = h >= 12 ? "pm" : "am"; let hh = h % 12; if (hh === 0) hh = 12;
  return m === 0 ? `${hh}${ap}` : `${hh}:${String(m).padStart(2,"0")}${ap}`;
}

// ---- user preferences (read as globals so formatters stay pure) ----
export let CLOCK = "12";                 // "12" | "24"
export let WEEK_COLS = [0,1,2,3,4,5,6]; // semantic weekday order, display L→R
export function setClock(v) { CLOCK = v; }
export function setWeekStart(v) { WEEK_COLS = v === "sun" ? [6,0,1,2,3,4,5] : [0,1,2,3,4,5,6]; }
export function weekColsOrder() { return WEEK_COLS || [0,1,2,3,4,5,6]; }

export {
  DAYS, DAYS_LONG, HABIT_PALETTE, CATEGORIES, HABITS,
  habitById, weekDates, generateWeek, historyFor, currentStreak,
  minToLabel, TODAY_INDEX,
  CALENDARS, MAJA_HABITS, generateWeekFromHabits, generateSharedWeek,
};
