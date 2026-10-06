/**
 * EpiCountdown – app.js
 * High-performance, modern countdown tracker for TV shows & anime.
 *
 * APIs used:
 *   TVmaze  – https://api.tvmaze.com (Completely open, free TV metadata)
 *   AniList – https://graphql.anilist.co (Modern, ultra-fast GraphQL anime schedule)
 */

'use strict';

import {
  API_ENDPOINTS,
  TMDB_CONFIG,
  CURATED_POPULAR_TV,
  UI_CONFIG,
  PLACEHOLDER_IMG,
  CACHE_CONFIG,
} from './config.js';

// ─────────────────────────────────────────
// State
// ─────────────────────────────────────────
/** @type {Array<{airTimestamp: number, cardEl: HTMLElement}>} */
let activeCountdowns = [];
let countdownIntervalId = null;

// ─────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────

/**
 * Pad a number to 2 digits.
 * @param {number} n
 * @returns {string}
 */
const pad = n => String(Math.max(0, Math.floor(n))).padStart(2, '0');

/**
 * Sanitize a plain-text string.
 * @param {*} str
 * @returns {string}
 */
const safe = str => (str === null || str === undefined ? '' : String(str).trim());

/**
 * Save data with timestamp to localStorage.
 */
function setCache(key, data) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

/**
 * Retrieve cached data if within duration.
 */
function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { timestamp, data } = JSON.parse(raw);
    if (Date.now() - timestamp < CACHE_CONFIG.CACHE_DURATION_MS) {
      return data;
    }
  } catch (e) {
    console.warn('LocalStorage read failed:', e);
  }
  return null;
}

/**
 * Polite batch execution helper to avoid burst rate-limits / ECONNRESET.
 */
async function mapInBatches(items, batchSize, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
    if (i + batchSize < items.length) {
      await new Promise(r => setTimeout(r, 60));
    }
  }
  return results;
}

// ─────────────────────────────────────────
// Countdown Engine
// ─────────────────────────────────────────

/**
 * Return inner HTML for active countdown digits.
 */
function countdownTemplate() {
  return `
    <div class="countdown-unit">
      <span class="countdown-value" data-days>00</span>
      <span class="countdown-label">Days</span>
    </div>
    <div class="countdown-sep">:</div>
    <div class="countdown-unit">
      <span class="countdown-value" data-hours>00</span>
      <span class="countdown-label">Hrs</span>
    </div>
    <div class="countdown-sep">:</div>
    <div class="countdown-unit">
      <span class="countdown-value" data-minutes>00</span>
      <span class="countdown-label">Min</span>
    </div>
    <div class="countdown-sep">:</div>
    <div class="countdown-unit">
      <span class="countdown-value" data-seconds>00</span>
      <span class="countdown-label">Sec</span>
    </div>`;
}

/**
 * Write countdown values into a card element.
 * @param {HTMLElement} cardEl
 * @param {number}      airTimestamp  ms since epoch
 */
