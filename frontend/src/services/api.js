const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

// ─── Songs ────────────────────────────────────────────────────────────────────
export const api = {
  songs: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/songs${qs ? `?${qs}` : ''}`);
    },
    get: (id) => request(`/songs/${id}`),
    add: (song) => request('/songs', { method: 'POST', body: JSON.stringify(song) }),
    delete: (id) => request(`/songs/${id}`, { method: 'DELETE' }),
  },

  // ─── Search ────────────────────────────────────────────────────────────────
  search: {
    query: (q, params = {}) => {
      const qs = new URLSearchParams({ q, ...params }).toString();
      return request(`/search?${qs}`);
    },
  },

  // ─── Compare ───────────────────────────────────────────────────────────────
  compare: {
    next: () => request('/compare/next'),
    submit: (data) => request('/compare', { method: 'POST', body: JSON.stringify(data) }),
  },

  // ─── Leaderboard ──────────────────────────────────────────────────────────
  leaderboard: {
    get: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/leaderboard${qs ? `?${qs}` : ''}`);
    },
  },

  // ─── Analytics ────────────────────────────────────────────────────────────
  analytics: {
    get: () => request('/analytics'),
    songHistory: (id) => request(`/analytics/song/${id}`),
  },

  // ─── Import / Export ──────────────────────────────────────────────────────
  export: {
    json: () => window.open('/api/export/json', '_blank'),
    csv: () => window.open('/api/export/csv', '_blank'),
    leaderboardCsv: () => window.open('/api/export/leaderboard-csv', '_blank'),
  },

  import: {
    csv: (csv, enrich = false) =>
      request('/import/csv', { method: 'POST', body: JSON.stringify({ csv, enrich }) }),
  },
};
