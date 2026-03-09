import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import StatsCard from '../components/StatsCard.jsx';
import SongCard from '../components/SongCard.jsx';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const result = await api.analytics.get();
      setData(result);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-400">
        <svg className="animate-spin h-8 w-8 mr-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading analytics...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-dark-400 text-sm mt-1">Progress and statistics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatsCard label="Total Songs" value={data.totalSongs} color="violet" />
        <StatsCard label="Comparisons" value={data.totalComparisons} color="blue" />
        <StatsCard label="Songs > 10 matches" value={data.songsOver10} color="green" />
        <StatsCard label="Songs > 20 matches" value={data.songsOver20} color="green" />
        <StatsCard label="Median ELO" value={data.medianElo} color="amber" />
        <StatsCard
          label="Ranking Stability"
          value={`${data.stability}%`}
          color={data.stability > 70 ? 'green' : data.stability > 40 ? 'amber' : 'red'}
          sub="% of songs stable in last 5 matches"
        />
      </div>

      {/* Progress bar */}
      <div className="card p-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-dark-300 font-medium">Ranking Progress</span>
          <span className="text-sm text-dark-400">
            {data.songsOver20} / {data.totalSongs} songs well-ranked
          </span>
        </div>
        <div className="w-full bg-dark-800 rounded-full h-3">
          <div
            className="bg-violet-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${data.totalSongs > 0 ? (data.songsOver20 / data.totalSongs) * 100 : 0}%` }}
          />
        </div>
        <p className="text-xs text-dark-500 mt-2">
          Songs need {'>'}20 matches to be considered well-ranked
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rising songs */}
        <div className="card p-4">
          <h2 className="font-semibold text-dark-100 mb-4 flex items-center gap-2">
            <span className="text-green-400">↑</span> Top Rising Songs
          </h2>
          {data.risingSongs.length === 0 ? (
            <p className="text-dark-500 text-sm">Not enough data yet. Keep comparing!</p>
          ) : (
            <div className="space-y-3">
              {data.risingSongs.map((song) => (
                <div key={song.id} className="flex items-center gap-3">
                  <SongCard song={song} compact />
                  <div className="ml-auto text-right flex-shrink-0">
                    <p className="text-green-400 font-mono text-sm font-semibold">
                      +{Math.round(song.elo_gain)}
                    </p>
                    <p className="text-dark-500 text-xs">ELO gain</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controversial songs */}
        <div className="card p-4">
          <h2 className="font-semibold text-dark-100 mb-4 flex items-center gap-2">
            <span className="text-amber-400">⚡</span> Most Controversial
          </h2>
          {data.controversialSongs.length === 0 ? (
            <p className="text-dark-500 text-sm">Not enough data yet. Keep comparing!</p>
          ) : (
            <div className="space-y-3">
              {data.controversialSongs.map((song) => {
                const winRate = song.matches_played > 0
                  ? Math.round((song.wins / song.matches_played) * 100)
                  : 0;
                return (
                  <div key={song.id} className="flex items-center gap-3">
                    <SongCard song={song} compact />
                    <div className="ml-auto text-right flex-shrink-0">
                      <p className="text-amber-400 font-mono text-sm font-semibold">
                        {winRate}%
                      </p>
                      <p className="text-dark-500 text-xs">win rate</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
