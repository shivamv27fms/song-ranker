export default function StatsCard({ label, value, sub, color = 'violet' }) {
  const colorMap = {
    violet: 'bg-violet-600/10 border-violet-600/20 text-violet-400',
    green: 'bg-green-600/10 border-green-600/20 text-green-400',
    blue: 'bg-blue-600/10 border-blue-600/20 text-blue-400',
    amber: 'bg-amber-600/10 border-amber-600/20 text-amber-400',
    red: 'bg-red-600/10 border-red-600/20 text-red-400',
  };

  return (
    <div className={`card p-4 border ${colorMap[color] || colorMap.violet}`}>
      <p className="text-dark-400 text-sm mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color]?.split(' ')[2] || 'text-violet-400'}`}>
        {value}
      </p>
      {sub && <p className="text-dark-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}
