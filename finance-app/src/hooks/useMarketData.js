import { useHistory } from './useHistory.js';
import { useQuotes } from './useQuotes.js';
import { MOCK_SUPPORTED_SYMBOLS, getMockQuote } from '../services/mockData.js';

export const BASELINE_SYMBOL = 'IBM';

/** HTTP 4xx from the proxy means Yahoo does not know the symbol. */
const isNotFoundError = (message) => /HTTP 4\d\d/.test(message ?? '');

/**
 * useCustomSymbolData
 *
 * History for a user-chosen symbol plus the IBM baseline, built on the
 * existing useHistory hook. Never substitutes another company's data: an
 * unknown or empty symbol is reported as `notFound`.
 *
 * @param {string|null} symbol
 * @param {'WEEK'|'QUARTER'} windowKey
 * @param {{ useMock?: boolean }} [options]
 * @returns {{ seriesData: object, quote: object|null, loading: boolean,
 *             error: string|null, notFound: boolean, refetch: () => void }}
 */
export function useCustomSymbolData(symbol, windowKey, { useMock = false } = {}) {
  // Offline mock mode only knows a fixed set of symbols.
  const mockUnknown = useMock && Boolean(symbol) && !MOCK_SUPPORTED_SYMBOLS.includes(symbol);
  const fetchSymbol = mockUnknown ? null : symbol;

  const baseline = useHistory(BASELINE_SYMBOL, windowKey, { useMock });
  const custom   = useHistory(fetchSymbol,     windowKey, { useMock });

  const quotesResult = useQuotes(fetchSymbol ? [fetchSymbol] : [], { useMock });
  const quote = fetchSymbol
    ? quotesResult.quotes.find((q) => q.symbol === fetchSymbol)
      ?? (useMock ? getMockQuote(fetchSymbol) : null)
    : null;

  const loading = Boolean(fetchSymbol) && (baseline.loading || custom.loading);
  const error   = baseline.error ?? custom.error;
  const notFound = Boolean(symbol) && (
    mockUnknown
    || (!loading && (isNotFoundError(custom.error) || (!error && custom.history.length === 0)))
  );

  const seriesData = symbol === BASELINE_SYMBOL
    ? { [BASELINE_SYMBOL]: baseline.history }
    : { [BASELINE_SYMBOL]: baseline.history, [symbol]: custom.history };

  const refetch = () => { baseline.refetch(); custom.refetch(); quotesResult.refetch(); };

  return { seriesData, quote, loading, error, notFound, refetch };
}
