import { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useParams, NavLink } from "react-router";
import axiosClient from "../utils/axiosClient";
import SubmissionHistory from "../components/SubmissionHistory";
import ChatAi from "../components/ChatAi";
import Editorial from "../components/Editorial";
import {
  Play, Send, Code2, FlaskConical, Trophy,
  BookOpen, Lightbulb, History, Bot, CheckCircle2, XCircle,
  Clock, Cpu, ChevronDown, Loader2,
  AlignLeft, RotateCcw,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────
const getCode = (entry) => entry?.initialCode || entry?.intialCode || "";

const STORAGE_KEY = (problemId, lang) => `codearena:code:${problemId}:${lang}`;
const saveCode  = (pid, lang, code) => { try { localStorage.setItem(STORAGE_KEY(pid, lang), code); } catch {} };
const loadCode  = (pid, lang)       => { try { return localStorage.getItem(STORAGE_KEY(pid, lang)); } catch { return null; } };
const clearCode = (pid, lang)       => { try { localStorage.removeItem(STORAGE_KEY(pid, lang)); } catch {} };

const DIFF = {
  easy:   { label: "Easy",   cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  medium: { label: "Medium", cls: "text-amber-400 bg-amber-400/10 border-amber-400/20"       },
  hard:   { label: "Hard",   cls: "text-rose-400 bg-rose-400/10 border-rose-400/20"           },
};
const TAG_CLS = {
  array:      "text-sky-400 bg-sky-400/8 border-sky-400/20",
  linkedList: "text-violet-400 bg-violet-400/8 border-violet-400/20",
  graph:      "text-pink-400 bg-pink-400/8 border-pink-400/20",
  dp:         "text-orange-400 bg-orange-400/8 border-orange-400/20",
};
const LANG_META = {
  cpp:        { label: "C++",        dot: "bg-sky-400",     monaco: "cpp"        },
  c:          { label: "C",          dot: "bg-blue-400",    monaco: "c"          },
  java:       { label: "Java",       dot: "bg-orange-400",  monaco: "java"       },
  rust:       { label: "Rust",       dot: "bg-orange-500",  monaco: "rust"       },
  kotlin:     { label: "Kotlin",     dot: "bg-violet-400",  monaco: "kotlin"     },
  swift:      { label: "Swift",      dot: "bg-rose-400",    monaco: "swift"      },
  csharp:     { label: "C#",         dot: "bg-indigo-400",  monaco: "csharp"     },
  javascript: { label: "JavaScript", dot: "bg-yellow-400",  monaco: "javascript" },
  typescript: { label: "TypeScript", dot: "bg-emerald-400", monaco: "typescript" },
  python:     { label: "Python 3",   dot: "bg-green-400",   monaco: "python"     },
  python2:    { label: "Python 2",   dot: "bg-green-300",   monaco: "python"     },
  ruby:       { label: "Ruby",       dot: "bg-pink-400",    monaco: "ruby"       },
  php:        { label: "PHP",        dot: "bg-purple-400",  monaco: "php"        },
  perl:       { label: "Perl",       dot: "bg-slate-400",   monaco: "perl"       },
  bash:       { label: "Bash",       dot: "bg-teal-400",    monaco: "shell"      },
  r:          { label: "R",          dot: "bg-cyan-400",    monaco: "r"          },
};

const LEFT_TABS = [
  { id: "description", label: "Description", icon: BookOpen  },
  { id: "editorial",   label: "Editorial",   icon: Lightbulb },
  { id: "solutions",   label: "Solutions",   icon: AlignLeft },
  { id: "submissions", label: "Submissions", icon: History   },
  { id: "chatAI",      label: "AI Chat",     icon: Bot       },
];
const RIGHT_TABS = [
  { id: "code",     label: "Code",     icon: Code2        },
  { id: "testcase", label: "Testcase", icon: FlaskConical },
  { id: "result",   label: "Result",   icon: Trophy       },
];

// ── Resizable hook ────────────────────────────────────────────────
function useResizable(initial = 48, min = 28, max = 72) {
  const [pct, setPct]    = useState(initial);
  const dragging         = useRef(false);
  const containerRef     = useRef(null);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor     = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const rect   = containerRef.current.getBoundingClientRect();
      const newPct = ((e.clientX - rect.left) / rect.width) * 100;
      setPct(Math.min(max, Math.max(min, newPct)));
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor     = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [min, max]);

  return { pct, containerRef, onMouseDown };
}

// ── Sub-components ────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-0.5 px-3 border-b border-white/[0.06] bg-[#0f0f17] overflow-x-auto flex-shrink-0" style={{ height: 44 }}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const on = active === id;
        return (
          <button key={id} onClick={() => onChange(id)}
            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap " +
              (on ? "text-white bg-white/[0.08]" : "text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04]")}>
            <Icon size={12} className={on ? "text-indigo-400" : ""} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function DiffBadge({ difficulty }) {
  const d = DIFF[difficulty] || DIFF.easy;
  return <span className={"text-xs font-semibold px-2.5 py-1 rounded-lg border " + d.cls}>{d.label}</span>;
}

function ExampleBlock({ example, index }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02]">
        <span className="text-xs font-semibold text-zinc-500">Example {index + 1}</span>
      </div>
      <div className="p-4 space-y-2 font-mono text-xs">
        <div className="flex gap-2"><span className="text-zinc-600 w-20 flex-shrink-0">Input</span>   <span className="text-zinc-200 bg-white/[0.04] px-2 py-0.5 rounded flex-1">{example.input}</span></div>
        <div className="flex gap-2"><span className="text-zinc-600 w-20 flex-shrink-0">Output</span>  <span className="text-zinc-200 bg-white/[0.04] px-2 py-0.5 rounded flex-1">{example.output}</span></div>
        {example.explanation && <div className="flex gap-2"><span className="text-zinc-600 w-20 flex-shrink-0">Explain</span><span className="text-zinc-400 flex-1 leading-relaxed">{example.explanation}</span></div>}
      </div>
    </div>
  );
}

