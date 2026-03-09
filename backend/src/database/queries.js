import { getDb } from './init.js';

// ─── Songs ───────────────────────────────────────────────────────────────────

export function getAllSongs({ page = 1, limit = 50, sort = 'elo_rating', order = 'desc' } = {}) {
  const db = getDb();
  const validSorts = ['elo_rating', 'matches_played', 'wins', 'title', 'artist', 'created_at'];
  // Use a map to prevent SQL injection via column name interpolation
  const sortColMap = {
    elo_rating: 'elo_rating',
    matches_played: 'matches_played',
    wins: 'wins',
    title: 'title',
    artist: 'artist',
    created_at: 'created_at',
  };
  const sortCol = sortColMap[validSorts.includes(sort) ? sort : 'elo_rating'];
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * limit;

  const songs = db.prepare(
    `SELECT * FROM songs ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`
  ).all(limit, offset);

  const { total } = db.prepare('SELECT COUNT(*) as total FROM songs').get();
  return { songs, total, page, limit };
}

export function getSongById(id) {
  return getDb().prepare('SELECT * FROM songs WHERE id = ?').get(id);
}

export function getSongByMusicBrainzId(mbid) {
  return getDb().prepare('SELECT * FROM songs WHERE musicbrainz_id = ?').get(mbid);
}

export function addSong(song) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO songs (musicbrainz_id, title, artist, album, year, genre, cover_art_url)
    VALUES (@musicbrainz_id, @title, @artist, @album, @year, @genre, @cover_art_url)
  `);
  const result = stmt.run(song);
  return getSongById(result.lastInsertRowid);
}

export function deleteSong(id) {
  const db = getDb();
  db.prepare('DELETE FROM rating_history WHERE song_id = ?').run(id);
  db.prepare('DELETE FROM comparisons WHERE song_a_id = ? OR song_b_id = ?').run(id, id);
  return db.prepare('DELETE FROM songs WHERE id = ?').run(id);
}

export function updateSongElo(id, eloRating, wins, losses, matchesPlayed) {
  return getDb().prepare(`
    UPDATE songs
    SET elo_rating = ?, wins = ?, losses = ?, matches_played = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(eloRating, wins, losses, matchesPlayed, id);
}

// ─── Comparisons ─────────────────────────────────────────────────────────────

export function insertComparison(comp) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO comparisons
      (song_a_id, song_b_id, winner_id, song_a_elo_before, song_b_elo_before,
       song_a_elo_after, song_b_elo_after, skipped)
    VALUES
      (@song_a_id, @song_b_id, @winner_id, @song_a_elo_before, @song_b_elo_before,
       @song_a_elo_after, @song_b_elo_after, @skipped)
  `);
  const result = stmt.run(comp);
  return result.lastInsertRowid;
}

export function getRecentComparisons(limit = 50) {
  return getDb().prepare(
    'SELECT song_a_id, song_b_id FROM comparisons ORDER BY created_at DESC LIMIT ?'
  ).all(limit);
}

export function getTotalComparisons() {
  return getDb().prepare('SELECT COUNT(*) as count FROM comparisons WHERE skipped = 0').get().count;
}

// ─── Rating History ───────────────────────────────────────────────────────────

export function insertRatingHistory(songId, eloRating) {
  return getDb().prepare(
    'INSERT INTO rating_history (song_id, elo_rating) VALUES (?, ?)'
  ).run(songId, eloRating);
}

export function getRatingHistory(songId, limit = 50) {
  return getDb().prepare(
    'SELECT * FROM rating_history WHERE song_id = ? ORDER BY recorded_at ASC LIMIT ?'
  ).all(songId, limit);
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export function getAnalyticsData() {
  const db = getDb();

  const totalSongs = db.prepare('SELECT COUNT(*) as count FROM songs').get().count;
  const totalComparisons = db.prepare(
    'SELECT COUNT(*) as count FROM comparisons WHERE skipped = 0'
  ).get().count;
  const songsOver10 = db.prepare(
    'SELECT COUNT(*) as count FROM songs WHERE matches_played > 10'
  ).get().count;
  const songsOver20 = db.prepare(
    'SELECT COUNT(*) as count FROM songs WHERE matches_played > 20'
  ).get().count;

  // Median ELO
  const allRatings = db.prepare('SELECT elo_rating FROM songs ORDER BY elo_rating').all();
  const median = allRatings.length > 0
    ? allRatings[Math.floor(allRatings.length / 2)].elo_rating
    : 1000;

  // Top 5 rising songs: compare current ELO to ELO from 10 comparisons ago
  const risingSongs = db.prepare(`
    SELECT s.id, s.title, s.artist, s.elo_rating, s.matches_played,
           s.cover_art_url,
           (s.elo_rating - COALESCE(
             (SELECT rh.elo_rating FROM rating_history rh
              WHERE rh.song_id = s.id
              ORDER BY rh.recorded_at DESC
              LIMIT 1 OFFSET 9),
             1000
           )) as elo_gain
    FROM songs s
    WHERE s.matches_played >= 10
    ORDER BY elo_gain DESC
    LIMIT 5
  `).all();

  // Most controversial: closest to 50% win rate with many matches
  const controversialSongs = db.prepare(`
    SELECT id, title, artist, elo_rating, matches_played, wins, losses, cover_art_url,
           ABS(CAST(wins AS REAL) / NULLIF(matches_played, 0) - 0.5) as controversy_score
    FROM songs
    WHERE matches_played >= 10
    ORDER BY controversy_score ASC
    LIMIT 5
  `).all();

  // Ranking stability: % of songs whose ELO hasn't changed much in last 5 comparisons
  const stableCount = db.prepare(`
    SELECT COUNT(*) as count FROM songs s
    WHERE s.matches_played >= 5
    AND ABS(s.elo_rating - COALESCE(
      (SELECT rh.elo_rating FROM rating_history rh
       WHERE rh.song_id = s.id
       ORDER BY rh.recorded_at DESC
       LIMIT 1 OFFSET 4),
      s.elo_rating
    )) < 20
  `).get().count;

  const stability = totalSongs > 0 ? Math.round((stableCount / totalSongs) * 100) : 0;

  return {
    totalSongs,
    totalComparisons,
    songsOver10,
    songsOver20,
    medianElo: Math.round(median),
    stability,
    risingSongs,
    controversialSongs,
  };
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export function getLeaderboard({ sort = 'elo_rating', limit = 100 } = {}) {
  const db = getDb();
  const validSorts = ['elo_rating', 'matches_played', 'wins'];
  // Map validated sort key to column name to prevent SQL injection
  const sortColMap = {
    elo_rating: 'elo_rating',
    matches_played: 'matches_played',
    wins: 'wins',
  };
  const sortCol = sortColMap[validSorts.includes(sort) ? sort : 'elo_rating'];

  const median = (() => {
    const rows = db.prepare('SELECT elo_rating FROM songs ORDER BY elo_rating').all();
    return rows.length > 0 ? rows[Math.floor(rows.length / 2)].elo_rating : 1000;
  })();

  const songs = db.prepare(`
    SELECT * FROM songs ORDER BY ${sortCol} DESC LIMIT ?
  `).all(limit);

  return songs.map((s, idx) => ({
    ...s,
    rank: idx + 1,
    win_rate: s.matches_played > 0 ? Math.round((s.wins / s.matches_played) * 100) : 0,
    likely_top_100: s.matches_played > 20 && s.elo_rating > median + 50,
  }));
}