function renderCountdown(cardEl, airTimestamp) {
  const countdownEl = cardEl.querySelector('.card__countdown');
  if (!countdownEl) return;

  const now = Date.now();

  if (isNaN(airTimestamp) || airTimestamp === null) {
    countdownEl.className = 'card__countdown card__countdown--tba';
    countdownEl.textContent = '⏳ Premiere TBA';
    return;
  }

  const diff = airTimestamp - now;

  if (diff <= 0) {
    countdownEl.className = 'card__countdown card__countdown--completed';
    countdownEl.textContent = '✔ Episode Aired';
    return;
  }

  // Restore units template if previously set to static label
  if (!countdownEl.querySelector('[data-seconds]')) {
    countdownEl.className = 'card__countdown';
    countdownEl.innerHTML = countdownTemplate();
  }

  const days = Math.floor(diff / UI_CONFIG.MS_PER_DAY);
  const hours = Math.floor((diff % UI_CONFIG.MS_PER_DAY) / UI_CONFIG.MS_PER_HOUR);
  const minutes = Math.floor((diff % UI_CONFIG.MS_PER_HOUR) / UI_CONFIG.MS_PER_MINUTE);
  const seconds = Math.floor((diff % UI_CONFIG.MS_PER_MINUTE) / UI_CONFIG.MS_PER_SECOND);

  // Add urgent class if less than 1 hour remaining
  const isUrgent = diff < UI_CONFIG.MS_PER_HOUR;
  countdownEl.classList.toggle('card__countdown--urgent', isUrgent);

  const daysEl = countdownEl.querySelector('[data-days]');
  const hoursEl = countdownEl.querySelector('[data-hours]');
  const minsEl = countdownEl.querySelector('[data-minutes]');
  const secsEl = countdownEl.querySelector('[data-seconds]');

  if (daysEl) daysEl.textContent = pad(days);
  if (hoursEl) hoursEl.textContent = pad(hours);
  if (minsEl) minsEl.textContent = pad(minutes);

  if (secsEl) {
    const secVal = pad(seconds);
    if (secsEl.textContent !== secVal) {
      secsEl.textContent = secVal;
      secsEl.classList.remove('tick-flash');
      void secsEl.offsetWidth; // Reflow for animation restart
      secsEl.classList.add('tick-flash');
    }
  }
}

/**
 * Tick all active countdowns once per second.
 */
function startCountdownEngine() {
  if (countdownIntervalId !== null) return;

  countdownIntervalId = setInterval(() => {
    // Retain only elements currently mounted in document
    activeCountdowns = activeCountdowns.filter(item => document.body.contains(item.cardEl));

    for (const item of activeCountdowns) {
      renderCountdown(item.cardEl, item.airTimestamp);
    }
  }, UI_CONFIG.COUNTDOWN_INTERVAL_MS);
}

// ─────────────────────────────────────────
// Card Builder
// ─────────────────────────────────────────

/**
 * Build a card DOM element from a normalised show object.
 *
 * @param {{
 *   id: string,
 *   title: string,
 *   image: string|null,
 *   status: string,
 *   rating: number|string|null,
 *   network?: string,
 *   genres: string[],
 *   nextEpisodeLabel: string,
 *   airTimestamp: number,
 *   url: string,
 * }} show
 * @returns {HTMLElement}
 */
function buildCard(show) {
  const template = document.getElementById('card-template');
  const card = template.content.cloneNode(true).querySelector('.card');

  // External link
  if (show.url) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', e => {
      if (e.target.closest('.card__favorite-btn')) return;
      window.open(show.url, '_blank', 'noopener,noreferrer');
    });
  }

  // Data attributes for filtering and countdown registration
  card.dataset.id = safe(show.id);
  card.dataset.timestamp = isNaN(show.airTimestamp) ? '' : String(show.airTimestamp);
  card.dataset.title = safe(show.title);

  // Favorites logic
  const favBtn = card.querySelector('.card__favorite-btn');
  if (favBtn) {
    const favorites = JSON.parse(localStorage.getItem('countdown-favorites')) || [];
    if (favorites.includes(safe(show.title))) {
      favBtn.classList.add('is-favorite');
    }
    favBtn.addEventListener('click', e => {
      e.stopPropagation();
      let favs = JSON.parse(localStorage.getItem('countdown-favorites')) || [];
      const title = safe(show.title);
      if (favs.includes(title)) {
        favs = favs.filter(t => t !== title);
        favBtn.classList.remove('is-favorite');
        if (window.toast) window.toast.info(`Removed "${title}" from favorites`);
      } else {
        favs.push(title);
        favBtn.classList.add('is-favorite');
        if (window.toast) window.toast.success(`Saved "${title}" to favorites!`);
      }
      localStorage.setItem('countdown-favorites', JSON.stringify(favs));
    });
  }

  // Poster Image
  const imgEl = card.querySelector('.card__image');
  imgEl.alt = safe(show.title);
  if (show.image) {
    imgEl.src = show.image;
    imgEl.onerror = () => {
      imgEl.src = PLACEHOLDER_IMG;
    };
  } else {
    imgEl.src = PLACEHOLDER_IMG;
  }

  // Status badge
  const badge = card.querySelector('.card__status-badge');
  const hasFutureAir = !isNaN(show.airTimestamp) && show.airTimestamp > Date.now();
  if (hasFutureAir) {
    badge.textContent = 'Airing Soon';
    badge.className = 'card__status-badge badge--airing';
  } else if (show.status === 'Ended' || show.status === 'Completed') {
    badge.textContent = 'Concluded';
    badge.className = 'card__status-badge badge--completed';
  } else {
    badge.textContent = show.status === 'Running' || show.status === 'Releasing' ? 'In Season' : 'Upcoming';
    badge.className = 'card__status-badge badge--tba';
  }

  // Title & Episode Label
  card.querySelector('.card__title').textContent = safe(show.title);
  card.querySelector('.card__episode').textContent = safe(show.nextEpisodeLabel);

  // Rating & Network
  const ratingEl = card.querySelector('.card__rating');
  const ratingVal = show.rating ? Number(show.rating) : null;
  if (ratingVal && ratingVal > 0) {
    const formatted = ratingVal > 10 ? (ratingVal / 10).toFixed(1) : ratingVal.toFixed(1);
    ratingEl.textContent = `⭐ ${formatted}`;
  } else if (show.network) {
    ratingEl.textContent = `📺 ${show.network}`;
  } else {
    ratingEl.textContent = '';
  }

  // Genres
  const genresEl = card.querySelector('.card__genres');
  genresEl.textContent = (show.genres || []).slice(0, 3).join(' · ');

  // Countdown Render & Registration
  renderCountdown(card, show.airTimestamp);

  if (!isNaN(show.airTimestamp) && show.airTimestamp > Date.now()) {
    activeCountdowns.push({ airTimestamp: show.airTimestamp, cardEl: card });
  }

  return card;
}

