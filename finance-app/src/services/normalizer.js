/**
 * normalizer.js
 *
 * Converts raw Yahoo Finance API payloads into stable, app-specific shapes.
 * If Yahoo changes its response schema, only this file needs to change.
 */

/**
 * Normalize a single Yahoo Finance quote result object.
 * @param {object} raw  - One item from quoteResponse.result[]
 * @returns {QuoteShape}
 */
export function normalizeQuote(raw) {
  return {
    symbol:        raw.symbol        ?? '',
    name:          raw.longName ?? raw.shortName ?? raw.symbol ?? '',
    price:         raw.regularMarketPrice         ?? null,
    change:        raw.regularMarketChange        ?? null,
    changePercent: raw.regularMarketChangePercent ?? null,
    open:          raw.regularMarketOpen          ?? null,
    high:          raw.regularMarketDayHigh       ?? null,
    low:           raw.regularMarketDayLow        ?? null,
    volume:        raw.regularMarketVolume        ?? null,
    marketCap:     raw.marketCap                  ?? null,
    currency:      raw.currency                   ?? 'USD',
    marketState:   raw.marketState                ?? 'REGULAR',
  };
}

/**
 * Normalize a Yahoo Finance chart (history) response.
 * @param {object} raw   - Full chart API response body
 * @param {string} symbol
 * @returns {HistoryPoint[]}
 */
export function normalizeHistory(raw, symbol) {
  try {
    const result = raw?.chart?.result?.[0];
    if (!result) return [];

    const timestamps = result.timestamp ?? [];
    const closes     = result.indicators?.quote?.[0]?.close ?? [];

    return timestamps
      .map((ts, i) => ({
        symbol,
        date:  new Date(ts * 1000),
        close: closes[i] ?? null,
      }))
      .filter(p => p.close !== null);
  } catch {
    return [];
  }
}
