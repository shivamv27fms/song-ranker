import { useState } from 'react';
import { api } from '../services/api.js';
import toast from 'react-hot-toast';

export default function ImportExport() {
  const [csvText, setCsvText] = useState('');
  const [enrich, setEnrich] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  async function handleImport() {
    if (!csvText.trim()) {
      toast.error('Please enter CSV data');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const result = await api.import.csv(csvText, enrich);
      setImportResult(result);
      toast.success(`Imported ${result.added.length} songs`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Import / Export</h1>
        <p className="text-dark-400 text-sm mt-1">Manage your song library data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export */}
        <div className="card p-5">
          <h2 className="font-semibold text-dark-100 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Library
          </h2>
          <p className="text-dark-400 text-sm mb-4">
            Download your complete song library with all ELO ratings and statistics.
          </p>
          <div className="space-y-2">
            <button onClick={() => api.export.json()} className="btn-primary w-full text-center">
              Export as JSON
            </button>
            <button onClick={() => api.export.csv()} className="btn-secondary w-full text-center">
              Export Library as CSV
            </button>
            <button onClick={() => api.export.leaderboardCsv()} className="btn-secondary w-full text-center">
              Export Top 100 as CSV
            </button>
          </div>
        </div>

        {/* Import */}
        <div className="card p-5">
          <h2 className="font-semibold text-dark-100 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Import from CSV
          </h2>
          <p className="text-dark-400 text-sm mb-3">
            Paste CSV data in <code className="bg-dark-800 px-1 rounded text-violet-400">title,artist</code> format (one song per line).
          </p>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="input w-full h-36 text-sm font-mono resize-none mb-3"
            placeholder={"title,artist\nBohemian Rhapsody,Queen\nStairway to Heaven,Led Zeppelin"}
          />
          <label className="flex items-center gap-2 text-sm text-dark-400 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enrich}
              onChange={(e) => setEnrich(e.target.checked)}
              className="w-4 h-4 accent-violet-600"
            />
            Auto-enrich with MusicBrainz metadata
            <span className="text-dark-600 text-xs">(slower)</span>
          </label>
          <button
            onClick={handleImport}
            disabled={importing || !csvText.trim()}
            className="btn-primary w-full"
          >
            {importing ? 'Importing...' : 'Import Songs'}
          </button>

          {/* Import results */}
          {importResult && (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-400">
                <span>✓</span>
                <span>{importResult.added.length} songs added</span>
              </div>
              {importResult.skipped.length > 0 && (
                <div className="flex items-center gap-2 text-dark-400">
                  <span>→</span>
                  <span>{importResult.skipped.length} already in library</span>
                </div>
              )}
              {importResult.errors.length > 0 && (
                <div className="flex items-center gap-2 text-red-400">
                  <span>✗</span>
                  <span>{importResult.errors.length} errors</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CSV format guide */}
      <div className="card p-4 mt-6">
        <h3 className="font-medium text-dark-200 mb-2">CSV Format Guide</h3>
        <div className="bg-dark-800 rounded-lg p-3 font-mono text-sm text-dark-300">
          <p className="text-dark-500"># Optional header row:</p>
          <p>title,artist</p>
          <p className="text-dark-500"># Song rows:</p>
          <p>Bohemian Rhapsody,Queen</p>
          <p>Hotel California,Eagles</p>
          <p>"Wish You Were Here",Pink Floyd</p>
        </div>
      </div>
    </div>
  );
}
