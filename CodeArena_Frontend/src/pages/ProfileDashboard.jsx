import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { NavLink, useNavigate } from "react-router";
import axiosClient from "../utils/axiosClient";
import {
  User, MapPin, Calendar, Link as LinkIcon,
  Github, Linkedin, Twitter, FileText,
  Briefcase, GraduationCap, Wrench,
  ChevronRight, ArrowLeft, Camera,
  ExternalLink, Code2, Flame, Target,
  TrendingUp, Award, Zap, Star,
} from "lucide-react";
import { updateUserProfile } from "../authSlice";

/* ─── Font Loader ────────────────────────────────────────────────── */
const FontLoader = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
};

/* ─── Animated counter ───────────────────────────────────────────── */
function useCounter(target, duration = 1000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

/* ─── Tier system ────────────────────────────────────────────────── */
function getTier(solved) {
  if (solved >= 200) return { name: "LEGEND",   color: "#ffd166", glow: "rgba(255,209,102,0.4)", icon: "👑" };
  if (solved >= 100) return { name: "EXPERT",   color: "#a78bfa", glow: "rgba(167,139,250,0.4)", icon: "💎" };
  if (solved >= 50)  return { name: "ADVANCED", color: "#4ecdc4", glow: "rgba(78,205,196,0.4)",  icon: "🔥" };
  if (solved >= 20)  return { name: "SKILLED",  color: "#00ff88", glow: "rgba(0,255,136,0.4)",   icon: "⚡" };
  if (solved >= 5)   return { name: "ROOKIE",   color: "#888aaa", glow: "rgba(136,138,170,0.3)", icon: "🌱" };
  return               { name: "NEWBIE",   color: "#444466", glow: "rgba(68,68,102,0.2)",  icon: "🐣" };
}

/* ─── Circular Ring ──────────────────────────────────────────────── */
function Ring({ value, max, color, size = 88, stroke = 7, label, sublabel }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = max > 0 ? (value / max) * 100 : 0;
  const off  = circ - (pct / 100) * circ;
  const anim = useCounter(value, 900);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a2e" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)", filter: `drop-shadow(0 0 5px ${color})` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 16, fontWeight: 700, color, lineHeight: 1 }}>{anim}</span>
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "#444466", marginTop: 1 }}>/{max}</span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Syne'", fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</div>
        {sublabel && <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "#555577", marginTop: 2 }}>{sublabel}%</div>}
      </div>
    </div>
  );
}

