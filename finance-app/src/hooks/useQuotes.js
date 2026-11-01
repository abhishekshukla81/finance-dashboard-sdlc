import { useState, useEffect } from 'react';
import { fetchQuotes } from '../services/yahooFinance.js';
import { MOCK_QUOTES } from '../services/mockData.js';
import { getQuotes } from '../services/marketDataService.js';

/**
 * useQuotes
 *
 * Fetches current-day quotes for an array of ticker symbols.
 *
 * @param {string[]} symbols
 * @param {{ useMock?: boolean, fallback?: boolean }} [options]
 *   `fallback` (default false) opts in to per-symbol simulated data: mock mode
 *   returns a quote for every requested symbol, and live mode falls back to
 *   simulated quotes when the source is unavailable (429, 5xx, timeout, network).
 * @returns {{ quotes: QuoteShape[], loading: boolean, error: string|null,
 *             source: 'live'|'simulated'|null, reason: string|null, refetch: () => void }}
 */
export function useQuotes(symbols, { useMock = false, fallback = false } = {}) {
  const [quotes,  setQuotes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [meta,    setMeta]    = useState({ source: null, reason: null });
  const [tick,    setTick]    = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!symbols?.length) {
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
          const result = await getQuotes(symbols, { useMock });
          data = result.data;
          nextMeta = { source: result.source, reason: result.reason };
        } else {
          data = useMock ? MOCK_QUOTES : await fetchQuotes(symbols);
        }
        if (!cancelled) { setQuotes(data); setMeta(nextMeta); }
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Failed to load quotes');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(','), useMock, fallback, tick]);

  return { quotes, loading, error, source: meta.source, reason: meta.reason, refetch };
}
