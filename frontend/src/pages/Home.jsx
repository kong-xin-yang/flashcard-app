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
  const isFormValid = formData.title.trim() !== "" && formData.description.trim() !== "";

  // 1. Reset form when modal is closed to avoid "remembering" old text
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
          <Link to="/" className="text-lg font-semibold text-blue-600">Vocario</Link>
          <nav className="flex items-center gap-3">
            {loading ? <span className="text-sm text-slate-500">Loading…</span> : session ? (
              <button className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700" onClick={() => supabase.auth.signOut()}>Logout</button>
            ) : (
              <Link to="/login" className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">Login</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="w-full px-6 py-10">
        {!loading && session && (
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
            <div className="flex-grow flex items-start px-20 py-12">
              <button
                onClick={() => setIsModalOpen(true)}
                className="!bg-white text-black w-44 h-64 !rounded-[40px] !border-4 !border-black text-6xl shadow-lg hover:bg-gray-50 transition-all"
              >
                +
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal Logic */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-white w-full max-w-md p-8 !rounded-[40px] !border-4 !border-black shadow-2xl z-10 mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">Create New Entry</h2>
              <button onClick={() => setIsModalOpen(false)} className="!bg-transparent text-black text-2xl hover:text-gray-500">✕</button>
            </div>

            <form className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 text-left">
                <label className="font-bold text-sm text-black">Word:</label>
                <input
                  autoFocus
                  required
                  className="w-full p-4 !bg-white !border-4 !border-black !rounded-[20px] focus:ring-4 focus:ring-blue-100 outline-none text-black"
                  placeholder="Enter word"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label className="font-bold text-sm text-black">Definition</label>
                <textarea
                  required
                  rows="3"
                  className="w-full p-4 !bg-white !border-4 !border-black !rounded-[20px] focus:ring-4 focus:ring-blue-100 outline-none text-black"
                  placeholder="Enter definition"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <button
                  type="button"
                  disabled={!isFormValid}
                  onClick={(e) => handleSubmit(e, true)}
                  className="disabled:opacity-30 disabled:cursor-not-allowed !bg-black text-white py-4 !rounded-[20px] font-bold text-lg hover:bg-gray-800 transition-all active:scale-95 shadow-md"
                >
                  Done
                </button>

                <button
                  type="button"
                  disabled={!isFormValid}
                  onClick={(e) => handleSubmit(e, false)}
                  className="disabled:opacity-30 disabled:cursor-not-allowed !bg-white text-black border-4 border-black py-4 !rounded-[20px] font-bold text-lg hover:bg-gray-100 transition-all active:scale-95 shadow-md"
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