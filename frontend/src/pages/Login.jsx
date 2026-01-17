import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      nav("/");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.18),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-slate-50" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="text-xs font-medium text-blue-700">Secure sign-in</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Login</h1>
          <p className="mt-1 text-sm text-slate-600">Access your decks and reviews.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-800">Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. e0123456@u.nus.edu"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-800">Password</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              disabled={busy}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-sm text-slate-600">
            No account?{" "}
            <Link className="font-semibold text-blue-700 hover:text-blue-800 underline" to="/register">
              Register
            </Link>
          </div>

          <div className="mt-2 text-sm">
            <Link className="text-slate-600 hover:text-slate-900 underline" to="/">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
