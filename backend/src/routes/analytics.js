import { Router } from 'express';
import { getAnalyticsData, getRatingHistory } from '../database/queries.js';

const router = Router();

// GET /api/analytics
router.get('/', (req, res, next) => {
  try {
    const data = getAnalyticsData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/song/:id
router.get('/song/:id', (req, res, next) => {
  try {
    const history = getRatingHistory(parseInt(req.params.id), 100);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

export default router;