/* ─── Heatmap ────────────────────────────────────────────────────── */
function HeatMap({ submissions }) {
  const DAYS  = 365;
  const today = new Date();
  const cells = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (DAYS - 1 - i));
    return d.toISOString().split("T")[0];
  });
  const countMap = {};
  (submissions || []).forEach((s) => {
    const day = s.createdAt?.split("T")[0];
    if (day) countMap[day] = (countMap[day] || 0) + 1;
  });
  const getColor = (c) => {
    if (!c) return "#141428";
    if (c === 1) return "#0d3d2a";
    if (c <= 3)  return "#0a6640";
    if (c <= 6)  return "#00c060";
    return "#00ff88";
  };
  const weeks = [];
  let week = [];
  cells.forEach((day, i) => {
    week.push({ day, count: countMap[day] || 0 });
    if ((i + 1) % 7 === 0 || i === cells.length - 1) { weeks.push(week); week = []; }
  });
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const totalActive = Object.keys(countMap).length;
  const totalSubs   = (submissions || []).length;
  const maxStreak   = (() => {
    let cur = 0, best = 0;
    cells.forEach((d) => { if (countMap[d]) { cur++; best = Math.max(best, cur); } else cur = 0; });
    return best;
  })();
  const curStreak = (() => {
    let cur = 0;
    for (let i = cells.length - 1; i >= 0; i--) {
      if (countMap[cells[i]]) cur++; else break;
    }
    return cur;
  })();

  return (
    <div>
      {/* Month labels */}
      <div style={{ display: "flex", gap: 3, marginBottom: 4, paddingLeft: 2 }}>
        {months.map((m, i) => (
          <div key={m} style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "#444466", flex: i === 11 ? "0 0 auto" : 1 }}>{m}</div>
        ))}
      </div>
      {/* Grid */}
      <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4 }}>
        {weeks.map((w, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {w.map(({ day, count }, di) => (
              <div key={di} title={`${day}: ${count} submission${count !== 1 ? "s" : ""}`}
                style={{ width: 11, height: 11, borderRadius: 2, background: getColor(count), cursor: count ? "pointer" : "default", transition: "transform 0.12s", flexShrink: 0,
                  boxShadow: count >= 4 ? `0 0 4px ${getColor(count)}` : "none" }}
                onMouseEnter={(e) => { e.target.style.transform = "scale(1.5)"; e.target.style.zIndex = 10; }}
                onMouseLeave={(e) => { e.target.style.transform = "scale(1)"; e.target.style.zIndex = 1; }}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Stats row */}
      <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
        {[
          { label: "Total Submissions", value: totalSubs,   color: "#00ff88" },
          { label: "Active Days",       value: totalActive, color: "#4ecdc4" },
          { label: "Current Streak",    value: `${curStreak}d`, color: "#ffd166" },
          { label: "Max Streak",        value: `${maxStreak}d`, color: "#ff4757" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 15, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontFamily: "'Inter'", fontSize: 10, color: "#444466", marginTop: 1 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Skill bar ──────────────────────────────────────────────────── */
function SkillBar({ label, count, max, color }) {
  const pct = max > 0 ? Math.min((count / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontFamily: "'Inter'", fontSize: 12, color: "#aaaacc", textTransform: "capitalize" }}>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color }}>{count}</span>
      </div>
      <div style={{ height: 5, background: "#141428", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3,
          boxShadow: `0 0 6px ${color}`, transition: "width 1.4s cubic-bezier(0.16,1,0.3,1)" }} />
      </div>
    </div>
  );
}

/* ─── Social link ────────────────────────────────────────────────── */
function SocialLink({ href, icon: Icon, label, color }) {
  if (!href) return null;
  const url = href.startsWith("http") ? href : `https://${href}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8,
        border: "1px solid #1e1e30", background: "#0e0e18", textDecoration: "none",
        transition: "all 0.2s", color: "#888aaa", flex: "1 1 140px" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; e.currentTarget.style.background = `${color}10`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e1e30"; e.currentTarget.style.color = "#888aaa"; e.currentTarget.style.background = "#0e0e18"; }}
    >
      <Icon size={14} />
      <span style={{ fontFamily: "'Inter'", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <ExternalLink size={11} style={{ marginLeft: "auto", flexShrink: 0 }} />
    </a>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div style={{ background: "#0e0e18", border: `1px solid ${color}22`, borderRadius: 12, padding: "14px 16px",
      background: `linear-gradient(135deg, #0e0e18, ${color}08)`, transition: "transform 0.2s, border-color 0.2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = `${color}44`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = `${color}22`; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <Icon size={14} color={color} />
      </div>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "'Inter'", fontSize: 11, color: "#555577", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#444466", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ─── Toggle switch ──────────────────────────────────────────────── */
function ToggleSwitch({ isOn, onToggle }) {
  return (
    <div onClick={onToggle} style={{ width: 40, height: 22, borderRadius: 11, background: isOn ? "#00ff88" : "#2a2a44",
      position: "relative", cursor: "pointer", transition: "background 0.3s" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: isOn ? "#050508" : "#888aaa",
        position: "absolute", top: 2, left: isOn ? 20 : 2, transition: "left 0.3s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
  );
}

/* ─── Edit Modal ─────────────────────────────────────────────────── */
function EditModal({ user, onClose }) {
  const dispatch = useDispatch();
  const [activeField, setActiveField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: user?.firstName || "", lastName: user?.lastName || "",
    gender: user?.gender || "", location: user?.location || "",
    birthday: user?.birthday || "", website: user?.website || "",
    github: user?.github || "", linkedin: user?.linkedin || "",
    twitter: user?.twitter || "", readme: user?.readme || "",
    work: user?.work || "", education: user?.education || "",
    skills: user?.skills || "", showRecentAC: user?.showRecentAC !== false,
    showHeatmap: user?.showHeatmap !== false, profileImage: user?.profileImage || "",
  });

  const fieldsConfig = {
    general: [
      { key: "firstName",  label: "Display Name", icon: User },
      { key: "lastName",   label: "Last Name",    icon: User },
      { key: "gender",     label: "Gender",       icon: User },
      { key: "location",   label: "Location",     icon: MapPin },
      { key: "birthday",   label: "Birthday",     icon: Calendar, type: "date" },
      { key: "website",    label: "Website",      icon: LinkIcon },
      { key: "github",     label: "GitHub",       icon: Github },
      { key: "linkedin",   label: "LinkedIn",     icon: Linkedin },
      { key: "twitter",    label: "X / Twitter",  icon: Twitter },
      { key: "readme",     label: "Bio",          icon: FileText, type: "textarea" },
    ],
    experience: [
      { key: "work",      label: "Work",      icon: Briefcase },
      { key: "education", label: "Education", icon: GraduationCap },
      { key: "skills",    label: "Skills",    icon: Wrench },
    ],
  };

  const saveToBackend = async (data) => {
    setSaving(true); setError("");
    try {
      const res = await axiosClient.put("/auth/update", data);
      const updated = res.data?.user || { ...user, ...data };
      dispatch(updateUserProfile(updated));
    } catch {
      setError("Failed to save. Please try again.");
      dispatch(updateUserProfile({ ...user, ...data }));
    } finally { setSaving(false); }
  };

  const handleToggle = async (key) => {
    const updated = { ...form, [key]: !form[key] };
    setForm(updated);
    await saveToBackend(updated);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", "profile_images");
      const res = await fetch("https://api.cloudinary.com/v1_1/dg4s9fydz/image/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.secure_url) {
        const updated = { ...form, profileImage: data.secure_url };
        setForm(updated);
        await saveToBackend(updated);
      }
    } catch { setError("Image upload failed."); }
    finally { setUploadingImage(false); }
  };

  const allFields = [...fieldsConfig.general, ...fieldsConfig.experience];
  const config = allFields.find((f) => f.key === activeField);

  const inp = {
    width: "100%", background: "#141428", border: "1px solid #2a2a44", borderRadius: 8,
    padding: "11px 14px", color: "#e2e8f0", fontFamily: "'Inter'", fontSize: 14,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,5,8,0.88)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#0e0e18", border: "1px solid #1e1e30", borderRadius: 16,
        width: 560, maxWidth: "95vw", maxHeight: "88vh", display: "flex", flexDirection: "column",
        boxShadow: "0 0 80px rgba(0,0,0,0.7)", overflow: "hidden",
      }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #2a2a44", display: "flex",
          justifyContent: "space-between", alignItems: "center", background: "#0a0a14", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {activeField && (
              <button onClick={() => setActiveField(null)}
                style={{ background: "none", border: "none", color: "#888aaa", cursor: "pointer", display: "flex", padding: 0 }}>
                <ArrowLeft size={16} />
              </button>
            )}
            <h2 style={{ margin: 0, color: "#e2e8f0", fontSize: 15, fontFamily: "'Syne'", fontWeight: 700 }}>
              {activeField ? config?.label || "Edit" : "Edit Profile"}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555577", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0 }}>&times;</button>
        </div>

        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {error && (
            <div style={{ background: "#2e0a0a", border: "1px solid #ff475733", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#ff4757", fontSize: 12, fontFamily: "'Inter'" }}>
              {error}
            </div>
          )}

          {/* FIELD EDITOR VIEW */}
          {activeField && config ? (
            <div>
              {config.type === "textarea" ? (
                <textarea value={form[activeField]} onChange={(e) => setForm({ ...form, [activeField]: e.target.value })}
                  style={{ ...inp, minHeight: 120, resize: "vertical" }} />
              ) : (
                <input type={config.type || "text"} value={form[activeField]}
                  onChange={(e) => setForm({ ...form, [activeField]: e.target.value })}
                  style={inp}
                  onFocus={(e) => { e.target.style.borderColor = "#00ff8855"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#2a2a44"; }}
                />
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button onClick={() => setActiveField(null)}
                  style={{ background: "#1a1a2e", color: "#888aaa", border: "1px solid #2a2a44", padding: "9px 18px", borderRadius: 7, cursor: "pointer", fontFamily: "'Inter'", fontSize: 13 }}>
                  Cancel
                </button>
                <button disabled={saving} onClick={async () => { await saveToBackend(form); if (!error) setActiveField(null); }}
                  style={{ background: saving ? "#1a1a2e" : "#00ff88", color: saving ? "#555" : "#050508", border: "none",
                    padding: "9px 20px", borderRadius: 7, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Syne'", fontWeight: 700, fontSize: 13 }}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            /* LIST VIEW */
            <>
              {/* Avatar upload */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
                <div style={{ position: "relative", width: 88, height: 88, borderRadius: 14, overflow: "hidden",
                  background: "#141428", border: "2px solid #2a2a44", cursor: "pointer" }}
                  onClick={() => document.getElementById("prof-upload")?.click()}>
                  {form.profileImage
                    ? <img src={form.profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><User size={36} color="#444466" /></div>
                  }
                  {uploadingImage
                    ? <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 20, height: 20, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                      </div>
                    : <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0)"; }}
                      >
                        <Camera size={18} color="#fff" style={{ opacity: 0.8 }} />
                      </div>
                  }
                  <input id="prof-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                </div>
              </div>

              {/* General */}
              {[
                { title: "General", desc: "Basic profile information.", items: fieldsConfig.general },
                { title: "Experience", desc: "Your background and expertise.", items: fieldsConfig.experience },
              ].map(({ title, desc, items }) => (
                <div key={title} style={{ marginBottom: 24 }}>
                  <h4 style={{ margin: "0 0 3px", color: "#e2e8f0", fontSize: 14, fontWeight: 600, fontFamily: "'Syne'" }}>{title}</h4>
                  <p style={{ margin: "0 0 12px", color: "#555577", fontSize: 11, fontFamily: "'Inter'" }}>{desc}</p>
                  <div style={{ background: "#141428", borderRadius: 10, border: "1px solid #2a2a44", overflow: "hidden" }}>
                    {items.map((item, idx) => (
                      <div key={item.key}>
                        <div onClick={() => setActiveField(item.key)}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 14px", cursor: "pointer", transition: "background 0.15s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#1e1e30"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <item.icon size={14} color="#555577" style={{ flexShrink: 0 }} />
                            <span style={{ fontFamily: "'Inter'", fontSize: 13, color: "#e2e8f0", flexShrink: 0 }}>{item.label}</span>
                            {form[item.key] && (
                              <span style={{ fontFamily: "'Inter'", fontSize: 12, color: "#555577", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {form[item.key]}
                              </span>
                            )}
                          </div>
                          <ChevronRight size={14} color="#444466" style={{ flexShrink: 0, marginLeft: 8 }} />
                        </div>
                        {idx < items.length - 1 && <div style={{ height: 1, background: "#1e1e30" }} />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Preferences */}
              <div style={{ marginBottom: 8 }}>
                <h4 style={{ margin: "0 0 3px", color: "#e2e8f0", fontSize: 14, fontWeight: 600, fontFamily: "'Syne'" }}>Preferences</h4>
                <p style={{ margin: "0 0 12px", color: "#555577", fontSize: 11, fontFamily: "'Inter'" }}>Control what appears on your profile.</p>
                <div style={{ background: "#141428", borderRadius: 10, border: "1px solid #2a2a44", overflow: "hidden" }}>
                  {[
                    { key: "showRecentAC", label: "Show Recent AC Problems" },
                    { key: "showHeatmap",  label: "Show Submission Heatmap" },
                  ].map((item, i) => (
                    <div key={item.key}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 14px" }}>
                        <span style={{ fontFamily: "'Inter'", fontSize: 13, color: "#e2e8f0" }}>{item.label}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#555577" }}>{form[item.key] ? "On" : "Off"}</span>
                          <ToggleSwitch isOn={form[item.key]} onToggle={() => handleToggle(item.key)} />
                        </div>
                      </div>
                      {i === 0 && <div style={{ height: 1, background: "#1e1e30" }} />}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main ProfileDashboard ──────────────────────────────────────── */
export default function ProfileDashboard() {
  const user     = useSelector((s) => s.auth?.user);
  const navigate = useNavigate();

  const [solved,      setSolved]      = useState([]);
  const [allProblems, setAllProblems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [editOpen,    setEditOpen]    = useState(false);
  const [activeTab,   setActiveTab]   = useState("overview");

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a] = await Promise.all([
          axiosClient.get("/problem/problemSolvedByUser").catch(() => ({ data: [] })),
          axiosClient.get("/problem/getAllProblem").catch(() => ({ data: [] })),
        ]);
        const solvedList = s.data?.data || s.data || [];
        const allList    = a.data?.data || a.data || [];
        setSolved(Array.isArray(solvedList) ? solvedList : []);
        setAllProblems(Array.isArray(allList) ? allList : []);

        const subs = [];
        for (const p of (Array.isArray(solvedList) ? solvedList : []).slice(0, 8)) {
          try {
            const r = await axiosClient.get(`/problem/submittedProblem/${p._id}`);
            const list = r.data?.data || r.data || [];
            if (Array.isArray(list)) subs.push(...list.map((s) => ({ ...s, problemTitle: p.title })));
          } catch {}
        }
        subs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setSubmissions(subs.slice(0, 50));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  /* ── Derived stats ── */
  const totalProblems = allProblems.length;
  const easySolved    = solved.filter((p) => p.difficulty === "easy").length;
  const medSolved     = solved.filter((p) => p.difficulty === "medium").length;
  const hardSolved    = solved.filter((p) => p.difficulty === "hard").length;
  const easyTotal     = allProblems.filter((p) => p.difficulty === "easy").length;
  const medTotal      = allProblems.filter((p) => p.difficulty === "medium").length;
  const hardTotal     = allProblems.filter((p) => p.difficulty === "hard").length;
  const acceptedSubs  = submissions.filter((s) => s.status === "accepted").length;
  const acceptRate    = submissions.length > 0 ? Math.round((acceptedSubs / submissions.length) * 100) : 0;
  const topicMap      = {};
  solved.forEach((p) => {
    const tags = Array.isArray(p.tags) ? p.tags : [p.tags].filter(Boolean);
    tags.forEach((t) => { topicMap[t] = (topicMap[t] || 0) + 1; });
  });
  const maxTopic = Math.max(...Object.values(topicMap), 1);

  const tier          = getTier(solved.length);
  const solvedCount   = useCounter(solved.length, 900);
  const joinDate      = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—";
  const showHeatmap   = user?.showHeatmap  !== false;
  const showRecentAC  = user?.showRecentAC !== false;

  const topicColors = ["#00ff88","#ffd166","#ff4757","#4ecdc4","#a78bfa","#f97316","#06b6d4","#ec4899"];

  // Shared card style
  const card = (extra = {}) => ({
    background: "#0e0e18", border: "1px solid #1e1e30", borderRadius: 16, padding: 20, ...extra,
  });

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <FontLoader />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid #1a1a2e", borderTopColor: "#00ff88", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" }}>
      <FontLoader />
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; scrollbar-width: thin; scrollbar-color: #2a2a44 #050508; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a44; border-radius: 2px; }
        a { text-decoration: none; }
      `}</style>

      {/* ── NAVBAR ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#050508cc", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1e1e30", padding: "0 24px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <NavLink to="/" style={{ display: "flex", alignItems: "center", gap: 8, color: "#e2e8f0" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Code2 size={14} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 15 }}>Code<span style={{ color: "#6366f1" }}>Arena</span></span>
        </NavLink>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => navigate("/leaderboard")}
            style={{ background: "#ffd16611", border: "1px solid #ffd16633", color: "#ffd166", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "'Syne'", fontSize: 12, fontWeight: 700 }}>
            🏆 Leaderboard
          </button>
          <button onClick={() => navigate("/")}
            style={{ background: "#1e1e30", border: "1px solid #2a2a44", color: "#888aaa", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "'Inter'", fontSize: 12 }}>
            ← Back
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px" }}>

        {/* ══════════════════════════════════════════
            ROW 1: LEFT SIDEBAR + RIGHT CONTENT
        ══════════════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, marginBottom: 20, animation: "fadeUp 0.5s ease" }}>

          {/* ── LEFT SIDEBAR ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Profile card */}
            <div style={{ ...card(), textAlign: "center" }}>
              {/* Avatar */}
              <div style={{ position: "relative", width: 88, height: 88, borderRadius: 16, overflow: "hidden",
                margin: "0 auto 14px", background: "linear-gradient(135deg,#1e2e44,#0a1a12)",
                border: "3px solid #1e2e22" }}>
                {user?.profileImage
                  ? <img src={user.profileImage} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Syne'", fontSize: 32, fontWeight: 800, color: "#00ff88" }}>
                      {(user?.firstName?.[0] || "?").toUpperCase()}
                    </div>
                }
              </div>

              {/* Name + tier */}
              <h1 style={{ fontFamily: "'Syne'", fontSize: 20, fontWeight: 800, margin: "0 0 4px", color: "#e2e8f0" }}>
                {user?.firstName || "Developer"} {user?.lastName || ""}
              </h1>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: "#555577", marginBottom: 10 }}>
                @{user?.emailId?.split("@")[0] || "dev"}
              </div>

              {/* Tier badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20,
                background: `${tier.color}15`, border: `1px solid ${tier.color}40`, marginBottom: 14 }}>
                <span style={{ fontSize: 14 }}>{tier.icon}</span>
                <span style={{ fontFamily: "'Syne'", fontSize: 11, fontWeight: 800, color: tier.color, letterSpacing: 2 }}>{tier.name}</span>
              </div>

              {/* Bio */}
              {user?.readme && (
                <p style={{ fontFamily: "'Inter'", fontSize: 13, color: "#888aaa", lineHeight: 1.6, margin: "0 0 14px", textAlign: "left" }}>
                  {user.readme}
                </p>
              )}

              {/* Meta info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16, textAlign: "left" }}>
                {user?.location && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter'", fontSize: 13, color: "#888aaa" }}>
                    <MapPin size={13} color="#555577" /> {user.location}
                  </div>
                )}
                {user?.work && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter'", fontSize: 13, color: "#888aaa" }}>
                    <Briefcase size={13} color="#555577" /> {user.work}
                  </div>
                )}
                {user?.education && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter'", fontSize: 13, color: "#888aaa" }}>
                    <GraduationCap size={13} color="#555577" /> {user.education}
                  </div>
                )}
                {user?.birthday && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter'", fontSize: 13, color: "#888aaa" }}>
                    <Calendar size={13} color="#555577" /> {user.birthday}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter'", fontSize: 13, color: "#555577" }}>
                  <Star size={13} color="#555577" /> Joined {joinDate}
                </div>
              </div>

              {/* Social links */}
              {(user?.github || user?.linkedin || user?.twitter || user?.website) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                  <SocialLink href={user?.github}   icon={Github}   label={user?.github?.replace("https://github.com/","") || user?.github}   color="#e2e8f0" />
                  <SocialLink href={user?.linkedin}  icon={Linkedin} label="LinkedIn"  color="#0a66c2" />
                  <SocialLink href={user?.twitter}   icon={Twitter}  label="X / Twitter" color="#1da1f2" />
                  <SocialLink href={user?.website}   icon={LinkIcon} label={user?.website?.replace(/https?:\/\//,"")} color="#00ff88" />
                </div>
              )}

              {/* Edit button */}
              <button onClick={() => setEditOpen(true)} style={{
                width: "100%", background: "#00ff88", color: "#050508", border: "none",
                padding: "10px", borderRadius: 9, cursor: "pointer", fontFamily: "'Syne'",
                fontSize: 13, fontWeight: 700, boxShadow: "0 0 20px rgba(0,255,136,0.25)",
                transition: "all 0.2s",
              }}
                onMouseEnter={(e) => { e.target.style.boxShadow = "0 0 30px rgba(0,255,136,0.45)"; }}
                onMouseLeave={(e) => { e.target.style.boxShadow = "0 0 20px rgba(0,255,136,0.25)"; }}
              >
                Edit Profile
              </button>
            </div>

            {/* Skills card */}
            {user?.skills && (
              <div style={card()}>
                <div style={{ fontFamily: "'Syne'", fontSize: 11, fontWeight: 700, color: "#555577", textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 }}>Skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {user.skills.split(",").map((s) => s.trim()).filter(Boolean).map((skill, i) => (
                    <span key={i} style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, padding: "4px 10px", borderRadius: 6,
                      background: `${topicColors[i % topicColors.length]}15`, border: `1px solid ${topicColors[i % topicColors.length]}30`,
                      color: topicColors[i % topicColors.length] }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Language breakdown */}
            {submissions.length > 0 && (() => {
              const langMap = {};
              submissions.forEach((s) => { if (s.language) langMap[s.language] = (langMap[s.language] || 0) + 1; });
              const maxL = Math.max(...Object.values(langMap), 1);
              const langColors = { cpp: "#4ecdc4", java: "#f97316", javascript: "#ffd166", python: "#a78bfa", c: "#06b6d4" };
              return (
                <div style={card()}>
                  <div style={{ fontFamily: "'Syne'", fontSize: 11, fontWeight: 700, color: "#555577", textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 }}>Languages</div>
                  {Object.entries(langMap).sort((a,b) => b[1]-a[1]).map(([lang, cnt]) => (
                    <SkillBar key={lang} label={lang} count={cnt} max={maxL} color={langColors[lang] || "#888aaa"} />
                  ))}
                </div>
              );
            })()}
          </div>

          {/* ── RIGHT CONTENT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Stat cards row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              <StatCard label="Problems Solved" value={solvedCount} icon={Target}   color="#00ff88" sub={`of ${totalProblems} total`} />
              <StatCard label="Accept Rate"     value={`${acceptRate}%`} icon={TrendingUp} color="#4ecdc4" sub={`${acceptedSubs} accepted`} />
              <StatCard label="Submissions"     value={submissions.length} icon={Zap}      color="#a78bfa" sub="total attempts" />
              <StatCard label="Topics Covered"  value={Object.keys(topicMap).length} icon={Award} color="#ffd166" sub="categories" />
            </div>

            {/* Rings + tab content */}
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16 }}>
              {/* Rings */}
              <div style={{ ...card(), display: "flex", flexDirection: "column", gap: 18, alignItems: "center", justifyContent: "center", minWidth: 130 }}>
                <Ring value={easySolved} max={easyTotal} color="#00ff88" label="Easy"
                  sublabel={easyTotal ? Math.round((easySolved/easyTotal)*100) : 0} />
                <Ring value={medSolved}  max={medTotal}  color="#ffd166" label="Med"
                  sublabel={medTotal  ? Math.round((medSolved/medTotal)*100)   : 0} />
                <Ring value={hardSolved} max={hardTotal} color="#ff4757" label="Hard"
                  sublabel={hardTotal ? Math.round((hardSolved/hardTotal)*100) : 0} />
              </div>

              {/* Tabs area */}
              <div style={{ ...card(), display: "flex", flexDirection: "column" }}>
                {/* Tab bar */}
                <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: "1px solid #1e1e30", paddingBottom: 0 }}>
                  {["overview","submissions","topics"].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                      fontFamily: "'Syne'", fontSize: 12, fontWeight: 700,
                      background: "transparent", border: "none", cursor: "pointer", padding: "8px 14px",
                      textTransform: "capitalize", color: activeTab === tab ? "#00ff88" : "#555577",
                      borderBottom: activeTab === tab ? "2px solid #00ff88" : "2px solid transparent",
                      marginBottom: -1, transition: "all 0.2s",
                    }}>{tab}</button>
                  ))}
                </div>

                {/* Tab: overview — heatmap */}
                {activeTab === "overview" && showHeatmap && (
                  <HeatMap submissions={submissions} />
                )}
                {activeTab === "overview" && !showHeatmap && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#555577", fontFamily: "'Inter'", fontSize: 13 }}>
                    Heatmap hidden in preferences.
                  </div>
                )}

                {/* Tab: submissions */}
                {activeTab === "submissions" && (
                  <div style={{ overflowX: "auto" }}>
                    {submissions.length === 0
                      ? <div style={{ textAlign: "center", padding: "40px 0", color: "#555577", fontSize: 13 }}>No submissions yet.</div>
                      : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              {["Problem","Status","Lang","Date"].map((h) => (
                                <th key={h} style={{ fontFamily: "'Syne'", fontSize: 10, color: "#444466", textTransform: "uppercase", letterSpacing: 2, padding: "0 10px 10px", textAlign: "left", borderBottom: "1px solid #1e1e30" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {submissions.slice(0,15).map((s, i) => (
                              <tr key={s._id || i}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#0a0a14"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                style={{ borderBottom: "1px solid #0a0a14", transition: "background 0.15s" }}
                              >
                                <td style={{ padding: "11px 10px", fontFamily: "'Inter'", fontSize: 13, color: "#e2e8f0", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {s.problemTitle || "—"}
                                </td>
                                <td style={{ padding: "11px 10px" }}>
                                  <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                                    ...(s.status === "accepted" ? { background: "#0a2e1a", color: "#00ff88" }
                                      : s.status === "wrong"   ? { background: "#2e0a0a", color: "#ff4757" }
                                      : { background: "#1e1e30", color: "#888aaa" }) }}>
                                    {s.status?.toUpperCase() || "—"}
                                  </span>
                                </td>
                                <td style={{ padding: "11px 10px", fontFamily: "'JetBrains Mono'", fontSize: 12, color: "#4ecdc4" }}>{s.language || "—"}</td>
                                <td style={{ padding: "11px 10px", fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#444466" }}>
                                  {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    }
                  </div>
                )}

                {/* Tab: topics */}
                {activeTab === "topics" && (
                  <div>
                    {Object.keys(topicMap).length === 0
                      ? <div style={{ textAlign: "center", padding: "40px 0", color: "#555577", fontSize: 13 }}>Solve problems to see topic stats.</div>
                      : Object.entries(topicMap).sort((a,b) => b[1]-a[1]).map(([topic, count], i) => (
                          <SkillBar key={topic} label={topic} count={count} max={maxTopic} color={topicColors[i % topicColors.length]} />
                        ))
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Recent AC problems */}
            {showRecentAC && solved.length > 0 && (
              <div style={card()}>
                <div style={{ fontFamily: "'Syne'", fontSize: 11, fontWeight: 700, color: "#555577", textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 }}>
                  Recent AC Problems
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 10 }}>
                  {solved.slice(0, 9).map((p) => (
                    <NavLink key={p._id} to={`/problem/${p._id}`} style={{ textDecoration: "none" }}>
                      <div style={{ background: "#050508", border: "1px solid #1e1e30", borderRadius: 10, padding: "11px 14px",
                        display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2a2a44"; e.currentTarget.style.background = "#0a0a14"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e1e30"; e.currentTarget.style.background = "#050508"; }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: "'Inter'", fontSize: 13, fontWeight: 500, color: "#e2e8f0", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.title}
                          </div>
                          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#444466", textTransform: "capitalize" }}>
                            {Array.isArray(p.tags) ? p.tags.join(", ") : p.tags}
                          </div>
                        </div>
                        <span style={{ fontFamily: "'Syne'", fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 4,
                          textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0, marginLeft: 8,
                          ...(p.difficulty === "easy"   ? { background: "#0a2e1a", color: "#00ff88" }
                            : p.difficulty === "medium" ? { background: "#2e2200", color: "#ffd166" }
                            : { background: "#2e0a0a", color: "#ff4757" }) }}>
                          {p.difficulty}
                        </span>
                      </div>
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {editOpen && <EditModal user={user} onClose={() => setEditOpen(false)} />}
    </div>
  );
}