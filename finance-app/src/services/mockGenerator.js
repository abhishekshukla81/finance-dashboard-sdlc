/**
 * mockGenerator.js
 *
 * Deterministic, offline-safe mock data for ANY valid ticker.
 * The same symbol always yields the same quote and price series, so the UI
 * is stable between renders and tests are repeatable. Output shapes match
 * normalizer.js. The data is simulated and must never be presented as real.
 */
import { isValidSymbol } from '../utils/symbols.js';

/** Number of daily points after "today" in the generated history (31 points total). */
export const MOCK_HISTORY_DAYS = 30;

/** FNV-1a 32-bit hash of a string. */
function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32 seeded PRNG: returns a function producing floats in [0, 1). */
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Generate a deterministic mock quote for a valid ticker.
 * @param {string} symbol - 1–5 letter uppercase ticker
 * @returns {import('./normalizer.js').Quote}
 * @throws {Error} when the symbol is not a valid ticker
 */
export function generateMockQuote(symbol) {
  if (!isValidSymbol(symbol)) throw new Error('Invalid ticker symbol');

  const rand = seededRandom(hashString(`quote:${symbol}`));

  const previousClose = round2(20 + rand() * 480);
  const changePercent = round2((rand() - 0.5) * 6); // -3% … +3%
  const change        = round2((previousClose * changePercent) / 100);
  const price         = round2(previousClose + change);
  const open          = round2(previousClose * (1 + (rand() - 0.5) * 0.01));
  const high          = round2(Math.max(price, open) * (1 + rand() * 0.008));
  const low           = round2(Math.min(price, open) * (1 - rand() * 0.008));
  const fiftyTwoWeekLow  = round2(Math.min(low, price) * (0.6 + rand() * 0.25));
  const fiftyTwoWeekHigh = round2(Math.max(high, price) * (1.05 + rand() * 0.3));
  const volume    = Math.round(500_000 + rand() * 40_000_000);
  const marketCap = Math.round((5 + rand() * 995) * 1_000_000_000);

  return {
    symbol,
    name: symbol,
    price,
    change,
    changePercent,
    previousClose,
    open,
    high,
    low,
    volume,
    marketCap,
    fiftyTwoWeekLow,
    fiftyTwoWeekHigh,
    currency: 'USD',
    marketState: 'REGULAR',
  };
}

/**
 * Generate a deterministic daily history of `days` days back plus today
 * (`days + 1` points). The last close equals `endPrice`, so the chart agrees
 * with the quote. The walk goes backwards from the end price using the same
 * seeded sequence for every window, so a 7-day series is the tail of the
 * 30-day series for the same symbol.
 * @param {string} symbol
 * @param {number} days - whole days back from today (1–365)
 * @param {number} [endPrice] - defaults to the generated quote price
 * @returns {import('./normalizer.js').HistoryPoint[]}
 * @throws {Error} when the symbol or day count is invalid
 */
export function generateMockSeries(symbol, days, endPrice) {
  if (!isValidSymbol(symbol)) throw new Error('Invalid ticker symbol');
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('Invalid day count');

  const last = endPrice ?? generateMockQuote(symbol).price;
  const rand = seededRandom(hashString(`history:${symbol}`));

  const closes = new Array(days + 1);
  closes[days] = last;
  for (let i = days; i > 0; i--) {
    const dailyReturn = (rand() - 0.5) * 0.04; // ±2% per day
    closes[i - 1] = Math.max(0.01, closes[i] / (1 + dailyReturn));
  }

  const today = new Date();
  return closes.map((close, idx) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - idx));
    return { symbol, date, close: round2(close) };
  });
}

/** 31-point (30 days back + today) history. */
export function generateMockHistory30(symbol, endPrice) {
  return generateMockSeries(symbol, MOCK_HISTORY_DAYS, endPrice);
}
