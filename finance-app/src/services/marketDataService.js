/**
 * marketDataService.js
 *
 * Decides between live Yahoo data and deterministic simulated data.
 *
 * - Mock mode (`useMock`) always serves simulated data.
 * - Live mode falls back to simulated data ONLY when the data source is
 *   unavailable: HTTP 429, HTTP 5xx, timeout, or a network failure.
 * - HTTP 404 (and other 4xx) and empty results are NOT masked: they are
 *   returned/thrown as-is so the UI still reports "no data".
 *
 * Every result carries `source` and `reason` so the UI can label simulated
 * data. Simulated data is unverified and must never be presented as real.
 */
import { fetchQuotes, fetchHistory } from './yahooFinance.js';
import { getMockQuote, getMockHistory } from './mockData.js';
import { RANGES } from '../constants/tickers.js';

export const SOURCE = Object.freeze({ LIVE: 'live', SIMULATED: 'simulated' });
export const REASON = Object.freeze({ MOCK_MODE: 'mock-mode', UNAVAILABLE: 'unavailable' });

/** Days of simulated history per window (matches the live ranges). */
const MOCK_DAYS = Object.freeze({ WEEK: 7, MONTH: 30, QUARTER: 90 });

/**
 * Whether a failed live request means "source unavailable" (fall back)
 * rather than "symbol unknown / bad request" (do not fall back).
 * @param {Error & { status?: number }} err
 * @returns {boolean}
 */
export function isFallbackError(err) {
  const fromMessage = /\bHTTP (\d{3})\b/.exec(err?.message ?? '');
  const status = err?.status ?? (fromMessage ? Number(fromMessage[1]) : null);
  if (status === null) return true; // timeout, network, parse
  return status === 429 || status >= 500;
}

const live      = (data) => ({ data, source: SOURCE.LIVE,      reason: null });
const simulated = (data, reason) => ({ data, source: SOURCE.SIMULATED, reason });

/**
 * Quotes for one or more symbols.
 * @param {string[]} symbols
 * @param {{ useMock?: boolean }} [options]
 * @returns {Promise<{ data: object[], source: string, reason: string|null }>}
 */
export async function getQuotes(symbols, { useMock = false } = {}) {
  const mock = () => symbols.map(getMockQuote).filter(Boolean);

  if (useMock) return simulated(mock(), REASON.MOCK_MODE);
  try {
    return live(await fetchQuotes(symbols));
  } catch (err) {
    if (!isFallbackError(err)) throw err;
    return simulated(mock(), REASON.UNAVAILABLE);
  }
}

/**
 * Price history for one symbol. Simulated history is deterministic and sized
 * to the window: 7 days (8 points), 30 days (31 points) or 90 days (91 points).
 * @param {string} symbol
 * @param {keyof typeof RANGES} windowKey
 * @param {{ useMock?: boolean }} [options]
 * @returns {Promise<{ data: object[], source: string, reason: string|null }>}
 */
export async function getHistory(symbol, windowKey, { useMock = false } = {}) {
  const mock = () => getMockHistory(symbol, MOCK_DAYS[windowKey] ?? 30) ?? [];

  if (useMock) return simulated(mock(), REASON.MOCK_MODE);
  const { range, interval } = RANGES[windowKey] ?? RANGES.MONTH;
  try {
    return live(await fetchHistory(symbol, range, interval));
  } catch (err) {
    if (!isFallbackError(err)) throw err;
    return simulated(mock(), REASON.UNAVAILABLE);
  }
}
