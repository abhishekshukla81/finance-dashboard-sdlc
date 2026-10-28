import { useState, useEffect } from 'react';
import { fetchHistory } from '../services/yahooFinance.js';
import { generateMockHistory } from '../services/mockData.js';
import { RANGES } from '../constants/tickers.js';

/**
 * useHistory
 *
 * Fetches OHLC close history for a single ticker symbol.
 *
 * @param {string} symbol
 * @param {'DAY'|'WEEK'|'QUARTER'} windowKey  - Key into RANGES constant
 * @param {{ useMock?: boolean }} [options]
 * @returns {{ history: HistoryPoint[], loading: boolean, error: string|null, refetch: () => void }}
 */
export function useHistory(symbol, windowKey, { useMock = false } = {}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
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
        if (useMock) {
          const days = windowKey === 'QUARTER' ? 90 : 7;
          data = generateMockHistory(symbol, days);
        } else {
          data = await fetchHistory(symbol, rangeConfig.range, rangeConfig.interval);
        }
        if (!cancelled) setHistory(data);
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Failed to load history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, windowKey, useMock, tick]);

  return { history, loading, error, refetch };
}
