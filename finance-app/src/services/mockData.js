/**
 * mockData.js
 *
 * Pre-shaped fixture data for tests and offline development.
 * All shapes match the output of normalizer.js exactly.
 */
import { TICKERS } from '../constants/tickers.js';

// ─── Quote fixtures ──────────────────────────────────────────────────────────

const BASE_PRICES = { IBM: 171.42, MSFT: 415.30, ORCL: 139.85, SAP: 211.60, CRM: 302.75 };
const BASE_CHANGES = { IBM: 1.23, MSFT: -2.15, ORCL: 0.95, SAP: 3.40, CRM: -1.80 };

export const MOCK_QUOTES = TICKERS.map(({ symbol, name }) => {
  const price  = BASE_PRICES[symbol] ?? 100;
  const change = BASE_CHANGES[symbol] ?? 0;
  return {
    symbol,
    name,
    price,
    change,
    changePercent: parseFloat(((change / price) * 100).toFixed(2)),
    open:      price - change - 0.3,
    high:      price + Math.abs(change) * 1.2,
    low:       price - Math.abs(change) * 1.2,
    volume:    Math.round(4_000_000 + Math.random() * 6_000_000),
    marketCap: Math.round(price * 900_000_000),
    currency:  'USD',
    marketState: 'REGULAR',
  };
});

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
