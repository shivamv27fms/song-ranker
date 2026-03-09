import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/init.js';
import { errorHandler } from './middleware/errorHandler.js';
import songsRouter from './routes/songs.js';
import searchRouter from './routes/search.js';
import compareRouter from './routes/compare.js';
import leaderboardRouter from './routes/leaderboard.js';
import analyticsRouter from './routes/analytics.js';
import importExportRouter from './routes/importExport.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/songs', songsRouter);
app.use('/api/search', searchRouter);
app.use('/api/compare', compareRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/export', importExportRouter);
app.use('/api/import', importExportRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Song Ranker backend running on http://localhost:${PORT}`);
});
