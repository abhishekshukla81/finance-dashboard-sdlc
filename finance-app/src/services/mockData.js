/**
 * mockData.js
 *
 * Pre-shaped fixture data for tests and offline development.
 * All shapes match the output of normalizer.js exactly.
 */
import { TICKERS } from '../constants/tickers.js';

// ─── Quote fixtures ──────────────────────────────────────────────────────────

const FIXTURES = [
  { symbol: 'IBM',  name: 'International Business Machines Corporation', price: 175.40, change:  1.23, changePercent:  0.71, previousClose: 174.17, open: 174.20, high: 176.10, low: 173.80, volume:  3_200_000, marketCap:  159_800_000_000, fiftyTwoWeekLow: 140.86, fiftyTwoWeekHigh: 199.18 },
  { symbol: 'MSFT', name: 'Microsoft Corporation',                       price: 415.20, change: -2.45, changePercent: -0.59, previousClose: 417.65, open: 417.00, high: 418.30, low: 413.90, volume: 18_500_000, marketCap: 3_090_000_000_000, fiftyTwoWeekLow: 344.79, fiftyTwoWeekHigh: 468.35 },
  { symbol: 'ORCL', name: 'Oracle Corporation',                          price: 128.50, change:  0.85, changePercent:  0.67, previousClose: 127.65, open: 127.80, high: 129.20, low: 127.50, volume:  5_100_000, marketCap:   353_000_000_000, fiftyTwoWeekLow:  99.26, fiftyTwoWeekHigh: 198.31 },
  { symbol: 'SAP',  name: 'SAP SE',                                      price: 196.75, change:  1.95, changePercent:  1.00, previousClose: 194.80, open: 195.00, high: 197.40, low: 194.80, volume:  1_100_000, marketCap:   238_000_000_000, fiftyTwoWeekLow: 164.83, fiftyTwoWeekHigh: 262.71 },
  { symbol: 'CRM',  name: 'Salesforce, Inc.',                            price: 287.60, change: -0.90, changePercent: -0.31, previousClose: 288.50, open: 288.50, high: 289.80, low: 286.20, volume:  4_200_000, marketCap:   278_000_000_000, fiftyTwoWeekLow: 212.00, fiftyTwoWeekHigh: 369.00 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation',                          price: 135.58, change:  2.14, changePercent:  1.60, previousClose: 133.44, open: 133.80, high: 136.20, low: 133.10, volume: 42_000_000, marketCap: 3_320_000_000_000, fiftyTwoWeekLow:  66.25, fiftyTwoWeekHigh: 153.13 },
];

const withDefaults = (f) => ({ currency: 'USD', marketState: 'REGULAR', ...f });

/** Quotes for the tracked companies, in TICKERS order. */
export const MOCK_QUOTES = TICKERS.map(({ symbol }) =>
  withDefaults(FIXTURES.find((f) => f.symbol === symbol))
);

const BASE_PRICES = Object.fromEntries(FIXTURES.map((f) => [f.symbol, f.price]));

/**
 * Symbols the offline mock mode recognises for the custom-company chart.
 * Anything else is treated as "not found" so the error path is testable offline.
 */
export const MOCK_SUPPORTED_SYMBOLS = [
  ...new Set([...TICKERS.map(({ symbol }) => symbol), 'AAPL', 'GOOGL', 'AMZN', 'META', 'TSLA']),
];

/** Offline quote for any symbol the mock mode supports, or null. */
export function getMockQuote(symbol) {
  const tracked = MOCK_QUOTES.find((q) => q.symbol === symbol);
  if (tracked) return tracked;
  if (!MOCK_SUPPORTED_SYMBOLS.includes(symbol)) return null;

  const price = BASE_PRICES[symbol] ?? 150;
  return withDefaults({
    symbol,
    name: symbol,
    price,
    change: 1,
    changePercent: parseFloat(((1 / price) * 100).toFixed(2)),
    previousClose: price - 1,
    open: price - 0.5,
    high: price + 1.5,
    low: price - 1.5,
    volume: 5_000_000,
    marketCap: Math.round(price * 900_000_000),
    fiftyTwoWeekLow: Math.round(price * 70) / 100,
    fiftyTwoWeekHigh: Math.round(price * 130) / 100,
  });
}

// ─── History fixture generator ───────────────────────────────────────────────

/**
 * Generate a simple mock history for a symbol over N days back from today.
 * @param {string} symbol
 * @param {number} days
 * @returns {HistoryPoint[]}
 */
export function generateMockHistory(symbol, days) {
  const base  = BASE_PRICES[symbol] ?? 150;
  const today = new Date();
  const result = [];

  for (let i = days; i >= 0; i--) {
    const date  = new Date(today);
    date.setDate(today.getDate() - i);
    const noise = (Math.random() - 0.48) * 2;
    const prev  = result.length > 0 ? result[result.length - 1].close : base;
    result.push({ symbol, date, close: parseFloat((prev + noise).toFixed(2)) });
  }
  return result;
}

/** Pre-generated mock history for common ranges */
export const MOCK_HISTORY_7D  = Object.fromEntries(
  TICKERS.map(({ symbol }) => [symbol, generateMockHistory(symbol, 7)])
);

export const MOCK_HISTORY_90D = Object.fromEntries(
  TICKERS.map(({ symbol }) => [symbol, generateMockHistory(symbol, 90)])
);
