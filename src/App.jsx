// App.jsx — shell, navigation, state, modals, tweaks
import React from 'react';
import { Icon } from './components.jsx';
import { generateWeekFromData, TODAY_INDEX, HABIT_PALETTE, CATEGORIES, HABITS, HABIT_LOGS, CUSTOM_BLOCKS, generateWeek, habitById, CALENDARS, generateSharedWeek, setGrid, setClock, setWeekStart, min12 } from './data.jsx';
import { supabase } from './supabase.js';
import { useTranslation } from './i18n.jsx';
import { GOALS_SEED, GOAL_YEAR } from './goals-data.jsx';
import LoginView from './login.jsx';
import DashboardView from './dashboard.jsx';
import CalendarView from './calendar.jsx';
import GoalDetail from './goal-detail.jsx';
import { GoalsView } from './goals.jsx';
import { SetupView, HabitForm } from './setup.jsx';
import ProfileView from './profile.jsx';
import GoalModal from './goal-modal.jsx';
import { EditModal } from './modal.jsx';

function useTweaks(defaults) {
  const [t, setT] = React.useState(defaults);
  return [t, (k, v) => setT(prev => ({ ...prev, [k]: v }))];
}
function TweaksPanel({ children }) { return null; }
function TweakSection() { return null; }
function TweakColor() { return null; }
function TweakRadio() { return null; }
function TweakToggle() { return null; }

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#3fb98a",
  "blockStyle": "tint",
  "density": "regular",
  "weekendTint": true
}/*EDITMODE-END*/;

const DENSITY = { compact: 22, regular: 28, comfy: 36 };

// append/update the chart series at "today" (June = month 5) with a new cumulative total
function bumpSeries(series, cum) {
  const m = 5;
  const s = (series || []).slice();
  if (s.length && s[s.length - 1].m === m) s[s.length - 1] = { m, v: cum };
  else s.push({ m, v: cum });
  return s;
}

