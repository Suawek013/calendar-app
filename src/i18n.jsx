import React, { createContext, useContext, useState, useEffect } from 'react';

const EN = {
  "nav.dash": "Dashboard",
  "nav.cal": "Calendar",
  "nav.goals": "Goals",
  "nav.profile": "Profile",
  "app.loading": "Loading data from Supabase...",

  // Profile
  "prof.edit": "Edit profile",
  "prof.acct.title": "Account",
  "prof.acct.plan": "Plan",
  "prof.acct.member": "Member since",
  "prof.acct.tz": "Time zone",
  "prof.acct.logout": "Sign out",
  "prof.share.title": "Share your calendar",
  "prof.share.sub": "view only",
  "prof.share.lead": "Let someone see your week so you can plan time together. They can view and copy your blocks — never edit them.",
  "prof.share.copy": "Copy link",
  "prof.share.copied": "Copied",
  "prof.share.vis": "Visible detail",
  "prof.share.vis.busy": "Busy / free",
  "prof.share.vis.full": "Full detail",
  "prof.share.sharedWith": "Shared with",
  "prof.share.canView": "can view",
  "prof.share.active": "● active",
  "prof.share.invite": "Invite someone",
  "prof.swy.title": "Shared with you",
  "prof.swy.sub": "1 calendar",
  "prof.swy.calOf": "{name}’s calendar",
  "prof.swy.viewOnly": "view only",
  "prof.swy.note": "See {name}’s week alongside yours, and overlay busy times on your calendar to find shared free time.",
  "prof.swy.open": "Open {name}’s calendar",
  "prof.swy.overlay": "Overlay on my week",
  "prof.prefs.title": "Calendar preferences",
  "prof.prefs.lang": "Language / Język",
  "prof.prefs.langSub": "App interface language",
  "prof.prefs.time": "Time format",
  "prof.prefs.timeSub": "How times display across the app",
  "prof.prefs.week": "Week starts on",
  "prof.prefs.weekSub": "First column of the planner",

  // Dashboard
  "dash.greet": "Good evening, {name}",
  "dash.habitsTracked": "{count} habits tracked",
  "dash.habitsDone": "habits done this week · {pct}% on track",
  "dash.whereTimeGoes": "Where time goes",
  "dash.period.week": "Last 7 days",
  "dash.period.month": "Last 30 days",
  "dash.sleep": "Sleep",
  "dash.thisWeek": "This week",
  "dash.thisWeek.sub": "tap a day to plan",
  "dash.action.mark": "Mark today's habits",
  "dash.action.cal": "This week's calendar",
  "dash.action.add": "Add one-off event",
  "dash.activity": "Habit activity",
  "dash.activity.sub": "past 12 months",
  "dash.activity.all": "All habits",
  "dash.activity.done": "{done} done · {pct}%",
  "dash.stat.cur": "Current streak",
  "dash.stat.best": "Best streak",
  "dash.stat.comp": "Completed",
  "dash.stat.cons": "Consistency",
  "dash.legend.less": "Less",
  "dash.legend.more": "More",
  "dash.card.thisWeek": "this week",
  "dash.goals.title": "{year} Goals",
  "dash.goals.seeAll": "See all",
  "dash.goals.behind1": "1 goal behind pace",
  "dash.goals.behindN": "{count} goals behind pace",
  "dash.goals.review": "Review",
  "dash.goals.steps": "steps",
  "dash.goals.sessions": "sessions",
  "dash.goals.done": "Done",
  "dash.goals.behindTxt": "Behind",
  "dash.goals.ahead": "Ahead",
  "dash.goals.onTrack": "On track",
};

