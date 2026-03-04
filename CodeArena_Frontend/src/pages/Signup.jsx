import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, NavLink } from "react-router";
import { registerUser } from "../authSlice";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Code2, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

const signupSchema = z.object({
  firstName: z.string().min(3, "Name must be at least 3 characters"),
  emailId:   z.string().email("Enter a valid email address"),
  password:  z
    .string()
    .min(8, "At least 8 characters required")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
});

// ── Password strength checker ────────────────────────────────────
const getStrength = (pw) => {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)       score++;
  if (pw.length >= 12)      score++;
  if (/[A-Z]/.test(pw))     score++;
  if (/[0-9]/.test(pw))     score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak",   color: "bg-rose-500"   };
  if (score <= 2) return { score, label: "Fair",   color: "bg-amber-500"  };
  if (score <= 3) return { score, label: "Good",   color: "bg-sky-400"    };
  return              { score, label: "Strong", color: "bg-emerald-400" };
};

// ── Password requirements ────────────────────────────────────────
const REQS = [
  { label: "8+ characters",       test: (p) => p.length >= 8      },
  { label: "Uppercase letter",    test: (p) => /[A-Z]/.test(p)    },
  { label: "Number",              test: (p) => /[0-9]/.test(p)    },
];

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused]           = useState(null);
  const [pwValue, setPwValue]           = useState("");
  const dispatch                        = useDispatch();
  const navigate                        = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  // Watch password for live strength indicator
  const watchedPassword = watch("password", "");
  useEffect(() => setPwValue(watchedPassword || ""), [watchedPassword]);

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => dispatch(registerUser(data));

  const strength = getStrength(pwValue);

  return (
    <div className="min-h-screen bg-[#0b0b10] text-white flex overflow-hidden">

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-violet-600/7 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: "radial-gradient(circle, #818cf8 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fu  { animation: fadeUp 0.5s 0.0s ease forwards; opacity: 0; }
        .fu1 { animation: fadeUp 0.5s 0.1s ease forwards; opacity: 0; }
        .fu2 { animation: fadeUp 0.5s 0.15s ease forwards; opacity: 0; }
        .fu3 { animation: fadeUp 0.5s 0.2s ease forwards; opacity: 0; }
        .fu4 { animation: fadeUp 0.5s 0.25s ease forwards; opacity: 0; }
        .fu5 { animation: fadeUp 0.5s 0.3s ease forwards; opacity: 0; }
        .fu6 { animation: fadeUp 0.5s 0.35s ease forwards; opacity: 0; }
        .fu7 { animation: fadeUp 0.5s 0.4s ease forwards; opacity: 0; }
      `}</style>

      {/* ── Form panel (left on desktop) ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 justify-center mb-8 lg:hidden fu">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold">Code<span className="text-indigo-400">Arena</span></span>
          </div>

          {/* Heading */}
          <div className="mb-7 fu1">
            <h2 className="text-2xl font-bold text-white">Create your account</h2>
            <p className="text-zinc-500 text-sm mt-1">Start solving problems for free</p>
          </div>

          {/* Global error */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-500/8 border border-rose-500/20 mb-5 fu1">
              <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
              <span className="text-xs text-rose-300">{typeof error === "string" ? error : "Registration failed. Please try again."}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* First Name */}
            <div className="fu2">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                First Name
              </label>
              <input
                type="text"
                placeholder="John"
                autoComplete="given-name"
                onFocus={() => setFocused("name")}
                onBlur={() => setFocused(null)}
                {...register("firstName")}
                className={
                  "w-full px-4 py-3 rounded-xl bg-white/[0.05] border text-white placeholder-zinc-700 text-sm focus:outline-none transition-all duration-200 " +
                  (errors.firstName
                    ? "border-rose-500/50"
                    : focused === "name"
                    ? "border-indigo-500/60 ring-1 ring-indigo-500/20 bg-white/[0.07]"
                    : "border-white/[0.08] hover:border-white/[0.15]")
                }
              />
              {errors.firstName && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-rose-400">
                  <AlertCircle size={11} />{errors.firstName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="fu3">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                {...register("emailId")}
                className={
                  "w-full px-4 py-3 rounded-xl bg-white/[0.05] border text-white placeholder-zinc-700 text-sm focus:outline-none transition-all duration-200 " +
                  (errors.emailId
                    ? "border-rose-500/50"
                    : focused === "email"
                    ? "border-indigo-500/60 ring-1 ring-indigo-500/20 bg-white/[0.07]"
                    : "border-white/[0.08] hover:border-white/[0.15]")
                }
              />
              {errors.emailId && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-rose-400">
                  <AlertCircle size={11} />{errors.emailId.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="fu4">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  {...register("password")}
                  className={
                    "w-full px-4 py-3 pr-11 rounded-xl bg-white/[0.05] border text-white placeholder-zinc-700 text-sm focus:outline-none transition-all duration-200 " +
                    (errors.password
                      ? "border-rose-500/50"
                      : focused === "password"
                      ? "border-indigo-500/60 ring-1 ring-indigo-500/20 bg-white/[0.07]"
                      : "border-white/[0.08] hover:border-white/[0.15]")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength bar */}
              {pwValue && (
                <div className="mt-2.5">
                  <div className="flex gap-1 mb-1.5">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s}
                        className={"h-1 flex-1 rounded-full transition-all duration-300 " +
                          (strength.score >= s ? strength.color : "bg-white/[0.08]")} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                      {REQS.map(({ label, test }) => {
                        const met = test(pwValue);
                        return (
                          <div key={label} className={"flex items-center gap-1 " + (met ? "text-emerald-400" : "text-zinc-700")}>
                            <CheckCircle2 size={10} />
                            <span className="text-[10px]">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                    <span className={"text-[10px] font-semibold " +
                      (strength.label === "Strong" ? "text-emerald-400" :
                       strength.label === "Good"   ? "text-sky-400" :
                       strength.label === "Fair"   ? "text-amber-400" : "text-rose-400")}>
                      {strength.label}
                    </span>
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-rose-400">
                  <AlertCircle size={11} />{errors.password.message}
                </p>
              )}
            </div>

            {/* Terms note */}
            <p className="text-[11px] text-zinc-700 leading-relaxed fu5">
              By creating an account you agree to our{" "}
              <span className="text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">Terms of Service</span>{" "}
              and{" "}
              <span className="text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">Privacy Policy</span>.
            </p>

            {/* Submit */}
            <div className="fu6">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold text-white transition-all duration-150 shadow-lg shadow-indigo-500/25"
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" />Creating account…</>
                ) : (
                  <>Create Free Account<ArrowRight size={15} /></>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5 fu7">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-zinc-700">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-zinc-600 fu7">
            Already have an account?{" "}
            <NavLink to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign in
            </NavLink>
          </p>
        </div>
      </div>

      {/* ── Right decorative panel (desktop) ── */}
      <div className="hidden lg:flex flex-col w-[42%] relative border-l border-white/[0.04] p-12 justify-between bg-white/[0.008]">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 self-end">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Code2 size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Code<span className="text-indigo-400">Arena</span>
          </span>
        </NavLink>

        {/* Center */}
        <div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Everything you need<br />
            to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">ace interviews</span>
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed mb-8 max-w-xs">
            Practice with real interview questions, get AI hints, watch editorial videos, and track your progress.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              { emoji: "⚡", text: "Run code instantly with Judge0" },
              { emoji: "🤖", text: "AI-powered doubt solving chat"  },
              { emoji: "🎬", text: "Video editorials for every problem" },
              { emoji: "📊", text: "Track your progress and streaks"    },
              { emoji: "🏆", text: "Multiple language support"          },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-sm flex-shrink-0">
                  {emoji}
                </div>
                <span className="text-sm text-zinc-400">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom user count */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {["#6366f1", "#8b5cf6", "#06b6d4", "#10b981"].map((c, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-[#0b0b10] flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: c }}>
                {["A", "B", "C", "D"][i]}
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Join 50,000+ developers</p>
            <p className="text-[10px] text-zinc-600">already improving their skills</p>
          </div>
        </div>
      </div>

    </div>
  );
}