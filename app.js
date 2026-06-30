/**
 * EpiCountdown – app.js
 * Fetches TV show & anime data, renders cards, and runs live countdown timers.
 *
 * APIs used:
 *   TVmaze  – https://api.tvmaze.com
 *   Jikan   – https://api.jikan.moe/v4
 */

'use strict';

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────
const TVMAZE_SCHEDULE = 'https://api.tvmaze.com/schedule?country=US&date=';
const TVMAZE_SEARCH = 'https://api.tvmaze.com/search/shows?q=';
const TVMAZE_SHOW = 'https://api.tvmaze.com/shows/'; // + id + ?embed=nextepisode
const JIKAN_SEASONS = 'https://api.jikan.moe/v4/seasons/now?limit=24';
const JIKAN_SEARCH = 'https://api.jikan.moe/v4/anime?q=';

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400'%3E%3Crect width='300' height='400' fill='%230a0a12'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='64' fill='%23333'%3E📺%3C/text%3E%3C/svg%3E";

// ─────────────────────────────────────────
// State
// ─────────────────────────────────────────
/** @type {Array<{airTimestamp: number, cardEl: HTMLElement}>} */
const activeCountdowns = [];

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
 * Parse a date/time string into a Unix timestamp (ms).
 * Returns NaN if the input is falsy.
 * @param {string|null} dateStr
 * @param {string|null} [timeStr]
 * @returns {number}
 */
function parseAirTime(dateStr, timeStr) {
  if (!dateStr) return NaN;
  const combined = timeStr ? `${dateStr}T${timeStr}` : dateStr;
  return new Date(combined).getTime();
}

/**
 * Sanitize a plain-text string to avoid XSS when inserting via textContent.
 * (We use textContent for all user-visible strings, so this is belt-and-suspenders.)
 * @param {string} str
 * @returns {string}
 */
const safe = str => (str === null || str === undefined ? '' : String(str).trim());

// ─────────────────────────────────────────
// Countdown engine
// ─────────────────────────────────────────

/**
 * Write countdown values into a card element.
 * @param {HTMLElement} cardEl
 * @param {number}      airTimestamp  ms since epoch
 */
function renderCountdown(cardEl, airTimestamp) {
  const countdownEl = cardEl.querySelector('.card__countdown');
  if (!countdownEl) return;

  const now = Date.now();
  const diff = airTimestamp - now;

  if (isNaN(airTimestamp)) {
    setStaticLabel(countdownEl, 'tba', '⏳ TBA');
    return;
  }

  if (diff <= 0) {
    setStaticLabel(countdownEl, 'completed', '✔ Aired');
    return;
  }

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);

  // Restore full countdown markup if it was previously replaced by a static label
  if (!countdownEl.querySelector('[data-seconds]')) {
    countdownEl.innerHTML = countdownTemplate();
    countdownEl.className = 'card__countdown';
  }

  countdownEl.querySelector('[data-days]').textContent = pad(days);
  countdownEl.querySelector('[data-hours]').textContent = pad(hours);
  countdownEl.querySelector('[data-minutes]').textContent = pad(minutes);

  const secEl = countdownEl.querySelector('[data-seconds]');
  secEl.textContent = pad(seconds);
  secEl.classList.remove('tick-flash');
  // Trigger reflow so the animation restarts
  void secEl.offsetWidth;
  secEl.classList.add('tick-flash');
}

/**
 * Replace countdown block with a single status label.
 * @param {HTMLElement} countdownEl
 * @param {'tba'|'completed'} type
 * @param {string} label
 */
function setStaticLabel(countdownEl, type, label) {
  countdownEl.className = `card__countdown card__countdown--${type}`;
  countdownEl.textContent = label;
}

/** Return the inner HTML for the countdown block (mirrors the <template>). */
function countdownTemplate() {
  return `
    <div class="countdown-unit">
      <span class="countdown-value" data-days></span>
      <span class="countdown-label">Days</span>
    </div>
    <div class="countdown-sep">:</div>
    <div class="countdown-unit">
      <span class="countdown-value" data-hours></span>
      <span class="countdown-label">Hrs</span>
    </div>
    <div class="countdown-sep">:</div>
    <div class="countdown-unit">
      <span class="countdown-value" data-minutes></span>
      <span class="countdown-label">Min</span>
    </div>
    <div class="countdown-sep">:</div>
    <div class="countdown-unit">
      <span class="countdown-value" data-seconds></span>
      <span class="countdown-label">Sec</span>
    </div>`;
}

