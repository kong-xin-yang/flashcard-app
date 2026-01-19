import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useSession } from "../hooks/useSession";
import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Home() {
  const { session, user, loading: sessionLoading } = useSession();
  
  // State for Data
  const [me, setMe] = useState(null);
  const [decks, setDecks] = useState([]);
  const [activeDeckId, setActiveDeckId] = useState(null);
  
  // State for UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState("createDeck"); // 'createDeck' or 'addCards'
  const [isSaving, setIsSaving] = useState(false);

  // State for Forms
  const [deckData, setDeckData] = useState({ name: "" });
  const [cardData, setCardData] = useState({ word: "", translation: "" });

  // 1. Fetch User Profile and Decks on Load
  useEffect(() => {
    let isMounted = true;
    // Inside your useEffect in Home.jsx
const loadAppData = async () => {
  if (!session?.user?.email) return;

  try {
    let user_id;
    
    try {
      // 1. Try to find the user using your GET endpoint
      const userRes = await api.get(`/user_profiles/lookup?email=${session.user.email}`);
      user_id = userRes.data.user_id;
    } catch (err) {
      // 2. If 404, use your EXISTING app.post("/user_profiles") to create them
      if (err.response?.status === 404) {
        const createRes = await api.post("/user_profiles", { email: session.user.email });
        
        // Supabase returns an array, so we get the ID from the first element
        user_id = createRes.data.id; 
      } else {
        throw err;
      }
    }

    if (isMounted) {
      setMe({ user_id });
      // 3. Now fetch decks safely
      const decksRes = await api.get(`/users/${user_id}/decks`);
      setDecks(decksRes.data);
    }
  } catch (error) {
    console.error("Initialization error:", error);
  }
};

    loadAppData();
    return () => { isMounted = false; };
  }, [session]);

  // 2. Handle Creating a New Deck
  const handleCreateDeck = async (e) => {
    if (e) e.preventDefault();
    if (!deckData.name.trim() || isSaving) return;

    console.log("Current user profile:", me);
    console.log("Payload being sent:", deckData);

    setIsSaving(true);
    try {
      // Hits backend: @app.post("/user_profiles/{user_id}/decks")
      const res = await api.post(`/user_profiles/${me.user_id}/decks`, deckData);
      const newDeck = Array.isArray(res.data) ? res.data[0] : res.data;

      setDecks((prev) => [...prev, newDeck]);
      setActiveDeckId(newDeck.id);
      
      // Transition to Add Card view
      setModalView("addCards");
    } catch (error) {
      console.error("Error creating deck:", error);
      alert("Failed to create deck.");
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Handle Adding Cards to the newly created Deck
  const handleAddCard = async (e, shouldClose = false) => {
    if (e) e.preventDefault();
    if (!cardData.word.trim() || isSaving) return;

    setIsSaving(true);
    try {
      // Hits backend: @app.post("/decks/{deck_id}/cards")
      // This will automatically handle the "senses" logic in your backend
      await api.post(`/decks/${activeDeckId}/cards`, cardData);

      setCardData({ word: "", translation: "" });

      if (shouldClose) {
        setIsModalOpen(false);
        setModalView("createDeck"); // Reset view for next time
        setDeckData({ name: "" });
      } else {
        // Focus back on word input for the next entry
        setTimeout(() => document.getElementById("word-input")?.focus(), 50);
      }
    } catch (error) {
      console.error("Error saving card:", error);
      alert("Failed to save card.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <Header loading={sessionLoading} session={session} email={user?.email} />

      <main className="w-full px-6 py-10">
        {!sessionLoading && !session && <LandingHero />}

        {!sessionLoading && session && (
          <div className="mx-auto max-w-5xl">
            <h1 className="text-4xl font-black tracking-tight mb-8">My Collection</h1>
            
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {/* Existing Decks */}
              {decks.map((deck) => (
                <Link 
                  to={`/deck/${deck.id}`} 
                  key={deck.id}
                  className="group relative flex h-64 w-44 flex-col items-center justify-center rounded-[40px] border-4 border-black bg-white p-4 text-center transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                >
                  <span className="text-xl font-bold">{deck.name}</span>
                </Link>
              ))}

              {/* Create New Deck Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex h-64 w-44 items-center justify-center rounded-[40px] border-4 border-black bg-white text-6xl font-light shadow-lg transition-all hover:bg-slate-50 active:scale-95"
              >
                +
              </button>
            </div>
          </div>
        )}

        {sessionLoading && <LoadingSkeleton />}
      </main>

      {isModalOpen && (
        <CombinedModal 
          view={modalView}
          deckData={deckData}
          setDeckData={setDeckData}
          cardData={cardData}
          setCardData={setCardData}
          onDeckSubmit={handleCreateDeck}
          onCardSubmit={handleAddCard}
          onClose={() => {
            setIsModalOpen(false);
            setModalView("createDeck");
            setDeckData({ name: "" });
          }}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

/** * SUB-COMPONENTS 
 */

function CombinedModal({ view, deckData, setDeckData, cardData, setCardData, onDeckSubmit, onCardSubmit, onClose, isSaving }) {
  const isDeckValid = deckData.name.trim() !== "";
  const isCardValid = cardData.word.trim() !== "" && cardData.translation.trim() !== "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-[40px] border-4 border-black bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black">
            {view === "createDeck" ? "New Deck" : "Add First Words"}
          </h2>
          <button onClick={onClose} className="text-2xl text-black hover:text-gray-500">✕</button>
        </div>

        {view === "createDeck" ? (
          <form onSubmit={onDeckSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-black">Deck Name:</label>
              <input
                autoFocus
                className="w-full rounded-[20px] border-4 border-black p-4 text-black outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Enter deck name"
                value={deckData.name}
                onChange={(e) => setDeckData({ name: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={!isDeckValid || isSaving}
              className="disabled:opacity-30 rounded-[20px] bg-black py-4 text-lg font-bold text-white shadow-md transition-all hover:bg-gray-800 active:scale-95"
            >
              {isSaving ? "Creating..." : "Next: Add Words"}
            </button>
          </form>
        ) : (
          <form className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-black">Word:</label>
              <input
                id="word-input"
                autoFocus
                className="w-full rounded-[20px] border-4 border-black p-4 text-black outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Enter word"
                value={cardData.word}
                onChange={(e) => setCardData({ ...cardData, word: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-black">Translation:</label>
              <textarea
                rows={2}
                className="w-full rounded-[20px] border-4 border-black p-4 text-black outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Enter translation"
                value={cardData.translation}
                onChange={(e) => setCardData({ ...cardData, translation: e.target.value })}
              />
            </div>
            <div className="mt-2 flex flex-col gap-3">
              <button
                type="button"
                disabled={!isCardValid || isSaving}
                onClick={(e) => onCardSubmit(e, true)}
                className="disabled:opacity-30 rounded-[20px] bg-black py-4 text-lg font-bold text-white shadow-md hover:bg-gray-800"
              >
                Done
              </button>
              <button
                type="button"
                disabled={!isCardValid || isSaving}
                onClick={(e) => onCardSubmit(e, false)}
                className="disabled:opacity-30 rounded-[20px] bg-white border-4 border-black py-4 text-lg font-bold text-black shadow-md hover:bg-gray-100"
              >
                {isSaving ? "Saving..." : "Add Another"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Header({ loading, session, email }) {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-slate-200 bg-white">
      <div className="flex h-14 w-full items-center justify-between px-6">
        <Link to="/" className="text-lg font-bold text-black uppercase tracking-tighter">Vernacular</Link>
        <nav className="flex items-center gap-3">
          {loading ? (
            <span className="text-sm text-slate-500">Loading…</span>
          ) : session ? (
            <>
              <span className="hidden text-sm font-bold text-slate-600 sm:inline">{email}</span>
              <button onClick={() => supabase.auth.signOut()} className="rounded-xl border-2 border-black bg-white px-4 py-1.5 text-sm font-bold text-black hover:bg-slate-50">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="rounded-xl border-2 border-black bg-black px-4 py-1.5 text-sm font-bold text-white hover:bg-gray-800">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function LandingHero() {
  return (
    <div className="mx-auto max-w-5xl rounded-[40px] border-4 border-black bg-white p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      <h1 className="text-5xl font-black tracking-tight leading-tight">Built for exchange.</h1>
      <p className="mt-4 text-xl text-slate-600">Master the local nuance, one card at a time.</p>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {[
          { step: "01", title: "Pick a Destination", text: "Tailor vocabulary to the region and situations you'll encounter." },
          { step: "02", title: "Build Your Vault", text: "Save words. Your vault becomes the context used to teach nuance." },
          { step: "03", title: "Master the Slang", text: "Study with adaptive cards that generate new sentences." }
        ].map((item, i) => (
          <div key={i} className="rounded-3xl border-4 border-black p-6">
            <div className="text-2xl font-black text-blue-600">{item.step}</div>
            <h3 className="mt-2 text-xl font-bold">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border-4 border-black bg-white p-8 animate-pulse">
      <div className="h-6 w-32 bg-slate-200 rounded mb-4"></div>
      <div className="h-4 w-full bg-slate-100 rounded"></div>
    </div>
  );
}