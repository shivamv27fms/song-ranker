import { useState } from 'react';
import { api } from '../services/api.js';
import SearchBar from '../components/SearchBar.jsx';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://via.placeholder.com/60/1e293b/475569?text=♪';

export default function Search() {
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());
  const [lastQuery, setLastQuery] = useState('');

  async function handleSearch(q) {
    setLoading(true);
    setLastQuery(q);
    try {
      const data = await api.search.query(q, { limit: 25 });
      setResults(data.recordings);
      setTotal(data.total);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(recording) {
    setAddingId(recording.musicbrainz_id);
    try {
      await api.songs.add({
        musicbrainz_id: recording.musicbrainz_id,
        title: recording.title,
        artist: recording.artist,
        album: recording.album,
        year: recording.year,
        cover_art_url: recording.cover_art_url,
      });
      setAddedIds((prev) => new Set([...prev, recording.musicbrainz_id]));
      toast.success(`Added "${recording.title}" to library`);
    } catch (err) {
      if (err.message?.includes('already')) {
        toast(`"${recording.title}" is already in your library`, { icon: 'ℹ️' });
        setAddedIds((prev) => new Set([...prev, recording.musicbrainz_id]));
      } else {
        toast.error(err.message);
      }
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Search Songs</h1>
        <p className="text-dark-400 text-sm">Search MusicBrainz for songs to add to your library</p>
      </div>

      <div className="max-w-2xl mb-6">
        <SearchBar
          onSearch={handleSearch}
          loading={loading}
          placeholder="Search by title, artist, or album..."
        />
      </div>

      {total > 0 && (
        <p className="text-dark-500 text-sm mb-4">
          Showing {results.length} of {total} results for "{lastQuery}"
        </p>
      )}

      <div className="space-y-2">
        {results.map((r) => {
          const isAdded = addedIds.has(r.musicbrainz_id);
          const isAdding = addingId === r.musicbrainz_id;
          return (
            <div
              key={r.musicbrainz_id}
              className="card p-3 flex items-center gap-4 hover:border-dark-700 transition-colors"
            >
              <img
                src={r.cover_art_url || PLACEHOLDER}
                alt={r.album || r.title}
                className="w-12 h-12 rounded object-cover bg-dark-800 flex-shrink-0"
                onError={(e) => { e.target.src = PLACEHOLDER; }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-dark-100 truncate">{r.title}</p>
                <p className="text-sm text-dark-400 truncate">{r.artist}</p>
                <p className="text-xs text-dark-500 truncate">
                  {[r.album, r.year].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button
                onClick={() => handleAdd(r)}
                disabled={isAdded || isAdding}
                className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isAdded
                    ? 'bg-green-600/20 text-green-400 border border-green-600/30 cursor-default'
                    : 'btn-primary'
                }`}
              >
                {isAdding ? '...' : isAdded ? '✓ Added' : '+ Add'}
              </button>
            </div>
          );
        })}
      </div>

      {!loading && results.length === 0 && lastQuery && (
        <div className="text-center text-dark-500 mt-12">
          <p>No results found for "{lastQuery}"</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      )}

      {!lastQuery && (
        <div className="text-center text-dark-600 mt-16">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>Search MusicBrainz to discover songs</p>
        </div>
      )}
    </div>
  );
}
