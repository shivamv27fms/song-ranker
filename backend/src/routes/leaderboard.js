import { Router } from 'express';
import { getLeaderboard } from '../database/queries.js';

const router = Router();

// GET /api/leaderboard?sort=elo_rating|matches_played|wins&limit=100
router.get('/', (req, res, next) => {
  try {
    const { sort = 'elo_rating', limit = 100 } = req.query;
    const leaderboard = getLeaderboard({ sort, limit: parseInt(limit) });
    res.json(leaderboard);
  } catch (err) {
    next(err);
  }
});

export default router;