/** Tick all active countdowns once per second. */
function startCountdownEngine() {
  setInterval(() => {
    for (const { airTimestamp, cardEl } of activeCountdowns) {
      renderCountdown(cardEl, airTimestamp);
    }
  }, 1_000);
}

// ─────────────────────────────────────────
// Card builder
// ─────────────────────────────────────────

/**
 * Build a card DOM element from a normalised show object and register
 * its countdown in the global registry.
 *
 * @param {{
 *   title: string,
 *   image: string|null,
 *   status: string,
 *   rating: number|null,
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

  // Make card clickable
  if (show.url) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      window.open(show.url, '_blank', 'noopener,noreferrer');
    });
  }

  // Image
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
  const statusLower = (show.status || '').toLowerCase();
  if (statusLower.includes('air') || statusLower === 'running') {
    badge.textContent = 'Airing';
    badge.classList.add('badge--airing');
  } else if (statusLower === 'ended' || statusLower === 'completed') {
    badge.textContent = 'Ended';
    badge.classList.add('badge--completed');
  } else {
    badge.textContent = show.status || 'TBA';
    badge.classList.add('badge--tba');
  }

  // Title
  card.querySelector('.card__title').textContent = safe(show.title);

  // Episode label
  card.querySelector('.card__episode').textContent = safe(show.nextEpisodeLabel);

  // Rating
  const ratingEl = card.querySelector('.card__rating');
  if (show.rating !== null && show.rating !== undefined && show.rating > 0) {
    ratingEl.textContent = `⭐ ${show.rating.toFixed(1)}`;
  } else {
    ratingEl.textContent = '';
  }

  // Genres
  const genresEl = card.querySelector('.card__genres');
  genresEl.textContent = show.genres.slice(0, 3).join(' · ') || '';

  // Initial countdown render
  renderCountdown(card, show.airTimestamp);

  // Register for live updates
  if (!isNaN(show.airTimestamp) && show.airTimestamp > Date.now()) {
    activeCountdowns.push({ airTimestamp: show.airTimestamp, cardEl: card });
  }

  return card;
}

// ─────────────────────────────────────────
// Render helpers
// ─────────────────────────────────────────

/**
 * Replace grid contents with an error message.
 * @param {HTMLElement} grid
 * @param {string}      message
 */
function showError(grid, message) {
  grid.innerHTML = `
    <div class="error-state">
      <p>⚠️ Could not load data.</p>
      <p class="error-detail">${safe(message)}</p>
    </div>`;
}

/**
 * Append cards to a grid and update the count badge.
 * @param {HTMLElement}   grid
 * @param {HTMLElement[]} cards
 * @param {HTMLElement}   badgeEl
 */
function renderCards(grid, cards, badgeEl) {
  grid.innerHTML = '';
  if (cards.length === 0) {
    grid.innerHTML = '<div class="error-state"><p>No results found.</p></div>';
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const c of cards) fragment.appendChild(c);
  grid.appendChild(fragment);
  if (badgeEl) badgeEl.textContent = `${cards.length} shows`;
}

// ─────────────────────────────────────────
// TVmaze data fetching
// ─────────────────────────────────────────

/**
 * Fetch today's US TV schedule from TVmaze, deduplicate by show, enrich with
 * the next-episode embed, and return normalised show objects.
 *
 * Strategy:
 *  1. Fetch today's schedule (gives us ~100 episodes with show data inline).
 *  2. Deduplicate by show ID.
 *  3. For each unique show, fetch its /shows/:id?embed=nextepisode to get the
 *     precise next-episode timestamp (today's schedule only covers today, but
 *     a show's next episode may be later in the week).
 *  4. Limit to 24 shows for performance.
 */
