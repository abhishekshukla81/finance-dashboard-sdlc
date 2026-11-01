import { useHistory } from './useHistory.js';
import { useQuotes } from './useQuotes.js';
import { MOCK_SUPPORTED_SYMBOLS, getMockQuote } from '../services/mockData.js';

/** HTTP 4xx from the proxy means Yahoo does not know the symbol. */
const isNotFoundError = (message) => /HTTP 4\d\d/.test(message ?? '');

/**
 * useCustomSymbolData
 *
 * 30-day history and current quote for one user-chosen symbol, built on the
 * existing useHistory and useQuotes hooks. Never substitutes another
 * company's data: an unknown or empty symbol is reported as `notFound`.
 *
 * @param {string|null} symbol
 * @param {{ useMock?: boolean }} [options]
 * @returns {{ history: HistoryPoint[], quote: object|null, loading: boolean,
 *             error: string|null, notFound: boolean, refetch: () => void }}
 */
export function useCustomSymbolData(symbol, { useMock = false } = {}) {
  // Offline mock mode only knows the tracked companies.
  const mockUnknown = useMock && Boolean(symbol) && !MOCK_SUPPORTED_SYMBOLS.includes(symbol);
  const fetchSymbol = mockUnknown ? null : symbol;

  const historyResult = useHistory(fetchSymbol, 'MONTH', { useMock });
  const quotesResult  = useQuotes(fetchSymbol ? [fetchSymbol] : [], { useMock });

  const quote = fetchSymbol
    ? quotesResult.quotes.find((q) => q.symbol === fetchSymbol)
      ?? (useMock ? getMockQuote(fetchSymbol) : null)
    : null;

  const { history, error } = historyResult;
  const loading = Boolean(fetchSymbol) && (historyResult.loading || quotesResult.loading);
  const notFound = Boolean(symbol) && (
    mockUnknown
    || (!loading && (isNotFoundError(error) || (!error && history.length === 0)))
  );

  const refetch = () => { historyResult.refetch(); quotesResult.refetch(); };

  return { history, quote, loading, error: error ?? quotesResult.error, notFound, refetch };
}
