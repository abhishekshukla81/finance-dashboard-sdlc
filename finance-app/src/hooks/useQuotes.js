import { useState, useEffect } from 'react';
import { fetchQuotes } from '../services/yahooFinance.js';
import { MOCK_QUOTES } from '../services/mockData.js';

/**
 * useQuotes
 *
 * Fetches current-day quotes for an array of ticker symbols.
 *
 * @param {string[]} symbols
 * @param {{ useMock?: boolean }} [options]
 * @returns {{ quotes: QuoteShape[], loading: boolean, error: string|null, refetch: () => void }}
 */
export function useQuotes(symbols, { useMock = false } = {}) {
  const [quotes,  setQuotes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
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
        const data = useMock ? MOCK_QUOTES : await fetchQuotes(symbols);
        if (!cancelled) setQuotes(data);
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Failed to load quotes');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(','), useMock, tick]);

  return { quotes, loading, error, refetch };
}
