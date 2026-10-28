/**
 * yahooFinance.js
 *
 * Data-access layer for Yahoo Finance.
 *
 * All calls go through /api/finance/* which is:
 *  - proxied by Vite in development (see vite.config.js)
 *  - served by a backend proxy in production
 *
 * No Yahoo Finance URLs appear in the browser bundle.
 * No secrets or API keys are stored here — the proxy holds auth if required.
 */
import { normalizeQuote, normalizeHistory } from './normalizer.js';

const API_BASE = '/api/finance';
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Thin fetch wrapper with timeout and structured error.
 */
async function apiFetch(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${path}`);
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error(`Request timed out: ${path}`);
    throw err;
  }
}

/**
 * Fetch current-day quotes for one or more ticker symbols.
 * @param {string[]} symbols
 * @returns {Promise<QuoteShape[]>}
 */
export async function fetchQuotes(symbols) {
  const joined = symbols.join(',');
  const data   = await apiFetch(`/quote?symbols=${encodeURIComponent(joined)}`);
  const results = data?.quoteResponse?.result ?? [];
  return results.map(normalizeQuote);
}

/**
 * Fetch OHLC history for a single ticker.
 * @param {string} symbol
 * @param {'1d'|'5d'|'3mo'} range
 * @param {'5m'|'1d'|'1wk'} interval
 * @returns {Promise<HistoryPoint[]>}
 */
export async function fetchHistory(symbol, range, interval) {
  const data = await apiFetch(
    `/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`
  );
  return normalizeHistory(data, symbol);
}