function App() {
  const { t: tr } = useTranslation();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState("calendar");
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [weeks, setWeeks] = React.useState({});
  const [editing, setEditing] = React.useState(null);     // {block, isNew}
  const [editHabit, setEditHabit] = React.useState(null); // {habit, isNew}
  // ---- goals ----
  const [goals, setGoals] = React.useState(() => JSON.parse(JSON.stringify(GOALS_SEED)));
  const [goalYear, setGoalYear] = React.useState(GOAL_YEAR);
  const [goalId, setGoalId] = React.useState(null);      // open detail
  const [editGoal, setEditGoal] = React.useState(null);  // {goal, isNew}
  const [dataLoaded, setDataLoaded] = React.useState(false);
  const [session, setSession] = React.useState(null);
  const [isInitializingAuth, setIsInitializingAuth] = React.useState(true);
  const [myProfile, setMyProfile] = React.useState({ id: "me", name: "", initial: "", color: "#3fb98a", email: "" });
  const [sharedProfiles, setSharedProfiles] = React.useState([]);
  const [myShareToken, setMyShareToken] = React.useState(null);
  const [partnerHabitsData, setPartnerHabitsData] = React.useState({ habits: [], logs: [], blocks: [] });

  // Nasłuchiwanie na zmiany sesji
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const share = params.get('share');
    if (share) {
      localStorage.setItem('cad_share', share);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
// (logowanie, wylogowanie)
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Inicjalizacja danych z bazy uruchamiana tylko, gdy jest dostępna sesja
  React.useEffect(() => {
    if (!session) return;
    
    async function init() {
      setDataLoaded(false);
      
      const userId = session.user.id;

      // 1. Process pending share
      const pendingShare = localStorage.getItem('cad_share');
      if (pendingShare) {
        const { data: st } = await supabase.from('share_tokens').select('*').eq('token', pendingShare).single();
        if (st && st.owner_id !== userId) {
          await supabase.from('calendar_shares').insert({ owner_id: st.owner_id, viewer_id: userId, detail_level: st.detail_level }).select();
        }
        localStorage.removeItem('cad_share');
      }

      // 2. Load my profile
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (prof) setMyProfile({ id: prof.id, name: prof.name, initial: prof.initial, color: prof.color, email: prof.email, access: "owner" });

      // 3. Ensure share token
      const { data: tokenData } = await supabase.from('share_tokens').select('*').eq('owner_id', userId).maybeSingle();
      let myToken = tokenData;
      if (!myToken) {
         const t = Math.random().toString(36).slice(2, 8);
         const { data: newT } = await supabase.from('share_tokens').insert({ token: t, owner_id: userId }).select().single();
         myToken = newT;
      }
      setMyShareToken(myToken);

      // 4. Load shares
      const { data: shares } = await supabase.from('calendar_shares').select('owner_id, detail_level').eq('viewer_id', userId);
      const ownerIds = (shares || []).map(s => s.owner_id);
      
      let pProfs = [];
      if (ownerIds.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('*').in('id', ownerIds);
        pProfs = (profs || []).map(p => {
          const detail = shares.find(s => s.owner_id === p.id).detail_level;
          return { ...p, access: "view", salt: p.id.charCodeAt(0), detail_level: detail };
        });
      }
      setSharedProfiles(pProfs);

      // 5. Pobieramy nawyki (własne i partnerów dzięki RLS)
      const { data: habs } = await supabase.from('habits').select('*');
      if (habs) {
        habs.forEach(h => { if (typeof h.schedule === 'string') h.schedule = JSON.parse(h.schedule); });
        
        HABITS.length = 0;
        HABITS.push(...habs.filter(h => h.user_id === userId));
      }
      
      const { data: hlogs } = await supabase.from('habit_logs').select('*');
      if (hlogs) {
        HABIT_LOGS.length = 0;
        HABIT_LOGS.push(...hlogs.filter(h => h.user_id === userId));
      }

      const { data: cblocks } = await supabase.from('custom_blocks').select('*');
      if (cblocks) {
        CUSTOM_BLOCKS.length = 0;
        CUSTOM_BLOCKS.push(...cblocks.filter(h => h.user_id === userId));
      }
      
      // Store partner data separately for rendering
      setPartnerHabitsData({
        habits: habs ? habs.filter(h => h.user_id !== userId) : [],
        logs: hlogs ? hlogs.filter(l => l.user_id !== userId) : [],
        blocks: cblocks ? cblocks.filter(b => b.user_id !== userId) : []
      });

      const { data: gs } = await supabase.from('goals').select('*, logs:goal_logs(*), steps:goal_steps(*), series:goal_series(*)');
      if (gs) {
        const mappedGoals = gs.map(g => ({
          id: g.id, name: g.name, icon: g.icon, areaId: g.area_id, type: g.type,
          target: g.target, unit: g.unit, startValue: g.start_value, current: g.current,
          deadline: g.deadline, weeklyTarget: g.weekly_target, habitId: g.habit_id,
          notes: g.notes, completedDate: g.completed_date,
          logs: g.logs || [], steps: g.steps || [], series: g.series ? g.series.map(s => ({ m: s.month, v: s.value })) : []
        }));
        setGoals(mappedGoals);
      }

      setWeeks({});
      setSharedWeeks({});
      setDataLoaded(true);
      bump();
    }
    init();
  }, [session]);
  const [mark, setMark] = React.useState(false);
  const [period, setPeriod] = React.useState("week");
  const [clipboard, setClipboard] = React.useState(null);  // copied block payload
  const [activeCal, setActiveCal] = React.useState("me");  // "me" | "maja"
  const [overlay, setOverlay] = React.useState(false);     // partner busy-times on my week
  const [sharedWeeks, setSharedWeeks] = React.useState({}); // `${calId}:${off}` -> blocks
  const [clock, setClockS] = React.useState(() => localStorage.getItem("cad_clock") || "12");
  const [weekStart, setWeekStartS] = React.useState(() => localStorage.getItem("cad_weekstart") || "mon");
  // apply prefs to globals before first render
  setClock(clock); setWeekStart(weekStart);
  const changeClock = (v) => { setClockS(v); setClock(v); localStorage.setItem("cad_clock", v); bump(); };
  const changeWeekStart = (v) => { setWeekStartS(v); setWeekStart(v); localStorage.setItem("cad_weekstart", v); bump(); };
  const [wake, setWakeS] = React.useState(() => { const v = localStorage.getItem("cad_wake"); return v ? +v : 6 * 60; });
  const [bed, setBedS] = React.useState(() => { const v = localStorage.getItem("cad_bed"); return v ? +v : 24 * 60; });
  const setWake = (v) => { setWakeS(v); localStorage.setItem("cad_wake", v); };
  const setBed = (v) => { setBedS(v); localStorage.setItem("cad_bed", v); };

  // load any custom categories saved earlier (merge once)
  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cad_cats") || "[]");
      saved.forEach(c => { if (!CATEGORIES.includes(c)) CATEGORIES.push(c); });
    } catch (e) {}
  }, []);
  const onAddCategory = (name) => {
    if (!CATEGORIES.includes(name)) CATEGORIES.push(name);
    const custom = CATEGORIES.slice(6); // defaults are the first 6
    localStorage.setItem("cad_cats", JSON.stringify(custom));
    bump();
  };
  const [, setTick] = React.useState(0);
  const bump = () => setTick(n => n + 1);

  const accent = t.accent || "#3fb98a";
  // waking hours drive the calendar grid range (read as globals by the views)
  setGrid(wake, bed);

  // lazy week generation
  const getBlocks = (off) => {
    if (!dataLoaded) return [];
    if (weeks[off]) return weeks[off];
    const gen = generateWeek(off);
    setWeeks(w => ({ ...w, [off]: gen }));
    return gen;
  };
  const blocks = dataLoaded ? (weeks[weekOffset] || getBlocks(weekOffset)) : [];

  // partner (shared, read-only) week cache
  
  const me = myProfile;
  const calsList = [ { ...me, access: "owner" }, ...sharedProfiles ];
  const partner = sharedProfiles.length > 0 ? sharedProfiles[0] : null;
  
  const getShared = (calId, off) => {
    const key = calId + ":" + off;
    if (sharedWeeks[key]) return sharedWeeks[key];
    
    // Anonymize habits if busy
    const pProfile = sharedProfiles.find(p => p.id === calId);
    if (!pProfile) return [];
    const isBusy = pProfile.detail_level === 'busy';
    
    const p_habits = partnerHabitsData.habits.filter(h => h.user_id === calId).map(h => ({
      ...h,
      name: isBusy ? "Busy" : h.name,
      sub: isBusy ? "" : h.category,
      icon: isBusy ? "🔒" : h.icon
    }));
    const p_logs = partnerHabitsData.logs.filter(l => l.user_id === calId);
    const p_blocks = partnerHabitsData.blocks.filter(b => b.user_id === calId);
    
    const gen = generateWeekFromData(p_habits, p_logs, p_blocks, off);
    setSharedWeeks(w => ({ ...w, [key]: gen }));
    return gen;
  };
  const partnerBlocks = sharedProfiles.length > 0 ? getShared(sharedProfiles[0].id, weekOffset) : [];
  const readOnly = activeCal !== "me";
  const shownBlocks = readOnly ? getShared(activeCal, weekOffset) : blocks;
  const overlayBlocks = (!readOnly && overlay) ? partnerBlocks : null;

  const setBlocks = (off, fn) => setWeeks(w => ({ ...w, [off]: fn(w[off] || generateWeek(off)) }));

  const syncCustomBlock = async (b, patch = {}, isDeleted = false) => {
    const dts = weekDates(weekOffset).map(dt => {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    });

    const targetDay = patch.day !== undefined ? patch.day : b.day;
    const targetStart = patch.start !== undefined ? patch.start : b.start;
    const targetDur = patch.dur !== undefined ? patch.dur : b.dur;
    const targetDateStr = dts[targetDay];
    const targetStatus = patch.status !== undefined ? patch.status : b.status;
    const targetLabel = patch.label !== undefined ? patch.label : b.label;
    const targetSublabel = patch.sublabel !== undefined ? patch.sublabel : b.sublabel;

    const cb = {
      id: b.id,
      habit_id: b.habitId,
      date_str: targetDateStr,
      start_min: targetStart,
      dur: targetDur,
      status: targetStatus,
      label: targetLabel,
      sublabel: targetSublabel,
      deleted: isDeleted
    };

    // Update global cache
    const exist = CUSTOM_BLOCKS.find(x => x.id === b.id);
    if (exist) Object.assign(exist, cb);
    else CUSTOM_BLOCKS.push(cb);

    // Update Supabase
    await supabase.from('custom_blocks').upsert(cb);
  };

  const onUpdate = async (id, patch) => {
    const b = (weeks[weekOffset] || blocks).find(x => x.id === id);
    if (!b) return;

    setBlocks(weekOffset, bs => bs.map(x => x.id === id ? { ...x, ...patch } : x));
    
    // Jeśli zmieniamy status, odnotowujemy to w habit_logs (statystyki streak)
    if (patch.status && b.habitId && b.dateStr) {
        const exist = HABIT_LOGS.find(l => l.habit_id === b.habitId && l.date === b.dateStr);
        if (exist) exist.status = patch.status;
        else HABIT_LOGS.push({ habit_id: b.habitId, date: b.dateStr, status: patch.status });
        
        await supabase.from('habit_logs').upsert({
          habit_id: b.habitId,
          date: b.dateStr,
          status: patch.status
        }, { onConflict: 'habit_id, date' });
        bump();
    }

    // Zapisujemy custom block, jeśli to zmiana kształtu, etykiety, ALBO jeśli blok był już "customowy"
    const isGeometryChange = patch.day !== undefined || patch.start !== undefined || patch.dur !== undefined || patch.label !== undefined || patch.sublabel !== undefined;
    if (isGeometryChange || !b.template) {
      await syncCustomBlock(b, patch);
    }
  };

  const onDelete = async (id) => { 
    const b = (weeks[weekOffset] || blocks).find(x => x.id === id);
    setBlocks(weekOffset, bs => bs.filter(x => x.id !== id)); 
    setEditing(null); 
    if (b) await syncCustomBlock(b, {}, true); 
  };

  const onReset = () => {
    // Reset przywraca wygenerowany tydzień, ale ignoruje Custom Blocks - wymaga usunięcia ich z bazy w tej funkcjonalności, zrobimy to później
    setWeeks(w => ({ ...w, [weekOffset]: generateWeek(weekOffset) }));
  };

  const onCreateBlock = async (off, b) => {
    const nb = { ...b, id: "n" + Date.now() + Math.random().toString(36).slice(2, 5),
      status: b.status || "planned", template: false };
    setBlocks(off, bs => [...bs, nb]);
    await syncCustomBlock(nb, nb); // Save to DB!
    return nb;
  };

  const onAdd = async (off, info) => {
    if (HABITS.length === 0) {
      alert("Musisz najpierw dodać jakikolwiek nawyk w zakładce Habits!");
      return;
    }
    if (info && info.habitId) {
      const h = habitById(info.habitId);
      if (!h) return;
      const nb = { id: "n" + Date.now(), habitId: info.habitId, label: h.name,
        sublabel: "", day: info.day, start: info.start, dur: 60, status: "planned", template: false };
      setBlocks(off, bs => [...bs, nb]);
      await syncCustomBlock(nb, nb); // Zapis do DB!
      return;
    }
    const day = info && info.day !== undefined ? info.day : TODAY_INDEX;
    const start = info && info.start !== undefined ? info.start : 12*60;
    setEditing({ block: { id: "n" + Date.now(), habitId: HABITS[0].id, label: "", sublabel: "",
      day, start, dur: 60, status: "planned", template: false, repeat: "this" }, isNew: true });
  };

  const onSaveBlock = async (b) => {
    if (editing.isNew) {
      setBlocks(weekOffset, bs => [...bs, b]);
      await syncCustomBlock(b, b);
    } else {
      onUpdate(b.id, b);
    }
    setEditing(null);
  };

  const openEdit = (id) => {
    const b = (weeks[weekOffset] || []).find(x => x.id === id);
    if (b) setEditing({ block: { ...b }, isNew: false });
  };

  const goCalendar = (day) => { setView("calendar"); };
  const viewPartner = () => { setActiveCal("maja"); setView("calendar"); };

  const onSaveHabit = async (h) => {
    let finalH;
    if (editHabit.isNew) { 
      finalH = { ...h, id: "h" + Date.now() };
      HABITS.push(finalH); 
    } else {
      finalH = { ...h };
      const orig = habitById(h.id);
      if (orig) Object.assign(orig, h);
    }
    
    // Zapis do Supabase
    await supabase.from('habits').upsert({
      id: finalH.id,
      name: finalH.name,
      icon: finalH.icon,
      color: finalH.color,
      category: finalH.category,
      tracked: finalH.tracked,
      schedule: JSON.stringify(finalH.schedule)
    });
    
    setEditHabit(null); bump();
  };
  const onDeleteHabit = async (id) => {
    const ix = HABITS.findIndex(x => x.id === id);
    if (ix >= 0) HABITS.splice(ix, 1);
    
    // Usunięcie z Supabase
    await supabase.from('habits').delete().eq('id', id);
    
    setEditHabit(null); bump();
  };

  const onUpdateProfile = async (updates) => {
    const nextProf = { ...myProfile, ...updates };
    nextProf.initial = nextProf.name ? nextProf.name.charAt(0).toUpperCase() : "U";
    setMyProfile(nextProf);
    if (session && session.user) {
      await supabase.from('profiles').update({ name: nextProf.name, initial: nextProf.initial }).eq('id', session.user.id);
    }
  };

  // ---- goal handlers ----
  const updateGoal = (id, fn) => setGoals(gs => gs.map(g => g.id === id ? fn(g) : g));
  const onLogProgress = (id, entry) => updateGoal(id, g => {
    const cum = (g.current || 0) + entry.value;
    return { ...g, current: cum,
      logs: [{ ...entry, icon: (g.logs && g.logs[0] && g.logs[0].icon) || "✏️" }, ...(g.logs || [])],
      series: bumpSeries(g.series, cum) };
  });
  const onToggleStep = (id, stepId) => updateGoal(id, g => ({
    ...g, steps: g.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s) }));
  const onAddStep = (id, name) => updateGoal(id, g => ({
    ...g, steps: [...g.steps, { id: "s" + Date.now(), name, due: null, done: false }] }));
  const onReorderSteps = (id, from, to) => updateGoal(id, g => {
    const arr = g.steps.slice(); const [m] = arr.splice(from, 1); arr.splice(to, 0, m); return { ...g, steps: arr }; });
  const onLinkHabit = (id, hid) => updateGoal(id, g => ({ ...g, linkedHabits: [...new Set([...(g.linkedHabits || []), hid])] }));
  const onUnlinkHabit = (id, hid) => updateGoal(id, g => ({ ...g, linkedHabits: (g.linkedHabits || []).filter(x => x !== hid) }));
  const onSaveGoal = (goal) => {
    if (editGoal.isNew) setGoals(gs => [...gs, { ...goal, id: "g" + Date.now() }]);
    else setGoals(gs => gs.map(g => g.id === goal.id ? goal : g));
    setEditGoal(null);
  };
  const onDeleteGoal = (id) => { setGoals(gs => gs.filter(g => g.id !== id)); setEditGoal(null); setGoalId(null); };
  const onAddGoal = () => setEditGoal({ goal: { icon: "🎯", type: "quant", areaId: "health" }, isNew: true });
  const onEditGoal = (id) => { const g = goals.find(x => x.id === id); if (g) setEditGoal({ goal: JSON.parse(JSON.stringify(g)), isNew: false }); };
  const openGoal = (id) => { setGoalId(id); setView("goals"); };
  const goGoals = () => { setGoalId(null); setView("goals"); };

  // habit -> linked goals lookup (drives the dot on calendar blocks)
  const goalsByHabit = React.useMemo(() => {
    const map = {};
    goals.forEach(g => (g.linkedHabits || []).forEach(hid => { (map[hid] = map[hid] || []).push(g); }));
    return map;
  }, [goals]);
  const detailGoal = goalId ? goals.find(g => g.id === goalId) : null;

  const NAV = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "calendar", icon: "calendar", label: "Calendar" },
    { id: "goals", icon: "target", label: "Goals" },
    { id: "setup", icon: "setup", label: "Habits" },
    { id: "profile", icon: "users", label: "Sharing" },
  ];

  if (isInitializingAuth) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', background: 'var(--bg)' }}>
        Loading session...
      </div>
    );
  }

  if (!session) {
    return <LoginView accent={accent} />;
  }

  return (
    <div className="app" style={{ "--accent": accent }}>
      {/* desktop sidebar */}
      <nav className="sidebar">
        <div className="brand"><span className="brand-mark" style={{ background: accent }} /><span className="brand-name">Calmate</span></div>
        <div className="nav-items">
          {NAV.map(n => (
            <button key={n.id} className={"nav-item" + (view === n.id ? " on" : "")} onClick={() => setView(n.id)}
              style={view === n.id ? { color: "var(--text)" } : {}}>
              <span className="nav-ico" style={{ color: view === n.id ? accent : "var(--muted)" }}><Icon name={n.icon} size={20} /></span>
              <span className="nav-label">{tr("nav." + n.id)}</span>
              {view === n.id && <span className="nav-active" style={{ background: accent }} />}
            </button>
          ))}
        </div>
        <button className="nav-foot" onClick={() => setView("profile")}
          style={view === "profile" ? { background: "var(--surface-2)" } : {}}>
          <div className="avatar" style={{ borderColor: accent }}>{me.initial || "S"}</div>
          <div className="avatar-meta"><div className="avatar-name">{me.name || "User"}</div><div className="avatar-sub">Profile & sharing</div></div>
        </button>
      </nav>

      {/* main */}
      <main className="main">
        {view === "dashboard" && <DashboardView blocks={blocks} weekOffset={weekOffset}
          onGoCalendar={goCalendar} onMarkHabits={() => setMark(true)} onAdd={() => onAdd(weekOffset)}
          accent={accent} period={period} setPeriod={setPeriod}
          goals={goals} onOpenGoal={openGoal} onGoGoals={goGoals} />}
        {view === "calendar" && <CalendarView blocks={shownBlocks} weekOffset={weekOffset} setWeekOffset={setWeekOffset}
          onUpdate={onUpdate} onDelete={onDelete} onAdd={onAdd} onReset={onReset} onEdit={openEdit}
          accent={accent} blockStyle={t.blockStyle} slot={DENSITY[t.density] || 28} today={TODAY_INDEX} tintToday={t.weekendTint}
          clipboard={clipboard} setClipboard={setClipboard} onCreateBlock={onCreateBlock}
          readOnly={readOnly} overlayBlocks={overlayBlocks} partner={partner}
          cals={calsList} activeCal={activeCal} onPickCal={setActiveCal} onOpenProfile={() => setView("profile")}
          overlayOn={overlay} setOverlay={setOverlay} partnerEnabled={true} goalsByHabit={goalsByHabit} />}
        {view === "goals" && (detailGoal
          ? <GoalDetail goal={detailGoal} onBack={() => setGoalId(null)} onEdit={onEditGoal}
              onLog={(entry) => onLogProgress(goalId, entry)} onToggleStep={(sid) => onToggleStep(goalId, sid)}
              onAddStep={(n) => onAddStep(goalId, n)} onReorderSteps={(f, t) => onReorderSteps(goalId, f, t)}
              onLink={(hid) => onLinkHabit(goalId, hid)} onUnlink={(hid) => onUnlinkHabit(goalId, hid)} accent={accent} />
          : <GoalsView goals={goals} year={goalYear} setYear={setGoalYear}
              onOpen={openGoal} onAdd={onAddGoal} accent={accent} />)}
        {view === "setup" && <SetupView accent={accent} bump={bump} wake={wake} bed={bed} setWake={setWake} setBed={setBed}
          onEditHabit={(id) => setEditHabit({ habit: habitById(id), isNew: false })}
          onAddHabit={() => setEditHabit({ habit: { name: "", icon: "✨", color: HABIT_PALETTE[4], category: "Personal", tracked: true, schedule: [{ days: [], start: 9*60, dur: 60 }] }, isNew: true })} />}
        {view === "profile" && <ProfileView accent={accent} me={me} partner={partner} shareToken={myShareToken}
          partnerEnabled={overlay} setPartnerEnabled={setOverlay} onViewPartner={viewPartner}
          clock={clock} setClock={changeClock} weekStart={weekStart} setWeekStart={changeWeekStart}
          onUpdateProfile={onUpdateProfile} />}
      </main>

      {/* mobile bottom tab */}
      <nav className="tabbar">
        {NAV.map(n => (
          <button key={n.id} className={"tab" + (view === n.id ? " on" : "")} onClick={() => setView(n.id)}
            style={view === n.id ? { color: accent } : {}}>
            <Icon name={n.icon} size={22} /><span>{n.label}</span>
          </button>
        ))}
      </nav>

      {editing && <EditModal block={editing.block} isNew={editing.isNew} accent={accent}
        onSave={onSaveBlock} onDelete={onDelete} onClose={() => setEditing(null)} />}
      {editHabit && <HabitForm habit={editHabit.habit} isNew={editHabit.isNew} accent={accent}
        onSave={onSaveHabit} onDelete={onDeleteHabit} onClose={() => setEditHabit(null)} onAddCategory={onAddCategory} />}
      {editGoal && <GoalModal goal={editGoal.goal} isNew={editGoal.isNew} accent={accent}
        onSave={onSaveGoal} onDelete={onDeleteGoal} onClose={() => setEditGoal(null)} />}
      {mark && <MarkModal blocks={blocks} onUpdate={onUpdate} accent={accent} onClose={() => setMark(false)} />}

      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakColor label="Accent" value={t.accent}
          options={["#3fb98a", "#e8692a", "#5b8def", "#a87ff0"]} onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Calendar" />
        <TweakRadio label="Block style" value={t.blockStyle} options={["tint", "outline", "solid"]}
          onChange={(v) => setTweak("blockStyle", v)} />
        <TweakRadio label="Density" value={t.density} options={["compact", "regular", "comfy"]}
          onChange={(v) => setTweak("density", v)} />
        <TweakToggle label="Tint today's column" value={t.weekendTint} onChange={(v) => setTweak("weekendTint", v)} />
      </TweaksPanel>
    </div>
  );
}

