import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { checkAuth } from "../authSlice";

export default function OAuthSuccess() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(checkAuth()).then((result) => {
      if (result.type.endsWith("/fulfilled")) {
        navigate("/", { replace: true });
      } else {
        navigate("/login?error=oauth_failed", { replace: true });
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b10] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-500 text-sm">Completing sign-in…</p>
      </div>
    </div>
  );
}