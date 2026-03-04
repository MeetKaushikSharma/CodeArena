import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import axiosClient from "../utils/axiosClient";
import { useNavigate, useParams } from "react-router";
import {
  Plus, Trash2, Code2, FlaskConical, FileText, Loader2,
  ChevronRight, Save, ArrowLeft, CheckCircle2, AlertCircle,
  Eye, EyeOff, Terminal, Pencil, Info,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// NOTE on DB quirks discovered from real response:
//   1. startCode field is "intialCode" (typo in schema, missing 'i')
//   2. hiddenTestCases may be completely absent from response
//   3. language values are lowercase: "cpp" / "java" / "javascript"
//   4. nested docs have _id fields — strip them before reset()
// ─────────────────────────────────────────────────────────────

const LANGUAGES = ["cpp", "java", "javascript"];

const problemSchema = z.object({
  title:       z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  difficulty:  z.enum(["easy", "medium", "hard"]),
  tags:        z.enum(["array", "linkedList", "graph", "dp"]),
  visibleTestCases: z.array(
    z.object({
      input:       z.string().min(1, "Input is required"),
      output:      z.string().min(1, "Output is required"),
      explanation: z.string().min(1, "Explanation is required"),
    })
  ).min(1, "At least one visible test case is required"),
  hiddenTestCases: z.array(
    z.object({
      input:  z.string().min(1, "Input is required"),
      output: z.string().min(1, "Output is required"),
    })
  ).min(1, "At least one hidden test case is required"),
  startCode: z.array(
    z.object({
      language:    z.enum(["cpp", "java", "javascript"]),
      initialCode: z.string().default(""),
    })
  ),
  referenceSolution: z.array(
    z.object({
      language:     z.enum(["cpp", "java", "javascript"]),
      completeCode: z.string().default(""),
    })
  ),
});

// ─── Normalizers ─────────────────────────────────────────────

const normalizeTag = (raw) =>
  Array.isArray(raw) ? (raw[0] ?? "array") : (raw ?? "array");

// hiddenTestCases might be absent entirely — return [] in that case
const getHiddenCases = (data) => {
  const arr = data.hiddenTestCases || data.HiddenTestCases || [];
  return arr.map(({ input = "", output = "" }) => ({ input, output }));
};

// Build 3 slots always. Handles:
//   - "intialCode" typo in DB (startCode)
//   - "initialCode" correct spelling (future-safe)
//   - "completeCode" (referenceSolution, no typo)
const normalizeLangArray = (arr, formKey) =>
  LANGUAGES.map((lang) => {
    const found = (arr || []).find(
      (s) => (s.language || "").toLowerCase() === lang
    );
    if (!found) return { language: lang, [formKey]: "" };

    // For startCode: DB has "intialCode" (typo). Read whichever exists.
    const value =
      found[formKey] !== undefined   ? found[formKey]      : // correct key
      found["intialCode"] !== undefined ? found["intialCode"] : // DB typo
      "";

    return { language: lang, [formKey]: value };
  });

// ─── UI constants ─────────────────────────────────────────────

const DIFFICULTY = {
  easy:   { label: "Easy",   text: "text-emerald-400", dot: "bg-emerald-400" },
  medium: { label: "Medium", text: "text-amber-400",   dot: "bg-amber-400"   },
  hard:   { label: "Hard",   text: "text-rose-400",    dot: "bg-rose-400"    },
};

const LANG_META = [
  { lang: "cpp",        label: "C++",        idx: 0, badge: "text-sky-400 bg-sky-400/10 border-sky-400/20",              dot: "bg-sky-400",    required: true  },
  { lang: "java",       label: "Java",       idx: 1, badge: "text-orange-400 bg-orange-400/10 border-orange-400/20",     dot: "bg-orange-400", required: false },
  { lang: "javascript", label: "JavaScript", idx: 2, badge: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",     dot: "bg-yellow-400", required: false },
];

// ─── Tiny components ──────────────────────────────────────────

function FieldError({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <AlertCircle size={11} className="text-rose-400 flex-shrink-0" />
      <span className="text-xs text-rose-400">{message}</span>
    </div>
  );
}

function SectionCard({ id, icon: Icon, step, title, subtitle, children }) {
  return (
    <section id={"sec-" + id} className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-indigo-500/20">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-7">
        <div className="flex items-start gap-4 mb-8">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center">
            <Icon size={17} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-[0.2em] text-zinc-600 uppercase mb-0.5">Step {step}</p>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

function Label({ children }) {
  return (
    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

const inputCls = (err) =>
  "w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-white placeholder-zinc-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all " +
  (err ? "border-rose-500/40 focus:ring-rose-500/30" : "border-white/10 hover:border-white/20 focus:border-indigo-500/40");

const monoInput =
  "w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 hover:border-white/20 text-sm text-white placeholder-zinc-700 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all";

const codeArea =
  "w-full px-4 py-3 rounded-xl bg-[#0a0a0f] border border-white/10 hover:border-white/[0.18] focus:border-indigo-500/40 text-zinc-300 placeholder-zinc-700 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all";

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function UpdateProblem() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [pageLoading,   setPageLoading]   = useState(true);
  const [fetchError,    setFetchError]    = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [toast,         setToast]         = useState(null);
  const [problemTitle,  setProblemTitle]  = useState("");
  const [activeSection, setActiveSection] = useState("info");

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  // ── Form setup ──────────────────────────────────────────────
  const {
    register, control, handleSubmit, reset, watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: "", description: "", difficulty: "easy", tags: "array",
      visibleTestCases: [],
      hiddenTestCases:  [],
      startCode:         LANGUAGES.map((l) => ({ language: l, initialCode: "" })),
      referenceSolution: LANGUAGES.map((l) => ({ language: l, completeCode: "" })),
    },
  });

  const { fields: visibleFields, append: appendVisible, remove: removeVisible } =
    useFieldArray({ control, name: "visibleTestCases" });
  const { fields: hiddenFields,  append: appendHidden,  remove: removeHidden  } =
    useFieldArray({ control, name: "hiddenTestCases" });

  // ── Fetch and prefill EVERYTHING from DB ───────────────────
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setPageLoading(true);
      setFetchError(null);
      try {
        const { data } = await axiosClient.get("/problem/problemById/" + id);

        // Log so you can verify in DevTools console
        console.log("[UpdateProblem] Raw DB response:", JSON.stringify(data, null, 2));

        setProblemTitle(data.title || "");

        // Strip _id from visible test cases
        const cleanVisible = (data.visibleTestCases || []).map(
          ({ input = "", output = "", explanation = "" }) => ({ input, output, explanation })
        );

        // hiddenTestCases may be absent — getHiddenCases returns [] safely
        const cleanHidden = getHiddenCases(data);

        // normalizeLangArray reads "intialCode" typo for startCode
        const startCode         = normalizeLangArray(data.startCode,         "initialCode");
        const referenceSolution = normalizeLangArray(data.referenceSolution, "completeCode");

        console.log("[UpdateProblem] Prefilling form with:", {
          cleanVisible, cleanHidden, startCode, referenceSolution
        });

        reset({
          title:             data.title       || "",
          description:       data.description || "",
          difficulty:        data.difficulty  || "easy",
          tags:              normalizeTag(data.tags),
          visibleTestCases:  cleanVisible,
          hiddenTestCases:   cleanHidden,
          startCode,
          referenceSolution,
        });
      } catch (err) {
        console.error("[UpdateProblem] Load failed:", err);
        setFetchError("Could not load problem. Check the ID or your connection.");
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id, reset]);

  // ── Submit ─────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // Only send slots that have code — skip empty optional languages
      const startCode         = data.startCode.filter((s) => s.initialCode?.trim());
      const referenceSolution = data.referenceSolution.filter((s) => s.completeCode?.trim());

      if (referenceSolution.length === 0) {
        showToast("error", "C++ reference solution is required.");
        setSubmitting(false);
        return;
      }

      await axiosClient.put("/problem/update/" + id, {
        title:            data.title,
        description:      data.description,
        difficulty:       data.difficulty,
        tags:             data.tags,
        visibleTestCases: data.visibleTestCases,
        hiddenTestCases:  data.hiddenTestCases,
        startCode,
        referenceSolution,
      });

      showToast("success", "Problem updated successfully!");
      setTimeout(() => navigate("/admin/update"), 1600);
    } catch (err) {
      console.error("[UpdateProblem] Update failed:", err);
      const msg = err.response?.data?.message || err.response?.data || err.message || "Update failed.";
      showToast("error", String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const onValidationError = (errs) => {
    console.error("[UpdateProblem] Validation errors:", errs);
    const find = (obj) => {
      if (!obj || typeof obj !== "object") return null;
      if (typeof obj.message === "string") return obj.message;
      for (const v of Object.values(obj)) { const f = find(v); if (f) return f; }
      return null;
    };
    showToast("error", find(errs) || "Please fix errors before saving.");
  };

  const watchedDiff = watch("difficulty");

  // ── Loading ────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/15" />
            <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400 animate-spin" />
          </div>
          <p className="text-white font-semibold">Loading Problem</p>
          <p className="text-zinc-600 text-xs -mt-2">Fetching from server…</p>
        </div>
      </div>
    );
  }

  // ── Fetch error ────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertCircle size={22} className="text-rose-400" />
          </div>
          <p className="text-white font-semibold">Failed to load problem</p>
          <p className="text-zinc-500 text-sm">{fetchError}</p>
          <div className="flex gap-3">
            <button onClick={() => navigate("/admin/update")} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 hover:bg-white/10 transition-all">← Go back</button>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-indigo-500 text-sm text-white font-medium hover:bg-indigo-400 transition-all">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0d0d12] text-white">
      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/3 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600/4 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(circle, #6366f1 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      {/* Toast */}
      {toast && (
        <div className={"fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl text-sm font-medium max-w-sm " + (toast.type === "success" ? "bg-emerald-950/90 border-emerald-500/25 text-emerald-300" : "bg-rose-950/90 border-rose-500/25 text-rose-300")}>
          {toast.type === "success" ? <CheckCircle2 size={15} className="flex-shrink-0" /> : <AlertCircle size={15} className="flex-shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0d0d12]/80 backdrop-blur-2xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate("/admin/update")} className="group flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-sm flex-shrink-0">
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              Problems
            </button>
            <ChevronRight size={13} className="text-zinc-700 flex-shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <Pencil size={13} className="text-amber-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-white truncate">{problemTitle || "Edit Problem"}</span>
            </div>
            {watchedDiff && DIFFICULTY[watchedDiff] && (
              <>
                <ChevronRight size={13} className="text-zinc-700 flex-shrink-0" />
                <span className={"text-xs font-medium " + DIFFICULTY[watchedDiff].text}>{DIFFICULTY[watchedDiff].label}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {isDirty && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-amber-400/80">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Unsaved changes
              </span>
            )}
            <button type="button" onClick={handleSubmit(onSubmit, onValidationError)} disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold shadow-lg shadow-indigo-500/25">
              {submitting ? <><Loader2 size={13} className="animate-spin" />Saving…</> : <><Save size={13} />Save Changes</>}
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-10 relative">

        {/* Section nav */}
        <nav className="flex items-center gap-1 mb-8 p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl w-fit">
          {[
            { id: "info",  label: "Details",   icon: FileText     },
            { id: "tests", label: "Test Cases", icon: FlaskConical },
            { id: "code",  label: "Code",       icon: Code2        },
          ].map(({ id: sid, label, icon: Icon }) => (
            <button key={sid} type="button"
              onClick={() => { setActiveSection(sid); document.getElementById("sec-" + sid)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
              className={"flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 " + (activeSection === sid ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5")}>
              <Icon size={13} />{label}
            </button>
          ))}
        </nav>

        {/* Validation error summary */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20">
            <AlertCircle size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-300">Fix before saving:</p>
              <ul className="mt-1.5 space-y-0.5">
                {Object.entries(errors).map(([field, err]) => {
                  const msg = err?.message || err?.root?.message;
                  return msg ? <li key={field} className="text-xs text-rose-400/80">• {msg}</li> : null;
                })}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="space-y-5">

          {/* ═══════════ SECTION 1 — Details ═══════════ */}
          <SectionCard id="info" icon={FileText} step={1} title="Problem Details" subtitle="Title, description, difficulty and category">
            <div className="space-y-5">
              <div>
                <Label>Title</Label>
                <input {...register("title")} placeholder="e.g. Two Sum" className={inputCls(errors.title)} />
                <FieldError message={errors.title?.message} />
              </div>
              <div>
                <Label>Description</Label>
                <textarea {...register("description")} rows={8} placeholder="Describe the problem…" className={inputCls(errors.description) + " resize-none leading-relaxed"} />
                <FieldError message={errors.description?.message} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Difficulty</Label>
                  <select {...register("difficulty")} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all cursor-pointer appearance-none">
                    <option value="easy"   className="bg-[#1a1a24]">Easy</option>
                    <option value="medium" className="bg-[#1a1a24]">Medium</option>
                    <option value="hard"   className="bg-[#1a1a24]">Hard</option>
                  </select>
                </div>
                <div>
                  <Label>Category Tag</Label>
                  <select {...register("tags")} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all cursor-pointer appearance-none">
                    <option value="array"      className="bg-[#1a1a24]">Array</option>
                    <option value="linkedList" className="bg-[#1a1a24]">Linked List</option>
                    <option value="graph"      className="bg-[#1a1a24]">Graph</option>
                    <option value="dp"         className="bg-[#1a1a24]">Dynamic Programming</option>
                  </select>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ═══════════ SECTION 2 — Test Cases ═══════════ */}
          <SectionCard id="tests" icon={FlaskConical} step={2} title="Test Cases" subtitle="Visible cases shown to users · Hidden cases used for grading">

            {/* Visible */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-sky-400" />
                  <h3 className="text-sm font-semibold text-white">Visible Test Cases</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/15 font-mono">{visibleFields.length}</span>
                </div>
                <button type="button" onClick={() => appendVisible({ input: "", output: "", explanation: "" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-400 bg-sky-400/8 border border-sky-400/15 hover:bg-sky-400/15 hover:border-sky-400/30 transition-all">
                  <Plus size={12} />Add Case
                </button>
              </div>
              {errors.visibleTestCases?.message && <div className="mb-3"><FieldError message={errors.visibleTestCases.message} /></div>}
              {visibleFields.length === 0 && <div className="border border-dashed border-white/10 rounded-xl py-8 text-center text-zinc-600 text-sm">No visible test cases</div>}
              <div className="space-y-3">
                {visibleFields.map((field, i) => (
                  <div key={field.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02]">
                      <span className="text-xs font-mono text-zinc-500">Case #{i + 1}</span>
                      <button type="button" onClick={() => removeVisible(i)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-zinc-600 hover:text-rose-400 hover:bg-rose-400/8 transition-all">
                        <Trash2 size={11} />Remove
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Input</Label>
                          <input {...register("visibleTestCases." + i + ".input")} placeholder="e.g. 2 3" className={monoInput} />
                          <FieldError message={errors.visibleTestCases?.[i]?.input?.message} />
                        </div>
                        <div>
                          <Label>Output</Label>
                          <input {...register("visibleTestCases." + i + ".output")} placeholder="e.g. 5" className={monoInput} />
                          <FieldError message={errors.visibleTestCases?.[i]?.output?.message} />
                        </div>
                      </div>
                      <div>
                        <Label>Explanation</Label>
                        <textarea {...register("visibleTestCases." + i + ".explanation")} rows={2} placeholder="Why is this output correct?" className={monoInput + " resize-none"} />
                        <FieldError message={errors.visibleTestCases?.[i]?.explanation?.message} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hidden */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <EyeOff size={14} className="text-violet-400" />
                  <h3 className="text-sm font-semibold text-white">Hidden Test Cases</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/15 font-mono">{hiddenFields.length}</span>
                </div>
                <button type="button" onClick={() => appendHidden({ input: "", output: "" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-400 bg-violet-400/8 border border-violet-400/15 hover:bg-violet-400/15 hover:border-violet-400/30 transition-all">
                  <Plus size={12} />Add Case
                </button>
              </div>
              {errors.hiddenTestCases?.message && <div className="mb-3"><FieldError message={errors.hiddenTestCases.message} /></div>}
              {hiddenFields.length === 0 && (
                <div className="border border-dashed border-white/10 rounded-xl py-8 text-center text-zinc-600 text-sm">
                  No hidden test cases in database — add one below
                </div>
              )}
              <div className="space-y-3">
                {hiddenFields.map((field, i) => (
                  <div key={field.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02]">
                      <span className="text-xs font-mono text-zinc-500">Hidden #{i + 1}</span>
                      <button type="button" onClick={() => removeHidden(i)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-zinc-600 hover:text-rose-400 hover:bg-rose-400/8 transition-all">
                        <Trash2 size={11} />Remove
                      </button>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                      <div>
                        <Label>Input</Label>
                        <input {...register("hiddenTestCases." + i + ".input")} placeholder="e.g. 10 20" className={monoInput} />
                        <FieldError message={errors.hiddenTestCases?.[i]?.input?.message} />
                      </div>
                      <div>
                        <Label>Output</Label>
                        <input {...register("hiddenTestCases." + i + ".output")} placeholder="e.g. 30" className={monoInput} />
                        <FieldError message={errors.hiddenTestCases?.[i]?.output?.message} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* ═══════════ SECTION 3 — Code ═══════════ */}
          <SectionCard id="code" icon={Code2} step={3} title="Code Templates" subtitle="Starter code and reference solutions per language">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 mb-6">
              <Info size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-400 leading-relaxed">
                <span className="text-white font-semibold">C++ reference solution is required</span>{" "}
                for backend validation. Java and JavaScript are optional.
              </p>
            </div>
            <div className="space-y-5">
              {LANG_META.map(({ lang, label, idx, badge, dot, required }) => (
                <div key={lang} className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
                    <div className={"w-2 h-2 rounded-full " + dot} />
                    <span className={"text-xs font-semibold px-2.5 py-1 rounded-lg border " + badge}>{label}</span>
                    {required
                      ? <span className="text-[10px] text-rose-400 font-medium px-2 py-0.5 rounded bg-rose-400/10 border border-rose-400/15">Required</span>
                      : <span className="text-[10px] text-zinc-600 font-medium px-2 py-0.5 rounded bg-white/5 border border-white/10">Optional</span>}
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Terminal size={12} className="text-zinc-500" />
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Starter Code</span>
                        <span className="text-[9px] text-zinc-700">shown to user</span>
                      </div>
                      <textarea
                        {...register("startCode." + idx + ".initialCode")}
                        rows={10} spellCheck={false}
                        placeholder={"// " + label + " starter template\n// Users will see this in the editor"}
                        className={codeArea}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 size={12} className="text-zinc-500" />
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Reference Solution</span>
                        {required && <span className="text-[9px] text-indigo-400/70">used for validation</span>}
                      </div>
                      <textarea
                        {...register("referenceSolution." + idx + ".completeCode")}
                        rows={10} spellCheck={false}
                        placeholder={"// Complete " + label + " solution"}
                        className={codeArea}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Sticky bottom save bar */}
          <div className="sticky bottom-6 z-30">
            <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-white/[0.08] bg-[#0d0d12]/90 backdrop-blur-2xl shadow-2xl shadow-black/60">
              <div>
                {isDirty
                  ? <div className="flex items-center gap-2 text-amber-400"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /><span className="text-xs font-medium">You have unsaved changes</span></div>
                  : <div className="flex items-center gap-2 text-zinc-600"><CheckCircle2 size={13} /><span className="text-xs">No pending changes</span></div>}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => navigate("/admin/update")} className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20">
                  {submitting ? <><Loader2 size={14} className="animate-spin" />Saving…</> : <><Save size={14} />Save Changes</>}
                </button>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}