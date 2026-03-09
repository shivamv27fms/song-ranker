import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import SongCard from '../components/SongCard.jsx';
import toast from 'react-hot-toast';

export default function Library() {
  const [songs, setSongs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('elo_rating');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const LIMIT = 24;

  useEffect(() => {
    loadSongs();
  }, [page, sort]);

  async function loadSongs() {
    setLoading(true);
    try {
      const result = await api.songs.list({ page, limit: LIMIT, sort, order: 'desc' });
      setSongs(result.songs);
      setTotal(result.total);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this song from your library?')) return;
    try {
      await api.songs.delete(id);
      toast.success('Song removed');
      loadSongs();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);
  const filtered = search
    ? songs.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.artist.toLowerCase().includes(search.toLowerCase())
      )
    : songs;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Library</h1>
          <p className="text-dark-400 text-sm mt-1">{total} songs in your collection</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Filter songs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input text-sm"
          />
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="input text-sm"
          >
            <option value="elo_rating">ELO Rating</option>
            <option value="matches_played">Matches Played</option>
            <option value="title">Title</option>
            <option value="artist">Artist</option>
            <option value="created_at">Date Added</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-dark-400">
          <svg className="animate-spin h-8 w-8 mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-dark-500">
          <svg className="w-16 h-16 mb-4 opacity-30" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <p className="text-lg">No songs found</p>
          <p className="text-sm mt-1">Search for songs to add them to your library</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filtered.map((song) => (
            <div key={song.id} className="relative group">
              <SongCard song={song} />
              <button
                onClick={() => handleDelete(song.id)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-dark-900/90 text-red-400 
                           opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center
                           hover:bg-red-600 hover:text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-sm px-3 py-1.5"
          >
            ← Prev
          </button>
          <span className="text-dark-400 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary text-sm px-3 py-1.5"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
