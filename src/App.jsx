import { useState, useEffect, useCallback } from "react";

// ─── Storage via JSONBin.io (free, no auth required to read/write a bin) ────
// We use a single shared bin. The bin ID is set once on first run and saved to localStorage.
// All brothers share the same bin via the BIN_ID stored in the app.

const JSONBIN_BASE = "https://api.jsonbin.io/v3/b";
// Public read/write bin — created on first launch and ID stored in localStorage
const LOCAL_BIN_KEY = "fc_bin_id";
const LOCAL_NAME_KEY = "fc_my_name";

async function createBin(initialData) {
  const res = await fetch(JSONBIN_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Bin-Private": "false" },
    body: JSON.stringify(initialData),
  });
  const json = await res.json();
  return json.metadata?.id || null;
}

async function readBin(binId) {
  const res = await fetch(`${JSONBIN_BASE}/${binId}/latest`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.record || null;
}

async function writeBin(binId, data) {
  const res = await fetch(`${JSONBIN_BASE}/${binId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.ok;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const VERSES = [
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "For God gave us a spirit not of fear but of power and love and self-control.", ref: "2 Timothy 1:7" },
  { text: "No temptation has overtaken you that is not common to man. God is faithful, and he will not let you be tempted beyond your ability.", ref: "1 Corinthians 10:13" },
  { text: "Walk in the Spirit, and you will not fulfill the lust of the flesh.", ref: "Galatians 5:16" },
  { text: "Submit yourselves therefore to God. Resist the devil, and he will flee from you.", ref: "James 4:7" },
  { text: "How can a young man keep his way pure? By guarding it according to your word.", ref: "Psalm 119:9" },
  { text: "The Lord is faithful. He will establish you and guard you against the evil one.", ref: "2 Thessalonians 3:3" },
  { text: "Flee these things and pursue righteousness, godliness, faith, love, steadfastness, gentleness.", ref: "1 Timothy 6:11" },
  { text: "Do you not know that your body is a temple of the Holy Spirit within you, whom you have from God?", ref: "1 Corinthians 6:19" },
  { text: "Those who live according to the Spirit set their minds on the things of the Spirit.", ref: "Romans 8:5" },
  { text: "Put on the full armor of God, so that you can take your stand against the devil's schemes.", ref: "Ephesians 6:11" },
  { text: "Create in me a clean heart, O God, and renew a right spirit within me.", ref: "Psalm 51:10" },
  { text: "He gives power to the faint, and to him who has no might he increases strength.", ref: "Isaiah 40:29" },
  { text: "Blessed is the man who remains steadfast under trial, for he will receive the crown of life.", ref: "James 1:12" },
  { text: "I have been crucified with Christ. It is no longer I who live, but Christ who lives in me.", ref: "Galatians 2:20" },
  { text: "The grace of God has appeared, training us to renounce ungodliness and worldly passions.", ref: "Titus 2:11-12" },
  { text: "Let us lay aside every weight and sin that clings so closely, and run with endurance.", ref: "Hebrews 12:1" },
  { text: "Flee youthful passions and pursue righteousness, faith, love, and peace.", ref: "2 Timothy 2:22" },
  { text: "The Spirit helps us in our weakness. For we do not know what to pray for as we ought.", ref: "Romans 8:26" },
  { text: "If we confess our sins, he is faithful and just to forgive us and cleanse us from all unrighteousness.", ref: "1 John 1:9" },
  { text: "Greater is He who is in you than he who is in the world.", ref: "1 John 4:4" },
  { text: "The Lord will fight for you; you need only to be still.", ref: "Exodus 14:14" },
  { text: "For those who love God all things work together for good.", ref: "Romans 8:28" },
  { text: "I sought the Lord, and he answered me and delivered me from all my fears.", ref: "Psalm 34:4" },
  { text: "This is the will of God, your sanctification: that you abstain from sexual immorality.", ref: "1 Thessalonians 4:3" },
  { text: "The Lord is my strength and my shield; in him my heart trusts, and I am helped.", ref: "Psalm 28:7" },
  { text: "To him who is able to keep you from stumbling and to present you blameless before his glory.", ref: "Jude 1:24" },
  { text: "If anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.", ref: "2 Corinthians 5:17" },
  { text: "Let us not grow weary of doing good, for in due season we will reap, if we do not give up.", ref: "Galatians 6:9" },
  { text: "Thanks be to God, who gives us the victory through our Lord Jesus Christ.", ref: "1 Corinthians 15:57" },
];

const TEMPTATION_VERSES = [
  { text: "The name of the Lord is a strong tower; the righteous man runs into it and is safe.", ref: "Proverbs 18:10" },
  { text: "God is faithful — he will not let you be tempted beyond your ability, but will also provide the way of escape.", ref: "1 Corinthians 10:13" },
  { text: "Resist the devil, and he will flee from you. Draw near to God, and he will draw near to you.", ref: "James 4:7-8" },
  { text: "No weapon formed against you shall prosper.", ref: "Isaiah 54:17" },
  { text: "We do not have a high priest unable to sympathize with our weaknesses — he was tempted as we are, yet without sin.", ref: "Hebrews 4:15" },
];

const MOODS = [
  { key: "strong", label: "Standing strong", icon: "💪", color: "#4ade80" },
  { key: "good",   label: "Good & grateful",  icon: "🙏", color: "#60a5fa" },
  { key: "neutral",label: "Just holding on",  icon: "😐", color: "#d97706" },
  { key: "hard",   label: "It's a hard day",  icon: "⚔️", color: "#f87171" },
];
const MOOD_LABELS = { strong: "Standing strong", good: "Good & grateful", neutral: "Holding on", hard: "Hard day" };

function calcStreak(days, currentDay) {
  let s = 0;
  for (let d = currentDay; d >= 1; d--) {
    if (days[d]?.complete) s++; else break;
  }
  return s;
}

// ─── SCREENS ─────────────────────────────────────────────────────────────────

function Spinner({ color = "#4ade80" }) {
  return (
    <div style={{ minHeight: "100vh", background: "#080a0e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 32, height: 32, border: `2px solid #1a1a1a`, borderTop: `2px solid ${color}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: 12, color: "#333", letterSpacing: 2, fontFamily: "Georgia, serif" }}>Loading...</div>
    </div>
  );
}

function HomePick({ onBrother, onLeader }) {
  return (
    <div style={{ minHeight: "100vh", background: "#080a0e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", padding: 24 }}>
      <div style={{ fontSize: 10, letterSpacing: 4, color: "#4ade80", textTransform: "uppercase", marginBottom: 10 }}>30-Day Freedom Challenge</div>
      <div style={{ fontSize: 24, color: "#f0ede6", marginBottom: 6 }}>Walking in the Spirit</div>
      <div style={{ fontSize: 13, color: "#444", marginBottom: 40, textAlign: "center", maxWidth: 280, lineHeight: 1.8 }}>
        A brotherhood accountability tracker.<br />Each man checks in daily.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 300 }}>
        <button onClick={onBrother} style={{ background: "#0a1f10", border: "1px solid #1a4a28", borderRadius: 12, padding: "20px", cursor: "pointer", textAlign: "left", transition: "border-color 0.15s" }}>
          <div style={{ fontSize: 14, color: "#4ade80", letterSpacing: 0.5, marginBottom: 5 }}>I'm a brother on the journey</div>
          <div style={{ fontSize: 12, color: "#1a4020", lineHeight: 1.5 }}>Daily check-ins, Scripture, and streak tracking</div>
        </button>
        <button onClick={onLeader} style={{ background: "#0b1220", border: "1px solid #1a2a40", borderRadius: 12, padding: "20px", cursor: "pointer", textAlign: "left" }}>
          <div style={{ fontSize: 14, color: "#60a5fa", letterSpacing: 0.5, marginBottom: 5 }}>I'm the accountability leader</div>
          <div style={{ fontSize: 12, color: "#1a2a40", lineHeight: 1.5 }}>View all brothers, progress, and challenge funds</div>
        </button>
      </div>
    </div>
  );
}

