import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { checkAuth } from "../authSlice";
import axiosClient from "../utils/axiosClient";

export default function OAuthSuccess() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");

    if (!code) {
      navigate("/login?error=oauth_failed", { replace: true });
      return;
    }

    // Exchange code → backend sets cookie → checkAuth
    axiosClient
      .get(`/user/auth/exchange?code=${code}`)
      .then(() => dispatch(checkAuth()))
      .then((result) => {
        if (result.type.endsWith("/fulfilled") && result.payload) {
          navigate("/", { replace: true });
        } else {
          navigate("/login?error=oauth_failed", { replace: true });
        }
      })
      .catch(() => navigate("/login?error=oauth_failed", { replace: true }));
  }, []); // ← empty deps, runs once, no remount issues

  return (
    <div className="min-h-screen bg-[#0b0b10] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-500 text-sm">Completing sign-in…</p>
      </div>
    </div>
  );
}