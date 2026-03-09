import fetch from 'node-fetch';

const BASE_URL = 'https://musicbrainz.org/ws/2';
const COVER_ART_URL = 'https://coverartarchive.org';
// MusicBrainz requires a meaningful User-Agent with contact info per their API policy
const CONTACT_EMAIL = process.env.MB_CONTACT_EMAIL || 'contact@example.com';
const USER_AGENT = `SongRanker/1.0.0 (${CONTACT_EMAIL})`;

// Rate limiting: max 1 request per second
let lastRequestTime = 0;

async function rateLimitedFetch(url) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
  }
  lastRequestTime = Date.now();

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search MusicBrainz recordings
 * @param {string} query - Search query
 * @param {number} limit - Max results (default 25)
 * @param {number} offset - Pagination offset
 */
export async function searchRecordings(query, limit = 25, offset = 0) {
  const encoded = encodeURIComponent(query);
  const url = `${BASE_URL}/recording?query=${encoded}&limit=${limit}&offset=${offset}&fmt=json`;
  const data = await rateLimitedFetch(url);

  const recordings = (data.recordings || []).map((r) => {
    const release = r.releases?.[0];
    const releaseGroup = release?.['release-group'];
    return {
      musicbrainz_id: r.id,
      title: r.title,
      artist: r['artist-credit']?.[0]?.artist?.name || 'Unknown Artist',
      album: release?.title || null,
      year: release?.date ? parseInt(release.date.substring(0, 4)) : null,
      release_id: release?.id || null,
      release_group_id: releaseGroup?.id || null,
      cover_art_url: null, // fetched separately or lazily
    };
  });

  return { recordings, total: data.count || 0 };
}

/**
 * Get cover art URL for a MusicBrainz release
 * Returns null if no cover art is available
 */
export async function getCoverArtUrl(releaseId) {
  if (!releaseId) return null;
  try {
    const url = `${COVER_ART_URL}/release/${releaseId}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    });
    if (!response.ok) return null;
    const data = await response.json();
    const front = data.images?.find((img) => img.front) || data.images?.[0];
    return front?.thumbnails?.small || front?.image || null;
  } catch {
    return null;
  }
}

/**
 * Search for a single best-match recording by title + artist
 * Used for CSV import enrichment
 */
export async function findBestMatch(title, artist) {
  const query = `recording:"${title}" AND artist:"${artist}"`;
  const { recordings } = await searchRecordings(query, 1);
  return recordings[0] || null;
}
