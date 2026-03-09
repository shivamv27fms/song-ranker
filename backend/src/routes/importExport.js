import { Router } from 'express';
import { getAllSongs, getLeaderboard, addSong } from '../database/queries.js';
import { findBestMatch, getCoverArtUrl } from '../services/musicbrainz.js';

const router = Router();

// GET /api/export/json
router.get('/json', (req, res, next) => {
  try {
    const { songs } = getAllSongs({ limit: 10000 });
    res.setHeader('Content-Disposition', 'attachment; filename="song-library.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(songs);
  } catch (err) {
    next(err);
  }
});

// GET /api/export/csv
router.get('/csv', (req, res, next) => {
  try {
    const { songs } = getAllSongs({ limit: 10000 });
    const headers = [
      'id', 'title', 'artist', 'album', 'year', 'genre',
      'elo_rating', 'matches_played', 'wins', 'losses',
    ];
    const rows = songs.map((s) =>
      headers.map((h) => {
        const val = s[h] == null ? '' : String(s[h]);
        return val.includes(',') ? `"${val}"` : val;
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Disposition', 'attachment; filename="song-library.csv"');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// GET /api/export/leaderboard-csv
router.get('/leaderboard-csv', (req, res, next) => {
  try {
    const songs = getLeaderboard({ limit: 100 });
    const headers = ['rank', 'title', 'artist', 'elo_rating', 'matches_played', 'win_rate'];
    const rows = songs.map((s) =>
      headers.map((h) => {
        const val = s[h] == null ? '' : String(s[h]);
        return val.includes(',') ? `"${val}"` : val;
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Disposition', 'attachment; filename="leaderboard.csv"');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// POST /api/import/csv
// Body: { csv: "title,artist\nSong,Artist\n..." }
router.post('/csv', async (req, res, next) => {
  try {
    const { csv, enrich = false } = req.body;
    if (!csv) return res.status(400).json({ error: 'csv field is required' });

    const lines = csv.trim().split('\n').filter(Boolean);
    // Skip header if first line looks like headers
    const startIdx = lines[0].toLowerCase().startsWith('title') ? 1 : 0;

    const results = { added: [], skipped: [], errors: [] };

    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(',');
      const title = parts[0]?.replace(/^"|"$/g, '').trim();
      const artist = parts[1]?.replace(/^"|"$/g, '').trim();

      if (!title || !artist) {
        results.errors.push({ line: i + 1, reason: 'Missing title or artist' });
        continue;
      }

      let songData = { title, artist, musicbrainz_id: null, cover_art_url: null };

      if (enrich) {
        try {
          const match = await findBestMatch(title, artist);
          if (match) {
            songData = { ...songData, ...match };
            if (match.release_id) {
              songData.cover_art_url = await getCoverArtUrl(match.release_id);
            }
          }
        } catch {
          // Enrichment failure is non-fatal
        }
      }

      try {
        const song = addSong(songData);
        results.added.push(song);
      } catch (err) {
        if (err.message?.includes('UNIQUE')) {
          results.skipped.push({ title, artist, reason: 'Already in library' });
        } else {
          results.errors.push({ title, artist, reason: err.message });
        }
      }
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;
