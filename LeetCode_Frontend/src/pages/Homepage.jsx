import { useEffect, useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { logoutUser } from "../authSlice";
import {
  Search, ChevronDown, LogOut, Shield, CheckCircle2,
  Circle, Code2, Filter, BarChart3, Zap, BookOpen,
  Trophy, ChevronRight, X, Hash, LayoutDashboard,
} from "lucide-react";

// ── Difficulty config ─────────────────────────────────────────────
const DIFF = {
  easy:   { label: "Easy",   text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  medium: { label: "Medium", text: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/20"   },
  hard:   { label: "Hard",   text: "text-rose-400",    bg: "bg-rose-400/10",    border: "border-rose-400/20"    },
};

const TAG_COLORS = {
  array:      "text-sky-400 bg-sky-400/8 border-sky-400/20",
  linkedList: "text-violet-400 bg-violet-400/8 border-violet-400/20",
  graph:      "text-pink-400 bg-pink-400/8 border-pink-400/20",
  dp:         "text-orange-400 bg-orange-400/8 border-orange-400/20",
};

const TAG_LABELS = {
  array: "Array", linkedList: "Linked List", graph: "Graph", dp: "DP",
};

const getInitials = (user) => {
  if (!user) return "?";
  const f = user.firstName?.[0] || "";
  const l = user.lastName?.[0] || "";
  return (f + l).toUpperCase() || user.emailId?.[0]?.toUpperCase() || "?";
};

export default function Homepage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [problems,       setProblems]       = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [search,         setSearch]         = useState("");
  const [filters,        setFilters]        = useState({ difficulty: "all", tag: "all", status: "all" });
  const [profileOpen,    setProfileOpen]    = useState(false);
  const [pageReady,      setPageReady]      = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axiosClient.get("/problem/getAllProblem");
        setProblems(data);
      } catch (e) { console.error(e); }
      if (user) {
        try {
          const { data } = await axiosClient.get("/problem/problemSolvedByUser");
          setSolvedProblems(data);
        } catch (e) { console.error(e); }
      }
      setTimeout(() => setPageReady(true), 100);
    };
    load();
  }, [user]);

  const handleLogout = () => {
    setProfileOpen(false);
    dispatch(logoutUser());
    setSolvedProblems([]);
  };

  const stats = {
    total:        problems.length,
    solved:       solvedProblems.length,
    easy:         problems.filter((p) => p.difficulty === "easy").length,
    medium:       problems.filter((p) => p.difficulty === "medium").length,
    hard:         problems.filter((p) => p.difficulty === "hard").length,
    solvedEasy:   solvedProblems.filter((p) => p.difficulty === "easy").length,
    solvedMedium: solvedProblems.filter((p) => p.difficulty === "medium").length,
    solvedHard:   solvedProblems.filter((p) => p.difficulty === "hard").length,
  };
  const solvedPct = stats.total ? Math.round((stats.solved / stats.total) * 100) : 0;

  const filtered = problems.filter((p) => {
    const isSolved = solvedProblems.some((sp) => sp._id === p._id);
    if (filters.status === "solved"   && !isSolved) return false;
    if (filters.status === "unsolved" &&  isSolved) return false;
    if (filters.difficulty !== "all"  && p.difficulty !== filters.difficulty) return false;
    if (filters.tag        !== "all"  && p.tags       !== filters.tag)        return false;
    if (search.trim() && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const hasActiveFilters =
    filters.difficulty !== "all" || filters.tag !== "all" ||
    filters.status !== "all" || search.trim();

  const clearFilters = () => {
    setFilters({ difficulty: "all", tag: "all", status: "all" });
    setSearch("");
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-[#0b0b10] text-white">
      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-950/30 to-transparent" />
        <div className="absolute top-[-100px] right-[10%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]" />
        <div className="absolute top-[200px] left-[5%] w-[300px] h-[300px] bg-violet-600/4 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.012]"
          style={{ backgroundImage: "radial-gradient(circle, #818cf8 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
      </div>

      {/* ════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0b0b10]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-6" style={{ height: "60px" }}>

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Code2 size={16} className="text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              Code<span className="text-indigo-400">Arena</span>
            </span>
          </NavLink>

          {/* Center search */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems..."
              className="w-full pl-10 pr-4 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 flex-shrink-0">

            {/* ── Leaderboard pill ── */}
            <NavLink
              to="/leaderboard"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20 transition-all"
            >
              <Trophy size={12} />
              Ranks
            </NavLink>

            {isAdmin && (
              <NavLink to="/admin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 bg-rose-400/10 border border-rose-400/20 hover:bg-rose-400/20 transition-all">
                <Shield size={12} />
                Admin
              </NavLink>
            )}

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/[0.06] transition-all"
              >
                {/* ─── Profile Image/Initials ─── */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white shadow-md flex-shrink-0 border border-white/10">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    getInitials(user)
                  )}
                </div>

                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-white leading-none">{user?.firstName}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-none">
                    {isAdmin ? "Administrator" : "Member"}
                  </p>
                </div>
                <ChevronDown size={13} className={"text-zinc-500 transition-transform " + (profileOpen ? "rotate-180" : "")} />
              </button>

              {/* ── Dropdown ── */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/[0.08] bg-[#141420] shadow-2xl shadow-black/60 overflow-hidden z-50">

                  {/* User info */}
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-semibold text-white">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{user?.emailId}</p>
                  </div>

                  {/* Solved mini-stat */}
                  <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Problems Solved</span>
                    <span className="text-xs font-bold text-emerald-400">{stats.solved} / {stats.total}</span>
                  </div>

                  {/* Menu */}
                  <div className="p-1.5 space-y-0.5">

                    {/* ▶ Profile Dashboard */}
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/profile"); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-indigo-400 transition-all text-left"
                    >
                      <LayoutDashboard size={14} />
                      Profile Dashboard
                    </button>

                    {/* ▶ Leaderboard */}
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/leaderboard"); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-amber-400 transition-all text-left"
                    >
                      <Trophy size={14} />
                      Leaderboard
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => { setProfileOpen(false); navigate("/admin"); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-400/10 transition-all text-left"
                      >
                        <Shield size={14} />
                        Admin Panel
                      </button>
                    )}

                    <div className="border-t border-white/[0.06] pt-1 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-rose-400 transition-all text-left"
                      >
                        <LogOut size={14} />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative">

        {/* ════════════════════════════════════════
            PROGRESS BANNER — clicks to /profile
        ════════════════════════════════════════ */}
        {stats.solved > 0 && (
          <div
            onClick={() => navigate("/profile")}
            className={"cursor-pointer mb-6 p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 " +
              (pageReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}
            style={{ transition: "opacity 0.5s, transform 0.5s, background 0.2s, border-color 0.2s" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <BarChart3 size={15} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Your Progress</p>
                  <p className="text-xs text-zinc-500">Click to view full dashboard →</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                {[
                  { label: "Easy",   count: stats.solvedEasy,   total: stats.easy,   cls: "text-emerald-400" },
                  { label: "Medium", count: stats.solvedMedium, total: stats.medium, cls: "text-amber-400"   },
                  { label: "Hard",   count: stats.solvedHard,   total: stats.hard,   cls: "text-rose-400"    },
                ].map(({ label, count, total, cls }) => (
                  <div key={label} className="text-center hidden sm:block">
                    <p className={"text-sm font-bold " + cls}>{count}<span className="text-zinc-600 font-normal">/{total}</span></p>
                    <p className="text-[10px] text-zinc-600">{label}</p>
                  </div>
                ))}
                <div className="text-center">
                  <p className="text-lg font-bold text-indigo-400">{solvedPct}<span className="text-sm text-zinc-600">%</span></p>
                  <p className="text-[10px] text-zinc-600">Done</p>
                </div>
                <ChevronRight size={16} className="text-zinc-600" />
              </div>
            </div>
            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000"
                style={{ width: pageReady ? `${solvedPct}%` : "0%" }}
              />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            FILTERS
        ════════════════════════════════════════ */}
        <div className={"flex flex-col sm:flex-row gap-3 mb-5 transition-all duration-500 delay-100 " + (pageReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>

          <div className="relative md:hidden flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs mr-1">
              <Filter size={12} />
              <span className="hidden sm:inline">Filters</span>
            </div>

            <div className="relative">
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="appearance-none pl-3 pr-7 py-2 bg-white/[0.05] border border-white/[0.08] hover:border-white/20 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer">
                <option value="all"      className="bg-[#141420]">All Status</option>
                <option value="solved"   className="bg-[#141420]">Solved</option>
                <option value="unsolved" className="bg-[#141420]">Unsolved</option>
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>

            <div className="relative">
              <select value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                className="appearance-none pl-3 pr-7 py-2 bg-white/[0.05] border border-white/[0.08] hover:border-white/20 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer">
                <option value="all"    className="bg-[#141420]">All Difficulties</option>
                <option value="easy"   className="bg-[#141420]">Easy</option>
                <option value="medium" className="bg-[#141420]">Medium</option>
                <option value="hard"   className="bg-[#141420]">Hard</option>
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>

            <div className="relative">
              <Hash size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <select value={filters.tag} onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                className="appearance-none pl-7 pr-7 py-2 bg-white/[0.05] border border-white/[0.08] hover:border-white/20 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer">
                <option value="all"        className="bg-[#141420]">All Tags</option>
                <option value="array"      className="bg-[#141420]">Array</option>
                <option value="linkedList" className="bg-[#141420]">Linked List</option>
                <option value="graph"      className="bg-[#141420]">Graph</option>
                <option value="dp"         className="bg-[#141420]">DP</option>
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs text-rose-400 bg-rose-400/8 border border-rose-400/20 hover:bg-rose-400/15 transition-all">
                <X size={11} />
                Clear
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1.5 text-xs text-zinc-600 flex-shrink-0">
            <Zap size={11} />
            <span>{filtered.length} problem{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* ════════════════════════════════════════
            PROBLEM LIST
        ════════════════════════════════════════ */}
        <div className={"transition-all duration-500 delay-150 " + (pageReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>

          <div className="hidden sm:grid grid-cols-[48px_1fr_120px_100px_80px] gap-4 px-5 py-2.5 mb-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
            <span>#</span><span>Title</span><span>Difficulty</span><span>Tag</span>
            <span className="text-right">Status</span>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.07] flex items-center justify-center">
                <BookOpen size={20} className="text-zinc-600" />
              </div>
              <p className="text-zinc-400 font-medium">No problems found</p>
              <p className="text-zinc-600 text-sm">Try adjusting your filters</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((problem, idx) => {
                const isSolved = solvedProblems.some((sp) => sp._id === problem._id);
                const diff     = DIFF[problem.difficulty] || DIFF.easy;
                const tagCls   = TAG_COLORS[problem.tags] || TAG_COLORS.array;
                const tagLabel = TAG_LABELS[problem.tags] || problem.tags;

                return (
                  <NavLink
                    key={problem._id}
                    to={"/problem/" + problem._id}
                    className="group grid grid-cols-[48px_1fr] sm:grid-cols-[48px_1fr_120px_100px_80px] gap-4 items-center px-5 py-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] hover:border-indigo-500/15 transition-all duration-200"
                    style={{ animationDelay: idx * 20 + "ms" }}
                  >
                    <span className="text-xs font-mono text-zinc-700 group-hover:text-zinc-500 transition-colors">
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
                          {problem.title}
                        </span>
                        <ChevronRight size={13} className="text-zinc-700 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 sm:hidden">
                        <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-md border " + diff.bg + " " + diff.border + " " + diff.text}>
                          {diff.label}
                        </span>
                        <span className={"text-[10px] font-medium px-2 py-0.5 rounded-md border " + tagCls}>
                          {tagLabel}
                        </span>
                      </div>
                    </div>

                    <span className={"hidden sm:inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg border w-fit " + diff.bg + " " + diff.border + " " + diff.text}>
                      {diff.label}
                    </span>

                    <span className={"hidden sm:inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg border w-fit " + tagCls}>
                      {tagLabel}
                    </span>

                    <div className="hidden sm:flex justify-end">
                      {isSolved ? (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 size={15} />
                          <span className="text-xs font-medium">Solved</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-zinc-700 group-hover:text-zinc-500 transition-colors">
                          <Circle size={15} />
                          <span className="text-xs">Todo</span>
                        </div>
                      )}
                    </div>
                  </NavLink>
                );
              })}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-xs text-zinc-700">
                Showing {filtered.length} of {problems.length} problems
                {stats.solved > 0 && <span className="text-emerald-700"> · {stats.solved} solved</span>}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-16 border-t border-white/[0.04] py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Code2 size={11} className="text-white" />
            </div>
            <span className="text-xs text-zinc-600">Code<span className="text-indigo-600">Arena</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/profile")}
              className="text-xs text-zinc-600 hover:text-indigo-400 transition-colors flex items-center gap-1.5">
              <LayoutDashboard size={11} /> Dashboard
            </button>
            <button onClick={() => navigate("/leaderboard")}
              className="text-xs text-zinc-600 hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <Trophy size={11} /> Leaderboard
            </button>
          </div>
          <p className="text-xs text-zinc-700">Practice · Learn · Conquer</p>
        </div>
      </footer>
    </div>
  );
}