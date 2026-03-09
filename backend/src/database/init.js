import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data/songs.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initializeDatabase() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      musicbrainz_id TEXT UNIQUE,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT,
      year INTEGER,
      genre TEXT,
      cover_art_url TEXT,
      elo_rating REAL DEFAULT 1000,
      matches_played INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comparisons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_a_id INTEGER NOT NULL,
      song_b_id INTEGER NOT NULL,
      winner_id INTEGER,
      song_a_elo_before REAL,
      song_b_elo_before REAL,
      song_a_elo_after REAL,
      song_b_elo_after REAL,
      skipped BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (song_a_id) REFERENCES songs(id),
      FOREIGN KEY (song_b_id) REFERENCES songs(id),
      FOREIGN KEY (winner_id) REFERENCES songs(id)
    );

    CREATE TABLE IF NOT EXISTS rating_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id INTEGER NOT NULL,
      elo_rating REAL NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (song_id) REFERENCES songs(id)
    );

    CREATE INDEX IF NOT EXISTS idx_songs_elo ON songs(elo_rating DESC);
    CREATE INDEX IF NOT EXISTS idx_songs_matches ON songs(matches_played);
    CREATE INDEX IF NOT EXISTS idx_comparisons_songs ON comparisons(song_a_id, song_b_id);
    CREATE INDEX IF NOT EXISTS idx_rating_history_song ON rating_history(song_id, recorded_at);
  `);

  console.log('Database initialized successfully');
  return database;
}