function Onboarding({ onEnter }) {
  const [name, setName] = useState("");
  const [isChallenge, setIsChallenge] = useState(false);
  return (
    <div style={{ minHeight: "100vh", background: "#080a0e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", padding: 24 }}>
      <div style={{ fontSize: 10, letterSpacing: 4, color: "#4ade80", textTransform: "uppercase", marginBottom: 10 }}>Welcome, brother</div>
      <div style={{ fontSize: 20, color: "#f0ede6", marginBottom: 6 }}>Enter your name</div>
      <div style={{ fontSize: 13, color: "#444", marginBottom: 32, textAlign: "center", maxWidth: 280, lineHeight: 1.7 }}>Your journey will be saved and your leader will be able to see your progress.</div>
      <div style={{ width: "100%", maxWidth: 300 }}>
        <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && name.trim() && onEnter(name.trim(), isChallenge)}
          placeholder="Your first name"
          style={{ width: "100%", background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "13px 16px", color: "#f0ede6", fontSize: 15, fontFamily: "Georgia, serif", marginBottom: 14, boxSizing: "border-box" }} />
        <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, cursor: "pointer" }} onClick={() => setIsChallenge(c => !c)}>
          <div style={{ width: 20, height: 20, borderRadius: 4, border: `1px solid ${isChallenge ? "#fbbf24" : "#2a2a2a"}`, background: isChallenge ? "#3d2a00" : "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {isChallenge && <div style={{ width: 10, height: 10, background: "#fbbf24", borderRadius: 2 }} />}
          </div>
          <span style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>I'm on the $100/day money challenge</span>
        </label>
        <button onClick={() => name.trim() && onEnter(name.trim(), isChallenge)} disabled={!name.trim()}
          style={{ width: "100%", background: name.trim() ? "#14532d" : "#0a1a0f", border: "none", color: name.trim() ? "#4ade80" : "#1a3a1a", borderRadius: 10, padding: 15, fontSize: 14, cursor: name.trim() ? "pointer" : "default", letterSpacing: 1, fontFamily: "Georgia, serif" }}>
          Begin my journey →
        </button>
      </div>
    </div>
  );
}

