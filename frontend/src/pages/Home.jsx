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
      if (!session) return;
      try {
        const res = await api.get("/me");
        setMe(res.data);
      } catch {
        setMe(null);
      }
    };

    loadMe();
  }, [session]);

  if (loading) return <div className="p-6">Loading...</div>;

  // Public home
  if (!session) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <h1 className="text-2xl font-semibold">NUS Flashcards</h1>
        <p className="mt-2 text-gray-700">Login or register to start.</p>

        <div className="mt-6 flex gap-3">
          <Link to="/login" className="px-4 py-2 bg-black text-white rounded">
            Login
          </Link>
          <Link to="/register" className="px-4 py-2 border rounded">
            Register
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated home (app)
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Your Decks</h1>
          <button
            className="px-4 py-2 bg-black text-white rounded"
            onClick={async () => {
              await supabase.auth.signOut();
            }}
          >
            Logout
          </button>
        </div>

        <div className="mt-3 text-sm">
          Signed in as: {user?.email}
        </div>

        {me && (
          <pre className="bg-gray-100 p-3 mt-4 text-sm rounded overflow-auto">
            {JSON.stringify(me, null, 2)}
          </pre>
        )}

        <div className="mt-6 text-sm text-gray-600">
          Flashcard UI goes here.
        </div>
      </div>
    </div>
  );
}
