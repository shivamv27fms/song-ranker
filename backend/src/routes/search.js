import { Router } from 'express';
import { searchRecordings, getCoverArtUrl } from '../services/musicbrainz.js';

const router = Router();

// GET /api/search?q=query&limit=25&offset=0&covers=true
router.get('/', async (req, res, next) => {
  try {
    const { q, limit = 25, offset = 0, covers = 'false' } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const result = await searchRecordings(q.trim(), parseInt(limit), parseInt(offset));

    // Optionally enrich with cover art (one additional request per result — use sparingly)
    if (covers === 'true') {
      for (const r of result.recordings) {
        if (r.release_id) {
          r.cover_art_url = await getCoverArtUrl(r.release_id);
        }
      }
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
