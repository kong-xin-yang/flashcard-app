import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { useSession } from "../hooks/useSession";

export default function DeckDetail() {
  const { deckId } = useParams();
  const { user } = useSession(); // We need user.id for the backend route
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. Fetch the cards first
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await api.get(`/decks/${deckId}/cards`);
        setCards(res.data);
      } catch (err) {
        console.error("Error fetching cards:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [deckId]);

  // 2. THE GENERATOR FUNCTION
  const generateSentence = async (senseId, index) => {
  // 1. Convert IDs to Numbers to match FastAPI's "int" requirement
  const numericUserId = parseInt(user?.id);
  const numericSenseId = parseInt(senseId);

  // 2. Safety check: If they are NaN (Not a Number), don't send the request
  if (isNaN(numericUserId) || isNaN(numericSenseId)) {
    console.error("❌ IDs are not valid integers:", { userId: user?.id, senseId });
    return;
  }

  try {
    // We use the numeric versions in the URL
    const res = await api.post(`/users/${numericUserId}/senses/${numericSenseId}/sentence_history`, {
      language: "Spanish"
    });

    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, current_sentence: res.data.sentence } : c))
    );
  } catch (err) {
    console.error("Auto-gen failed:", err.response?.data || err.message);
  }
};

  // 3. THE AUTO-TRIGGER
  // This watches the currentIndex. When you move to a new card, 
  // it checks if a sentence exists. If not, it fires the POST request.
  useEffect(() => {
    if (cards.length > 0) {
      const currentCard = cards[currentIndex];
      if (!currentCard.current_sentence) {
        generateSentence(currentCard.sense_id, currentIndex);
      }
    }
  }, [currentIndex, cards, user]);

  if (loading) return <div className="p-10 text-center">Loading cards...</div>;
  if (cards.length === 0) return <div className="p-10 text-center">Empty deck.</div>;

  const currentCard = cards[currentIndex];

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-50 p-6">
      <div className="w-full max-w-2xl">
        <Link to="/" className="text-sm font-bold uppercase text-slate-400 hover:text-black">
          ← Back
        </Link>

        {/* Progress Tracker */}
        <div className="mt-8 flex items-center justify-between text-xs font-black text-slate-400">
          <span>CARD {currentIndex + 1} OF {cards.length}</span>
          <span>{Math.round(((currentIndex + 1) / cards.length) * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
          <div 
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>

        {/* Flashcard Display */}
        <div className="mt-10 flex justify-center">
          <Flashcard 
            key={currentCard.id} 
            sentence={currentCard.current_sentence}
            word={currentCard.senses?.word} 
            translation={currentCard.senses?.translation} 
          />
        </div>

        {/* Navigation */}
        <div className="mt-12 flex items-center justify-between">
          <button 
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            className="rounded-2xl border-4 border-black bg-white px-6 py-3 font-black transition-all active:scale-95 disabled:opacity-20"
            disabled={currentIndex === 0}
          >
            PREVIOUS
          </button>
          <button 
            onClick={() => setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1))}
            className="rounded-2xl border-4 border-black bg-black px-10 py-3 font-black text-white transition-all active:scale-95 disabled:opacity-20"
            disabled={currentIndex === cards.length - 1}
          >
            NEXT
          </button>
        </div>
      </div>
    </div>
  );
}

function Flashcard({ sentence, word, translation }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div 
      onClick={() => setFlipped(!flipped)}
      className="group relative h-96 w-full max-w-md cursor-pointer perspective-1000"
    >
      <div className={`relative h-full w-full transition-all duration-500 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
        
        {/* FRONT: AI Sentence */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[40px] border-4 border-black bg-white p-10 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] [backface-visibility:hidden]">
          
          {sentence ? (
            <p className="text-2xl font-medium text-center italic leading-relaxed text-slate-800">
              "{sentence}"
            </p>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
              <p className="text-sm font-bold text-slate-400 italic">Thinking of a sentence...</p>
            </div>
          )}
        </div>

        {/* BACK: Meaning */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[40px] border-4 border-black bg-blue-600 p-10 text-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="text-4xl font-black opacity-70">{word}</span>
          <div className="my-4 h-px w-16" />
          <span className="text-4xl font-black text-center">{translation}</span>
        </div>
        
      </div>
    </div>
  );
}