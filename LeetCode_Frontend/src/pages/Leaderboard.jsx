import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router";
import axiosClient from "../utils/axiosClient";

/* ─── Font Loader ────────────────────────────────────────────────────── */
const FontLoader = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
};

/* ─── Podium card ────────────────────────────────────────────────────── */
function PodiumCard({ user, rank, delay }) {
  const medals = ["🥇", "🥈", "🥉"];
  const heights = [180, 140, 110];
  const colors = ["#ffd166", "#c0c0d0", "#cd7f32"];
  const glows = [
    "rgba(255,209,102,0.4)",
    "rgba(192,192,208,0.3)",
    "rgba(205,127,50,0.3)",
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
        animation: `riseUp 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s both`,
      }}
    >
      {/* User info above podium */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            margin: "0 auto 8px",
            background: `linear-gradient(135deg, ${colors[rank - 1]}, ${colors[rank - 1]}88)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 800,
            color: "#050508",
            fontFamily: "'Syne', sans-serif",
            boxShadow: `0 0 30px ${glows[rank - 1]}`,
            border: `2px solid ${colors[rank - 1]}`,
          }}
        >
          {(user?.firstName?.[0] || "?").toUpperCase()}
        </div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: "#e2e8f0",
          }}
        >
          {user?.firstName || "—"}
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "#555577",
          }}
        >
          {user?.solved} solved
        </div>
      </div>

      {/* Podium block */}
      <div
        style={{
          width: 120,
          height: heights[rank - 1],
          background: `linear-gradient(180deg, ${colors[rank - 1]}22, ${colors[rank - 1]}08)`,
          border: `1px solid ${colors[rank - 1]}44`,
          borderRadius: "8px 8px 0 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 16,
          boxShadow: `0 0 40px ${glows[rank - 1]}, inset 0 1px 0 ${colors[rank - 1]}44`,
        }}
      >
        <span style={{ fontSize: 28 }}>{medals[rank - 1]}</span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 28,
            fontWeight: 700,
            color: colors[rank - 1],
            textShadow: `0 0 20px ${colors[rank - 1]}`,
            marginTop: 8,
          }}
        >
          #{rank}
        </span>
      </div>
    </div>
  );
}

/* ─── Rank badge ─────────────────────────────────────────────────────── */
function RankBadge({ rank }) {
  if (rank === 1) return <span style={{ fontSize: 18 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: 18 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: 18 }}>🥉</span>;
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14,
        fontWeight: 700,
        color: rank <= 10 ? "#a78bfa" : "#555577",
      }}
    >
      #{rank}
    </span>
  );
}

/* ─── Tier badge ─────────────────────────────────────────────────────── */
function Tier({ solved }) {
  let tier, color, bg;
  if (solved >= 200) {
    tier = "LEGEND";
    color = "#ffd166";
    bg = "#2e2200";
  } else if (solved >= 100) {
    tier = "EXPERT";
    color = "#a78bfa";
    bg = "#1a1030";
  } else if (solved >= 50) {
    tier = "ADVANCED";
    color = "#4ecdc4";
    bg = "#0a1e1e";
  } else if (solved >= 20) {
    tier = "SKILLED";
    color = "#00ff88";
    bg = "#0a2e1a";
  } else if (solved >= 5) {
    tier = "ROOKIE";
    color = "#888aaa";
    bg = "#1a1a2e";
  } else {
    tier = "NEWBIE";
    color = "#444466";
    bg = "#0e0e18";
  }

  return (
    <span
      style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1.5,
        padding: "2px 8px",
        borderRadius: 4,
        background: bg,
        color,
        border: `1px solid ${color}33`,
      }}
    >
      {tier}
    </span>
  );
}

/* ─── Score bar ──────────────────────────────────────────────────────── */
function ScoreBar({ value, max, color = "#00ff88" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}
    >
      <div
        style={{
          flex: 1,
          height: 4,
          background: "#1a1a2e",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 2,
            boxShadow: `0 0 6px ${color}`,
            transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color,
          minWidth: 24,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ─── Main Leaderboard Component ─────────────────────────────────────── */
export default function Leaderboard() {
  const currentUser = useSelector(
    (s) => s.user?.user || s.auth?.user || s.user,
  );
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosClient.get("/leaderboard");
        const data = (res.data || []).map((u, i) => ({ ...u, rank: i + 1 }));
        setUsers(data);
        const me = data.find((u) => u._id === currentUser?._id);
        if (me) setMyRank(me.rank);
      } catch (err) {
        console.error("Leaderboard API not implemented yet:", err);
        // Fallback mock data for UI preview
        const mock = Array.from({ length: 30 }, (_, i) => ({
          _id: `mock_${i}`,
          firstName:
            [
              "Alice",
              "Bob",
              "Charlie",
              "Diana",
              "Evan",
              "Fiona",
              "George",
              "Hannah",
            ][i % 8] + (i > 7 ? ` ${i}` : ""),
          emailId: `user${i + 1}@example.com`,
          solved: Math.max(0, 150 - i * 4 - Math.floor(Math.random() * 5)),
          easy: Math.floor(Math.random() * 30) + 10,
          medium: Math.floor(Math.random() * 20) + 5,
          hard: Math.floor(Math.random() * 10),
          rank: i + 1,
        }));
        setUsers(mock);
        setMyRank(8);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?._id]);

  const maxSolved = users[0]?.solved || 1;

  const filtered = users.filter((u) => {
    const matchSearch =
      u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      u.emailId?.toLowerCase().includes(search.toLowerCase());
    if (filter === "top10") return u.rank <= 10 && matchSearch;
    if (filter === "top50") return u.rank <= 50 && matchSearch;
    return matchSearch;
  });

  const top3 = users.slice(0, 3);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050508",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FontLoader />
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "2px solid #1a1a2e",
              borderTopColor: "#ffd166",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: "#555577",
              fontSize: 13,
            }}
          >
            Loading rankings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050508",
        color: "#e2e8f0",
        fontFamily: "'Syne', sans-serif",
      }}
    >
      <FontLoader />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes riseUp { from { opacity: 0; transform: translateY(60px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes scanline {
          0% { background-position: 0 0; }
          100% { background-position: 0 100vh; }
        }
        * { box-sizing: border-box; scrollbar-width: thin; scrollbar-color: #2a2a44 #050508; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #050508; }
        ::-webkit-scrollbar-thumb { background: #2a2a44; border-radius: 2px; }
        .row-hover:hover { background: #0a0a14 !important; cursor: pointer; }
        .me-row { background: rgba(255,209,102,0.05) !important; border-left: 3px solid #ffd166 !important; }
      `}</style>

      {/* Scanline effect */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.03,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, #ffffff 2px, #ffffff 3px)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* Noise */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          opacity: 0.025,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 48,
            animation: "fadeUp 0.5s ease",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "#555577",
                letterSpacing: 4,
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              Global Rankings
            </div>
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 40,
                fontWeight: 800,
                margin: 0,
                background: "linear-gradient(135deg, #ffd166, #ff4757)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Leaderboard
            </h1>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {myRank && (
              <div
                style={{
                  background: "#0e0e18",
                  border: "1px solid #ffd16633",
                  borderRadius: 12,
                  padding: "12px 20px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: "#555577",
                    marginBottom: 4,
                  }}
                >
                  Your Rank
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#ffd166",
                  }}
                >
                  #{myRank}
                </div>
              </div>
            )}
            <NavLink
              to="/profile"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: "#00ff88",
                textDecoration: "none",
                padding: "12px 20px",
                border: "1px solid #00ff8833",
                borderRadius: 12,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#00ff8811";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              ← Profile
            </NavLink>
          </div>
        </div>

        {/* ── PODIUM ── */}
        {top3.length >= 3 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              gap: 8,
              marginBottom: 60,
              padding: "40px 0 0",
              animation: "fadeUp 0.5s ease 0.1s both",
            }}
          >
            {/* Silver — 2nd */}
            <div style={{ marginBottom: -0 }}>
              <PodiumCard user={top3[1]} rank={2} delay={0.3} />
            </div>
            {/* Gold — 1st (tallest, center) */}
            <div style={{ marginBottom: 0 }}>
              <PodiumCard user={top3[0]} rank={1} delay={0.1} />
            </div>
            {/* Bronze — 3rd */}
            <div style={{ marginBottom: 0 }}>
              <PodiumCard user={top3[2]} rank={3} delay={0.5} />
            </div>
          </div>
        )}

        {/* ── FILTERS ── */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
            animation: "fadeUp 0.5s ease 0.2s both",
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍  Search by name or email..."
              style={{
                width: "100%",
                background: "#0e0e18",
                border: "1px solid #2a2a44",
                borderRadius: 10,
                padding: "10px 16px",
                color: "#e2e8f0",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#ffd16666";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#2a2a44";
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["all", "top10", "top50"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "10px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  border: "1px solid",
                  transition: "all 0.2s",
                  borderColor: filter === f ? "#ffd166" : "#2a2a44",
                  background: filter === f ? "#2e2200" : "#0e0e18",
                  color: filter === f ? "#ffd166" : "#555577",
                }}
              >
                {f === "all" ? "All" : f === "top10" ? "Top 10" : "Top 50"}
              </button>
            ))}
          </div>
        </div>

        {/* ── STATS BANNER ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 24,
            animation: "fadeUp 0.5s ease 0.25s both",
          }}
        >
          {[
            { label: "Total Coders", value: users.length, color: "#4ecdc4" },
            {
              label: "Total Solved",
              value: users.reduce((s, u) => s + (u.solved || 0), 0),
              color: "#00ff88",
            },
            {
              label: "Top Score",
              value: users[0]?.solved || 0,
              color: "#ffd166",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: "#0e0e18",
                border: `1px solid ${color}22`,
                borderRadius: 12,
                padding: "16px 20px",
                background: `linear-gradient(135deg, #0e0e18, ${color}08)`,
              }}
            >
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 11,
                  color: "#555577",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  marginBottom: 6,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 24,
                  fontWeight: 700,
                  color,
                }}
              >
                {value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* ── TABLE ── */}
        <div
          style={{
            background: "#0e0e18",
            border: "1px solid #1e1e30",
            borderRadius: 16,
            overflow: "hidden",
            animation: "fadeUp 0.5s ease 0.3s both",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "60px 1fr 100px 200px 100px 80px",
              padding: "16px 24px",
              borderBottom: "1px solid #1e1e30",
              background: "#0a0a14",
            }}
          >
            {["Rank", "Developer", "Tier", "Progress", "Solved", "Score"].map(
              (h) => (
                <div
                  key={h}
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#444466",
                    textTransform: "uppercase",
                    letterSpacing: 2,
                  }}
                >
                  {h}
                </div>
              ),
            )}
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
                color: "#555577",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
              }}
            >
              No results found
            </div>
          ) : (
            filtered.map((u, i) => {
              const isMe = u._id === currentUser?._id;
              const isTop3 = u.rank <= 3;
              return (
                <div
                  key={u._id}
                  className={`row-hover ${isMe ? "me-row" : ""}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr 100px 200px 100px 80px",
                    padding: "16px 24px",
                    alignItems: "center",
                    borderBottom: "1px solid #0a0a14",
                    background: isMe ? "rgba(255,209,102,0.03)" : "transparent",
                    borderLeft: isMe
                      ? "3px solid #ffd166"
                      : "3px solid transparent",
                    transition: "background 0.2s",
                    animation: `fadeUp 0.4s ease ${Math.min(i * 0.03, 0.5)}s both`,
                  }}
                >
                  {/* Rank */}
                  <div>
                    <RankBadge rank={u.rank} />
                  </div>

                  {/* User */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: isTop3
                          ? `linear-gradient(135deg, ${["#ffd166", "#c0c0d0", "#cd7f32"][u.rank - 1]}, ${["#ffd166", "#c0c0d0", "#cd7f32"][u.rank - 1]}88)`
                          : "linear-gradient(135deg, #1e1e30, #2a2a44)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 800,
                        color: isTop3 ? "#050508" : "#888aaa",
                        fontFamily: "'Syne', sans-serif",
                        boxShadow: isTop3
                          ? `0 0 16px ${["rgba(255,209,102,0.4)", "rgba(192,192,208,0.3)", "rgba(205,127,50,0.3)"][u.rank - 1]}`
                          : "none",
                      }}
                    >
                      {(u.firstName?.[0] || "?").toUpperCase()}
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "'Syne', sans-serif",
                          fontSize: 14,
                          fontWeight: 700,
                          color: isMe ? "#ffd166" : "#e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {u.firstName}
                        {isMe && (
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 10,
                              color: "#ffd166",
                              background: "#2e2200",
                              padding: "1px 6px",
                              borderRadius: 4,
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          color: "#444466",
                        }}
                      >
                        {u.emailId?.split("@")[0]}
                      </div>
                    </div>
                  </div>

                  {/* Tier */}
                  <div>
                    <Tier solved={u.solved} />
                  </div>

                  {/* Progress bar */}
                  <div>
                    <ScoreBar
                      max={maxSolved}
                      color={
                        u.rank === 1
                          ? "#ffd166"
                          : u.rank === 2
                            ? "#c0c0d0"
                            : u.rank === 3
                              ? "#cd7f32"
                              : u.rank <= 10
                                ? "#a78bfa"
                                : "#00ff88"
                      }
                    />
                  </div>

                  {/* Solved count */}
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#e2e8f0",
                      marginLeft: "25px",
                    }}
                  >
                    {u.solved}
                  </div>

                  {/* Score */}
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      color: "#555577",
                    }}
                  >
                    {Math.round(
                      u.solved * 10 + (u.hard || 0) * 30 + (u.medium || 0) * 10,
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── MY RANK STICKY CARD (if not visible) ── */}
        {myRank && myRank > 10 && (
          <div
            style={{
              marginTop: 24,
              background: "#0e0e18",
              border: "1px solid #ffd16633",
              borderRadius: 12,
              padding: "16px 24px",
              display: "grid",
              gridTemplateColumns: "60px 1fr 100px 200px 100px 80px",
              alignItems: "center",
              boxShadow: "0 0 30px rgba(255,209,102,0.1)",
              animation: "fadeUp 0.5s ease 0.4s both",
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                fontWeight: 700,
                color: "#ffd166",
              }}
            >
              #{myRank}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #ffd166, #ff4757)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#050508",
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                {(currentUser?.firstName?.[0] || "?").toUpperCase()}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#ffd166",
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  {currentUser?.firstName}{" "}
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      background: "#2e2200",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    YOU
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: "#444466",
                  }}
                >
                  {currentUser?.emailId?.split("@")[0]}
                </div>
              </div>
            </div>
            <div>
              <Tier
                solved={
                  users.find((u) => u._id === currentUser?._id)?.solved || 0
                }
              />
            </div>
            <div>
              <ScoreBar
                value={
                  users.find((u) => u._id === currentUser?._id)?.solved || 0
                }
                max={maxSolved}
                color="#ffd166"
              />
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 16,
                fontWeight: 700,
                color: "#ffd166",
              }}
            >
              {users.find((u) => u._id === currentUser?._id)?.solved || 0}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "#555577",
              }}
            >
              Your rank
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: 48,
            textAlign: "center",
            borderTop: "1px solid #1e1e30",
            paddingTop: 24,
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: "#333355",
            }}
          >
            Rankings update in real-time · LEETGRIND ·{" "}
            {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
}
