import { Router } from 'express';
import { getNextPair } from '../services/matchmaking.js';
import { calculateNewRatings } from '../services/elo.js';
import {
  getSongById,
  updateSongElo,
  insertComparison,
  insertRatingHistory,
} from '../database/queries.js';
import { getDb } from '../database/init.js';

const router = Router();

// GET /api/compare/next
router.get('/next', (req, res, next) => {
  try {
    const pair = getNextPair();
    if (!pair) {
      return res.status(404).json({ error: 'Not enough songs in library. Add at least 2 songs.' });
    }
    res.json(pair);
  } catch (err) {
    next(err);
  }
});

// POST /api/compare
// Body: { song_a_id, song_b_id, winner_id } — winner_id = null for skip
router.post('/', (req, res, next) => {
  try {
    const { song_a_id, song_b_id, winner_id } = req.body;

    if (!song_a_id || !song_b_id) {
      return res.status(400).json({ error: 'song_a_id and song_b_id are required' });
    }

    const songA = getSongById(song_a_id);
    const songB = getSongById(song_b_id);

    if (!songA || !songB) {
      return res.status(404).json({ error: 'One or both songs not found' });
    }

    const db = getDb();

    // Use a transaction for atomic ELO update
    const processComparison = db.transaction(() => {
      const skipped = winner_id == null;
      let aEloAfter = songA.elo_rating;
      let bEloAfter = songB.elo_rating;

      if (!skipped) {
        const isAWinner = winner_id === song_a_id;
        const { winnerNew, loserNew } = calculateNewRatings(
          isAWinner ? songA.elo_rating : songB.elo_rating,
          isAWinner ? songB.elo_rating : songA.elo_rating
        );

        aEloAfter = isAWinner ? winnerNew : loserNew;
        bEloAfter = isAWinner ? loserNew : winnerNew;

        // Update winner
        const winner = isAWinner ? songA : songB;
        updateSongElo(
          winner.id,
          isAWinner ? aEloAfter : bEloAfter,
          winner.wins + 1,
          winner.losses,
          winner.matches_played + 1
        );

        // Update loser
        const loser = isAWinner ? songB : songA;
        updateSongElo(
          loser.id,
          isAWinner ? bEloAfter : aEloAfter,
          loser.wins,
          loser.losses + 1,
          loser.matches_played + 1
        );

        // Record rating history
        insertRatingHistory(isAWinner ? songA.id : songB.id, isAWinner ? aEloAfter : bEloAfter);
        insertRatingHistory(isAWinner ? songB.id : songA.id, isAWinner ? bEloAfter : aEloAfter);
      }

      const compId = insertComparison({
        song_a_id,
        song_b_id,
        winner_id: skipped ? null : winner_id,
        song_a_elo_before: songA.elo_rating,
        song_b_elo_before: songB.elo_rating,
        song_a_elo_after: aEloAfter,
        song_b_elo_after: bEloAfter,
        skipped: skipped ? 1 : 0,
      });

      return compId;
    });

    const compId = processComparison();
    res.json({ success: true, comparison_id: compId });
  } catch (err) {
    next(err);
  }
});

export default router;
