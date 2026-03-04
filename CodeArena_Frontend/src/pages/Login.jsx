import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, NavLink } from "react-router";
import { loginUser } from "../authSlice";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Code2, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

const loginSchema = z.object({
  emailId:  z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ── Floating code snippet decorations ──────────────────────────
const CODE_SNIPPETS = [
  { text: "function twoSum(nums, target) {",  top: "8%",  left: "2%",  delay: "0s",   opacity: "0.07" },
  { text: "  const map = new Map();",          top: "14%", left: "2%",  delay: "0.3s", opacity: "0.05" },
  { text: "  for (let i = 0; i < n; i++) {",  top: "20%", left: "2%",  delay: "0.6s", opacity: "0.04" },
  { text: "return dp[n];",                     top: "70%", right: "2%", delay: "0.2s", opacity: "0.06" },
  { text: "graph.bfs(start);",                 top: "78%", right: "2%", delay: "0.5s", opacity: "0.05" },
  { text: "O(n log n)",                        top: "85%", right: "2%", delay: "0.1s", opacity: "0.07" },
];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused]           = useState(null);
  const dispatch                        = useDispatch();
  const navigate                        = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => dispatch(loginUser(data));

  return (
    <div className="min-h-screen bg-[#0b0b10] text-white flex overflow-hidden">

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-violet-600/6 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: "radial-gradient(circle, #818cf8 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      {/* ── Floating code snippets ── */}
      {CODE_SNIPPETS.map((s, i) => (
        <div key={i} className="fixed font-mono text-xs text-indigo-300 pointer-events-none select-none hidden lg:block"
          style={{ top: s.top, left: s.left, right: s.right, opacity: s.opacity,
            animation: `float ${3 + i * 0.4}s ease-in-out infinite alternate`,
            animationDelay: s.delay }}>
          {s.text}
        </div>
      ))}

      <style>{`
        @keyframes float { from { transform: translateY(0px); } to { transform: translateY(-8px); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-1 { animation: fadeUp 0.5s 0.1s ease forwards; opacity: 0; }
        .fade-up-2 { animation: fadeUp 0.5s 0.2s ease forwards; opacity: 0; }
        .fade-up-3 { animation: fadeUp 0.5s 0.3s ease forwards; opacity: 0; }
        .fade-up-4 { animation: fadeUp 0.5s 0.4s ease forwards; opacity: 0; }
        .fade-up-5 { animation: fadeUp 0.5s 0.5s ease forwards; opacity: 0; }
      `}</style>

      {/* ── Left decorative panel (desktop) ── */}
      <div className="hidden lg:flex flex-col w-[45%] relative border-r border-white/[0.04] p-12 justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Code2 size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Code<span className="text-indigo-400">Arena</span>
          </span>
        </NavLink>

        {/* Center content */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs text-indigo-300 font-medium">4,000+ problems & counting</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-white mb-4">
            Sharpen your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              problem solving
            </span><br />
            skills
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
            Practice coding challenges, compete with others, and land your dream job.
          </p>

          {/* Stats row */}
          <div className="flex gap-6 mt-10">
            {[
              { value: "500+", label: "Problems" },
              { value: "50k+", label: "Developers" },
              { value: "16",    label: "Languages" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="border border-white/[0.06] rounded-xl p-4 bg-white/[0.02]">
          <p className="text-xs text-zinc-500 leading-relaxed italic">
            "The only way to learn a new programming language is by writing programs in it."
          </p>
          <p className="text-xs text-zinc-700 mt-2">— Dennis Ritchie</p>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 justify-center mb-10 lg:hidden fade-up">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold">Code<span className="text-indigo-400">Arena</span></span>
          </div>

          {/* Heading */}
          <div className="mb-8 fade-up-1">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-zinc-500 text-sm mt-1">Sign in to continue your streak</p>
          </div>

          {/* Global error */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-500/8 border border-rose-500/20 mb-5 fade-up-1">
              <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
              <span className="text-xs text-rose-300">{typeof error === "string" ? error : "Invalid credentials. Please try again."}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Email */}
            <div className="fade-up-2">
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
                    ? "border-rose-500/50 focus:ring-1 focus:ring-rose-500/30"
                    : focused === "email"
                    ? "border-indigo-500/60 ring-1 ring-indigo-500/20 bg-white/[0.07]"
                    : "border-white/[0.08] hover:border-white/[0.15]")
                }
              />
              {errors.emailId && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-rose-400">
                  <AlertCircle size={11} />
                  {errors.emailId.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="fade-up-3">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  {...register("password")}
                  className={
                    "w-full px-4 py-3 pr-11 rounded-xl bg-white/[0.05] border text-white placeholder-zinc-700 text-sm focus:outline-none transition-all duration-200 " +
                    (errors.password
                      ? "border-rose-500/50 focus:ring-1 focus:ring-rose-500/30"
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
              {errors.password && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-rose-400">
                  <AlertCircle size={11} />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2 fade-up-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold text-white transition-all duration-150 shadow-lg shadow-indigo-500/25"
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" />Signing in…</>
                ) : (
                  <>Sign In<ArrowRight size={15} /></>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6 fade-up-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-zinc-700">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Signup link */}
          <p className="text-center text-sm text-zinc-600 fade-up-5">
            Don't have an account?{" "}
            <NavLink to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Create one free
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}