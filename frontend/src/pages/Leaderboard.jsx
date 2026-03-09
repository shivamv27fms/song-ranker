import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://via.placeholder.com/40/1e293b/475569?text=♪';

export default function Leaderboard() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('elo_rating');
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    loadLeaderboard();
  }, [sort, limit]);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const data = await api.leaderboard.get({ sort, limit });
      setSongs(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getRankColor(rank) {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-dark-500';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-dark-400 text-sm mt-1">Top ranked songs by ELO rating</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input text-sm"
          >
            <option value="elo_rating">Sort by ELO</option>
            <option value="matches_played">Sort by Matches</option>
            <option value="wins">Sort by Wins</option>
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="input text-sm"
          >
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
            <option value={500}>Top 500</option>
          </select>
          <button
            onClick={() => api.export.leaderboardCsv()}
            className="btn-secondary text-sm"
          >
            Export CSV
          </button>
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
      ) : songs.length === 0 ? (
        <div className="text-center text-dark-500 mt-20">
          <p>No songs ranked yet. Add songs and start comparing!</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-800 text-dark-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-12">#</th>
                <th className="px-4 py-3 text-left">Song</th>
                <th className="px-4 py-3 text-right">ELO</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">Matches</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">Win Rate</th>
                <th className="px-4 py-3 text-center hidden lg:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song, idx) => (
                <tr
                  key={song.id}
                  className={`border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors
                    ${song.likely_top_100 ? 'bg-violet-900/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className={`font-bold text-base ${getRankColor(idx + 1)}`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={song.cover_art_url || PLACEHOLDER}
                        alt={song.title}
                        className="w-10 h-10 rounded object-cover bg-dark-800 flex-shrink-0"
                        onError={(e) => { e.target.src = PLACEHOLDER; }}
                      />
                      <div>
                        <p className="font-medium text-dark-100">{song.title}</p>
                        <p className="text-dark-400 text-xs">{song.artist}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-semibold text-violet-400">
                      {Math.round(song.elo_rating)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-dark-400 hidden sm:table-cell">
                    {song.matches_played}
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className={`font-medium ${
                      song.win_rate >= 60 ? 'text-green-400' :
                      song.win_rate <= 40 ? 'text-red-400' : 'text-dark-300'
                    }`}>
                      {song.win_rate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    {song.likely_top_100 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                       bg-violet-600/20 text-violet-400 text-xs border border-violet-600/30">
                        ✦ Top 100
                      </span>
                    )}
                    {song.matches_played < 5 && (
                      <span className="text-dark-600 text-xs">New</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
