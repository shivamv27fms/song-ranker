import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import SongCard from '../components/SongCard.jsx';
import toast from 'react-hot-toast';

export default function Compare() {
  const [pair, setPair] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { winnerId }
  const [count, setCount] = useState(0);
  const [error, setError] = useState(null);

  const loadPair = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await api.compare.next();
      setPair(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPair();
  }, [loadPair]);

  const handleChoose = useCallback(async (winnerId) => {
    if (submitting || result) return;
    setSubmitting(true);
    setResult({ winnerId });
    try {
      await api.compare.submit({
        song_a_id: pair.songA.id,
        song_b_id: pair.songB.id,
        winner_id: winnerId,
      });
      setCount((c) => c + 1);
      setTimeout(loadPair, 800);
    } catch (err) {
      toast.error(err.message);
      setResult(null);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, result, pair, loadPair]);

  const handleSkip = useCallback(async () => {
    if (submitting || result) return;
    setSubmitting(true);
    try {
      await api.compare.submit({
        song_a_id: pair.songA.id,
        song_b_id: pair.songB.id,
        winner_id: null,
      });
      setCount((c) => c + 1);
      loadPair();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, result, pair, loadPair]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Compare</h1>
          <p className="text-dark-400 text-sm mt-1">
            Which song do you prefer?
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-violet-400">{count}</p>
          <p className="text-xs text-dark-500">comparisons this session</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-80 text-dark-400">
          <svg className="animate-spin h-8 w-8 mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading next pair...
        </div>
      ) : error ? (
        <div className="text-center mt-20">
          <div className="text-6xl mb-4">🎵</div>
          <p className="text-dark-300 text-lg mb-2">{error}</p>
          <p className="text-dark-500 text-sm mb-6">
            Search for songs and add at least 2 to your library to start comparing.
          </p>
          <a href="/search" className="btn-primary inline-block">Search for Songs</a>
        </div>
      ) : pair ? (
        <>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <SongCard
              song={pair.songA}
              onChoose={() => handleChoose(pair.songA.id)}
              isWinner={result?.winnerId === pair.songA.id}
              isLoser={result?.winnerId === pair.songB.id}
            />
            <SongCard
              song={pair.songB}
              onChoose={() => handleChoose(pair.songB.id)}
              isWinner={result?.winnerId === pair.songB.id}
              isLoser={result?.winnerId === pair.songA.id}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleChoose(pair.songA.id)}
              disabled={submitting || !!result}
              className="btn-primary flex items-center gap-2"
            >
              <span>← Choose Left</span>
              <kbd className="text-xs bg-violet-800 px-1.5 py-0.5 rounded opacity-70">←</kbd>
            </button>
            <button
              onClick={handleSkip}
              disabled={submitting || !!result}
              className="btn-secondary flex items-center gap-2"
            >
              <span>Skip</span>
              <kbd className="text-xs bg-dark-700 px-1.5 py-0.5 rounded opacity-70">Space</kbd>
            </button>
            <button
              onClick={() => handleChoose(pair.songB.id)}
              disabled={submitting || !!result}
              className="btn-primary flex items-center gap-2"
            >
              <kbd className="text-xs bg-violet-800 px-1.5 py-0.5 rounded opacity-70">→</kbd>
              <span>Choose Right →</span>
            </button>
          </div>

          <p className="text-center text-dark-600 text-xs mt-4">
            Use arrow keys to choose · Space to skip
          </p>
        </>
      ) : null}
    </div>
  );
}