// ─────────────────────────────────────────
// Render Helpers
// ─────────────────────────────────────────

function showError(grid, message) {
  grid.innerHTML = `
    <div class="error-state">
      <p>⚠️ Unable to load latest data.</p>
      <p class="error-detail">${safe(message)}</p>
    </div>`;
}

function showSkeletons(grid, count = 6) {
  const skeletons = Array.from({ length: count }, () => {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.innerHTML = `
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-line" style="width: 80%;"></div>
        <div class="skeleton-line" style="width: 60%;"></div>
        <div class="skeleton-line" style="width: 70%;"></div>
      </div>
    `;
    return skeleton;
  });

  grid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (const s of skeletons) fragment.appendChild(s);
  grid.appendChild(fragment);
}

function renderCards(grid, cards, badgeEl) {
  grid.innerHTML = '';
  if (cards.length === 0) {
    grid.innerHTML = '<div class="error-state"><p>No matching shows found.</p></div>';
    if (badgeEl) badgeEl.textContent = '0 shows';
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const c of cards) fragment.appendChild(c);
  grid.appendChild(fragment);
  if (badgeEl) badgeEl.textContent = `${cards.length} shows`;
}

// ─────────────────────────────────────────
// AniList GraphQL Fetching (Anime)
// ─────────────────────────────────────────

/**
 * Fetch top popular currently-releasing anime from AniList GraphQL.
 */
async function fetchAnime() {
  const query = `
    query {
      Page(page: 1, perPage: ${UI_CONFIG.SHOWS_PER_SOURCE}) {
        media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
          id
          title {
            english
            romaji
          }
          coverImage {
            large
            extraLarge
          }
          averageScore
          genres
          nextAiringEpisode {
            airingAt
            timeUntilAiring
            episode
          }
          siteUrl
        }
      }
    }
  `;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const resp = await fetch(API_ENDPOINTS.ANILIST_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) throw new Error(`AniList returned status ${resp.status}`);
    const json = await resp.json();
    const media = json.data?.Page?.media || [];

    const items = media
      .map(anime => {
        const next = anime.nextAiringEpisode;
        const airTimestamp = next ? next.airingAt * 1000 : NaN;
        const title = anime.title.english || anime.title.romaji || 'Untitled Anime';

        return {
          id: `anime-${anime.id}`,
          title: safe(title),
          image: anime.coverImage?.extraLarge || anime.coverImage?.large || null,
          status: next ? 'Airing' : 'Releasing',
          rating: anime.averageScore ? anime.averageScore / 10 : null,
          genres: anime.genres || [],
          nextEpisodeLabel: next ? `Episode ${next.episode}` : 'Season in progress',
          airTimestamp,
          url: anime.siteUrl || `https://anilist.co/anime/${anime.id}`,
        };
      })
      .filter(a => a.title);

    setCache(CACHE_CONFIG.ANIME_CACHE_KEY, items);
    return items;
  } catch (err) {
    clearTimeout(timeoutId);
    const cached = getCache(CACHE_CONFIG.ANIME_CACHE_KEY);
    if (cached && cached.length > 0) return cached;
    throw err;
  }
}

