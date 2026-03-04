import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axiosClient from "../utils/axiosClient";
import {
  Search,
  Pencil,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ChevronRight,
  Filter,
  Hash,
  Layers,
  Zap,
} from "lucide-react";

const DIFFICULTY_STYLES = {
  easy: {
    label: "Easy",
    pill: "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20",
    dot: "bg-emerald-400",
    glow: "shadow-emerald-500/10",
  },
  medium: {
    label: "Medium",
    pill: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
    dot: "bg-amber-400",
    glow: "shadow-amber-500/10",
  },
  hard: {
    label: "Hard",
    pill: "text-rose-400 bg-rose-400/10 border border-rose-400/20",
    dot: "bg-rose-400",
    glow: "shadow-rose-500/10",
  },
};

const TAG_STYLES = {
  array: "text-sky-400 bg-sky-400/10 border border-sky-400/20",
  linkedList: "text-violet-400 bg-violet-400/10 border border-violet-400/20",
  graph: "text-pink-400 bg-pink-400/10 border border-pink-400/20",
  dp: "text-orange-400 bg-orange-400/10 border border-orange-400/20",
};

const TAG_LABELS = {
  array: "Array",
  linkedList: "Linked List",
  graph: "Graph",
  dp: "Dynamic Programming",
};

export default function ProblemListForUpdate() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get("/problem/getAllProblem");
        setProblems(data);
        setFiltered(data);
      } catch (err) {
        setError("Failed to load problems. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  useEffect(() => {
    let result = problems;
    if (search.trim()) {
      result = result.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (diffFilter !== "all") {
      result = result.filter((p) => p.difficulty === diffFilter);
    }
    if (tagFilter !== "all") {
      result = result.filter((p) => p.tags === tagFilter);
    }
    setFiltered(result);
  }, [search, diffFilter, tagFilter, problems]);

  const stats = {
    total: problems.length,
    easy: problems.filter((p) => p.difficulty === "easy").length,
    medium: problems.filter((p) => p.difficulty === "medium").length,
    hard: problems.filter((p) => p.difficulty === "hard").length,
  };

  return (
    <div className="min-h-screen bg-[#0d0d12] text-white">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/3 w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0d0d12]/80 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin")}
              className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft
                size={15}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
              Admin Panel
            </button>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Pencil size={14} className="text-amber-400" />
              <span className="text-sm font-semibold text-white">
                Update Problem
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Layers size={13} />
            <span>{stats.total} problems total</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 relative">
        {/* Page heading */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Select a Problem to Edit
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Choose from the list below, then modify its details, test cases, and
            code templates.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total", value: stats.total, color: "text-white", bg: "bg-white/5 border-white/10" },
            { label: "Easy", value: stats.easy, color: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/15" },
            { label: "Medium", value: stats.medium, color: "text-amber-400", bg: "bg-amber-500/5 border-amber-500/15" },
            { label: "Hard", value: stats.hard, color: "text-rose-400", bg: "bg-rose-500/5 border-rose-500/15" },
          ].map(({ label, value, color, bg }) => (
            <div
              key={label}
              className={`rounded-xl border px-4 py-3 ${bg}`}
            >
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Difficulty filter */}
          <div className="relative">
            <Filter
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <select
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value)}
              className="pl-8 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer transition-all hover:border-white/20"
            >
              <option value="all" className="bg-[#1a1a24]">All Difficulties</option>
              <option value="easy" className="bg-[#1a1a24]">Easy</option>
              <option value="medium" className="bg-[#1a1a24]">Medium</option>
              <option value="hard" className="bg-[#1a1a24]">Hard</option>
            </select>
          </div>

          {/* Tag filter */}
          <div className="relative">
            <Hash
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="pl-8 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer transition-all hover:border-white/20"
            >
              <option value="all" className="bg-[#1a1a24]">All Tags</option>
              <option value="array" className="bg-[#1a1a24]">Array</option>
              <option value="linkedList" className="bg-[#1a1a24]">Linked List</option>
              <option value="graph" className="bg-[#1a1a24]">Graph</option>
              <option value="dp" className="bg-[#1a1a24]">DP</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400 animate-spin" />
            </div>
            <p className="text-zinc-500 text-sm">Loading problems...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <AlertCircle size={20} className="text-rose-400" />
            </div>
            <p className="text-zinc-300 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Search size={20} className="text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium">No problems found</p>
            <p className="text-zinc-600 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((problem, idx) => {
              const diff = DIFFICULTY_STYLES[problem.difficulty] || DIFFICULTY_STYLES.easy;
              const tagStyle = TAG_STYLES[problem.tags] || TAG_STYLES.array;
              const tagLabel = TAG_LABELS[problem.tags] || problem.tags;

              return (
                <div
                  key={problem._id}
                  className="group flex items-center gap-4 px-5 py-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/20 transition-all duration-200 cursor-default"
                >
                  {/* Serial number */}
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.07] flex items-center justify-center">
                    <span className="text-[11px] font-mono font-bold text-zinc-500">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Difficulty dot */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${diff.dot}`} />

                  {/* Title */}
                  <span className="flex-1 text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
                    {problem.title}
                  </span>

                  {/* Difficulty + Tag badges */}
                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${diff.pill}`}>
                      {diff.label}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${tagStyle}`}>
                      {tagLabel}
                    </span>
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => navigate(`/admin/update/${problem._id}`)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-400/40 transition-all duration-200 flex-shrink-0 group/btn"
                  >
                    <Pencil size={11} />
                    Edit
                    <ChevronRight
                      size={11}
                      className="group-hover/btn:translate-x-0.5 transition-transform"
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer count */}
        {!loading && !error && filtered.length > 0 && (
          <div className="mt-6 text-center text-xs text-zinc-600">
            Showing {filtered.length} of {problems.length} problems
          </div>
        )}
      </div>
    </div>
  );
}