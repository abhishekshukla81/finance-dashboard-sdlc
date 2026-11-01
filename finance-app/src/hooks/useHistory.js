import { useState, useEffect } from 'react';
import { fetchHistory } from '../services/yahooFinance.js';
import { generateMockHistory } from '../services/mockData.js';
import { getHistory } from '../services/marketDataService.js';
import { RANGES } from '../constants/tickers.js';

/**
 * useHistory
 *
 * Fetches OHLC close history for a single ticker symbol.
 *
 * @param {string} symbol
 * @param {'DAY'|'WEEK'|'MONTH'|'QUARTER'} windowKey  - Key into RANGES constant
 * @param {{ useMock?: boolean, fallback?: boolean }} [options]
 *   `fallback` (default false) opts in to simulated data when the live source
 *   is unavailable, and makes mock mode serve the deterministic 30-day series.
 * @returns {{ history: HistoryPoint[], loading: boolean, error: string|null,
 *             source: 'live'|'simulated'|null, reason: string|null, refetch: () => void }}
 */
export function useHistory(symbol, windowKey, { useMock = false, fallback = false } = {}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [meta,    setMeta]    = useState({ source: null, reason: null });
  const [tick,    setTick]    = useState(0);

  const refetch = () => setTick((t) => t + 1);

  const rangeConfig = RANGES[windowKey] ?? RANGES.WEEK;

  useEffect(() => {
    if (!symbol) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        let data;
        let nextMeta = { source: null, reason: null };
        if (fallback) {
          const result = await getHistory(symbol, windowKey, { useMock });
          data = result.data;
          nextMeta = { source: result.source, reason: result.reason };
        } else if (useMock) {
          const days = { QUARTER: 90, MONTH: 30 }[windowKey] ?? 7;
          data = generateMockHistory(symbol, days);
        } else {
          data = await fetchHistory(symbol, rangeConfig.range, rangeConfig.interval);
        }
        if (!cancelled) { setHistory(data); setMeta(nextMeta); }
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Failed to load history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, windowKey, useMock, fallback, tick]);

  return { history, loading, error, source: meta.source, reason: meta.reason, refetch };
}
