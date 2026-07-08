/**
 * Configuration constants for EpiCountdown
 */

export const API_ENDPOINTS = {
  TVMAZE_SCHEDULE: 'https://api.tvmaze.com/schedule?country=US&date=',
  TVMAZE_SEARCH: 'https://api.tvmaze.com/search/shows?q=',
  TVMAZE_SHOW: 'https://api.tvmaze.com/shows/', // + id + ?embed=nextepisode
  JIKAN_SEASONS: 'https://api.jikan.moe/v4/seasons/now?limit=24',
  JIKAN_SEARCH: 'https://api.jikan.moe/v4/anime?q=',
};

export const UI_CONFIG = {
  // Number of shows to fetch per source
  SHOWS_PER_SOURCE: 24,
  // Search debounce delay in ms
  SEARCH_DEBOUNCE_MS: 400,
  // Countdown update interval in ms
  COUNTDOWN_INTERVAL_MS: 1000,
  // Milliseconds per time unit
  MS_PER_DAY: 86_400_000,
  MS_PER_HOUR: 3_600_000,
  MS_PER_MINUTE: 60_000,
  MS_PER_SECOND: 1_000,
};

export const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400'%3E%3Crect width='300' height='400' fill='%230a0a12'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='64' fill='%23333'%3E📺%3C/text%3E%3C/svg%3E";

export const CACHE_CONFIG = {
  // Cache key prefixes
  TV_SHOWS_CACHE_KEY: 'epicountdown:tv_shows',
  ANIME_CACHE_KEY: 'epicountdown:anime',
  // Cache expiry in ms (1 hour)
  CACHE_DURATION_MS: 3600000,
};

export const RETRY_CONFIG = {
  // Maximum number of retries
  MAX_RETRIES: 3,
  // Base delay in ms for exponential backoff
  BASE_DELAY_MS: 500,
  // Fetch timeout in ms
  FETCH_TIMEOUT_MS: 10000,
};
