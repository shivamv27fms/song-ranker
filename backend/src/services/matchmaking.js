import { getDb } from '../database/init.js';
import { getRecentComparisons } from '../database/queries.js';

/**
 * Smart matchmaking: pick the best pair of songs to compare.
 *
 * Scoring criteria (lower is better):
 *  1. Prefer songs with similar ELO (small ELO diff)
 *  2. Prefer songs with similar number of matches played
 *  3. Prioritize songs with fewer total matches (under-rated songs)
 *  4. Avoid recently compared pairs
 */
export function getNextPair() {
  const db = getDb();

  const songs = db.prepare(
    'SELECT id, elo_rating, matches_played FROM songs ORDER BY matches_played ASC'
  ).all();

  if (songs.length < 2) return null;

  // Build a set of recently compared pairs to avoid repeats
  const recentPairs = new Set();
  const recent = getRecentComparisons(100);
  for (const c of recent) {
    const key1 = `${c.song_a_id}-${c.song_b_id}`;
    const key2 = `${c.song_b_id}-${c.song_a_id}`;
    recentPairs.add(key1);
    recentPairs.add(key2);
  }

  // Candidate pool: take the 50 songs with fewest matches for efficiency (avoid O(n²))
  const candidates = songs.slice(0, Math.min(50, songs.length));

  let bestScore = Infinity;
  let bestPair = null;

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];

      const pairKey = `${a.id}-${b.id}`;
      const recentPenalty = recentPairs.has(pairKey) ? 10000 : 0;

      // Normalised ELO difference (0-1 range, lower = closer in rating)
      const eloDiff = Math.abs(a.elo_rating - b.elo_rating);
      const normalizedElo = eloDiff / 400;

      // Normalized match count difference
      const matchDiff = Math.abs(a.matches_played - b.matches_played);
      const normalizedMatch = matchDiff / 20;

      // Prioritize under-matched songs
      const avgMatches = (a.matches_played + b.matches_played) / 2;
      const matchPriority = avgMatches / 100;

      const score = normalizedElo + normalizedMatch + matchPriority + recentPenalty;

      if (score < bestScore) {
        bestScore = score;
        bestPair = [a.id, b.id];
      }
    }
  }

  if (!bestPair) return null;

  // Randomly swap the pair so "left/right" position is not always biased
  if (Math.random() > 0.5) bestPair.reverse();

  const [idA, idB] = bestPair;
  const songA = db.prepare('SELECT * FROM songs WHERE id = ?').get(idA);
  const songB = db.prepare('SELECT * FROM songs WHERE id = ?').get(idB);

  return { songA, songB };
}
