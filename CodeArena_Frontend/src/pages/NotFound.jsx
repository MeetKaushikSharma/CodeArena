import { NavLink } from "react-router";
import { Code2, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0b0b10] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(circle, #818cf8 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/10">
          <Code2 size={32} className="text-indigo-400" />
        </div>
        
        <h1 className="text-6xl font-bold tracking-tighter mb-4" style={{ background: "linear-gradient(135deg, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          404
        </h1>
        
        <p className="text-xl text-zinc-300 font-medium mb-2">Page not found</p>
        <p className="text-zinc-500 max-w-sm mb-10 text-sm leading-relaxed">
          The problem or page you're looking for doesn't exist, has been moved, or you don't have access to it.
        </p>

        <NavLink to="/" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5 active:scale-[0.98]">
          <ArrowLeft size={16} />
          Back to CodeArena
        </NavLink>
      </div>
    </div>
  );
}
