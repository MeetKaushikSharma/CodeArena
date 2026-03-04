import { useState, useEffect } from "react";
import axiosClient from "../utils/axiosClient";

// ── SubmissionHistory ─────────────────────────────────────────────────────
// Props:
//   problemId     — the current problem's ID
//   newSubmission — the latest submission object passed down from ProblemPage
//                   immediately after a successful submit (no refresh needed)
const SubmissionHistory = ({ problemId, newSubmission }) => {
  const [submissions,        setSubmissions]        = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // ── Initial fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!problemId) { setError("Problem ID is missing"); setLoading(false); return; }
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/problem/submittedProblem/${problemId}`);
        const data = Array.isArray(response.data) ? response.data : [];
        setSubmissions(data);
        setError(null);
      } catch (err) {
        setError(err.response?.data || "Failed to fetch submission history");
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [problemId]);

  // ── THE FIX: whenever ProblemPage passes a new submission, prepend it ───
  // This runs instantly after submit — no refresh, no re-fetch needed.
  useEffect(() => {
    if (!newSubmission) return;

    setSubmissions((prev) => {
      // Avoid duplicates if the same submission somehow arrives twice
      const alreadyExists = prev.some((s) => s._id && s._id === newSubmission._id);
      if (alreadyExists) return prev;
      return [newSubmission, ...prev];
    });
  }, [newSubmission]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const getStatusColor = (status) => {
    switch (status) {
      case "accepted": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "wrong":    return "text-rose-400 bg-rose-400/10 border-rose-400/20";
      case "error":    return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "pending":  return "text-sky-400 bg-sky-400/10 border-sky-400/20";
      default:         return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
    }
  };

  const formatMemory = (memory) => {
    if (!memory) return "—";
    if (memory < 1024) return `${memory} KB`;
    return `${(memory / 1024).toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Just now";
    return new Date(dateString).toLocaleString();
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-indigo-400 animate-spin" />
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="mx-1 my-2 px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm">
        <span className="font-semibold">Error: </span>
        {typeof error === "string" ? error : JSON.stringify(error)}
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.07] flex items-center justify-center">
          <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-sm text-zinc-500 font-medium">No submissions yet</p>
        <p className="text-xs text-zinc-700">Submit your solution to see history here</p>
      </div>
    );
  }

  // ── Submission list ──────────────────────────────────────────────────────
  return (
    <div className="space-y-2 px-1">
      <p className="text-[11px] text-zinc-600 mb-3">{submissions.length} submission{submissions.length !== 1 ? "s" : ""}</p>

      {submissions.map((sub, index) => (
        <div key={sub._id || index}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all overflow-hidden"
        >
          {/* Row */}
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Index */}
            <span className="text-[11px] font-mono text-zinc-700 w-5 flex-shrink-0">
              {submissions.length - index}
            </span>

            {/* Status badge */}
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border flex-shrink-0 capitalize ${getStatusColor(sub.status)}`}>
              {sub.status || "pending"}
            </span>

            {/* Language */}
            <span className="text-xs font-mono text-zinc-400 flex-shrink-0">{sub.language}</span>

            {/* Test cases */}
            {sub.testCasesTotal > 0 && (
              <span className="text-xs text-zinc-600 flex-shrink-0">
                {sub.testCasesPassed}/{sub.testCasesTotal} cases
              </span>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Runtime & Memory */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-zinc-600 flex-shrink-0">
              {sub.runtime && <span>{sub.runtime}s</span>}
              {sub.memory  && <span>{formatMemory(sub.memory)}</span>}
            </div>

            {/* Date */}
            <span className="text-[11px] text-zinc-700 flex-shrink-0 hidden md:block">
              {formatDate(sub.createdAt)}
            </span>

            {/* View code button */}
            <button
              onClick={() => setSelectedSubmission(selectedSubmission?._id === sub._id ? null : sub)}
              className="text-[11px] text-zinc-500 hover:text-indigo-400 border border-white/[0.06] hover:border-indigo-500/30 px-2.5 py-1 rounded-lg transition-all flex-shrink-0"
            >
              Code
            </button>
          </div>

          {/* Expanded code view */}
          {selectedSubmission?._id === sub._id && (
            <div className="border-t border-white/[0.06]">
              {sub.errorMessage && (
                <div className="px-4 py-2 bg-rose-500/5 border-b border-rose-500/15">
                  <p className="text-xs text-rose-400 font-mono">{sub.errorMessage}</p>
                </div>
              )}
              <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-64 overflow-y-auto bg-black/20">
                <code>{sub.code}</code>
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SubmissionHistory;