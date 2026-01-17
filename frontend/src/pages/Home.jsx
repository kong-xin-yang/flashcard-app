import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useSession } from "../hooks/useSession";
import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Home() {
  const { session, user, loading } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [me, setMe] = useState(null);

  // Modal Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  // Validation: Check if both fields are non-empty
  const isFormValid =
    formData.title.trim() !== "" && formData.description.trim() !== "";

  // Reset form when modal is closed to avoid remembering old text
  useEffect(() => {
    if (!isModalOpen) {
      setFormData({ title: "", description: "" });
    }
  }, [isModalOpen]);

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

  const handleSubmit = async (e, shouldClose = true) => {
    if (e) e.preventDefault();
    if (!isFormValid) return;

    try {
      await api.post("/entries", formData);

      // Clear current inputs after saving
      setFormData({ title: "", description: "" });

      if (shouldClose) {
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error saving entry:", error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
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
                  onClick={() => supabase.auth.signOut()}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="w-full px-6 py-10">
        {!loading && !session && (
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold tracking-tight">
              Built for students going on exchange.
            </h1>
            <p className="mt-2 text-slate-600">
              Learn the words you actually need, in context.
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-5">
                <div className="text-sm font-semibold text-blue-600">1.</div>
                <h3 className="mt-2 font-semibold">Pick a Destination</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Tell us where you’re going so we can tailor the vocabulary to
                  the language, region, and situations you’ll actually
                  encounter.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <div className="text-sm font-semibold text-blue-600">2.</div>
                <h3 className="mt-2 font-semibold">Build Your Vault</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Save unfamiliar words and phrases as you find them. Your vault
                  becomes the evolving context used to teach meaning, nuance,
                  and usage.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <div className="text-sm font-semibold text-blue-600">3.</div>
                <h3 className="mt-2 font-semibold">Master the Slang</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Study with adaptive flashcards that generate new sentences
                  every time you flip. Each sentence incorporates previously
                  learned words, expanding context continuously.
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading && session && (
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>

            <div className="flex flex-grow items-start px-20 py-12">
              <button
                onClick={() => setIsModalOpen(true)}
                className="!bg-white text-black w-44 h-64 !rounded-[40px] !border-4 !border-black text-6xl shadow-lg hover:bg-gray-50 transition-all"
              >
                +
              </button>
            </div>

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

      {/* Modal Logic */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative z-10 mx-4 w-full max-w-md !rounded-[40px] !border-4 !border-black bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-black">
                Create New Entry
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="!bg-transparent text-2xl text-black hover:text-gray-500"
              >
                ✕
              </button>
            </div>

            <form className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 text-left">
                <label className="text-sm font-bold text-black">Word:</label>
                <input
                  autoFocus
                  required
                  className="w-full !rounded-[20px] !border-4 !border-black !bg-white p-4 text-black outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter word"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label className="text-sm font-bold text-black">
                  Definition
                </label>
                <textarea
                  required
                  rows={3}
                  className="w-full !rounded-[20px] !border-4 !border-black !bg-white p-4 text-black outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter definition"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="mt-2 flex flex-col gap-3">
                <button
                  type="button"
                  disabled={!isFormValid}
                  onClick={(e) => handleSubmit(e, true)}
                  className="disabled:cursor-not-allowed disabled:opacity-30 !rounded-[20px] !bg-black py-4 text-lg font-bold text-white shadow-md transition-all hover:bg-gray-800 active:scale-95"
                >
                  Done
                </button>

                <button
                  type="button"
                  disabled={!isFormValid}
                  onClick={(e) => handleSubmit(e, false)}
                  className="disabled:cursor-not-allowed disabled:opacity-30 !rounded-[20px] !bg-white py-4 text-lg font-bold text-black shadow-md transition-all hover:bg-gray-100 active:scale-95 border-4 border-black"
                >
                  Next
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