// ─────────────────────────────────────────
// TMDB & TVmaze Ingestion (TV Shows)
// ─────────────────────────────────────────

function getTMDBAuth() {
  const token = TMDB_CONFIG.API_READ_ACCESS_TOKEN;
  const key = TMDB_CONFIG.API_KEY;
  if (!token && !key) return null;
  return {
    headers: token
      ? { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      : { Accept: 'application/json' },
    queryParam: !token && key ? `api_key=${encodeURIComponent(key)}` : '',
  };
}

function buildTMDBUrl(auth, path, extraParams = '') {
  let url = `${API_ENDPOINTS.TMDB_BASE}${path}`;
  const params = [];
  if (auth?.queryParam) params.push(auth.queryParam);
  if (extraParams) params.push(extraParams);
  if (params.length > 0) {
    url += (url.includes('?') ? '&' : '?') + params.join('&');
  }
  return url;
}

/**
 * Fetch top prestige & highly anticipated TV shows from TMDB.
 */
async function fetchTMDBShows(auth) {
  const now = Date.now();
  const cached = getCache(CACHE_CONFIG.TV_SHOWS_CACHE_KEY);

  const buildUrl = (path, extraParams = '') => buildTMDBUrl(auth, path, extraParams);

  try {
    const showIds = new Set();

    // 1. Fetch shows currently on the air / upcoming this week
    const onAirPromise = fetch(buildUrl('/tv/on_the_air', 'timezone=America%2FNew_York'), { headers: auth.headers })
      .then(r => (r.ok ? r.json() : { results: [] }))
      .catch(() => ({ results: [] }));

    // 2. Fetch trending TV shows globally
    const trendingPromise = fetch(buildUrl('/trending/tv/week'), { headers: auth.headers })
      .then(r => (r.ok ? r.json() : { results: [] }))
      .catch(() => ({ results: [] }));

    // 3. Search curated prestige list in batches
    const curatedPromises = mapInBatches(CURATED_POPULAR_TV, 6, async title => {
      try {
        const res = await fetch(buildUrl('/search/tv', `query=${encodeURIComponent(title)}`), { headers: auth.headers });
        if (!res.ok) return null;
        const data = await res.json();
        return data.results?.[0]?.id || null;
      } catch {
        return null;
      }
    });

    const [onAirData, trendingData, curatedIds] = await Promise.all([
      onAirPromise,
      trendingPromise,
      curatedPromises,
    ]);

    for (const s of onAirData.results || []) {
      if (s.id) showIds.add(s.id);
    }
    for (const s of trendingData.results || []) {
      if (s.id) showIds.add(s.id);
    }
    for (const id of curatedIds || []) {
      if (id) showIds.add(id);
    }

    const uniqueIds = Array.from(showIds).slice(0, 36);

    // Fetch detailed metadata including next_episode_to_air for each show
    const detailedShows = await mapInBatches(uniqueIds, 6, async id => {
      try {
        const res = await fetch(buildUrl(`/tv/${id}`), { headers: auth.headers });
        if (!res.ok) return null;
        const d = await res.json();
        if (!d.name) return null;

        const genres = (d.genres || []).map(g => g.name);
        const type = d.type || 'Scripted';

        // Filter out news, daytime talk, sports, reality, soap operas
        if (
          type === 'Talk Show' ||
          type === 'Reality' ||
          genres.includes('Talk') ||
          genres.includes('News') ||
          genres.includes('Reality') ||
          genres.includes('Soap')
        ) {
          return null;
        }

        const next = d.next_episode_to_air;
        let airTimestamp = NaN;
        let nextLabel = 'Upcoming Season TBA';

        if (next && next.air_date) {
          airTimestamp = new Date(`${next.air_date}T20:00:00Z`).getTime();
          nextLabel = next.name
            ? `S${next.season_number}E${next.episode_number} · ${next.name}`
            : `Season ${next.season_number} · Episode ${next.episode_number}`;
        } else if (d.status === 'Returning Series' || d.status === 'In Production') {
          nextLabel = 'New Season in Production';
        } else if (d.status === 'Ended') {
          nextLabel = 'Complete Series';
        } else if (d.status === 'Planned') {
          nextLabel = 'In Development';
        }

        return {
          id: `tmdb-${d.id}`,
          title: safe(d.name),
          image: d.poster_path ? `${API_ENDPOINTS.TMDB_IMAGE}${d.poster_path}` : null,
          status: d.status || 'Running',
          rating: d.vote_average ? Number(d.vote_average.toFixed(1)) : null,
          network: d.networks?.[0]?.name || null,
          genres,
          nextEpisodeLabel: nextLabel,
          airTimestamp,
          url: `https://www.themoviedb.org/tv/${d.id}`,
          weight: d.popularity || 80,
        };
      } catch {
        return null;
      }
    });

    const validShows = detailedShows.filter(Boolean);

    // Sort: active upcoming countdowns first, then sorted by popularity/rating
    validShows.sort((a, b) => {
      const aFuture = !isNaN(a.airTimestamp) && a.airTimestamp > now;
      const bFuture = !isNaN(b.airTimestamp) && b.airTimestamp > now;
      if (aFuture && bFuture) return a.airTimestamp - b.airTimestamp;
      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;
      return (b.weight || 0) - (a.weight || 0);
    });

    const finalShows = validShows.slice(0, UI_CONFIG.SHOWS_PER_SOURCE);
    if (finalShows.length > 0) {
      setCache(CACHE_CONFIG.TV_SHOWS_CACHE_KEY, finalShows);
      return finalShows;
    }

    return fetchTVmazeShows();
  } catch (err) {
    console.warn('TMDB fetch failed, falling back to TVmaze:', err);
    if (cached && cached.length > 0) return cached;
    return fetchTVmazeShows();
  }
}

/**
 * Fallback: Fetch top prestige TV shows from TVmaze.
 */
async function fetchTVmazeShows() {
  const now = Date.now();
  const cached = getCache(CACHE_CONFIG.TV_SHOWS_CACHE_KEY);

  try {
    const showsMap = new Map();

    const dates = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date(now + i * UI_CONFIG.MS_PER_DAY);
      dates.push(d.toISOString().slice(0, 10));
    }

    const schedulePromises = dates.map(date =>
      Promise.allSettled([
        fetch(`${API_ENDPOINTS.TVMAZE_SCHEDULE_WEB}${date}`).then(r => (r.ok ? r.json() : [])),
        fetch(`${API_ENDPOINTS.TVMAZE_SCHEDULE}${date}`).then(r => (r.ok ? r.json() : [])),
      ])
    );

    const scheduleResults = await Promise.allSettled(schedulePromises);
    for (const dayRes of scheduleResults) {
      if (dayRes.status !== 'fulfilled') continue;
      const [webResult, usResult] = dayRes.value;
      const allEps = [
        ...(webResult.status === 'fulfilled' && Array.isArray(webResult.value) ? webResult.value : []),
        ...(usResult.status === 'fulfilled' && Array.isArray(usResult.value) ? usResult.value : []),
      ];

      for (const ep of allEps) {
        const s = ep._embedded?.show || ep.show;
        if (!s) continue;
        const weight = s.weight || 0;
        const rating = s.rating?.average || 0;
        const type = s.type;
        const genres = s.genres || [];

        if (type !== 'Scripted') continue;
        if (genres.includes('Soap') || genres.includes('News') || genres.includes('Sports')) continue;

        if (rating >= 7.8 && weight >= 95 && !showsMap.has(s.id)) {
          const airTimestamp = ep.airstamp ? new Date(ep.airstamp).getTime() : NaN;
          if (!isNaN(airTimestamp) && airTimestamp > now - 86400000) {
            showsMap.set(s.id, {
              id: `tv-${s.id}`,
              title: safe(s.name),
              image: s.image?.original || s.image?.medium || null,
              status: s.status || 'Running',
              rating: rating || null,
              network: s.network?.name || s.webChannel?.name || null,
              genres: s.genres || [],
              nextEpisodeLabel: ep.name
                ? `S${ep.season || 1}E${ep.number || '?'} · ${ep.name}`
                : `Episode ${ep.number || '?'}`,
              airTimestamp,
              url: s.url || `https://www.tvmaze.com/shows/${s.id}`,
              weight: s.weight || 80,
            });
          }
        }
      }
    }

    const curatedResults = await mapInBatches(CURATED_POPULAR_TV, 6, async title => {
      try {
        const res = await fetch(
          `${API_ENDPOINTS.TVMAZE_SINGLESINGLE}${encodeURIComponent(title)}&embed=nextepisode`
        );
        if (!res.ok) return null;
        const s = await res.json();
        const next = s._embedded?.nextepisode;
        let airTimestamp = NaN;
        let nextLabel = 'Upcoming Season TBA';

        if (next) {
          airTimestamp = next.airstamp ? new Date(next.airstamp).getTime() : NaN;
          nextLabel = `Episode ${next.number || '1'} · S${String(next.season || '1').padStart(2, '0')}`;
        } else if (s.status === 'Running') {
          nextLabel = 'New Season in Production';
        } else if (s.status === 'Ended') {
          nextLabel = 'Complete Series';
        }

        return {
          id: `tv-${s.id}`,
          title: safe(s.name),
          image: s.image?.original || s.image?.medium || null,
          status: s.status || 'Running',
          rating: s.rating?.average || null,
          network: s.network?.name || s.webChannel?.name || null,
          genres: s.genres || [],
          nextEpisodeLabel: nextLabel,
          airTimestamp,
          url: s.url || `https://www.tvmaze.com/shows/${s.id}`,
          weight: 100,
        };
      } catch {
        return null;
      }
    });

    const curatedList = curatedResults.filter(Boolean);
    for (const c of curatedList) {
      if (!showsMap.has(c.id)) {
        showsMap.set(c.id, c);
      }
    }

    const allShows = [...showsMap.values()].sort((a, b) => {
      const aFuture = !isNaN(a.airTimestamp) && a.airTimestamp > now;
      const bFuture = !isNaN(b.airTimestamp) && b.airTimestamp > now;
      if (aFuture && bFuture) return a.airTimestamp - b.airTimestamp;
      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    const finalShows = allShows.slice(0, UI_CONFIG.SHOWS_PER_SOURCE);
    setCache(CACHE_CONFIG.TV_SHOWS_CACHE_KEY, finalShows);
    return finalShows;
  } catch (err) {
    if (cached && cached.length > 0) return cached;
    throw err;
  }
}

/**
 * Master fetch for TV Shows — uses TMDB if API key/token present, falls back to TVmaze.
 */
async function fetchTVShows() {
  const auth = getTMDBAuth();
  if (auth) {
    return fetchTMDBShows(auth);
  }
  return fetchTVmazeShows();
}

// ─────────────────────────────────────────
// Unified Search (TVmaze + AniList)
// ─────────────────────────────────────────

let searchTimeout = null;

async function performSearch(query) {
  const resultsEl = document.getElementById('search-results');
  if (!query.trim()) {
    resultsEl.hidden = true;
    return;
  }

  resultsEl.removeAttribute('hidden');
  resultsEl.innerHTML = `
    <div class="loading-state" style="padding:1.5rem">
      <div class="spinner"></div>
    </div>`;

  const animeGql = `
    query ($search: String) {
      Page(page: 1, perPage: 6) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { english romaji }
          coverImage { medium }
          format
          status
          siteUrl
        }
      }
    }
  `;

  try {
    const auth = getTMDBAuth();

    const tvPromise = auth
      ? fetch(buildTMDBUrl(auth, '/search/tv', `query=${encodeURIComponent(query)}`), { headers: auth.headers })
          .then(r => (r.ok ? r.json() : { results: [] }))
          .then(data =>
            (data.results || []).slice(0, 5).map(r => ({
              title: r.name,
              image: r.poster_path ? `${API_ENDPOINTS.TMDB_IMAGE}${r.poster_path}` : null,
              meta: `TV · ${r.first_air_date ? r.first_air_date.slice(0, 4) : 'Series'}${r.vote_average ? ` · ★ ${r.vote_average.toFixed(1)}` : ''}`,
              url: `https://www.themoviedb.org/tv/${r.id}`,
            }))
          )
          .catch(() => [])
      : fetch(`${API_ENDPOINTS.TVMAZE_SEARCH}${encodeURIComponent(query)}`)
          .then(r => (r.ok ? r.json() : []))
          .then(data =>
            (Array.isArray(data) ? data : []).slice(0, 5).map(r => ({
              title: r.show?.name,
              image: r.show?.image?.medium || null,
              meta: `TV · ${r.show?.network?.name || r.show?.webChannel?.name || 'Prestige'}`,
              url: r.show?.url || `https://www.tvmaze.com/shows/${r.show?.id}`,
            }))
          )
          .catch(() => []);

    const animePromise = fetch(API_ENDPOINTS.ANILIST_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: animeGql, variables: { search: query } }),
    })
      .then(r => (r.ok ? r.json() : {}))
      .then(animeResp =>
        (animeResp?.data?.Page?.media || []).map(a => ({
          title: a.title.english || a.title.romaji,
          image: a.coverImage?.medium || null,
          meta: `Anime · ${a.format || 'Series'} · ${a.status || ''}`,
          url: a.siteUrl || `https://anilist.co/anime/${a.id}`,
        }))
      )
      .catch(() => []);

    const [tvItems, animeItems] = await Promise.all([tvPromise, animePromise]);
    const combined = [...tvItems, ...animeItems].filter(i => i.title);

    if (combined.length === 0) {
      resultsEl.innerHTML = '<div class="search-no-results">No shows or anime found.</div>';
      return;
    }

    const header = document.createElement('div');
    header.className = 'search-results__header';
    header.textContent = `${combined.length} results found`;

    const list = document.createDocumentFragment();
    list.appendChild(header);

    for (const item of combined) {
      const row = document.createElement('div');
      row.className = 'search-result-item';
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');

      row.addEventListener('click', () => {
        window.open(item.url, '_blank', 'noopener,noreferrer');
        resultsEl.hidden = true;
      });

      const img = document.createElement('img');
      img.src = item.image || PLACEHOLDER_IMG;
      img.alt = safe(item.title);
      img.onerror = () => {
        img.src = PLACEHOLDER_IMG;
      };

      const info = document.createElement('div');
      info.className = 'search-result-item__info';

      const titleEl = document.createElement('div');
      titleEl.className = 'search-result-item__title';
      titleEl.textContent = safe(item.title);

      const metaEl = document.createElement('div');
      metaEl.className = 'search-result-item__meta';
      metaEl.textContent = safe(item.meta);

      info.appendChild(titleEl);
      info.appendChild(metaEl);
      row.appendChild(img);
      row.appendChild(info);
      list.appendChild(row);
    }

    resultsEl.innerHTML = '';
    resultsEl.appendChild(list);
  } catch (err) {
    resultsEl.innerHTML = '<div class="search-no-results">Search failed. Please try again.</div>';
    console.error('Search error:', err);
  }
}

