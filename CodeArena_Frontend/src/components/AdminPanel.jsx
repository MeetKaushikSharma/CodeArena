import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axiosClient from "../utils/axiosClient";
import { useNavigate } from "react-router";

// This LANGUAGES export is also imported by ProblemPage to build its lang dropdown
export const LANGUAGES = [
  { key: "cpp",        label: "C++",        color: "#38bdf8", group: "Compiled" },
  { key: "c",          label: "C",          color: "#60a5fa", group: "Compiled" },
  { key: "java",       label: "Java",       color: "#fb923c", group: "Compiled" },
  { key: "rust",       label: "Rust",       color: "#f97316", group: "Compiled" },
  { key: "kotlin",     label: "Kotlin",     color: "#a78bfa", group: "Compiled" },
  { key: "swift",      label: "Swift",      color: "#f43f5e", group: "Compiled" },
  { key: "csharp",     label: "C#",         color: "#818cf8", group: "Compiled" },
  { key: "javascript", label: "JavaScript", color: "#facc15", group: "Scripted" },
  { key: "typescript", label: "TypeScript", color: "#34d399", group: "Scripted" },
  { key: "python",     label: "Python 3",   color: "#4ade80", group: "Scripted" },
  { key: "python2",    label: "Python 2",   color: "#86efac", group: "Scripted" },
  { key: "ruby",       label: "Ruby",       color: "#fb7185", group: "Scripted" },
  { key: "php",        label: "PHP",        color: "#c084fc", group: "Scripted" },
  { key: "perl",       label: "Perl",       color: "#94a3b8", group: "Scripted" },
  { key: "bash",       label: "Bash",       color: "#6ee7b7", group: "Scripted" },
  { key: "r",          label: "R",          color: "#67e8f9", group: "Scripted" },
];

const problemSchema = z.object({
  title:       z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  difficulty:  z.enum(["easy", "medium", "hard"]),
  tags:        z.enum(["array", "linkedlist", "graph", "dp", "stack", "queue", "tree"]),
  visibleTestCases: z.array(z.object({
    input:       z.string().min(1),
    output:      z.string().min(1),
    explanation: z.string().min(1),
  })).min(1),
  HiddenTestCases: z.array(z.object({
    input:  z.string().min(1),
    output: z.string().min(1),
  })).min(1),
  startCode: z.array(z.object({
    language:    z.string(),
    initialCode: z.string().min(1, "Initial code required"),
  })).min(1),
  referenceSolution: z.array(z.object({
    language:     z.string(),
    completeCode: z.string().min(1, "Reference solution required"),
  })).min(1),
});

