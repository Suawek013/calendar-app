// profile.jsx — account profile, share-your-calendar, shared-with-you, preferences
// Exposes: ProfileView

import React from 'react';
import { Icon, Segmented, hexA } from './components.jsx';
import { supabase } from './supabase.js';
import { useTranslation } from './i18n.jsx';

function ProfileView({ accent, me, partner, shareToken, partnerEnabled, setPartnerEnabled, onViewPartner,
  clock, setClock, weekStart, setWeekStart }) {
  const { t } = useTranslation();
  const shareLink = shareToken ? `${window.location.host}/?share=${shareToken.token}` : "Generating...";
  const copyLink = shareToken ? `${window.location.origin}/?share=${shareToken.token}` : "";
  return (
    <div className="profile">
      <header className="profile-head">
        <div className="pf-id">
          <div className="pf-avatar" style={{ background: accent }}>{me.initial}</div>
          <div>
            <h1 className="pf-name">{me.name}</h1>
            <div className="pf-email"><Icon name="mail" size={13} /> {me.email}</div>
          </div>
        </div>
        <button className="ghost-btn">{t("prof.edit")}</button>
      </header>

      <div className="profile-grid">
        <div className="pf-col">
          <ShareCard accent={accent} shareLink={shareLink} copyLink={copyLink} partner={partner}
            partnerEnabled={partnerEnabled} setPartnerEnabled={setPartnerEnabled} />

          {partner && (
            <SharedWithYou accent={accent} partner={partner} partnerEnabled={partnerEnabled}
              onView={onViewPartner} />
          )}
        </div>

        <div className="pf-col">
          <PrefsCard accent={accent} clock={clock} setClock={setClock} weekStart={weekStart} setWeekStart={setWeekStart} />

          <section className="dash-block">
            <div className="dash-block-head"><h2 className="sec-title">{t("prof.acct.title")}</h2></div>
            <div className="acct-row"><span>{t("prof.acct.plan")}</span><b>Free</b></div>
            <div className="acct-row"><span>{t("prof.acct.member")}</span><b>Jan 2026</b></div>
            <div className="acct-row"><span>{t("prof.acct.tz")}</span><b>Europe / Warsaw</b></div>
            <button className="logout-btn" onClick={async () => await supabase.auth.signOut()}>
              <Icon name="logout" size={15} /> {t("prof.acct.logout")}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function ShareCard({ accent, shareLink, copyLink, partner, partnerEnabled, setPartnerEnabled }) {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);
  const [vis, setVis] = React.useState("busy");   // busy | full
  
  // W idealnym scenariuszu tutaj byśmy zrobili update w Supabase `share_tokens` przy zmianie "vis"
  // na razie frontendowy mock dla samego segmented.
  
  function copy() {
    setCopied(true);
    try { navigator.clipboard && navigator.clipboard.writeText(copyLink); } catch (e) {}
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <section className="dash-block">
      <div className="dash-block-head">
        <h2 className="sec-title">{t("prof.share.title")}</h2>
        <span className="sec-sub">{t("prof.share.sub")}</span>
      </div>
      <p className="share-lead">{t("prof.share.lead")}</p>

      <div className="share-link">
        <span className="sl-ico"><Icon name="link" size={15} /></span>
        <span className="sl-url">{shareLink}</span>
        <button className="sl-copy" style={{ background: accent }} onClick={copy}>
          {copied ? <><Icon name="check" size={14} stroke={2.6} /> {t("prof.share.copied")}</> : t("prof.share.copy")}
        </button>
      </div>

      <div className="share-vis">
        <span className="sv-label">{t("prof.share.vis")}</span>
        <Segmented value={vis} onChange={setVis}
          options={[{value:"busy",label:t("prof.share.vis.busy")},{value:"full",label:t("prof.share.vis.full")}]} />
      </div>

      {partner && (
      <div className="share-people">
        <div className="sp-label">{t("prof.share.sharedWith")}</div>
        <div className="sp-row">
          <span className="cp-av sm" style={{ background: partner.color }}>{partner.initial}</span>
          <div className="sp-meta"><div className="sp-name">{partner.name}</div><div className="sp-sub">{partner.email} · {t("prof.share.canView")}</div></div>
          <span className="sp-status" style={{ color: accent }}>{t("prof.share.active")}</span>
        </div>
        <button className="sp-invite"><Icon name="plus" size={14} stroke={2.4} /> {t("prof.share.invite")}</button>
      </div>
      )}
    </section>
  );
}

function SharedWithYou({ accent, partner, partnerEnabled, setPartnerEnabled, onView }) {
  const { t } = useTranslation();
  return (
    <section className="dash-block">
      <div className="dash-block-head">
        <h2 className="sec-title">{t("prof.swy.title")}</h2>
        <span className="sec-sub">{t("prof.swy.sub")}</span>
      </div>
      <div className="swy-card" style={{ borderColor: hexA(partner.color, 0.4) }}>
        <div className="swy-top">
          <span className="cp-av" style={{ background: partner.color }}>{partner.initial}</span>
          <div className="swy-meta">
            <div className="swy-name">{t("prof.swy.calOf", {name: partner.name})}</div>
            <div className="swy-sub">{partner.email} · {t("prof.swy.viewOnly")}</div>
          </div>
        </div>
        <p className="swy-note">{t("prof.swy.note", {name: partner.name})}</p>
        <div className="swy-actions">
          <button className="swy-view" style={{ background: partner.color }} onClick={onView}>
            <Icon name="eye" size={15} /> <span>{t("prof.swy.open", {name: partner.name})}</span>
          </button>
          <label className="swy-overlay">
            <span className="swo-text">{t("prof.swy.overlay")}</span>
            <button className={"toggle" + (partnerEnabled ? " on" : "")} onClick={() => setPartnerEnabled(!partnerEnabled)}
              style={partnerEnabled ? { background: partner.color } : {}}><span className="toggle-knob" /></button>
          </label>
        </div>
      </div>
    </section>
  );
}

function PrefsCard({ accent, clock, setClock, weekStart, setWeekStart }) {
  const { t, lang, setLang } = useTranslation();
  return (
    <section className="dash-block">
      <div className="dash-block-head"><h2 className="sec-title">{t("prof.prefs.title")}</h2></div>
      <div className="pref-row">
        <div><div className="notif-label">{t("prof.prefs.lang")}</div><div className="notif-sub">{t("prof.prefs.langSub")}</div></div>
        <Segmented value={lang} onChange={setLang}
          options={[{value:"en",label:"English"},{value:"pl",label:"Polski"}]} />
      </div>
      <div className="pref-row">
        <div><div className="notif-label">{t("prof.prefs.time")}</div><div className="notif-sub">{t("prof.prefs.timeSub")}</div></div>
        <Segmented value={clock} onChange={setClock}
          options={[{value:"12",label:"12-hour"},{value:"24",label:"24-hour"}]} />
      </div>
      <div className="pref-row">
        <div><div className="notif-label">{t("prof.prefs.week")}</div><div className="notif-sub">{t("prof.prefs.weekSub")}</div></div>
        <Segmented value={weekStart} onChange={setWeekStart}
          options={[{value:"mon",label:"Monday"},{value:"sun",label:"Sunday"}]} />
      </div>
    </section>
  );
}

export default ProfileView;
