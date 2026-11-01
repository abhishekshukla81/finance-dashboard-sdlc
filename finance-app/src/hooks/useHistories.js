import { useState, useEffect } from 'react';
import { getHistory, SOURCE } from '../services/marketDataService.js';

/**
 * useHistories
 *
 * Price history for a variable-length list of symbols, with fallback to
 * simulated data when the live source is unavailable (HTTP 429, 5xx, timeout,
 * network). Replaces calling `useHistory` in a loop, which breaks when the
 * list length changes.
 *
 * Failures are reported per symbol (`errors[symbol]`) so one bad symbol does
 * not blank the others.
 *
 * @param {string[]} symbols
 * @param {'WEEK'|'MONTH'|'QUARTER'} windowKey
 * @param {{ useMock?: boolean }} [options]
 * @returns {{ histories: Record<string, object[]>, errors: Record<string, string>,
 *             loading: boolean, source: 'live'|'simulated'|null, reason: string|null,
 *             refetch: () => void }}
 */
export function useHistories(symbols, windowKey, { useMock = false } = {}) {
  const [state, setState] = useState({
    histories: {}, errors: {}, source: null, reason: null, loading: true,
  });
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);
  const key = symbols.join(',');

  useEffect(() => {
    if (!symbols.length) {
      setState({ histories: {}, errors: {}, source: null, reason: null, loading: false });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    const load = async () => {
      const settled = await Promise.allSettled(
        symbols.map((symbol) => getHistory(symbol, windowKey, { useMock }))
      );
      if (cancelled) return;

      const histories = {};
      const errors = {};
      let simulated = null;
      settled.forEach((result, i) => {
        const symbol = symbols[i];
        if (result.status === 'fulfilled') {
          histories[symbol] = result.value.data;
          if (result.value.source === SOURCE.SIMULATED && !simulated) simulated = result.value;
        } else {
          errors[symbol] = result.reason?.message ?? 'Failed to load history';
        }
      });

      setState({
        histories,
        errors,
        source: simulated ? SOURCE.SIMULATED : SOURCE.LIVE,
        reason: simulated ? simulated.reason : null,
        loading: false,
      });
    };

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, windowKey, useMock, tick]);

  return { ...state, refetch };
}