const PL = {
  "nav.dash": "Pulpit",
  "nav.cal": "Kalendarz",
  "nav.goals": "Cele",
  "nav.profile": "Profil",
  "app.loading": "Ładowanie danych z Supabase...",

  // Profile
  "prof.edit": "Edytuj profil",
  "prof.acct.title": "Konto",
  "prof.acct.plan": "Plan",
  "prof.acct.member": "Członek od",
  "prof.acct.tz": "Strefa czasowa",
  "prof.acct.logout": "Wyloguj się",
  "prof.share.title": "Udostępnij kalendarz",
  "prof.share.sub": "tylko odczyt",
  "prof.share.lead": "Pozwól komuś zobaczyć Twój tydzień, abyście mogli łatwiej planować wspólny czas. Mogą tylko podglądać Twoje bloki – bez możliwości edycji.",
  "prof.share.copy": "Skopiuj link",
  "prof.share.copied": "Skopiowano",
  "prof.share.vis": "Widoczność detali",
  "prof.share.vis.busy": "Zajęty / wolny",
  "prof.share.vis.full": "Pełne detale",
  "prof.share.sharedWith": "Udostępniono dla",
  "prof.share.canView": "może przeglądać",
  "prof.share.active": "● aktywne",
  "prof.share.invite": "Zaproś kogoś",
  "prof.swy.title": "Udostępnione Tobie",
  "prof.swy.sub": "1 kalendarz",
  "prof.swy.calOf": "Kalendarz {name}",
  "prof.swy.viewOnly": "tylko odczyt",
  "prof.swy.note": "Zobacz tydzień {name} obok swojego i nałóż zajęty czas na swój kalendarz, by znaleźć wspólną lukę.",
  "prof.swy.open": "Otwórz kalendarz {name}",
  "prof.swy.overlay": "Nałóż na mój tydzień",
  "prof.prefs.title": "Preferencje kalendarza",
  "prof.prefs.lang": "Language / Język",
  "prof.prefs.langSub": "Język interfejsu aplikacji",
  "prof.prefs.time": "Format czasu",
  "prof.prefs.timeSub": "Wyświetlanie godzin w aplikacji",
  "prof.prefs.week": "Tydzień zaczyna się w",
  "prof.prefs.weekSub": "Pierwsza kolumna kalendarza",

  // Dashboard
  "dash.greet": "Dobry wieczór, {name}",
  "dash.habitsTracked": "{count} śledzonych nawyków",
  "dash.habitsDone": "nawyków zrobionych w tym tygodniu · {pct}% na dobrej drodze",
  "dash.whereTimeGoes": "Na co idzie czas",
  "dash.period.week": "Ostatnie 7 dni",
  "dash.period.month": "Ostatnie 30 dni",
  "dash.sleep": "Sen",
  "dash.thisWeek": "W tym tygodniu",
  "dash.thisWeek.sub": "dotknij dnia, aby zaplanować",
  "dash.action.mark": "Oznacz dzisiejsze nawyki",
  "dash.action.cal": "Kalendarz tego tygodnia",
  "dash.action.add": "Dodaj jednorazowe zadanie",
  "dash.activity": "Aktywność",
  "dash.activity.sub": "ostatnie 12 miesięcy",
  "dash.activity.all": "Wszystkie nawyki",
  "dash.activity.done": "{done} zrobiono · {pct}%",
  "dash.stat.cur": "Obecna seria",
  "dash.stat.best": "Najlepsza seria",
  "dash.stat.comp": "Ukończono",
  "dash.stat.cons": "Konsekwencja",
  "dash.legend.less": "Mniej",
  "dash.legend.more": "Więcej",
  "dash.card.thisWeek": "w tym tygodniu",
  "dash.goals.title": "Cele na rok {year}",
  "dash.goals.seeAll": "Zobacz wszystkie",
  "dash.goals.behind1": "1 cel poniżej tempa",
  "dash.goals.behindN": "{count} cele poniżej tempa",
  "dash.goals.review": "Przejrzyj",
  "dash.goals.steps": "kroków",
  "dash.goals.sessions": "sesji",
  "dash.goals.done": "Zrobione",
  "dash.goals.behindTxt": "Zaległe",
  "dash.goals.ahead": "Wyprzedza",
  "dash.goals.onTrack": "Na dobrej drodze",
};

const DICTIONARIES = { en: EN, pl: PL };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("cal_lang") || "en");

  useEffect(() => {
    localStorage.setItem("cal_lang", lang);
  }, [lang]);

  const t = (key, params = {}) => {
    const dict = DICTIONARIES[lang] || DICTIONARIES.en;
    let str = dict[key];
    if (!str) {
      console.warn(`Missing translation for key: ${key}`);
      return key; // fallback to key
    }
    // Replace {param} in string
    Object.keys(params).forEach(p => {
      str = str.replace(`{${p}}`, params[p]);
    });
    return str;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
