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

export const HABITS = []; // Będzie zasilane z bazy danych
export const HABIT_LOGS = []; // Będzie zasilane z bazy danych
export const CUSTOM_BLOCKS = []; // Dodano: przechowuje zmodyfikowane/niestandardowe bloki

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

// Current week anchor and today's index, calculated dynamically based on real time.
const _now = new Date();
const TODAY_INDEX = (_now.getDay() + 6) % 7;
const BASE_MONDAY = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() - TODAY_INDEX);
BASE_MONDAY.setHours(0, 0, 0, 0);

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
export function generateWeekFromData(habits, logs, customBlocks, offset) {
  const blocks = [];
  const dts = [];
  
  for (let i = 0; i < 7; i++) {
    const dt = new Date(BASE_MONDAY);
    dt.setDate(BASE_MONDAY.getDate() + offset * 7 + i);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    dts.push(`${y}-${m}-${d}`);
  }

  habits.forEach(h => {
    (h.schedule || []).forEach(slot => {
      (slot.days || []).forEach(day => {
        const dateStr = dts[day];
        const blockId = `t_${h.id}_${dateStr}_${slot.start}`;
        
        if (customBlocks.some(cb => cb.id === blockId)) return;

        const log = logs.find(l => l.habit_id === h.id && l.date === dateStr);
        const status = log ? log.status : "planned";

        blocks.push({
          id: blockId,
          habitId: h.id,
          label: h.name,
          sublabel: h.sub || SUBLABELS[h.id] || "",
          day, start: slot.start, dur: slot.dur,
          status: status,
          dateStr: dateStr,
          template: true,
          color: h.color,
          icon: h.icon
        });
      });
    });
  });

  customBlocks.forEach(cb => {
    const dayIndex = dts.indexOf(cb.date_str);
    if (dayIndex >= 0 && !cb.deleted) {
      const h = habits.find(x => x.id === cb.habit_id);
      if (!h) return;

      blocks.push({
        id: cb.id,
        habitId: cb.habit_id,
        label: cb.label || h.name,
        sublabel: cb.sublabel || h.sub || SUBLABELS[h.id] || "",
        day: dayIndex,
        start: cb.start_min,
        dur: cb.dur,
        status: cb.status,
        dateStr: cb.date_str,
        template: false,
        color: h.color,
        icon: h.icon
      });
    }
  });

  return blocks;
}

export function generateWeek(offset) {
  return generateWeekFromData(HABITS, HABIT_LOGS, CUSTOM_BLOCKS, offset);
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
export function historyFor(habit, weeks = 8) {
  const scheduledDays = new Set();
  (habit.schedule || []).forEach(s => (s.days || []).forEach(d => scheduledDays.add(d)));
  
  const grid = []; // [week][day]
  for (let w = 0; w < weeks; w++) {
    const row = [];
    for (let d = 0; d < 7; d++) {
      if (!scheduledDays.has(d)) { row.push(0); continue; }
      if (w === weeks - 1 && d > TODAY_INDEX) { row.push(0); continue; }
      
      const dt = new Date(BASE_MONDAY);
      // w=0 to oldest, w=weeks-1 is current week
      dt.setDate(BASE_MONDAY.getDate() - (weeks - 1 - w) * 7 + d);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dd}`;
      
      const log = HABIT_LOGS.find(l => l.habit_id === habit.id && l.date === dateStr);
      row.push(log && log.status === "done" ? 2 : 1);
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
  DAYS, DAYS_LONG, HABIT_PALETTE, CATEGORIES,
  habitById, weekDates, currentStreak,
  minToLabel, TODAY_INDEX,
  CALENDARS, MAJA_HABITS, generateWeekFromHabits, generateSharedWeek,
};