function MarkModal({ blocks, onUpdate, onClose, accent }) {
  const today = blocks.filter(b => b.day === TODAY_INDEX).sort((a, b) => a.start - b.start);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><span className="modal-kicker">Mark today · Thursday</span>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button></div>
        <div className="mark-list">
          {today.length === 0 && <div className="mark-empty">Nothing planned today.</div>}
          {today.map(b => {
            const h = habitById(b.habitId);
            return (
              <div key={b.id} className="mark-row">
                <span className="mark-bar" style={{ background: h.color }} />
                <span className="mark-icon">{h.icon}</span>
                <span className="mark-main"><span className="mark-name" style={{ textDecoration: b.status === "skipped" ? "line-through" : "none", opacity: b.status === "skipped" ? 0.5 : 1 }}>{b.label}</span><span className="mark-time">{min12(b.start)}</span></span>
                <div className="mark-btns">
                  <button className={"mark-b" + (b.status === "done" ? " on" : "")} onClick={() => onUpdate(b.id, { status: "done" })}
                    style={b.status === "done" ? { background: h.color, color: "#0b0b10", borderColor: h.color } : {}}><Icon name="check" size={15} stroke={2.6} /></button>
                  <button className={"mark-b" + (b.status === "skipped" ? " on" : "")} onClick={() => onUpdate(b.id, { status: "skipped" })}
                    style={b.status === "skipped" ? { background: "var(--surface-3)", borderColor: "var(--border)" } : {}}><Icon name="minus" size={15} stroke={2.6} /></button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="modal-actions"><div style={{ flex: 1 }} /><button className="save-btn" style={{ background: accent }} onClick={onClose}>Done</button></div>
      </div>
    </div>
  );
}

export default App;