// ─────────────────────────────────────────
// Filter Setup
// ─────────────────────────────────────────

function setupFilters() {
  const filterContainers = document.querySelectorAll('.filters-container');

  filterContainers.forEach(container => {
    const isTV = container.id.includes('tv');
    const gridId = isTV ? 'tv-grid' : 'anime-grid';
    const badgeId = isTV ? 'tv-count' : 'anime-count';

    container.addEventListener('click', e => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;

      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filterType = chip.dataset.filter;
      const grid = document.getElementById(gridId);
      if (!grid) return;

      const cards = grid.querySelectorAll('.card');
      const now = Date.now();
      const oneDay = UI_CONFIG.MS_PER_DAY;
      const oneWeek = oneDay * 7;
      let visibleCount = 0;

      cards.forEach(card => {
        const ts = card.dataset.timestamp ? parseInt(card.dataset.timestamp, 10) : NaN;
        let show = false;

        if (filterType === 'all') {
          show = true;
        } else if (filterType === 'favorites') {
          const favs = JSON.parse(localStorage.getItem('countdown-favorites')) || [];
          show = favs.includes(card.dataset.title);
        } else if (filterType === 'today') {
          if (!isNaN(ts)) {
            const diff = ts - now;
            show = diff >= 0 && diff <= oneDay;
          }
        } else if (filterType === 'week') {
          if (!isNaN(ts)) {
            const diff = ts - now;
            show = diff >= 0 && diff <= oneWeek;
          }
        } else if (filterType === 'upcoming') {
          // Shows awaiting season dates or future airings
          show = isNaN(ts) || ts > now;
        }

        card.style.display = show ? 'flex' : 'none';
        if (show) visibleCount++;
      });

      const badge = document.getElementById(badgeId);
      if (badge) badge.textContent = `${visibleCount} shows`;
    });
  });
}

