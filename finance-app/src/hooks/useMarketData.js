import { useHistory } from './useHistory.js';
import { useQuotes } from './useQuotes.js';
import { SOURCE } from '../services/marketDataService.js';

/** HTTP 4xx from the proxy means Yahoo does not know the symbol. */
const isNotFoundError = (message) => /HTTP 4\d\d/.test(message ?? '');

/**
 * useCustomSymbolData
 *
 * 30-day history and current quote for one user-chosen symbol, built on the
 * existing useHistory and useQuotes hooks with fallback opted in.
 *
 * - Mock mode serves deterministic simulated data for any valid symbol.
 * - Live mode falls back to simulated data only when the source is
 *   unavailable (429, 5xx, timeout, network). HTTP 404 and an empty result
 *   are reported as `notFound`; another company's data is never substituted.
 * - `simulated` is true whenever any shown data is generated, with the
 *   `simulatedReason` ('mock-mode' | 'unavailable').
 *
 * @param {string|null} symbol
 * @param {{ useMock?: boolean }} [options]
 * @returns {{ history: HistoryPoint[], quote: object|null, loading: boolean,
 *             error: string|null, notFound: boolean, simulated: boolean,
 *             simulatedReason: string|null, refetch: () => void }}
 */
export function useCustomSymbolData(symbol, { useMock = false } = {}) {
  const historyResult = useHistory(symbol, 'MONTH', { useMock, fallback: true });
  const quotesResult  = useQuotes(symbol ? [symbol] : [], { useMock, fallback: true });

  const quote = symbol
    ? quotesResult.quotes.find((q) => q.symbol === symbol) ?? null
    : null;

  const { history, error } = historyResult;
  const loading = Boolean(symbol) && (historyResult.loading || quotesResult.loading);
  const notFound = Boolean(symbol) && !loading
    && (isNotFoundError(error) || (!error && history.length === 0));

  const simulatedResult = [historyResult, quotesResult].find((r) => r.source === SOURCE.SIMULATED);
  const simulated = Boolean(symbol) && !loading && !notFound && Boolean(simulatedResult);

  const refetch = () => { historyResult.refetch(); quotesResult.refetch(); };

  return {
    history,
    quote,
    loading,
    error: error ?? quotesResult.error,
    notFound,
    simulated,
    simulatedReason: simulated ? simulatedResult.reason : null,
    refetch,
  };
}