function TestCaseResult({ tc, index }) {
  const passed = tc.status_id === 3 || tc.status_id === "3";
  return (
    <div className={"rounded-xl border overflow-hidden " + (passed ? "border-emerald-500/20 bg-emerald-500/3" : "border-rose-500/20 bg-rose-500/3")}>
      <div className={"flex items-center justify-between px-4 py-2.5 border-b " + (passed ? "border-emerald-500/15 bg-emerald-500/5" : "border-rose-500/15 bg-rose-500/5")}>
        <span className="text-xs font-mono text-zinc-500">Case #{index + 1}</span>
        <div className={"flex items-center gap-1.5 text-xs font-semibold " + (passed ? "text-emerald-400" : "text-rose-400")}>
          {passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {passed ? "Passed" : "Failed"}
        </div>
      </div>
      <div className="p-4 space-y-2 font-mono text-xs">
        {tc.stdin           && <div className="flex gap-2"><span className="text-zinc-600 w-20 flex-shrink-0">Input</span>   <span className="text-zinc-300 bg-white/[0.04] px-2 py-0.5 rounded flex-1 break-all">{tc.stdin}</span></div>}
        {tc.expected_output && <div className="flex gap-2"><span className="text-zinc-600 w-20 flex-shrink-0">Expected</span><span className="text-zinc-300 bg-white/[0.04] px-2 py-0.5 rounded flex-1 break-all">{tc.expected_output}</span></div>}
        {tc.stdout          && <div className="flex gap-2"><span className="text-zinc-600 w-20 flex-shrink-0">Output</span>  <span className={"px-2 py-0.5 rounded flex-1 break-all " + (passed ? "text-emerald-300 bg-emerald-500/8" : "text-rose-300 bg-rose-500/8")}>{tc.stdout}</span></div>}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function ProblemPage() {
  const { problemId } = useParams();

  const [problem,          setProblem]          = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("cpp");
  const [code,             setCode]             = useState("");
  const [loading,          setLoading]          = useState(false);
  const [runResult,        setRunResult]        = useState(null);
  const [submitResult,     setSubmitResult]     = useState(null);
  const [activeLeftTab,    setActiveLeftTab]    = useState("description");
  const [activeRightTab,   setActiveRightTab]   = useState("code");
  const [langDropOpen,     setLangDropOpen]     = useState(false);

  // ── THE FIX: track the most recent submission and pass it to SubmissionHistory
  // SubmissionHistory prepends it instantly — no re-fetch, no refresh needed
  const [lastSubmission, setLastSubmission] = useState(null);

  const [chatMessages, setChatMessages] = useState(null);

  const editorRef   = useRef(null);
  const langDropRef = useRef(null);
  const saveTimer   = useRef(null);
  const { pct, containerRef, onMouseDown } = useResizable();

  useEffect(() => {
    const h = (e) => { if (langDropRef.current && !langDropRef.current.contains(e.target)) setLangDropOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Fetch problem ─────────────────────────────────────────────
  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const { data } = await axiosClient.get(`/problem/problemById/${problemId}`);
        if (!data) throw new Error("No data");

        const preferredLang = data.startCode?.[0]?.language || "cpp";
        setSelectedLanguage(preferredLang);

        const saved   = loadCode(problemId, preferredLang);
        const starter = getCode(data.startCode?.find((sc) => sc.language === preferredLang));
        setCode(saved ?? starter ?? "// No starter code for this language");

        setProblem(data);
        setChatMessages([{
          role: "model",
          parts: [{ text: `Hey! I'm your AI assistant for **${data.title}**.\n\nI can give hints, explain the approach, review your code, or walk you through the solution.\n\nWhat do you need?` }],
        }]);
      } catch (err) {
        console.error("[ProblemPage] fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [problemId]);

  // ── Language switch ───────────────────────────────────────────
  useEffect(() => {
    if (!problem?.startCode) return;
    const saved   = loadCode(problemId, selectedLanguage);
    const starter = getCode(problem.startCode.find((sc) => sc.language === selectedLanguage));
    setCode(saved ?? starter ?? "// No starter code for this language");
  }, [selectedLanguage, problem]);

  // ── Debounced auto-save ───────────────────────────────────────
  const handleCodeChange = (value) => {
    const v = value || "";
    setCode(v);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveCode(problemId, selectedLanguage, v), 600);
  };

  // ── Run ───────────────────────────────────────────────────────
  const handleRun = async () => {
    setLoading(true); setRunResult(null);
    try {
      const { data } = await axiosClient.post(`/submission/run/${problemId}`, { code, language: selectedLanguage });
      setRunResult(data);
      setActiveRightTab("testcase");
    } catch (err) {
      setRunResult({ success: false, error: err.response?.data?.error || "Server error", testCases: [] });
      setActiveRightTab("testcase");
    } finally { setLoading(false); }
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmitCode = async () => {
    setLoading(true); setSubmitResult(null);
    try {
      const { data } = await axiosClient.post(`/submission/submit/${problemId}`, { code, language: selectedLanguage });
      setSubmitResult(data);
      setActiveRightTab("result");

      // ── THE FIX: build a submission object from the response and pass it
      // to SubmissionHistory immediately — no re-fetch required
      const newSub = {
        // Use the _id from backend if returned, else generate a temp one
        _id:             data._id             || data.submissionId || `temp_${Date.now()}`,
        status:          data.accepted ? "accepted" : "wrong",
        language:        selectedLanguage,
        code:            code,
        runtime:         data.runtime         || null,
        memory:          data.memory          || null,
        testCasesPassed: data.passedTestCases  || 0,
        testCasesTotal:  data.totalTestCases   || 0,
        errorMessage:    data.error            || "",
        createdAt:       new Date().toISOString(),
      };
      setLastSubmission(newSub);

    } catch (err) {
      setSubmitResult({ accepted: false, error: err.response?.data?.error || "Server error", passedTestCases: 0, totalTestCases: 0 });
      setActiveRightTab("result");
    } finally { setLoading(false); }
  };

  // ── Reset ─────────────────────────────────────────────────────
  const resetCode = () => {
    if (!problem?.startCode) return;
    const starter = getCode(problem.startCode.find((sc) => sc.language === selectedLanguage));
    setCode(starter ?? "");
    clearCode(problemId, selectedLanguage);
  };

  if (loading && !problem) {
    return (
      <div className="h-screen bg-[#0b0b10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400 animate-spin" />
          </div>
          <p className="text-zinc-500 text-sm">Loading problem…</p>
        </div>
      </div>
    );
  }

  const tagCls   = TAG_CLS[problem?.tags]      || "text-sky-400 bg-sky-400/8 border-sky-400/20";
  const langMeta = LANG_META[selectedLanguage] || LANG_META.cpp;

  return (
    <div className="h-screen bg-[#0b0b10] text-white flex flex-col overflow-hidden">

      {/* Navbar */}
      <header className="flex-shrink-0 h-12 border-b border-white/[0.06] bg-[#0b0b10]/95 backdrop-blur-xl flex items-center justify-between px-4 gap-4 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <NavLink to="/" className="flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/30">
              <Code2 size={14} className="text-white" />
            </div>
          </NavLink>
          <div className="h-4 w-px bg-white/10 flex-shrink-0" />
          {problem && (
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-sm font-semibold text-white truncate max-w-xs">{problem.title}</span>
              <DiffBadge difficulty={problem.difficulty} />
              <span className={"text-[10px] font-medium px-2 py-0.5 rounded-lg border hidden sm:inline " + tagCls}>{problem.tags}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleRun} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Run
          </button>
          <button onClick={handleSubmitCode} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Submit
          </button>
        </div>
      </header>

      {/* Resizable body */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">

        {/* LEFT PANEL */}
        <div className="flex flex-col overflow-hidden bg-[#0d0d14]" style={{ width: pct + "%" }}>
          <TabBar tabs={LEFT_TABS} active={activeLeftTab} onChange={setActiveLeftTab} />

          <div className="flex-1 overflow-hidden relative">

            <div className={"absolute inset-0 overflow-y-auto " + (activeLeftTab === "description" ? "" : "hidden")}>
              {problem && (
                <div className="p-5 space-y-6">
                  <div>
                    <h1 className="text-xl font-bold text-white mb-3">{problem.title}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <DiffBadge difficulty={problem.difficulty} />
                      <span className={"text-xs font-medium px-2.5 py-1 rounded-lg border " + tagCls}>{problem.tags}</span>
                    </div>
                  </div>
                  <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap border-b border-white/[0.05] pb-6">{problem.description}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Examples</h3>
                    <div className="space-y-3">
                      {problem.visibleTestCases?.map((ex, i) => <ExampleBlock key={i} example={ex} index={i} />)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={"absolute inset-0 overflow-y-auto p-5 " + (activeLeftTab === "editorial" ? "" : "hidden")}>
              {problem && <><h2 className="text-base font-bold text-white mb-4">Editorial</h2><Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration} /></>}
            </div>

            <div className={"absolute inset-0 overflow-y-auto p-5 " + (activeLeftTab === "solutions" ? "" : "hidden")}>
              {problem && (
                <>
                  <h2 className="text-base font-bold text-white mb-4">Reference Solutions</h2>
                  {problem.referenceSolution?.length ? (
                    <div className="space-y-4">
                      {problem.referenceSolution.map((sol, i) => (
                        <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                            <div className={"w-2 h-2 rounded-full " + (LANG_META[sol.language]?.dot || "bg-zinc-400")} />
                            <span className="text-xs font-semibold text-zinc-300">{LANG_META[sol.language]?.label || sol.language}</span>
                          </div>
                          <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed"><code>{sol.completeCode}</code></pre>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.07] flex items-center justify-center"><Trophy size={18} className="text-zinc-600" /></div>
                      <p className="text-sm text-zinc-500">Solve the problem to unlock solutions</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Submissions tab — passes lastSubmission for instant update ── */}
            <div className={"absolute inset-0 overflow-y-auto p-5 " + (activeLeftTab === "submissions" ? "" : "hidden")}>
              {problem && (
                <>
                  <h2 className="text-base font-bold text-white mb-4">My Submissions</h2>
                  <SubmissionHistory
                    problemId={problemId}
                    newSubmission={lastSubmission}
                  />
                </>
              )}
            </div>

            <div className={"absolute inset-0 flex flex-col " + (activeLeftTab === "chatAI" ? "" : "hidden")}>
              {problem && chatMessages !== null && (
                <ChatAi problem={problem} messages={chatMessages} setMessages={setChatMessages} />
              )}
            </div>

          </div>
        </div>

        {/* DRAG HANDLE */}
        <div onMouseDown={onMouseDown}
          className="flex-shrink-0 w-[5px] bg-transparent hover:bg-indigo-500/30 active:bg-indigo-500/50 cursor-col-resize transition-colors flex items-center justify-center group relative z-20">
          <div className="w-[3px] h-8 rounded-full bg-white/[0.08] group-hover:bg-indigo-400/60 transition-colors" />
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col overflow-hidden bg-[#0b0b10] flex-1">
          <TabBar tabs={RIGHT_TABS} active={activeRightTab} onChange={setActiveRightTab} />

          {activeRightTab === "code" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[#0f0f17]">
                <div className="relative" ref={langDropRef}>
                  <button onClick={() => setLangDropOpen((p) => !p)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:border-white/20 text-xs font-medium text-zinc-300 transition-all">
                    <div className={"w-2 h-2 rounded-full " + langMeta.dot} />
                    {langMeta.label}
                    <ChevronDown size={12} className={"text-zinc-500 transition-transform " + (langDropOpen ? "rotate-180" : "")} />
                  </button>
                  {langDropOpen && (
                    <div className="absolute top-full mt-1.5 left-0 w-36 rounded-xl border border-white/[0.08] bg-[#141420] shadow-2xl shadow-black/60 overflow-hidden z-40">
                      {Object.entries(LANG_META).map(([key, meta]) => (
                        <button key={key} onClick={() => { setSelectedLanguage(key); setLangDropOpen(false); }}
                          className={"w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs transition-all " +
                            (selectedLanguage === key ? "text-white bg-indigo-500/20 font-semibold" : "text-zinc-400 hover:bg-white/[0.06] hover:text-white")}>
                          <div className={"w-2 h-2 rounded-full " + meta.dot} />
                          {meta.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 inline-block" />
                    Auto-saved
                  </span>
                  <button onClick={resetCode}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] transition-all">
                    <RotateCcw size={11} /> Reset
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <Editor
                  height="100%"
                  language={langMeta.monaco}
                  value={code}
                  onChange={handleCodeChange}
                  onMount={(editor) => { editorRef.current = editor; }}
                  theme="vs-dark"
                  options={{
                    fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontLigatures: true, minimap: { enabled: false }, scrollBeyondLastLine: false,
                    automaticLayout: true, tabSize: 2, insertSpaces: true, wordWrap: "on",
                    lineNumbers: "on", glyphMargin: false, folding: true, lineDecorationsWidth: 8,
                    lineNumbersMinChars: 3, renderLineHighlight: "gutter", cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on", smoothScrolling: true, mouseWheelZoom: true,
                    padding: { top: 16, bottom: 16 },
                  }}
                />
              </div>
            </div>
          )}

          {activeRightTab === "testcase" && (
            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <Loader2 size={22} className="animate-spin text-indigo-400" />
                  <p className="text-xs text-zinc-500">Running test cases…</p>
                </div>
              ) : runResult ? (
                <div className="space-y-4">
                  <div className={"flex items-center gap-3 px-4 py-3 rounded-xl border " + (runResult.success ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20")}>
                    {runResult.success ? <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" /> : <XCircle size={16} className="text-rose-400 flex-shrink-0" />}
                    <p className={"text-sm font-semibold flex-1 " + (runResult.success ? "text-emerald-300" : "text-rose-300")}>
                      {runResult.success ? "All test cases passed!" : "Some test cases failed"}
                    </p>
                    {runResult.success && (
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        {runResult.runtime && <span className="flex items-center gap-1"><Clock size={11} />{runResult.runtime}s</span>}
                        {runResult.memory  && <span className="flex items-center gap-1"><Cpu   size={11} />{runResult.memory} KB</span>}
                      </div>
                    )}
                  </div>
                  {runResult.testCases?.length > 0 && (
                    <div className="space-y-2">{runResult.testCases.map((tc, i) => <TestCaseResult key={i} tc={tc} index={i} />)}</div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.07] flex items-center justify-center"><Play size={20} className="text-zinc-700" /></div>
                  <p className="text-sm text-zinc-500 font-medium">Run your code</p>
                  <p className="text-xs text-zinc-700">Click Run to test against visible test cases</p>
                </div>
              )}
            </div>
          )}

          {activeRightTab === "result" && (
            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <Loader2 size={22} className="animate-spin text-indigo-400" />
                  <p className="text-xs text-zinc-500">Judging your solution…</p>
                </div>
              ) : submitResult ? (
                <div className="space-y-4">
                  {submitResult.accepted ? (
                    <>
                      <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/8 to-emerald-500/3 p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-3"><CheckCircle2 size={24} className="text-emerald-400" /></div>
                        <h3 className="text-xl font-bold text-emerald-300 mb-1">Accepted</h3>
                        <p className="text-xs text-emerald-600">Your solution passed all test cases</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Test Cases", value: `${submitResult.passedTestCases}/${submitResult.totalTestCases}`, icon: CheckCircle2, color: "text-emerald-400" },
                          { label: "Runtime",    value: submitResult.runtime ? submitResult.runtime + "s"   : "—", icon: Clock, color: "text-sky-400"    },
                          { label: "Memory",     value: submitResult.memory  ? submitResult.memory  + " KB" : "—", icon: Cpu,  color: "text-violet-400" },
                        ].map(({ label, value, icon: Icon, color }) => (
                          <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
                            <Icon size={16} className={color + " mx-auto mb-2"} />
                            <p className={"text-lg font-bold " + color}>{value}</p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-500/8 to-rose-500/3 p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/25 flex items-center justify-center mx-auto mb-3"><XCircle size={24} className="text-rose-400" /></div>
                        <h3 className="text-xl font-bold text-rose-300 mb-1">{submitResult.error || "Wrong Answer"}</h3>
                        <p className="text-xs text-rose-600">{submitResult.passedTestCases}/{submitResult.totalTestCases} test cases passed</p>
                      </div>
                      {submitResult.totalTestCases > 0 && (
                        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-zinc-500">Test cases</span>
                            <span className="text-xs font-semibold text-zinc-300">{submitResult.passedTestCases}/{submitResult.totalTestCases}</span>
                          </div>
                          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500"
                              style={{ width: (submitResult.passedTestCases / submitResult.totalTestCases * 100) + "%" }} />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.07] flex items-center justify-center"><Send size={18} className="text-zinc-700" /></div>
                  <p className="text-sm text-zinc-500 font-medium">Submit your solution</p>
                  <p className="text-xs text-zinc-700">Click Submit to run against all test cases</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}