async function fetchTVShows() {
  const today = new Date().toISOString().slice(0, 10);
  const resp = await fetch(`${TVMAZE_SCHEDULE}${today}`);
  if (!resp.ok) throw new Error(`TVmaze schedule: ${resp.status}`);

  const episodes = await resp.json();

  // Deduplicate by show ID, keep first occurrence
  const showMap = new Map();
  for (const ep of episodes) {
    if (ep.show && !showMap.has(ep.show.id)) {
      showMap.set(ep.show.id, ep.show);
    }
  }

  // Take up to 24 shows and enrich with nextepisode embed
  const topShows = [...showMap.values()].slice(0, 24);

  const enriched = await Promise.allSettled(
    topShows.map(show =>
      fetch(`${TVMAZE_SHOW}${show.id}?embed=nextepisode`).then(r =>
        r.ok ? r.json() : Promise.reject(r.status)
      )
    )
  );

  return enriched
    .map((result, i) => {
      const raw = result.status === 'fulfilled' ? result.value : topShows[i];
      const next = raw?._embedded?.nextepisode;
      const show = raw || topShows[i];

      const airDate = next?.airdate || null;
      const airTime = next?.airtime || null;
      const ts = parseAirTime(airDate, airTime);

      return {
        title: safe(show.name),
        image: show.image?.medium || show.image?.original || null,
        status: show.status || 'Unknown',
        rating: show.rating?.average || null,
        genres: show.genres || [],
        nextEpisodeLabel: next
          ? `Episode ${next.number ?? '?'}${next.season ? ` · S${String(next.season).padStart(2, '0')}` : ''}`
          : show.status === 'Ended'
            ? 'Series Ended'
            : 'Next Episode TBA',
        airTimestamp: ts,
        url: show.url || `https://www.tvmaze.com/shows/${show.id}`,
      };
    })
    .filter(s => s.title);
}

// ─────────────────────────────────────────
// Jikan (MyAnimeList) data fetching
// ─────────────────────────────────────────

/**
 * Fetch currently-airing anime from Jikan's /seasons/now endpoint.
 * Returns normalised show objects. The Jikan API does not provide exact
 * per-episode air timestamps so we use the weekly broadcast day/time.
 */
async function fetchAnime() {
  const resp = await fetch(JIKAN_SEASONS);
  if (!resp.ok) throw new Error(`Jikan: ${resp.status}`);
  const json = await resp.json();

  return (json.data || [])
    .filter(a => a.type !== 'Music' && a.type !== 'ONA') // skip music/specials
    .slice(0, 24)
    .map(anime => {
      const broadcast = anime.broadcast; // { day, time, timezone, string }
      const ts = nextBroadcastTimestamp(broadcast);

      const score = anime.score ? Number(anime.score) : null;

      return {
        title: safe(anime.title_english || anime.title),
        image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || null,
        status: anime.airing ? 'Airing' : anime.status || 'TBA',
        rating: score,
        genres: (anime.genres || []).map(g => g.name),
        nextEpisodeLabel: anime.airing
          ? anime.episodes
            ? `Episode ? / ${anime.episodes}`
            : 'Currently Airing'
          : 'TBA',
        airTimestamp: ts,
        url: anime.url || `https://myanimelist.net/anime/${anime.mal_id}`,
      };
    })
    .filter(s => s.title);
}

/**
 * Given a Jikan broadcast object, compute the next timestamp (in ms) when
 * the anime airs, based on its weekly day and time (JST → UTC).
 *
 * @param {{ day?: string, time?: string, timezone?: string }|null} broadcast
 * @returns {number} ms timestamp, or NaN if unknown
 */
function nextBroadcastTimestamp(broadcast) {
  if (!broadcast || !broadcast.day || !broadcast.time) return NaN;

  const days = [
    'Sundays',
    'Mondays',
    'Tuesdays',
    'Wednesdays',
    'Thursdays',
    'Fridays',
    'Saturdays',
  ];
  const dayIndex = days.indexOf(broadcast.day);
  if (dayIndex === -1) return NaN;

  // Parse time (HH:MM in JST = UTC+9)
  const [hStr, mStr] = broadcast.time.split(':');
  const hJST = parseInt(hStr, 10);
  const mJST = parseInt(mStr, 10);
  if (isNaN(hJST) || isNaN(mJST)) return NaN;

  // Convert JST → UTC (handle negative hours)
  let hUTC = hJST - 9;
  let dayOffset = 0;

  if (hUTC < 0) {
    hUTC += 24;
    dayOffset = -1;
  } else if (hUTC >= 24) {
    hUTC -= 24;
    dayOffset = 1;
  }

  const now = new Date();
  // Build a UTC date for the target day+time
  const candidate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hUTC, mJST, 0, 0)
  );

  // Adjust to the correct weekday
  const todayUTCDay = candidate.getUTCDay();
  let diff = dayIndex - todayUTCDay + dayOffset;

  // Normalize diff to 0-6 range
  if (diff < 0) diff += 7;

  candidate.setUTCDate(candidate.getUTCDate() + diff);

  // If the computed time is in the past, move forward one week
  if (candidate.getTime() <= Date.now()) {
    candidate.setUTCDate(candidate.getUTCDate() + 7);
  }

  return candidate.getTime();
}

