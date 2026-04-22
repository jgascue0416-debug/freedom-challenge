import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

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

function calcStreak(checkins) {
  if (!checkins || checkins.length === 0) return 0;
  const sorted = [...checkins].sort((a, b) => b.day_number - a.day_number);
  let streak = 0;
  let expected = sorted[0].day_number;
  for (const c of sorted) {
    if (c.day_number === expected && c.complete) { streak++; expected--; }
    else break;
  }
  return streak;
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner({ color = "#4ade80" }) {
  return (
    <div style={{ minHeight: "100vh", background: "#080a0e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 32, height: 32, border: "2px solid #1a1a1a", borderTop: `2px solid ${color}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: 12, color: "#888", letterSpacing: 2, fontFamily: "Georgia, serif" }}>Loading...</div>
    </div>
  );
}

// ─── Auth Screen ─────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isChallenge, setIsChallenge] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(""); setLoading(true);
    if (mode === "signup") {
      if (!name.trim()) { setError("Please enter your name."); setLoading(false); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); setLoading(false); return; }
      const { data, error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name.trim(), is_challenge: isChallenge } }
      });
      if (err) { setError(err.message); setLoading(false); return; }
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id, full_name: name.trim(),
          is_challenge: isChallenge, is_leader: false, current_day: 1
        });
        // Auto sign in immediately after signup
        await supabase.auth.signInWithPassword({ email, password });
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message === "Email not confirmed" ? "Please check your email and confirm your account first." : err.message); }
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080a0e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", padding: 24 }}>
      <div style={{ fontSize: 10, letterSpacing: 4, color: "#4ade80", textTransform: "uppercase", marginBottom: 10 }}>30-Day Freedom Challenge</div>
      <div style={{ fontSize: 22, color: "#f0ede6", marginBottom: 6 }}>Walking in the Spirit</div>
      <div style={{ fontSize: 13, color: "#aaa", marginBottom: 32, textAlign: "center", maxWidth: 280, lineHeight: 1.7 }}>
        {mode === "login" ? "Sign in to your account to continue your journey." : "Create your account to begin the challenge."}
      </div>
      <div style={{ width: "100%", maxWidth: 300 }}>
        {mode === "signup" && (
          <>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your first name"
              style={{ width: "100%", background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "12px 16px", color: "#f0ede6", fontSize: 14, fontFamily: "Georgia, serif", marginBottom: 10, boxSizing: "border-box" }} />
          </>
        )}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email"
          style={{ width: "100%", background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "12px 16px", color: "#f0ede6", fontSize: 14, fontFamily: "Georgia, serif", marginBottom: 10, boxSizing: "border-box" }} />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password"
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ width: "100%", background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "12px 16px", color: "#f0ede6", fontSize: 14, fontFamily: "Georgia, serif", marginBottom: 14, boxSizing: "border-box" }} />
        {mode === "signup" && (
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, cursor: "pointer" }} onClick={() => setIsChallenge(c => !c)}>
            <div style={{ width: 20, height: 20, borderRadius: 4, border: `1px solid ${isChallenge ? "#fbbf24" : "#2a2a2a"}`, background: isChallenge ? "#3d2a00" : "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {isChallenge && <div style={{ width: 10, height: 10, background: "#fbbf24", borderRadius: 2 }} />}
            </div>
            <span style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>I'm on the $100/day money challenge</span>
          </label>
        )}
        {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 12, textAlign: "center" }}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", background: "#14532d", border: "none", color: "#4ade80", borderRadius: 10, padding: 15, fontSize: 14, cursor: loading ? "default" : "pointer", letterSpacing: 1, fontFamily: "Georgia, serif", opacity: loading ? 0.7 : 1, marginBottom: 14 }}>
          {loading ? "Please wait..." : mode === "login" ? "Sign in →" : "Create account →"}
        </button>
        <div style={{ textAlign: "center", fontSize: 12, color: "#aaa" }}>
          {mode === "login" ? "No account yet? " : "Already have an account? "}
          <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={{ color: "#4ade80", cursor: "pointer" }}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Role Picker ──────────────────────────────────────────────────────────────
