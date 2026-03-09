const PLACEHOLDER = 'https://via.placeholder.com/150/1e293b/475569?text=♪';

export default function SongCard({ song, onChoose, isWinner, isLoser, compact = false }) {
  const winRate = song.matches_played > 0
    ? Math.round((song.wins / song.matches_played) * 100)
    : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <img
          src={song.cover_art_url || PLACEHOLDER}
          alt={song.album || song.title}
          className="w-10 h-10 rounded object-cover bg-dark-800 flex-shrink-0"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
        <div className="min-w-0">
          <p className="font-medium text-dark-100 truncate">{song.title}</p>
          <p className="text-sm text-dark-400 truncate">{song.artist}</p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onChoose}
      disabled={!onChoose}
      className={`card p-0 overflow-hidden transition-all duration-300 flex flex-col w-full
        ${onChoose ? 'cursor-pointer hover:border-violet-500 hover:shadow-lg hover:shadow-violet-900/20 active:scale-95' : ''}
        ${isWinner ? 'border-green-500 shadow-lg shadow-green-900/30 ring-2 ring-green-500/40' : ''}
        ${isLoser ? 'border-red-800 opacity-60' : ''}
      `}
    >
      {/* Album art */}
      <div className="w-full aspect-square bg-dark-800 relative overflow-hidden">
        <img
          src={song.cover_art_url || PLACEHOLDER}
          alt={song.album || song.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
        {isWinner && (
          <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
            <span className="text-4xl">✓</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-dark-950/90 to-transparent p-3">
          <p className="text-xs text-dark-400 font-mono">ELO {Math.round(song.elo_rating)}</p>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 text-left">
        <h3 className="font-semibold text-dark-100 text-lg leading-snug mb-1 line-clamp-2">
          {song.title}
        </h3>
        <p className="text-dark-300 text-sm mb-0.5">{song.artist}</p>
        {song.album && <p className="text-dark-500 text-xs mb-3 truncate">{song.album}</p>}

        <div className="flex gap-3 text-xs text-dark-500">
          {song.year && <span>{song.year}</span>}
          <span>{song.matches_played} matches</span>
          <span>{winRate}% wins</span>
        </div>
      </div>
    </button>
  );
}