function BrotherView({ name, brotherData, onSave, onSwitch }) {
  const days = brotherData?.days || {};
  const currentDay = brotherData?.currentDay || 1;
  const isChallenge = brotherData?.isChallenge || false;
  const [tab, setTab] = useState("today");
  const [mood, setMood] = useState(null);
  const [note, setNote] = useState("");
  const [temptationVerse, setTemptationVerse] = useState(null);
  const [saving, setSaving] = useState(false);

  const todayEntry = days[currentDay];
  const saved = !!todayEntry?.complete;
  const verse = VERSES[(currentDay - 1) % 30];
  const completedCount = Object.values(days).filter(d => d?.complete).length;
  const streak = calcStreak(days, currentDay);

  function handleTemptation() {
    const v = TEMPTATION_VERSES[Math.floor(Math.random() * TEMPTATION_VERSES.length)];
    setTemptationVerse(v);
    const updated = { ...days, [currentDay]: { ...(days[currentDay] || {}), temptation: true } };
    onSave({ ...brotherData, days: updated });
  }

  async function handleSubmit() {
    setSaving(true);
    const entry = { mood: mood || "good", note, complete: true, temptation: !!(days[currentDay]?.temptation), savedAt: new Date().toISOString() };
    await onSave({ ...brotherData, days: { ...days, [currentDay]: entry }, lastUpdated: new Date().toISOString() });
    setSaving(false);
  }

  async function advanceDay() {
    if (currentDay < 30) {
      setMood(null); setNote(""); setTemptationVerse(null);
      await onSave({ ...brotherData, currentDay: currentDay + 1, lastUpdated: new Date().toISOString() });
    }
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", color: "#f0ede6", minHeight: "100vh", background: "#0a0a0a", paddingBottom: 80 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid #141414", background: "#0a0a0a", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 1 }}>{name}</div>
        <button onClick={onSwitch} style={{ background: "none", border: "1px solid #1e1e1e", color: "#444", padding: "4px 12px", borderRadius: 6, fontSize: 10, cursor: "pointer", letterSpacing: 1 }}>Switch view</button>
      </div>
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #141414" }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#4ade80", textTransform: "uppercase", marginBottom: 4 }}>30-Day Freedom Challenge</div>
        <div style={{ fontSize: 24, fontWeight: 400 }}>Day {currentDay}</div>
        {isChallenge && <div style={{ marginTop: 6, display: "inline-block", background: "#2a1a00", border: "1px solid #4a3000", borderRadius: 999, padding: "3px 12px", fontSize: 11, color: "#fbbf24" }}>💰 ${completedCount * 100} deposited of $3,000</div>}
        <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
          {[["Streak", streak], ["Complete", completedCount], ["Remaining", 30 - completedCount]].map(([l, v]) => (
            <div key={l}><div style={{ fontSize: 20, color: "#4ade80" }}>{v}</div><div style={{ fontSize: 10, letterSpacing: 2, color: "#444", textTransform: "uppercase" }}>{l}</div></div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", borderBottom: "1px solid #141414", padding: "0 20px" }}>
        {[["today","Today"],["streak","Streak"],["log","Log"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ background: "none", border: "none", color: tab === id ? "#4ade80" : "#555", fontSize: 13, padding: "12px 14px", cursor: "pointer", borderBottom: tab === id ? "2px solid #4ade80" : "2px solid transparent", letterSpacing: 1 }}>{label}</button>
        ))}
      </div>
      <div style={{ padding: "20px 20px 0" }}>
        {tab === "today" && (
          <div>
            <div style={{ borderLeft: "3px solid #4ade80", paddingLeft: 14, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontStyle: "italic", lineHeight: 1.7, color: "#c8c4bc", marginBottom: 6 }}>"{verse.text}"</div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#4ade80", textTransform: "uppercase" }}>— {verse.ref}</div>
            </div>
            {saved ? (
              <div style={{ background: "#0a1f0f", border: "1px solid #1a3a1a", borderRadius: 12, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                <div style={{ color: "#4ade80", fontSize: 15 }}>Day {currentDay} complete</div>
                <div style={{ color: "#446644", fontSize: 12, marginTop: 6 }}>The Lord sees your faithfulness.</div>
                {currentDay < 30
                  ? <button onClick={advanceDay} style={{ marginTop: 16, background: "none", border: "1px solid #1e3a1e", color: "#4ade80", padding: "8px 20px", borderRadius: 6, fontSize: 12, cursor: "pointer", letterSpacing: 1 }}>Begin Day {currentDay + 1} →</button>
                  : <div style={{ marginTop: 12, color: "#fbbf24", fontSize: 14 }}>🏆 Challenge complete. Freedom is yours, brother.</div>}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#444", textTransform: "uppercase", marginBottom: 12 }}>How are you today?</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                  {MOODS.map(m => (
                    <button key={m.key} onClick={() => setMood(m.key)} style={{ background: mood === m.key ? "#0a1f10" : "#111", border: `1px solid ${mood === m.key ? m.color : "#1e1e1e"}`, borderRadius: 10, padding: "12px 8px", cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
                      <div style={{ fontSize: 11, color: mood === m.key ? m.color : "#666" }}>{m.label}</div>
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#444", textTransform: "uppercase", marginBottom: 8 }}>Reflection (optional)</div>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What's on your heart today..."
                  style={{ width: "100%", background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: 12, color: "#c8c4bc", fontSize: 13, fontFamily: "Georgia, serif", lineHeight: 1.6, minHeight: 80, resize: "vertical", marginBottom: 16, boxSizing: "border-box" }} />
                {!temptationVerse
                  ? <button onClick={handleTemptation} style={{ width: "100%", background: "none", border: "1px solid #3a2008", color: "#d97706", borderRadius: 10, padding: 13, fontSize: 13, cursor: "pointer", marginBottom: 12 }}>⚠ I'm facing a temptation right now</button>
                  : <div style={{ background: "#0b1526", border: "1px solid #162040", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                      <div style={{ fontSize: 10, letterSpacing: 3, color: "#60a5fa", textTransform: "uppercase", marginBottom: 8 }}>Hold fast — the Word of God</div>
                      <div style={{ fontSize: 13, fontStyle: "italic", color: "#aac8f0", lineHeight: 1.7, marginBottom: 6 }}>"{temptationVerse.text}"</div>
                      <div style={{ fontSize: 10, color: "#60a5fa", letterSpacing: 1 }}>— {temptationVerse.ref}</div>
                    </div>}
                <button onClick={handleSubmit} disabled={saving}
                  style={{ width: "100%", background: saving ? "#0a2a14" : "#14532d", border: "none", color: "#4ade80", borderRadius: 10, padding: 15, fontSize: 14, cursor: saving ? "default" : "pointer", letterSpacing: 1, fontFamily: "Georgia, serif" }}>
                  {saving ? "Saving..." : "Mark day complete ✓"}
                </button>
              </div>
            )}
          </div>
        )}
        {tab === "streak" && (
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#444", textTransform: "uppercase", marginBottom: 14 }}>30-day journey</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 5, marginBottom: 16 }}>
              {Array.from({ length: 30 }, (_, i) => i + 1).map(d => {
                const e = days[d]; const done = e?.complete, temp = e?.temptation && !done, isToday = d === currentDay;
                return <div key={d} style={{ aspectRatio: "1", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, background: done ? "#0f2d18" : temp ? "#2d1a08" : "#111", border: `${isToday ? 2 : 1}px solid ${done ? "#1a4a28" : temp ? "#4a2a10" : isToday ? "#4ade80" : "#1e1e1e"}`, color: done ? "#4ade80" : temp ? "#d97706" : "#333" }}>{d}</div>;
              })}
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {[["#0f2d18","#1a4a28","Complete"],["#2d1a08","#4a2a10","Temptation"],["#111","#1e1e1e","Upcoming"]].map(([bg,b,l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#555" }}><div style={{ width: 11, height: 11, borderRadius: 3, background: bg, border: `1px solid ${b}` }} />{l}</div>
              ))}
            </div>
          </div>
        )}
        {tab === "log" && (
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#444", textTransform: "uppercase", marginBottom: 14 }}>Your journey</div>
            {Object.entries(days).filter(([,v]) => v?.complete || v?.temptation).length === 0
              ? <div style={{ color: "#333", fontSize: 14, fontStyle: "italic" }}>No entries yet. Your story begins today.</div>
              : Object.entries(days).filter(([,v]) => v?.complete || v?.temptation).sort((a,b)=>Number(b[0])-Number(a[0])).map(([d,v]) => (
                <div key={d} style={{ borderBottom: "1px solid #1a1a1a", paddingBottom: 14, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: 13, color: "#f0ede6" }}>Day {d}</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {v.complete && v.mood && <span style={{ fontSize: 10, color: MOODS.find(m=>m.key===v.mood)?.color||"#aaa", background: "#111", padding: "2px 8px", borderRadius: 999 }}>{MOOD_LABELS[v.mood]}</span>}
                      {v.temptation && <span style={{ fontSize: 10, color: "#d97706", background: "#1a0f00", padding: "2px 8px", borderRadius: 999 }}>⚠ Temptation</span>}
                    </div>
                  </div>
                  {v.note ? <div style={{ fontSize: 12, color: "#778", fontStyle: "italic", lineHeight: 1.6, paddingLeft: 8, borderLeft: "2px solid #1a2a1a" }}>{v.note}</div>
                    : <div style={{ fontSize: 11, color: "#333", fontStyle: "italic" }}>No reflection added.</div>}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderView({ allData, onRefresh, onSwitch }) {
  const brothers = allData?.brothers || {};
  const [selected, setSelected] = useState(null);

  const brotherList = Object.entries(brothers).map(([name, data]) => {
    const days = data?.days || {};
    const currentDay = data?.currentDay || 1;
    const completedCount = Object.values(days).filter(d => d?.complete).length;
    const streak = calcStreak(days, currentDay);
    const todayDone = !!(days[currentDay]?.complete);
    const temptationCount = Object.values(days).filter(d => d?.temptation).length;
    const latestMood = days[currentDay]?.mood || days[currentDay - 1]?.mood || null;
    return { name, data, days, currentDay, completedCount, streak, todayDone, temptationCount, latestMood, isChallenge: data?.isChallenge };
  });

  const challengeBrother = brotherList.find(b => b.isChallenge);
  const totalCheckedInToday = brotherList.filter(b => b.todayDone).length;
  const needsAttention = brotherList.filter(b => b.temptationCount > 0 || b.latestMood === "hard");

  if (selected) {
    const b = brotherList.find(b => b.name === selected);
    if (!b) { setSelected(null); return null; }
    const { days, currentDay, completedCount, streak, isChallenge } = b;
    return (
      <div style={{ fontFamily: "Georgia, serif", color: "#e8eaf0", minHeight: "100vh", background: "#080c14", paddingBottom: 80 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid #10151f", background: "#080c14", position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#60a5fa", fontSize: 12, cursor: "pointer", letterSpacing: 1 }}>← All brothers</button>
          <button onClick={onSwitch} style={{ background: "none", border: "1px solid #1a2540", color: "#334", padding: "4px 12px", borderRadius: 6, fontSize: 10, cursor: "pointer", letterSpacing: 1 }}>Switch view</button>
        </div>
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#60a5fa", textTransform: "uppercase", marginBottom: 4 }}>Brother detail</div>
          <div style={{ fontSize: 22, color: "#e8eaf0", marginBottom: isChallenge ? 8 : 16 }}>{selected}</div>
          {isChallenge && <div style={{ display: "inline-block", background: "#2a1a00", border: "1px solid #4a3000", borderRadius: 999, padding: "3px 12px", fontSize: 11, color: "#fbbf24", marginBottom: 16 }}>💰 $100/day challenge · ${completedCount * 100} of $3,000</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[["Streak", streak,"#4ade80"],["Complete",`${completedCount}/30`,"#60a5fa"],["Temptations",Object.values(days).filter(d=>d?.temptation).length,"#d97706"]].map(([l,v,c]) => (
              <div key={l} style={{ background: "#0c1220", border: "1px solid #10151f", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#2a3040", textTransform: "uppercase", marginBottom: 6 }}>{l}</div>
                <div style={{ fontSize: 22, color: c }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#0c1220", border: "1px solid #10151f", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#2a3040", textTransform: "uppercase", marginBottom: 12 }}>30-day calendar</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
              {Array.from({ length: 30 }, (_, i) => i + 1).map(d => {
                const e = days[d]; const done = e?.complete, temp = e?.temptation, isToday = d === currentDay;
                return <div key={d} style={{ aspectRatio: "1", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, background: done ? "#0a1f10" : temp ? "#1f0e04" : "#0e1220", border: `${isToday?2:1}px solid ${done?"#1a4a28":temp?"#4a2010":isToday?"#60a5fa":"#141c28"}`, color: done?"#4ade80":temp?"#d97706":"#2a3a50" }}>{d}</div>;
              })}
            </div>
          </div>
          <div style={{ background: "#0c1220", border: "1px solid #10151f", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#2a3040", textTransform: "uppercase", marginBottom: 12 }}>Check-in log</div>
            {Object.entries(days).filter(([,v]) => v?.complete || v?.temptation).length === 0
              ? <div style={{ fontSize: 13, color: "#222", fontStyle: "italic" }}>No entries yet.</div>
              : Object.entries(days).filter(([,v]) => v?.complete || v?.temptation).sort((a,b)=>Number(b[0])-Number(a[0])).map(([d,v]) => (
                <div key={d} style={{ borderBottom: "1px solid #10151f", paddingBottom: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 13, color: "#e8eaf0" }}>Day {d}</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {v.complete && v.mood && <span style={{ fontSize: 10, color: MOODS.find(m=>m.key===v.mood)?.color||"#aaa", background: "#0c1220", padding: "2px 8px", borderRadius: 999 }}>{MOOD_LABELS[v.mood]}</span>}
                      {v.temptation && <span style={{ fontSize: 10, color: "#d97706", background: "#150a00", padding: "2px 8px", borderRadius: 999 }}>⚠</span>}
                    </div>
                  </div>
                  {v.note ? <div style={{ fontSize: 12, color: "#556", fontStyle: "italic", lineHeight: 1.5, paddingLeft: 8, borderLeft: "2px solid #162030" }}>{v.note}</div>
                    : <div style={{ fontSize: 11, color: "#222", fontStyle: "italic" }}>No reflection.</div>}
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", color: "#e8eaf0", minHeight: "100vh", background: "#080c14", paddingBottom: 80 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid #10151f", background: "#080c14", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: "#60a5fa" }}>LEADER VIEW</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onRefresh} style={{ background: "none", border: "1px solid #1a2540", color: "#60a5fa", padding: "4px 12px", borderRadius: 6, fontSize: 10, cursor: "pointer", letterSpacing: 1 }}>Refresh</button>
          <button onClick={onSwitch} style={{ background: "none", border: "1px solid #1a2540", color: "#334", padding: "4px 12px", borderRadius: 6, fontSize: 10, cursor: "pointer", letterSpacing: 1 }}>Switch view</button>
        </div>
      </div>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ fontSize: 22, color: "#e8eaf0", marginBottom: 4 }}>Brotherhood</div>
        <div style={{ fontSize: 12, color: "#2a3040", marginBottom: 20 }}>{brotherList.length} brother{brotherList.length !== 1 ? "s" : ""} on the journey · {totalCheckedInToday} checked in today</div>
        {needsAttention.length > 0 && (
          <div style={{ background: "#150d06", border: "1px solid #3a1e06", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#d97706", textTransform: "uppercase", marginBottom: 10 }}>⚠ Needs your attention</div>
            {needsAttention.map(b => (
              <div key={b.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid #2a1a06" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#fbbf24" }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: "#7a5020" }}>
                    {b.temptationCount > 0 && `${b.temptationCount} temptation${b.temptationCount > 1 ? "s" : ""} flagged`}
                    {b.temptationCount > 0 && b.latestMood === "hard" && " · "}
                    {b.latestMood === "hard" && "Hard day logged"}
                  </div>
                </div>
                <button onClick={() => setSelected(b.name)} style={{ background: "none", border: "1px solid #3a2010", color: "#d97706", padding: "4px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>View →</button>
              </div>
            ))}
          </div>
        )}
        {challengeBrother && (
          <div style={{ background: "#0f0c02", border: "1px solid #3a2800", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#fbbf24", textTransform: "uppercase", marginBottom: 10 }}>💰 $100/day challenge — {challengeBrother.name}</div>
            <div style={{ height: 8, background: "#1a1200", borderRadius: 999, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ height: "100%", width: `${Math.round((challengeBrother.completedCount/30)*100)}%`, background: "#fbbf24", borderRadius: 999 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5a4010", marginBottom: 10 }}>
              <span style={{ color: "#fbbf24" }}>${challengeBrother.completedCount * 100} deposited</span>
              <span>$3,000 goal</span>
            </div>
            <div style={{ fontSize: 11, color: "#4a3808", fontStyle: "italic" }}>"Walk in the Spirit, and you will not fulfill the lust of the flesh." — Galatians 5:16</div>
          </div>
        )}
        <div style={{ fontSize: 10, letterSpacing: 3, color: "#2a3040", textTransform: "uppercase", marginBottom: 12 }}>All brothers</div>
        {brotherList.length === 0
          ? <div style={{ color: "#222", fontSize: 14, fontStyle: "italic" }}>No brothers have joined yet. Share the link and invite them in.</div>
          : brotherList.map(b => (
            <button key={b.name} onClick={() => setSelected(b.name)} style={{ width: "100%", background: "#0c1220", border: "1px solid #10151f", borderRadius: 10, padding: "14px 16px", marginBottom: 10, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 14, color: "#e8eaf0" }}>{b.name}</div>
                  {b.isChallenge && <span style={{ fontSize: 10, color: "#fbbf24", background: "#2a1a00", padding: "1px 7px", borderRadius: 999 }}>challenge</span>}
                  {b.todayDone
                    ? <span style={{ fontSize: 10, color: "#4ade80", background: "#071510", padding: "1px 7px", borderRadius: 999 }}>✓ today</span>
                    : <span style={{ fontSize: 10, color: "#d97706", background: "#150d06", padding: "1px 7px", borderRadius: 999 }}>not yet</span>}
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  <span style={{ fontSize: 11, color: "#4ade80" }}>{b.streak} day streak</span>
                  <span style={{ fontSize: 11, color: "#2a3040" }}>{b.completedCount}/30 complete</span>
                  {b.temptationCount > 0 && <span style={{ fontSize: 11, color: "#d97706" }}>⚠ {b.temptationCount}</span>}
                </div>
              </div>
              <div style={{ fontSize: 16, color: "#2a3040" }}>→</div>
            </button>
          ))}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("loading");
  const [binId, setBinId] = useState(null);
  const [allData, setAllData] = useState({ brothers: {} });
  const [myName, setMyName] = useState(null);

  useEffect(() => {
    async function init() {
      const savedName = localStorage.getItem(LOCAL_NAME_KEY);
      let id = localStorage.getItem(LOCAL_BIN_KEY);
      if (!id) {
        id = await createBin({ brothers: {} });
        if (id) localStorage.setItem(LOCAL_BIN_KEY, id);
      }
      setBinId(id);
      if (id) {
        const data = await readBin(id);
        if (data) setAllData(data);
      }
      if (savedName) setMyName(savedName);
      setScreen("pick");
    }
    init();
  }, []);

  async function refreshData() {
    if (!binId) return;
    const data = await readBin(binId);
    if (data) setAllData(data);
  }

  async function saveBrotherData(name, brotherData) {
    const updated = { ...allData, brothers: { ...allData.brothers, [name]: brotherData } };
    setAllData(updated);
    if (binId) await writeBin(binId, updated);
  }

  async function handleJoin(name, isChallenge) {
    localStorage.setItem(LOCAL_NAME_KEY, name);
    setMyName(name);
    const fresh = await readBin(binId);
    const base = fresh || allData;
    if (!base.brothers?.[name]) {
      const updated = { ...base, brothers: { ...(base.brothers || {}), [name]: { days: {}, currentDay: 1, isChallenge } } };
      setAllData(updated);
      if (binId) await writeBin(binId, updated);
    } else {
      setAllData(base);
    }
    setScreen("brother");
  }

  if (screen === "loading") return <Spinner />;

  if (screen === "pick") return (
    <HomePick
      onBrother={() => {
        if (myName) setScreen("brother");
        else setScreen("onboard");
      }}
      onLeader={async () => { await refreshData(); setScreen("leader"); }}
    />
  );

  if (screen === "onboard") return <Onboarding onEnter={handleJoin} />;

  if (screen === "brother" && myName) {
    const brotherData = allData.brothers?.[myName] || { days: {}, currentDay: 1 };
    return <BrotherView name={myName} brotherData={brotherData} onSave={(d) => saveBrotherData(myName, d)} onSwitch={() => setScreen("pick")} />;
  }

  if (screen === "leader") return <LeaderView allData={allData} onRefresh={refreshData} onSwitch={() => setScreen("pick")} />;

  return null;
}