function RolePicker({ profile, onPick, onSignOut }) {
  return (
    <div style={{ minHeight: "100vh", background: "#080a0e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", padding: 24 }}>
      <div style={{ fontSize: 10, letterSpacing: 4, color: "#4ade80", textTransform: "uppercase", marginBottom: 10 }}>30-Day Freedom Challenge</div>
      <div style={{ fontSize: 20, color: "#f0ede6", marginBottom: 4 }}>Welcome, {profile?.full_name}</div>
      <div style={{ fontSize: 13, color: "#aaa", marginBottom: 36 }}>Choose your view</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 300 }}>
        <button onClick={() => onPick("brother")} style={{ background: "#0a1f10", border: "1px solid #1a4a28", borderRadius: 12, padding: "20px", cursor: "pointer", textAlign: "left" }}>
          <div style={{ fontSize: 14, color: "#4ade80", letterSpacing: 0.5, marginBottom: 5 }}>My daily check-in</div>
          <div style={{ fontSize: 12, color: "#6abf88", lineHeight: 1.5 }}>Log today, track your streak, read Scripture</div>
        </button>
        <button onClick={() => onPick("leader")} style={{ background: "#0b1220", border: "1px solid #1a2a40", borderRadius: 12, padding: "20px", cursor: "pointer", textAlign: "left" }}>
          <div style={{ fontSize: 14, color: "#60a5fa", letterSpacing: 0.5, marginBottom: 5 }}>Leader dashboard</div>
          <div style={{ fontSize: 12, color: "#6a9abf", lineHeight: 1.5 }}>View all brothers, progress, and challenge funds</div>
        </button>
      </div>
      <button onClick={onSignOut} style={{ marginTop: 32, background: "none", border: "none", color: "#888", fontSize: 11, cursor: "pointer", letterSpacing: 1 }}>Sign out</button>
    </div>
  );
}

