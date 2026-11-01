import { useMemo } from 'react';
import { TICKERS, TOP_N } from '../constants/tickers.js';
import useDashboardStore from '../store/dashboardStore.js';
import { useQuotes } from './useQuotes.js';
import { rankByDailyChange } from '../utils/ranking.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const TRACKED_COLORS = Object.fromEntries(TICKERS.map((t) => [t.symbol, t.color]));

/**
 * useTopCompanies
 *
 * Tracked plus dynamically added companies, ranked by today's % change (the
 * Daily Performance Ranking order), limited to the top `limit`.
 *
 * @param {number} [limit] defaults to TOP_N (8)
 * @returns {{ top: object[], symbols: string[], colors: object, names: object,
 *             total: number, loading: boolean, error: string|null,
 *             source: string|null, reason: string|null, refetch: () => void }}
 */
export function useTopCompanies(limit = TOP_N) {
  const addedCompanies = useDashboardStore((s) => s.addedCompanies);

  const allSymbols = useMemo(
    () => [...TICKERS.map((t) => t.symbol), ...addedCompanies.map((c) => c.symbol)],
    [addedCompanies]
  );

  const { quotes, loading, error, source, reason, refetch } =
    useQuotes(allSymbols, { useMock: USE_MOCK, fallback: true });

  return useMemo(() => {
    const colors = {
      ...TRACKED_COLORS,
      ...Object.fromEntries(addedCompanies.map((c) => [c.symbol, c.color])),
    };
    const trackedNames = Object.fromEntries(TICKERS.map((t) => [t.symbol, t.name]));
    const names = {
      ...trackedNames,
      ...Object.fromEntries(addedCompanies.map((c) => [c.symbol, c.name])),
    };
    const top = rankByDailyChange(quotes).slice(0, limit);
    return {
      top,
      symbols: top.map((q) => q.symbol),
      colors,
      names,
      total: quotes.length,
      loading,
      error,
      source,
      reason,
      refetch,
    };
  }, [quotes, addedCompanies, limit, loading, error, source, reason, refetch]);
}
