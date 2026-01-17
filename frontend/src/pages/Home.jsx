import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useSession } from "../hooks/useSession";
import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Home() {
  const { session, user, loading } = useSession();
  const [me, setMe] = useState(null);

  useEffect(() => {
    const loadMe = async () => {
      if (!session) {
        setMe(null);
        return;
      }
      try {
        const res = await api.get("/me");
        setMe(res.data);
      } catch {
        setMe(null);
      }
    };

    loadMe();
  }, [session]);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-10 w-full border-b border-slate-200 bg-white">
        <div className="flex h-14 w-full items-center justify-between px-6">
          <Link to="/" className="text-lg font-semibold text-blue-600">
            Vocario
          </Link>

          <nav className="flex items-center gap-3">
            {loading ? (
              <span className="text-sm text-slate-500">Loading…</span>
            ) : session ? (
              <>
                <span className="hidden text-sm text-slate-600 sm:inline">
                  {user?.email}
                </span>
                <button
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                  onClick={async () => {
                    await supabase.auth.signOut();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full px-6 py-10">
        {!loading && !session && (
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold tracking-tight">
              My collection
            </h1>
            <p className="mt-2 text-slate-600">
              Login or register to start.
            </p>
          </div>
        )}

        {!loading && session && (
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome
            </h1>
            <p className="mt-2 text-slate-600">
              You are signed in. This area will become your flashcard app.
            </p>

            {me && (
              <pre className="mt-6 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800">
                {JSON.stringify(me, null, 2)}
              </pre>
            )}
          </div>
        )}

        {loading && (
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <span className="text-sm text-slate-600">Loading…</span>
          </div>
        )}
      </main>
    </div>
  );
}
