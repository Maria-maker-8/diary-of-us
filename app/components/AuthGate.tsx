"use client";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { hasSupabase } from "../lib/supabase";

type Mode = "signin" | "signup" | "join";

export function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!hasSupabase) {
    return <>{children}</>;
  }

  if (auth?.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e27]">
        <div className="text-sm text-slate-400">Loading…</div>
      </div>
    );
  }

  if (auth?.user) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    if (mode === "join") {
      const res = await auth!.joinWithCode(inviteCode);
      setLoading(false);
      if (res.error) setMessage({ type: "error", text: res.error.message });
      else setMessage({ type: "ok", text: "Joined! Refreshing…" });
      return;
    }
    if (mode === "signin") {
      const res = await auth!.signIn(email, password);
      setLoading(false);
      if (res.error) setMessage({ type: "error", text: res.error.message });
      return;
    }
    const res = await auth!.signUp(email, password);
    setLoading(false);
    if (res.error) setMessage({ type: "error", text: res.error.message });
    else setMessage({ type: "ok", text: "Check your email to confirm, then sign in." });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e27] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1f3a] p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-2xl">💫</span>
          <h1 className="text-lg font-semibold text-slate-50">Diary of Us</h1>
        </div>
        <p className="mb-4 text-xs text-slate-400">
          Sign in or create an account to save your journal in the cloud and share it with your partner.
        </p>

        {mode === "join" ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-medium text-slate-300">
              Invite code (from your partner)
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm uppercase tracking-widest text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400/50"
              maxLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-600 disabled:opacity-50"
            >
              {loading ? "Joining…" : "Join journal"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("signin"); setMessage(null); }}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200"
            >
              I already have an account
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/50"
            />
            <label className="block text-xs font-medium text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-600 disabled:opacity-50"
            >
              {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
            <div className="flex justify-between text-xs">
              <button
                type="button"
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(null); }}
                className="text-slate-400 hover:text-slate-200"
              >
                {mode === "signin" ? "Create account" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => { setMode("join"); setMessage(null); }}
                className="text-slate-400 hover:text-slate-200"
              >
                Join with code
              </button>
            </div>
          </form>
        )}

        {message && (
          <p
            className={`mt-3 text-center text-sm ${
              message.type === "error" ? "text-rose-300" : "text-emerald-300"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
