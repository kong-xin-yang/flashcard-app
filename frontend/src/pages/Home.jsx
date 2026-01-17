import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useSession } from "../hooks/useSession";
import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Home() {
  const { session, user, loading: sessionLoading } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [me, setMe] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({ title: "", description: "" });
  const isFormValid = formData.title.trim() !== "" && formData.description.trim() !== "";

  // Fetch user profile data
  useEffect(() => {
    let isMounted = true;
    const loadMe = async () => {
      if (!session) {
        setMe(null);
        return;
      }
      try {
        const res = await api.get("/me");
        if (isMounted) setMe(res.data);
      } catch {
        if (isMounted) setMe(null);
      }
    };
    loadMe();
    return () => { isMounted = false; };
  }, [session]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isModalOpen) setFormData({ title: "", description: "" });
  }, [isModalOpen]);

  const handleSubmit = async (e, shouldClose = true) => {
    if (e) e.preventDefault();
    if (!isFormValid || isSaving) return;

    setIsSaving(true);
    try {
      // 1. Perform the save
      await api.post("/entries", formData);

      // 2. Clear current inputs immediately so the user sees a fresh form
      setFormData({ title: "", description: "" });

      // 3. Decide whether to exit or stay
      if (shouldClose) {
        setIsModalOpen(false);
      } else {
        // If "Next", refocus the first input (optional but helpful)
        document.getElementById("word-input")?.focus();
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <Header loading={sessionLoading} session={session} email={user?.email} />

      <main className="w-full px-6 py-10">
        {/* Not signed in */}
        {!sessionLoading && !session && <LandingHero />}

        {/* Signed in */}
        {!sessionLoading && session && (
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
            
            <div className="flex flex-grow items-start px-20 py-12">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-44 h-64 bg-white text-black rounded-[40px] border-4 border-black text-6xl shadow-lg hover:bg-gray-50 transition-all active:scale-95"
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

        {/* Loading */}
        {sessionLoading && <LoadingSkeleton />}
      </main>

      {isModalOpen && (
        <EntryModal 
          formData={formData} 
          setFormData={setFormData}
          isFormValid={isFormValid}
          isSaving={isSaving}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

// Sub-components

function Header({ loading, session, email }) {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-slate-200 bg-white">
      <div className="flex h-14 w-full items-center justify-between px-6">
        <Link to="/" className="text-lg font-semibold text-blue-600">Vernacular</Link>
        <nav className="flex items-center gap-3">
          {loading ? (
            <span className="text-sm text-slate-500">Loading…</span>
          ) : session ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:inline">{email}</span>
              <button onClick={() => supabase.auth.signOut()} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

// Log-in/register page
function LandingHero() {
  return (
    <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold tracking-tight">Built for students going on exchange.</h1>
      <p className="mt-2 text-slate-600">Learn the words you actually need, in context.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {[
          { step: "1.", title: "Pick a Destination", text: "Tailor vocabulary to the region and situations you'll actually encounter." },
          { step: "2.", title: "Build Your Vault", text: "Save unfamiliar words. Your vault becomes the context used to teach nuance." },
          { step: "3.", title: "Master the Slang", text: "Study with adaptive flashcards that generate new sentences every time." }
        ].map((item, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-5">
            <div className="text-sm font-semibold text-blue-600">{item.step}</div>
            <h3 className="mt-2 font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pop-up window
function EntryModal({ formData, setFormData, isFormValid, isSaving, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-[40px] border-4 border-black bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black">Create New Entry</h2>
          <button onClick={onClose} className="text-2xl text-black hover:text-gray-500">✕</button>
        </div>
        <form className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-black">Word:</label>
            <input
              id="word-input" // Added for auto-focus on 'Next'
              autoFocus
              required
              className="w-full !rounded-[20px] !border-4 !border-black !bg-white p-4 text-black outline-none focus:ring-4 focus:ring-blue-100"
              placeholder="Enter word"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-black">Definition:</label>
            <textarea
              rows={3}
              className="w-full rounded-[20px] border-4 border-black p-4 text-black outline-none focus:ring-4 focus:ring-blue-100"
              placeholder="Enter definition"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="mt-2 flex flex-col gap-3">
            <button
              type="button"
              disabled={!isFormValid || isSaving}
              onClick={(e) => onSubmit(e, true)}
              className="disabled:opacity-30 rounded-[20px] bg-black py-4 text-lg font-bold text-white shadow-md transition-all hover:bg-gray-800 active:scale-95"
            >
              {isSaving ? "Saving..." : "Done"}
            </button>
            <button
              type="button"
              disabled={!isFormValid || isSaving}
              onClick={(e) => onSubmit(e, false)}
              className="disabled:opacity-30 rounded-[20px] bg-white border-4 border-black py-4 text-lg font-bold text-black shadow-md transition-all hover:bg-gray-100 active:scale-95"
            >
              {isSaving ? "Saving..." : "Next"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Loading screen 
function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <span className="text-sm text-slate-600">Loading…</span>
    </div>
  );
}