// ─────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────

async function init() {
  const tvGrid = document.getElementById('tv-grid');
  const animeGrid = document.getElementById('anime-grid');
  const tvCount = document.getElementById('tv-count');
  const animeCount = document.getElementById('anime-count');

  // Start the per-second countdown engine
  startCountdownEngine();

  // Instant render from cache if available (0ms visual pop)
  const cachedTV = getCache(CACHE_CONFIG.TV_SHOWS_CACHE_KEY);
  if (cachedTV && cachedTV.length > 0) {
    renderCards(tvGrid, cachedTV.map(buildCard), tvCount);
  } else {
    showSkeletons(tvGrid, 6);
  }

  const cachedAnime = getCache(CACHE_CONFIG.ANIME_CACHE_KEY);
  if (cachedAnime && cachedAnime.length > 0) {
    renderCards(animeGrid, cachedAnime.map(buildCard), animeCount);
  } else {
    showSkeletons(animeGrid, 6);
  }

  // Fetch TV shows and anime in parallel
  const [tvResult, animeResult] = await Promise.allSettled([fetchTVShows(), fetchAnime()]);

  // Render TV Shows
  if (tvResult.status === 'fulfilled' && tvResult.value.length > 0) {
    renderCards(tvGrid, tvResult.value.map(buildCard), tvCount);
  } else if (!cachedTV || cachedTV.length === 0) {
    showError(tvGrid, tvResult.reason?.message || 'Could not load TV shows.');
  }

  // Render Anime
  if (animeResult.status === 'fulfilled' && animeResult.value.length > 0) {
    renderCards(animeGrid, animeResult.value.map(buildCard), animeCount);
  } else if (!cachedAnime || cachedAnime.length === 0) {
    showError(animeGrid, animeResult.reason?.message || 'Could not load anime.');
  }
}

// ─────────────────────────────────────────
// DOM-Ready Entry Point
// ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', e => {
      e.preventDefault();
      performSearch(searchInput.value);
    });

    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      const q = searchInput.value.trim();
      if (!q) {
        if (searchResults) searchResults.hidden = true;
        return;
      }
      searchTimeout = setTimeout(() => performSearch(q), UI_CONFIG.SEARCH_DEBOUNCE_MS);
    });

    document.addEventListener('click', e => {
      if (searchResults && !searchForm.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.hidden = true;
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && searchResults) {
        searchResults.hidden = true;
      }
    });
  }

  setupFilters();
  init().catch(err => console.error('Init error:', err));
});