// ─────────────────────────────────────────
// Search
// ─────────────────────────────────────────

let searchTimeout = null;

/**
 * Search both TVmaze and Jikan simultaneously and render results in the
 * floating search results panel.
 * @param {string} query
 */
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

  try {
    const [tvResp, animeResp] = await Promise.allSettled([
      fetch(`${TVMAZE_SEARCH}${encodeURIComponent(query)}`).then(r => r.json()),
      fetch(`${JIKAN_SEARCH}${encodeURIComponent(query)}&limit=5`).then(r => r.json()),
    ]);

    const tvItems =
      tvResp.status === 'fulfilled'
        ? (tvResp.value || [])
            .slice(0, 5)
            .map(r => ({
              title: r.show?.name,
              image: r.show?.image?.medium || null,
              meta: `TV · ${r.show?.network?.name || r.show?.webChannel?.name || 'Unknown network'}`,
              status: r.show?.status,
              url: r.show?.url || `https://www.tvmaze.com/shows/${r.show?.id}`,
            }))
            .filter(i => i.title)
        : [];

    const animeItems =
      animeResp.status === 'fulfilled'
        ? (animeResp.value?.data || [])
            .slice(0, 5)
            .map(a => ({
              title: a.title_english || a.title,
              image: a.images?.jpg?.image_url || null,
              meta: `Anime · ${a.type || 'TV'} · ${a.status || ''}`,
              status: a.status,
              url: a.url || `https://myanimelist.net/anime/${a.mal_id}`,
            }))
            .filter(i => i.title)
        : [];

    const combined = [...tvItems, ...animeItems];

    if (combined.length === 0) {
      resultsEl.innerHTML = '<div class="search-no-results">No results found.</div>';
      return;
    }

    const header = document.createElement('div');
    header.className = 'search-results__header';
    header.textContent = `${combined.length} result${combined.length !== 1 ? 's' : ''}`;

    const list = document.createDocumentFragment();
    list.appendChild(header);

    for (const item of combined) {
      const row = document.createElement('div');
      row.className = 'search-result-item';
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.style.cursor = 'pointer';

      // Add click handler to open show page
      if (item.url) {
        row.addEventListener('click', () => {
          const resultsEl = document.getElementById('search-results');
          window.open(item.url, '_blank', 'noopener,noreferrer');
          resultsEl.hidden = true;
        });
        row.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const resultsEl = document.getElementById('search-results');
            window.open(item.url, '_blank', 'noopener,noreferrer');
            resultsEl.hidden = true;
          }
        });
      }

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
// Initialise
// ─────────────────────────────────────────

async function init() {
  const tvGrid = document.getElementById('tv-grid');
  const animeGrid = document.getElementById('anime-grid');
  const tvCount = document.getElementById('tv-count');
  const animeCount = document.getElementById('anime-count');

  // Start countdown ticker
  startCountdownEngine();

  // Fetch TV shows and anime in parallel
  const [tvResult, animeResult] = await Promise.allSettled([fetchTVShows(), fetchAnime()]);

  // Render TV shows
  if (tvResult.status === 'fulfilled') {
    const cards = tvResult.value.map(buildCard);
    renderCards(tvGrid, cards, tvCount);
  } else {
    console.error('TV fetch error:', tvResult.reason);
    showError(tvGrid, tvResult.reason?.message || String(tvResult.reason));
    tvCount.textContent = '0 shows';
  }

  // Render anime
  if (animeResult.status === 'fulfilled') {
    const cards = animeResult.value.map(buildCard);
    renderCards(animeGrid, cards, animeCount);
  } else {
    console.error('Anime fetch error:', animeResult.reason);
    showError(animeGrid, animeResult.reason?.message || String(animeResult.reason));
    animeCount.textContent = '0 shows';
  }
}

// ─────────────────────────────────────────
// DOM-ready entry point
// ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // ── Search form ──
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    performSearch(searchInput.value);
  });

  // Live search with debounce
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = searchInput.value.trim();
    if (!q) {
      searchResults.hidden = true;
      return;
    }
    searchTimeout = setTimeout(() => performSearch(q), 400);
  });

  // Close results when clicking outside
  document.addEventListener('click', e => {
    if (!searchForm.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.hidden = true;
    }
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') searchResults.hidden = true;
  });

  // ── Boot ──
  init().catch(err => console.error('Init error:', err));
});
