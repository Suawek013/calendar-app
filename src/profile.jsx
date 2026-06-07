// profile.jsx — account profile, share-your-calendar, shared-with-you, preferences
// Exposes: ProfileView

import React from 'react';
import { Icon, Segmented, hexA } from './components.jsx';
import { supabase } from './supabase.js';

function ProfileView({ accent, me, partner, shareToken, partnerEnabled, setPartnerEnabled, onViewPartner,
  clock, setClock, weekStart, setWeekStart }) {
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
        <button className="ghost-btn">Edit profile</button>
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
            <div className="dash-block-head"><h2 className="sec-title">Account</h2></div>
            <div className="acct-row"><span>Plan</span><b>Free</b></div>
            <div className="acct-row"><span>Member since</span><b>Jan 2026</b></div>
            <div className="acct-row"><span>Time zone</span><b>Europe / Warsaw</b></div>
            <button className="logout-btn" onClick={async () => await supabase.auth.signOut()}>
              <Icon name="logout" size={15} /> Sign out
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function ShareCard({ accent, shareLink, copyLink, partner, partnerEnabled, setPartnerEnabled }) {
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
        <h2 className="sec-title">Share your calendar</h2>
        <span className="sec-sub">view only</span>
      </div>
      <p className="share-lead">Let someone see your week so you can plan time together. They can view and copy your blocks — never edit them.</p>

      <div className="share-link">
        <span className="sl-ico"><Icon name="link" size={15} /></span>
        <span className="sl-url">{shareLink}</span>
        <button className="sl-copy" style={{ background: accent }} onClick={copy}>
          {copied ? <><Icon name="check" size={14} stroke={2.6} /> Copied</> : "Copy link"}
        </button>
      </div>

      <div className="share-vis">
        <span className="sv-label">Visible detail</span>
        <Segmented value={vis} onChange={setVis}
          options={[{value:"busy",label:"Busy / free"},{value:"full",label:"Full detail"}]} />
      </div>

      {partner && (
      <div className="share-people">
        <div className="sp-label">Shared with</div>
        <div className="sp-row">
          <span className="cp-av sm" style={{ background: partner.color }}>{partner.initial}</span>
          <div className="sp-meta"><div className="sp-name">{partner.name}</div><div className="sp-sub">{partner.email} · can view</div></div>
          <span className="sp-status" style={{ color: accent }}>● active</span>
        </div>
        <button className="sp-invite"><Icon name="plus" size={14} stroke={2.4} /> Invite someone</button>
      </div>
      )}
    </section>
  );
}

function SharedWithYou({ accent, partner, partnerEnabled, setPartnerEnabled, onView }) {
  return (
    <section className="dash-block">
      <div className="dash-block-head">
        <h2 className="sec-title">Shared with you</h2>
        <span className="sec-sub">1 calendar</span>
      </div>
      <div className="swy-card" style={{ borderColor: hexA(partner.color, 0.4) }}>
        <div className="swy-top">
          <span className="cp-av" style={{ background: partner.color }}>{partner.initial}</span>
          <div className="swy-meta">
            <div className="swy-name">{partner.name}’s calendar</div>
            <div className="swy-sub">{partner.email} · view only</div>
          </div>
        </div>
        <p className="swy-note">See {partner.name}’s week alongside yours, and overlay busy times on your calendar to find shared free time.</p>
        <div className="swy-actions">
          <button className="swy-view" style={{ background: partner.color }} onClick={onView}>
            <Icon name="eye" size={15} /> <span>Open {partner.name}’s calendar</span>
          </button>
          <label className="swy-overlay">
            <span className="swo-text">Overlay on my week</span>
            <button className={"toggle" + (partnerEnabled ? " on" : "")} onClick={() => setPartnerEnabled(!partnerEnabled)}
              style={partnerEnabled ? { background: partner.color } : {}}><span className="toggle-knob" /></button>
          </label>
        </div>
      </div>
    </section>
  );
}

function PrefsCard({ accent, clock, setClock, weekStart, setWeekStart }) {
  return (
    <section className="dash-block">
      <div className="dash-block-head"><h2 className="sec-title">Calendar preferences</h2></div>
      <div className="pref-row">
        <div><div className="notif-label">Time format</div><div className="notif-sub">How times display across the app</div></div>
        <Segmented value={clock} onChange={setClock}
          options={[{value:"12",label:"12-hour"},{value:"24",label:"24-hour"}]} />
      </div>
      <div className="pref-row">
        <div><div className="notif-label">Week starts on</div><div className="notif-sub">First column of the planner</div></div>
        <Segmented value={weekStart} onChange={setWeekStart}
          options={[{value:"mon",label:"Monday"},{value:"sun",label:"Sunday"}]} />
      </div>
    </section>
  );
}

export default ProfileView;
