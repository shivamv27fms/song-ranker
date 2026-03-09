import { Router } from 'express';
import { getAllSongs, getSongById, addSong, deleteSong } from '../database/queries.js';
import { getSongByMusicBrainzId } from '../database/queries.js';
import { getCoverArtUrl } from '../services/musicbrainz.js';

const router = Router();

// GET /api/songs
router.get('/', (req, res, next) => {
  try {
    const { page = 1, limit = 50, sort = 'elo_rating', order = 'desc' } = req.query;
    const result = getAllSongs({
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/songs/:id
router.get('/:id', (req, res, next) => {
  try {
    const song = getSongById(parseInt(req.params.id));
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json(song);
  } catch (err) {
    next(err);
  }
});

// POST /api/songs
router.post('/', async (req, res, next) => {
  try {
    const { musicbrainz_id, title, artist, album, year, genre, cover_art_url, release_id } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ error: 'title and artist are required' });
    }

    // Check for duplicate MusicBrainz ID
    if (musicbrainz_id) {
      const existing = getSongByMusicBrainzId(musicbrainz_id);
      if (existing) {
        return res.status(409).json({ error: 'Song already in library', song: existing });
      }
    }

    // Fetch cover art if not provided but release_id is available
    let finalCoverArtUrl = cover_art_url || null;
    if (!finalCoverArtUrl && release_id) {
      try {
        finalCoverArtUrl = await getCoverArtUrl(release_id);
      } catch {
        // Cover art fetch failed; proceed without it
      }
    }

    const song = addSong({ musicbrainz_id, title, artist, album, year, genre, cover_art_url: finalCoverArtUrl });
    res.status(201).json(song);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/songs/:id
router.delete('/:id', (req, res, next) => {
  try {
    const result = deleteSong(parseInt(req.params.id));
    if (result.changes === 0) return res.status(404).json({ error: 'Song not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
