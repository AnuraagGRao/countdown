/**
 * Configuration constants for EpiCountdown
 */

export const API_ENDPOINTS = {
  // TMDB v3 API for premier global movies & TV metadata
  TMDB_BASE: 'https://api.themoviedb.org/3',
  TMDB_IMAGE: 'https://image.tmdb.org/t/p/w500',
  // AniList GraphQL API for 100% reliable real-time anime countdowns
  ANILIST_GRAPHQL: 'https://graphql.anilist.co',
  // TVmaze APIs for TV data (completely free, open-source fallback)
  TVMAZE_SINGLESINGLE: 'https://api.tvmaze.com/singlesearch/shows?q=',
  TVMAZE_SCHEDULE: 'https://api.tvmaze.com/schedule?country=US&date=',
  TVMAZE_SCHEDULE_WEB: 'https://api.tvmaze.com/schedule/web?date=',
  TVMAZE_SEARCH: 'https://api.tvmaze.com/search/shows?q=',
  TVMAZE_SHOW: 'https://api.tvmaze.com/shows/',
};

// ── The Movie Database (TMDB) Configuration ──────────────────────────────
let secrets = { API_KEY: '', API_READ_ACCESS_TOKEN: '' };
try {
  const mod = await import('./secrets.js');
  if (mod?.TMDB_SECRETS) {
    secrets = mod.TMDB_SECRETS;
  }
} catch {
  // secrets.js not present (e.g. fresh clone), fallback gracefully
}

// Optional localStorage fallback
const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('epicountdown_tmdb_key') : null;
const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('epicountdown_tmdb_token') : null;

export const TMDB_CONFIG = {
  API_KEY: secrets.API_KEY || storedKey || '',
  API_READ_ACCESS_TOKEN: secrets.API_READ_ACCESS_TOKEN || storedToken || '',
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
};

// Curated list of premier, universally acclaimed and highly anticipated TV shows
export const CURATED_POPULAR_TV = [
  'Stranger Things',
  'Severance',
  'House of the Dragon',
  'The Boys',
  'The Last of Us',
  'Fallout',
  'Wednesday',
  'The Bear',
  'Squid Game',
  'Invincible',
  'Silo',
  'Slow Horses',
  'The Penguin',
  'The White Lotus',
  'Yellowjackets',
  'Reacher',
  'Daredevil: Born Again',
  'Euphoria',
  'Peacemaker',
  'Andor',
  'True Detective',
  'Arcane: League of Legends',
  'Fargo',
  'Black Mirror'
];

export const UI_CONFIG = {
  SHOWS_PER_SOURCE: 24,
  SEARCH_DEBOUNCE_MS: 350,
  COUNTDOWN_INTERVAL_MS: 1000,
  MS_PER_DAY: 86_400_000,
  MS_PER_HOUR: 3_600_000,
  MS_PER_MINUTE: 60_000,
  MS_PER_SECOND: 1_000,
};

export const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400'%3E%3Crect width='300' height='400' fill='%230a0a12'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='64' fill='%23333'%3E📺%3C/text%3E%3C/svg%3E";

export const CACHE_CONFIG = {
  TV_SHOWS_CACHE_KEY: 'epicountdown:tv_shows_v2',
  ANIME_CACHE_KEY: 'epicountdown:anime_v2',
  CACHE_DURATION_MS: 30 * 60 * 1000, // 30 minutes
};

