# Song Ranker 🎵

An ELO-based pairwise song comparison system to help you discover your Top 100 songs from a large music library.

## Features

- 🔍 **Song Search** — Search MusicBrainz for songs with album artwork
- 📚 **Song Library** — Build your personal collection of songs
- ⚔️ **Compare** — Side-by-side comparison with keyboard shortcuts
- 🧠 **Smart Matchmaking** — Pairs songs by similar ELO & match count
- 📊 **ELO Rating** — Standard chess ELO formula (K=24)
- 🏆 **Leaderboard** — Top 100 sortable by ELO, matches, win rate
- 📈 **Analytics** — Progress stats, rising songs, controversial tracks
- 📤 **Import/Export** — CSV and JSON support

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Music API | MusicBrainz + Cover Art Archive |

## Prerequisites

- **Node.js 18+** (check: `node --version`)
- npm

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/shivamv27fms/song-ranker.git
cd song-ranker
```

### 2. Install Backend dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend dependencies

```bash
cd ../frontend
npm install
```

## Running Locally

You need two terminal windows — one for the backend and one for the frontend.

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

The backend API will be available at `http://localhost:3001`.

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`.

Open your browser and navigate to **http://localhost:5173**.

## Project Structure

```
song-ranker/
├── backend/
│   ├── package.json
│   └── src/
│       ├── index.js             # Express server entry point
│       ├── database/
│       │   ├── init.js          # SQLite schema initialization
│       │   └── queries.js       # Database query helpers
│       ├── routes/
│       │   ├── songs.js         # Song CRUD routes
│       │   ├── search.js        # MusicBrainz search routes
│       │   ├── compare.js       # Comparison routes
│       │   ├── leaderboard.js   # Leaderboard routes
│       │   ├── analytics.js     # Analytics routes
│       │   └── importExport.js  # Import/Export routes
│       ├── services/
│       │   ├── elo.js           # ELO calculation
│       │   ├── matchmaking.js   # Smart pairing algorithm
│       │   └── musicbrainz.js   # MusicBrainz API client
│       └── middleware/
│           └── errorHandler.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js           # Dev proxy to backend
│   └── src/
│       ├── App.jsx
│       ├── components/          # Reusable UI components
│       └── pages/               # Page-level components
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search?q=query` | Search MusicBrainz |
| `POST` | `/api/songs` | Add song to library |
| `GET` | `/api/songs` | List all songs |
| `DELETE` | `/api/songs/:id` | Remove song |
| `GET` | `/api/compare/next` | Get next pair |
| `POST` | `/api/compare` | Submit comparison result |
| `GET` | `/api/leaderboard` | Get ranked leaderboard |
| `GET` | `/api/analytics` | Get analytics data |
| `GET` | `/api/export/json` | Export library as JSON |
| `GET` | `/api/export/csv` | Export library as CSV |
| `GET` | `/api/export/leaderboard-csv` | Export top 100 as CSV |
| `POST` | `/api/import/csv` | Import from CSV |

## How the ELO System Works

The app uses the standard chess ELO rating system:

- **Initial rating**: 1000 for all songs
- **K-factor**: 24 (how quickly ratings change)
- **Expected score**: `E_A = 1 / (1 + 10^((R_B - R_A) / 400))`
- **Rating update**: `R_new = R_old + K × (actual - expected)`

After each comparison, both songs' ratings are updated. The winner's rating increases and the loser's decreases, with the amount depending on their relative ratings (upsets cause larger swings).

## Keyboard Shortcuts (Compare page)

| Key | Action |
|-----|--------|
| `←` Left Arrow | Choose left song |
| `→` Right Arrow | Choose right song |
| `Space` | Skip comparison |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request