const STEPS = ["Info", "Test Cases", "Languages", "Code", "Review"];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [step,          setStep]          = useState(0);
  const [activeLang,    setActiveLang]    = useState(0);
  const [selectedLangs, setSelectedLangs] = useState(["cpp", "java", "javascript"]);
  const [submitting,    setSubmitting]    = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: "", description: "", difficulty: "easy", tags: "array",
      visibleTestCases: [{ input: "", output: "", explanation: "" }],
      HiddenTestCases:  [{ input: "", output: "" }],
      startCode:         ["cpp","java","javascript"].map(k => ({ language: k, initialCode: "" })),
      referenceSolution: ["cpp","java","javascript"].map(k => ({ language: k, completeCode: "" })),
    },
  });

  const watched = watch();

  const { fields: vFields, append: appendV, remove: removeV } = useFieldArray({ control, name: "visibleTestCases" });
  const { fields: hFields, append: appendH, remove: removeH } = useFieldArray({ control, name: "HiddenTestCases" });

  const toggleLang = (key) => {
    const next = selectedLangs.includes(key)
      ? selectedLangs.filter(k => k !== key)
      : [...selectedLangs, key];
    if (next.length === 0) return;
    setSelectedLangs(next);
    const existStart = {};
    watched.startCode?.forEach(s => { existStart[s.language] = s.initialCode; });
    const existRef = {};
    watched.referenceSolution?.forEach(s => { existRef[s.language] = s.completeCode; });
    setValue("startCode",         next.map(k => ({ language: k, initialCode:  existStart[k] || "" })));
    setValue("referenceSolution", next.map(k => ({ language: k, completeCode: existRef[k]   || "" })));
    setActiveLang(0);
  };

  const activeLangs = LANGUAGES.filter(l => selectedLangs.includes(l.key));

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await axiosClient.post("/problem/create", data);
      navigate("/");
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const diffColors = { easy: "#4ade80", medium: "#fb923c", hard: "#f87171" };

  return (
    <div style={{ minHeight:"100vh", background:"#080810", color:"#e2e8f0", fontFamily:"'DM Mono','Fira Code',monospace" }}>

      {/* ── Header ── */}
      <div style={{
        borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"16px 40px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"rgba(255,255,255,0.02)", backdropFilter:"blur(20px)",
        position:"sticky", top:0, zIndex:50,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff" }}>P</div>
          <span style={{ fontSize:12, color:"#475569", letterSpacing:"0.1em" }}>PROBLEM CREATOR</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <button type="button" onClick={() => setStep(i)} style={{
                display:"flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:20,
                border:`1px solid ${step===i?"rgba(99,102,241,0.5)":"rgba(255,255,255,0.07)"}`,
                background:step===i?"rgba(99,102,241,0.15)":"transparent",
                color:step===i?"#a5b4fc":"#3f4f64", fontSize:11, fontFamily:"inherit", cursor:"pointer", letterSpacing:"0.06em",
              }}>
                <span style={{ width:16,height:16,borderRadius:"50%",background:step===i?"#6366f1":step>i?"#4ade80":"rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0 }}>{step>i?"✓":i+1}</span>
                {s}
              </button>
              {i < STEPS.length-1 && <div style={{ width:12,height:1,background:"rgba(255,255,255,0.06)" }} />}
            </div>
          ))}
        </div>
        <button type="button" onClick={handleSubmit(onSubmit)} disabled={submitting} style={{
          padding:"7px 18px", borderRadius:8,
          background:submitting?"rgba(99,102,241,0.3)":"linear-gradient(135deg,#6366f1,#8b5cf6)",
          border:"none", color:"#fff", fontSize:11, fontFamily:"inherit", fontWeight:700,
          cursor:submitting?"not-allowed":"pointer", letterSpacing:"0.08em",
          boxShadow:"0 4px 20px rgba(99,102,241,0.3)",
        }}>{submitting ? "PUBLISHING..." : "PUBLISH →"}</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ maxWidth:820, margin:"0 auto", padding:"36px 24px" }}>

          {/* ── STEP 0: Info ── */}
          {step === 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <SectionLabel>Basic Information</SectionLabel>
              <Field label="PROBLEM TITLE" error={errors.title?.message}>
                <input {...register("title")} placeholder="e.g. Two Sum" style={inputStyle} />
              </Field>
              <Field label="DESCRIPTION" error={errors.description?.message}>
                <textarea {...register("description")} rows={5} placeholder="Describe the problem..." style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 }} />
              </Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <Field label="DIFFICULTY">
                  <select {...register("difficulty")} style={inputStyle}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </Field>
                <Field label="TAG">
                  <select {...register("tags")} style={inputStyle}>
                    {["array","linkedlist","graph","dp","stack","queue","tree"].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                    ))}
                  </select>
                </Field>
              </div>
              {watched.title && (
                <div style={{ padding:14, borderRadius:10, border:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:13, fontWeight:600 }}>{watched.title}</span>
                  <Pill color={diffColors[watched.difficulty]}>{watched.difficulty}</Pill>
                  <Pill color="#a5b4fc">{watched.tags}</Pill>
                </div>
              )}
              <NavButtons step={step} setStep={setStep} total={STEPS.length} />
            </div>
          )}

          {/* ── STEP 1: Test Cases ── */}
          {step === 1 && (
            <div style={{ display:"flex", flexDirection:"column", gap:28 }}>
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <SectionLabel>Visible Test Cases</SectionLabel>
                  <AddBtn onClick={() => appendV({ input:"", output:"", explanation:"" })}>+ Add</AddBtn>
                </div>
                {vFields.map((f, i) => (
                  <div key={f.id} style={{ ...cardStyle, marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                      <span style={caseLabelStyle}>CASE #{i+1}</span>
                      <button type="button" onClick={() => removeV(i)} style={removeBtnStyle}>✕</button>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                      <MiniField label="Input"><input {...register(`visibleTestCases.${i}.input`)} style={inputStyle} placeholder="2 3" /></MiniField>
                      <MiniField label="Output"><input {...register(`visibleTestCases.${i}.output`)} style={inputStyle} placeholder="5" /></MiniField>
                    </div>
                    <MiniField label="Explanation"><input {...register(`visibleTestCases.${i}.explanation`)} style={inputStyle} placeholder="2 + 3 = 5" /></MiniField>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <SectionLabel>Hidden Test Cases</SectionLabel>
                  <AddBtn onClick={() => appendH({ input:"", output:"" })}>+ Add</AddBtn>
                </div>
                {hFields.map((f, i) => (
                  <div key={f.id} style={{ ...cardStyle, marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                      <span style={caseLabelStyle}>HIDDEN #{i+1}</span>
                      <button type="button" onClick={() => removeH(i)} style={removeBtnStyle}>✕</button>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <MiniField label="Input"><input {...register(`HiddenTestCases.${i}.input`)} style={inputStyle} placeholder="0 0" /></MiniField>
                      <MiniField label="Output"><input {...register(`HiddenTestCases.${i}.output`)} style={inputStyle} placeholder="0" /></MiniField>
                    </div>
                  </div>
                ))}
              </div>
              <NavButtons step={step} setStep={setStep} total={STEPS.length} />
            </div>
          )}

          {/* ── STEP 2: Language Selection ── */}
          {step === 2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
              <div>
                <SectionLabel>Select Languages</SectionLabel>
                <p style={{ fontSize:11, color:"#475569", marginTop:4, marginBottom:20, letterSpacing:"0.04em" }}>
                  Pick which languages this problem supports. You'll write starter code + solution for each one.
                </p>
              </div>
              {["Compiled","Scripted"].map(group => (
                <div key={group}>
                  <div style={{ fontSize:9, color:"#334155", letterSpacing:"0.14em", marginBottom:10, fontWeight:600 }}>{group.toUpperCase()}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {LANGUAGES.filter(l => l.group===group).map(lang => {
                      const on = selectedLangs.includes(lang.key);
                      return (
                        <button key={lang.key} type="button" onClick={() => toggleLang(lang.key)} style={{
                          display:"flex", alignItems:"center", gap:7,
                          padding:"7px 14px", borderRadius:8,
                          border:`1px solid ${on ? lang.color+"50" : "rgba(255,255,255,0.07)"}`,
                          background:on ? `${lang.color}12` : "rgba(255,255,255,0.02)",
                          color:on ? lang.color : "#3f4f64",
                          fontSize:12, fontFamily:"inherit", fontWeight:on?600:400,
                          cursor:"pointer", transition:"all 0.15s",
                        }}>
                          <div style={{ width:7,height:7,borderRadius:"50%",background:on?lang.color:"#1e293b" }} />
                          {lang.label}
                          {on && <span style={{ fontSize:9, opacity:0.6 }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div style={{ ...cardStyle }}>
                <div style={{ fontSize:9, color:"#475569", letterSpacing:"0.1em", marginBottom:10 }}>SELECTED ({selectedLangs.length})</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {selectedLangs.map(k => {
                    const l = LANGUAGES.find(x => x.key===k);
                    return <Pill key={k} color={l.color}>{l.label}</Pill>;
                  })}
                </div>
              </div>
              <NavButtons step={step} setStep={setStep} total={STEPS.length} />
            </div>
          )}

          {/* ── STEP 3: Code ── */}
          {step === 3 && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <SectionLabel>Code Templates & Solutions</SectionLabel>
              {/* Scrollable language tabs */}
              <div style={{ display:"flex", gap:3, padding:4, background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)", overflowX:"auto", flexWrap:"wrap" }}>
                {activeLangs.map((lang, i) => {
                  const complete = watched.startCode?.[i]?.initialCode?.trim().length > 0
                                && watched.referenceSolution?.[i]?.completeCode?.trim().length > 0;
                  return (
                    <button key={lang.key} type="button" onClick={() => setActiveLang(i)} style={{
                      display:"flex", alignItems:"center", gap:6,
                      padding:"6px 13px", borderRadius:7,
                      border:`1px solid ${activeLang===i ? lang.color+"40" : "transparent"}`,
                      background:activeLang===i ? `${lang.color}12` : "transparent",
                      color:activeLang===i ? lang.color : complete ? "#475569" : "#2d3748",
                      fontSize:11, fontFamily:"inherit", fontWeight:activeLang===i?600:400,
                      cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap",
                    }}>
                      <div style={{ width:6,height:6,borderRadius:"50%",background:complete?lang.color:"#1e293b" }} />
                      {lang.label}
                      {complete && <span style={{ fontSize:8, color:"#4ade80" }}>✓</span>}
                    </button>
                  );
                })}
              </div>
              {/* Editors */}
              {activeLangs.map((lang, i) => (
                <div key={lang.key} style={{ display:activeLang===i?"flex":"none", flexDirection:"column", gap:14 }}>
                  <Field label="STARTER CODE" error={errors.startCode?.[i]?.initialCode?.message}>
                    <div style={{ borderRadius:10, border:"1px solid rgba(255,255,255,0.08)", overflow:"hidden" }}>
                      <div style={{ padding:"7px 14px", background:"rgba(255,255,255,0.03)", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:8, fontSize:10, color:"#475569", letterSpacing:"0.08em" }}>
                        <div style={{ width:6,height:6,borderRadius:"50%",background:lang.color }} />
                        {lang.label} — shown to users
                      </div>
                      <textarea {...register(`startCode.${i}.initialCode`)} rows={7} placeholder={`// ${lang.label} starter code`}
                        style={{ ...inputStyle, borderRadius:0, border:"none", fontFamily:"'JetBrains Mono','Fira Code',monospace", fontSize:12, lineHeight:1.7, resize:"vertical" }} />
                    </div>
                  </Field>
                  <Field label="REFERENCE SOLUTION" error={errors.referenceSolution?.[i]?.completeCode?.message}>
                    <div style={{ borderRadius:10, border:"1px solid rgba(74,222,128,0.12)", overflow:"hidden" }}>
                      <div style={{ padding:"7px 14px", background:"rgba(74,222,128,0.04)", borderBottom:"1px solid rgba(74,222,128,0.08)", display:"flex", alignItems:"center", gap:8, fontSize:10, color:"#4ade8060", letterSpacing:"0.08em" }}>
                        <div style={{ width:6,height:6,borderRadius:"50%",background:"#4ade80" }} />
                        {lang.label} — validated on publish
                      </div>
                      <textarea {...register(`referenceSolution.${i}.completeCode`)} rows={10} placeholder={`// ${lang.label} complete solution`}
                        style={{ ...inputStyle, borderRadius:0, border:"none", fontFamily:"'JetBrains Mono','Fira Code',monospace", fontSize:12, lineHeight:1.7, resize:"vertical" }} />
                    </div>
                  </Field>
                </div>
              ))}
              <NavButtons step={step} setStep={setStep} total={STEPS.length} />
            </div>
          )}

          {/* ── STEP 4: Review ── */}
          {step === 4 && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <SectionLabel>Review & Publish</SectionLabel>
              <ReviewCard label="Title">{watched.title || "—"}</ReviewCard>
              <ReviewCard label="Description">
                <span style={{ color:"#94a3b8", fontSize:12, lineHeight:1.6 }}>
                  {watched.description?.slice(0,200) || "—"}{watched.description?.length>200?"...":""}
                </span>
              </ReviewCard>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                <ReviewCard label="Difficulty"><span style={{ color:diffColors[watched.difficulty] }}>{watched.difficulty}</span></ReviewCard>
                <ReviewCard label="Tag">{watched.tags}</ReviewCard>
                <ReviewCard label="Test Cases">
                  <span style={{ color:"#4ade80" }}>{watched.visibleTestCases?.length||0}v</span>{" / "}
                  <span style={{ color:"#f87171" }}>{watched.HiddenTestCases?.length||0}h</span>
                </ReviewCard>
              </div>
              <ReviewCard label={`Languages (${selectedLangs.length})`}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {activeLangs.map((lang, i) => {
                    const ok = watched.startCode?.[i]?.initialCode?.trim().length > 0
                            && watched.referenceSolution?.[i]?.completeCode?.trim().length > 0;
                    return (
                      <span key={lang.key} style={{ padding:"3px 10px", borderRadius:20, fontSize:11, background:ok?`${lang.color}15`:"rgba(255,255,255,0.03)", color:ok?lang.color:"#334155", border:`1px solid ${ok?lang.color+"30":"rgba(255,255,255,0.06)"}` }}>
                        {ok?"✓ ":"✕ "}{lang.label}
                      </span>
                    );
                  })}
                </div>
              </ReviewCard>
              <button type="submit" disabled={submitting} style={{
                width:"100%", padding:14, borderRadius:10, border:"none",
                background:submitting?"rgba(99,102,241,0.3)":"linear-gradient(135deg,#6366f1,#8b5cf6)",
                color:"#fff", fontSize:12, fontFamily:"inherit", fontWeight:700,
                cursor:submitting?"not-allowed":"pointer", letterSpacing:"0.1em",
                boxShadow:submitting?"none":"0 8px 32px rgba(99,102,241,0.35)", marginTop:8,
              }}>{submitting ? "VALIDATING & PUBLISHING..." : "PUBLISH PROBLEM →"}</button>
            </div>
          )}

        </div>
      </form>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────
const inputStyle = {
  width:"100%", padding:"10px 14px",
  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
  borderRadius:8, color:"#e2e8f0", fontSize:13, fontFamily:"inherit",
  outline:"none", boxSizing:"border-box",
};
const cardStyle = { padding:16, borderRadius:10, border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)" };
const caseLabelStyle = { fontSize:9, color:"#475569", letterSpacing:"0.12em", fontWeight:600 };
const removeBtnStyle = { background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", color:"#f87171", borderRadius:6, padding:"2px 8px", fontSize:11, cursor:"pointer", fontFamily:"inherit" };

function SectionLabel({ children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
      <div style={{ width:3, height:14, borderRadius:2, background:"linear-gradient(180deg,#6366f1,#8b5cf6)" }} />
      <span style={{ fontSize:10, letterSpacing:"0.14em", color:"#475569", fontWeight:600 }}>{typeof children==="string"?children.toUpperCase():children}</span>
    </div>
  );
}
function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:10, color:"#475569", letterSpacing:"0.1em", marginBottom:6, fontWeight:600 }}>{label}</label>
      {children}
      {error && <span style={{ fontSize:11, color:"#f87171", marginTop:4, display:"block" }}>{error}</span>}
    </div>
  );
}
function MiniField({ label, children }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:9, color:"#475569", letterSpacing:"0.1em", marginBottom:5, fontWeight:600 }}>{label}</label>
      {children}
    </div>
  );
}
function ReviewCard({ label, children }) {
  return (
    <div style={{ padding:"14px 16px", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)" }}>
      <div style={{ fontSize:9, color:"#475569", letterSpacing:"0.12em", marginBottom:8, fontWeight:600 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize:13, color:"#e2e8f0" }}>{children}</div>
    </div>
  );
}
function Pill({ color, children }) {
  return (
    <span style={{ fontSize:10, padding:"2px 9px", borderRadius:20, background:`${color}15`, color, border:`1px solid ${color}30`, letterSpacing:"0.06em", fontWeight:600 }}>{children}</span>
  );
}
function AddBtn({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{ padding:"5px 13px", borderRadius:8, background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", color:"#a5b4fc", fontSize:11, fontFamily:"inherit", fontWeight:600, cursor:"pointer", letterSpacing:"0.06em" }}>{children}</button>
  );
}
function NavButtons({ step, setStep, total }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8 }}>
      {step > 0
        ? <button type="button" onClick={() => setStep(s=>s-1)} style={{ padding:"8px 18px", borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"#94a3b8", fontSize:11, fontFamily:"inherit", cursor:"pointer", letterSpacing:"0.06em" }}>← BACK</button>
        : <div />}
      {step < total-1 && (
        <button type="button" onClick={() => setStep(s=>s+1)} style={{ padding:"8px 18px", borderRadius:8, background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)", color:"#a5b4fc", fontSize:11, fontFamily:"inherit", fontWeight:600, cursor:"pointer", letterSpacing:"0.06em" }}>NEXT →</button>
      )}
    </div>
  );
}