// ─── Brother View ─────────────────────────────────────────────────────────────
function BrotherView({ profile, checkins, onSave, onSwitch, onSignOut }) {
  const currentDay = profile?.current_day || 1;
  const isChallenge = profile?.is_challenge || false;
  const [tab, setTab] = useState("today");
  const [mood, setMood] = useState(null);
  const [note, setNote] = useState("");
  const [temptationVerse, setTemptationVerse] = useState(null);
  const [saving, setSaving] = useState(false);

  const todayCheckin = checkins.find(c => c.day_number === currentDay);
  const saved = !!todayCheckin?.complete;
  const verse = VERSES[(currentDay - 1) % 30];
  const completedCount = checkins.filter(c => c.complete).length;
  const streak = calcStreak(checkins);

  function handleTemptation() {
    const v = TEMPTATION_VERSES[Math.floor(Math.random() * TEMPTATION_VERSES.length)];
    setTemptationVerse(v);
    onSave({ dayNumber: currentDay, temptation: true, complete: false, mood: null, note: "" }, false);
  }

  async function handleSubmit() {
    setSaving(true);
    await onSave({ dayNumber: currentDay, mood: mood || "good", note, complete: true, temptation: !!(todayCheckin?.temptation) }, true);
    setSaving(false);
  }

  async function advanceDay() {
    if (currentDay < 30) {
      setMood(null); setNote(""); setTemptationVerse(null);
      await supabase.from("profiles").update({ current_day: currentDay + 1 }).eq("id", profile.id);
      onSwitch("refresh");
    }
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", color: "#f0ede6", minHeight: "100vh", background: "#0a0a0a", paddingBottom: 80 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid #141414", background: "#0a0a0a", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 1 }}>{profile?.full_name}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onSwitch("pick")} style={{ background: "none", border: "1px solid #1e1e1e", color: "#aaa", padding: "4px 10px", borderRadius: 6, fontSize: 10, cursor: "pointer" }}>Switch</button>
          <button onClick={onSignOut} style={{ background: "none", border: "none", color: "#888", fontSize: 10, cursor: "pointer" }}>Sign out</button>
        </div>
      </div>
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #141414" }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#4ade80", textTransform: "uppercase", marginBottom: 4 }}>30-Day Freedom Challenge</div>
        <div style={{ fontSize: 24, fontWeight: 400 }}>Day {currentDay}</div>
        {isChallenge && <div style={{ marginTop: 6, display: "inline-block", background: "#2a1a00", border: "1px solid #4a3000", borderRadius: 999, padding: "3px 12px", fontSize: 11, color: "#fbbf24" }}>💰 ${completedCount * 100} deposited of $3,000</div>}
        <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
          {[["Streak", streak], ["Complete", completedCount], ["Remaining", 30 - completedCount]].map(([l, v]) => (
            <div key={l}><div style={{ fontSize: 20, color: "#4ade80" }}>{v}</div><div style={{ fontSize: 10, letterSpacing: 2, color: "#aaa", textTransform: "uppercase" }}>{l}</div></div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", borderBottom: "1px solid #141414", padding: "0 20px" }}>
        {[["today","Today"],["streak","Streak"],["log","Log"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ background: "none", border: "none", color: tab === id ? "#4ade80" : "#aaa", fontSize: 13, padding: "12px 14px", cursor: "pointer", borderBottom: tab === id ? "2px solid #4ade80" : "2px solid transparent", letterSpacing: 1 }}>{label}</button>
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
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#aaa", textTransform: "uppercase", marginBottom: 12 }}>How are you today?</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                  {MOODS.map(m => (
                    <button key={m.key} onClick={() => setMood(m.key)} style={{ background: mood === m.key ? "#0a1f10" : "#111", border: `1px solid ${mood === m.key ? m.color : "#1e1e1e"}`, borderRadius: 10, padding: "12px 8px", cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
                      <div style={{ fontSize: 11, color: mood === m.key ? m.color : "#aaa" }}>{m.label}</div>
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#aaa", textTransform: "uppercase", marginBottom: 8 }}>Reflection (optional)</div>
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
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#aaa", textTransform: "uppercase", marginBottom: 14 }}>30-day journey</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 5, marginBottom: 16 }}>
              {Array.from({ length: 30 }, (_, i) => i + 1).map(d => {
                const c = checkins.find(x => x.day_number === d);
                const done = c?.complete, temp = c?.temptation && !done, isToday = d === currentDay;
                return <div key={d} style={{ aspectRatio: "1", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, background: done ? "#0f2d18" : temp ? "#2d1a08" : "#111", border: `${isToday ? 2 : 1}px solid ${done ? "#1a4a28" : temp ? "#4a2a10" : isToday ? "#4ade80" : "#1e1e1e"}`, color: done ? "#4ade80" : temp ? "#d97706" : "#888" }}>{d}</div>;
              })}
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {[["#0f2d18","#1a4a28","Complete"],["#2d1a08","#4a2a10","Temptation"],["#111","#1e1e1e","Upcoming"]].map(([bg,b,l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#aaa" }}><div style={{ width: 11, height: 11, borderRadius: 3, background: bg, border: `1px solid ${b}` }} />{l}</div>
              ))}
            </div>
          </div>
        )}
        {tab === "log" && (
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#aaa", textTransform: "uppercase", marginBottom: 14 }}>Your journey</div>
            {checkins.filter(c => c.complete || c.temptation).length === 0
              ? <div style={{ color: "#888", fontSize: 14, fontStyle: "italic" }}>No entries yet. Your story begins today.</div>
              : [...checkins].filter(c => c.complete || c.temptation).sort((a,b)=>b.day_number-a.day_number).map(c => (
                <div key={c.day_number} style={{ borderBottom: "1px solid #1a1a1a", paddingBottom: 14, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: 13, color: "#f0ede6" }}>Day {c.day_number}</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {c.complete && c.mood && <span style={{ fontSize: 10, color: MOODS.find(m=>m.key===c.mood)?.color||"#aaa", background: "#111", padding: "2px 8px", borderRadius: 999 }}>{MOOD_LABELS[c.mood]}</span>}
                      {c.temptation && <span style={{ fontSize: 10, color: "#d97706", background: "#1a0f00", padding: "2px 8px", borderRadius: 999 }}>⚠ Temptation</span>}
                    </div>
                  </div>
                  {c.note ? <div style={{ fontSize: 12, color: "#778", fontStyle: "italic", lineHeight: 1.6, paddingLeft: 8, borderLeft: "2px solid #1a2a1a" }}>{c.note}</div>
                    : <div style={{ fontSize: 11, color: "#888", fontStyle: "italic" }}>No reflection added.</div>}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Leader View ──────────────────────────────────────────────────────────────
function LeaderView({ profiles, allCheckins, onRefresh, onSwitch, onSignOut }) {
  const [selected, setSelected] = useState(null);

  const brotherList = profiles.map(p => {
    const checkins = allCheckins.filter(c => c.user_id === p.id);
    const completedCount = checkins.filter(c => c.complete).length;
    const streak = calcStreak(checkins);
    const todayCheckin = checkins.find(c => c.day_number === p.current_day);
    const todayDone = !!todayCheckin?.complete;
    const temptationCount = checkins.filter(c => c.temptation).length;
    const latestMood = todayCheckin?.mood || checkins.find(c => c.day_number === p.current_day - 1)?.mood || null;
    return { ...p, checkins, completedCount, streak, todayDone, temptationCount, latestMood };
  });

  const challengeBrother = brotherList.find(b => b.is_challenge);
  const totalToday = brotherList.filter(b => b.todayDone).length;
  const needsAttention = brotherList.filter(b => b.temptationCount > 0 || b.latestMood === "hard");

  if (selected) {
    const b = brotherList.find(b => b.id === selected);
    if (!b) { setSelected(null); return null; }
    return (
      <div style={{ fontFamily: "Georgia, serif", color: "#e8eaf0", minHeight: "100vh", background: "#080c14", paddingBottom: 80 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid #10151f", background: "#080c14", position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#60a5fa", fontSize: 12, cursor: "pointer" }}>← All brothers</button>
          <button onClick={onSignOut} style={{ background: "none", border: "none", color: "#888", fontSize: 10, cursor: "pointer" }}>Sign out</button>
        </div>
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#60a5fa", textTransform: "uppercase", marginBottom: 4 }}>Brother detail</div>
          <div style={{ fontSize: 22, color: "#e8eaf0", marginBottom: b.is_challenge ? 8 : 16 }}>{b.full_name}</div>
          {b.is_challenge && <div style={{ display: "inline-block", background: "#2a1a00", border: "1px solid #4a3000", borderRadius: 999, padding: "3px 12px", fontSize: 11, color: "#fbbf24", marginBottom: 16 }}>💰 $100/day challenge · ${b.completedCount * 100} of $3,000</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[["Streak", b.streak, "#4ade80"], ["Complete", `${b.completedCount}/30`, "#60a5fa"], ["Temptations", b.temptationCount, "#d97706"]].map(([l,v,c]) => (
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
                const c = b.checkins.find(x => x.day_number === d);
                const done = c?.complete, temp = c?.temptation, isToday = d === b.current_day;
                return <div key={d} style={{ aspectRatio: "1", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, background: done ? "#0a1f10" : temp ? "#1f0e04" : "#0e1220", border: `${isToday?2:1}px solid ${done?"#1a4a28":temp?"#4a2010":isToday?"#60a5fa":"#141c28"}`, color: done?"#4ade80":temp?"#d97706":"#2a3a50" }}>{d}</div>;
              })}
            </div>
          </div>
          <div style={{ background: "#0c1220", border: "1px solid #10151f", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#2a3040", textTransform: "uppercase", marginBottom: 12 }}>Check-in log</div>
            {b.checkins.filter(c => c.complete || c.temptation).length === 0
              ? <div style={{ fontSize: 13, color: "#222", fontStyle: "italic" }}>No entries yet.</div>
              : [...b.checkins].filter(c => c.complete || c.temptation).sort((a,x)=>x.day_number-a.day_number).map(c => (
                <div key={c.day_number} style={{ borderBottom: "1px solid #10151f", paddingBottom: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 13, color: "#e8eaf0" }}>Day {c.day_number}</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {c.complete && c.mood && <span style={{ fontSize: 10, color: MOODS.find(m=>m.key===c.mood)?.color||"#aaa", padding: "2px 8px", borderRadius: 999, background: "#0c1220" }}>{MOOD_LABELS[c.mood]}</span>}
                      {c.temptation && <span style={{ fontSize: 10, color: "#d97706", background: "#150a00", padding: "2px 8px", borderRadius: 999 }}>⚠</span>}
                    </div>
                  </div>
                  {c.note ? <div style={{ fontSize: 12, color: "#556", fontStyle: "italic", lineHeight: 1.5, paddingLeft: 8, borderLeft: "2px solid #162030" }}>{c.note}</div>
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
          <button onClick={onRefresh} style={{ background: "none", border: "1px solid #1a2540", color: "#60a5fa", padding: "4px 12px", borderRadius: 6, fontSize: 10, cursor: "pointer" }}>Refresh</button>
          <button onClick={() => onSwitch("pick")} style={{ background: "none", border: "1px solid #1a2540", color: "#334", padding: "4px 10px", borderRadius: 6, fontSize: 10, cursor: "pointer" }}>Switch</button>
          <button onClick={onSignOut} style={{ background: "none", border: "none", color: "#888", fontSize: 10, cursor: "pointer" }}>Sign out</button>
        </div>
      </div>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ fontSize: 22, color: "#e8eaf0", marginBottom: 4 }}>Brotherhood</div>
        <div style={{ fontSize: 12, color: "#2a3040", marginBottom: 20 }}>{brotherList.length} brother{brotherList.length !== 1 ? "s" : ""} on the journey · {totalToday} checked in today</div>
        {needsAttention.length > 0 && (
          <div style={{ background: "#150d06", border: "1px solid #3a1e06", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#d97706", textTransform: "uppercase", marginBottom: 10 }}>⚠ Needs your attention</div>
            {needsAttention.map(b => (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid #2a1a06" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#fbbf24" }}>{b.full_name}</div>
                  <div style={{ fontSize: 11, color: "#7a5020" }}>
                    {b.temptationCount > 0 && `${b.temptationCount} temptation${b.temptationCount > 1 ? "s" : ""} flagged`}
                    {b.temptationCount > 0 && b.latestMood === "hard" && " · "}
                    {b.latestMood === "hard" && "Hard day logged"}
                  </div>
                </div>
                <button onClick={() => setSelected(b.id)} style={{ background: "none", border: "1px solid #3a2010", color: "#d97706", padding: "4px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>View →</button>
              </div>
            ))}
          </div>
        )}
        {challengeBrother && (
          <div style={{ background: "#0f0c02", border: "1px solid #3a2800", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#fbbf24", textTransform: "uppercase", marginBottom: 10 }}>💰 $100/day challenge — {challengeBrother.full_name}</div>
            <div style={{ height: 8, background: "#1a1200", borderRadius: 999, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ height: "100%", width: `${Math.round((challengeBrother.completedCount/30)*100)}%`, background: "#fbbf24", borderRadius: 999 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5a4010", marginBottom: 10 }}>
              <span style={{ color: "#fbbf24" }}>${challengeBrother.completedCount * 100} deposited</span><span>$3,000 goal</span>
            </div>
            <div style={{ fontSize: 11, color: "#4a3808", fontStyle: "italic" }}>"Walk in the Spirit, and you will not fulfill the lust of the flesh." — Galatians 5:16</div>
          </div>
        )}
        <div style={{ fontSize: 10, letterSpacing: 3, color: "#2a3040", textTransform: "uppercase", marginBottom: 12 }}>All brothers</div>
        {brotherList.length === 0
          ? <div style={{ color: "#222", fontSize: 14, fontStyle: "italic" }}>No brothers have joined yet.</div>
          : brotherList.map(b => (
            <button key={b.id} onClick={() => setSelected(b.id)} style={{ width: "100%", background: "#0c1220", border: "1px solid #10151f", borderRadius: 10, padding: "14px 16px", marginBottom: 10, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 14, color: "#e8eaf0" }}>{b.full_name}</div>
                  {b.is_challenge && <span style={{ fontSize: 10, color: "#fbbf24", background: "#2a1a00", padding: "1px 7px", borderRadius: 999 }}>challenge</span>}
                  {b.todayDone ? <span style={{ fontSize: 10, color: "#4ade80", background: "#071510", padding: "1px 7px", borderRadius: 999 }}>✓ today</span>
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

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [allCheckins, setAllCheckins] = useState([]);
  const [screen, setScreen] = useState("loading");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setScreen("auth");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setScreen("auth");
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    let { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!data) {
      const { data: authData } = await supabase.auth.getUser();
      const meta = authData?.user?.user_metadata || {};
      const fallbackName = meta.full_name || authData?.user?.email?.split("@")[0] || "Brother";
      await supabase.from("profiles").upsert({
        id: userId, full_name: fallbackName,
        is_challenge: meta.is_challenge || false,
        is_leader: false, current_day: 1
      });
      const res = await supabase.from("profiles").select("*").eq("id", userId).single();
      data = res.data;
    }
    if (data) { setProfile(data); setScreen("pick"); loadMyCheckins(userId); }
    else setScreen("auth");
  }

  async function loadMyCheckins(userId) {
    const { data } = await supabase.from("checkins").select("*").eq("user_id", userId);
    if (data) setCheckins(data);
  }

  async function loadAllData() {
    const [{ data: profiles }, { data: checkins }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("checkins").select("*")
    ]);
    if (profiles) setAllProfiles(profiles);
    if (checkins) setAllCheckins(checkins);
  }

  async function handleSaveCheckin({ dayNumber, mood, note, complete, temptation }, isComplete) {
    const existing = checkins.find(c => c.day_number === dayNumber);
    const payload = { user_id: session.user.id, day_number: dayNumber, mood: mood || existing?.mood || null, note: note ?? existing?.note ?? "", complete: complete || existing?.complete || false, temptation: temptation || existing?.temptation || false };
    if (existing) {
      await supabase.from("checkins").update(payload).eq("id", existing.id);
      setCheckins(prev => prev.map(c => c.day_number === dayNumber ? { ...c, ...payload } : c));
    } else {
      const { data } = await supabase.from("checkins").insert(payload).select().single();
      if (data) setCheckins(prev => [...prev, data]);
    }
  }

  async function handleSwitch(target) {
    if (target === "pick") setScreen("pick");
    else if (target === "refresh") { await loadProfile(session.user.id); setScreen("pick"); }
    else if (target === "leader") { await loadAllData(); setScreen("leader"); }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null); setProfile(null); setCheckins([]); setAllProfiles([]); setAllCheckins([]);
    setScreen("auth");
  }

  if (screen === "loading") return <Spinner />;
  if (screen === "auth") return <AuthScreen onAuth={() => {}} />;
  if (screen === "pick") return <RolePicker profile={profile} onPick={async (role) => { if (role === "leader") { await loadAllData(); setScreen("leader"); } else setScreen("brother"); }} onSignOut={handleSignOut} />;
  if (screen === "brother") return <BrotherView profile={profile} checkins={checkins} onSave={handleSaveCheckin} onSwitch={handleSwitch} onSignOut={handleSignOut} />;
  if (screen === "leader") return <LeaderView profiles={allProfiles} allCheckins={allCheckins} onRefresh={loadAllData} onSwitch={handleSwitch} onSignOut={handleSignOut} />;
  return null;
}
