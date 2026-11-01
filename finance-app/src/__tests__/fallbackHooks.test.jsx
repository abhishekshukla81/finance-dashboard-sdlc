import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../services/yahooFinance.js', () => ({
  fetchQuotes: vi.fn(),
  fetchHistory: vi.fn(),
}));

import { fetchQuotes, fetchHistory } from '../services/yahooFinance.js';
import { useCustomSymbolData } from '../hooks/useMarketData.js';
import { useHistory } from '../hooks/useHistory.js';
import { useQuotes } from '../hooks/useQuotes.js';

const httpError = (status) => Object.assign(new Error(`HTTP ${status} from /x`), { status });

beforeEach(() => {
  vi.resetAllMocks();
});

describe('useCustomSymbolData (live mode)', () => {
  it('falls back to simulated data on HTTP 429', async () => {
    fetchHistory.mockRejectedValue(httpError(429));
    fetchQuotes.mockRejectedValue(httpError(429));
    const { result } = renderHook(() => useCustomSymbolData('AAPL', { useMock: false }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notFound).toBe(false);
    expect(result.current.history).toHaveLength(31);
    expect(result.current.quote?.symbol).toBe('AAPL');
    expect(result.current.simulated).toBe(true);
    expect(result.current.simulatedReason).toBe('unavailable');
  });

  it('reports notFound on HTTP 404 without falling back', async () => {
    fetchHistory.mockRejectedValue(httpError(404));
    fetchQuotes.mockRejectedValue(httpError(404));
    const { result } = renderHook(() => useCustomSymbolData('QQQQQ', { useMock: false }));
    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(result.current.history).toEqual([]);
    expect(result.current.quote).toBeNull();
    expect(result.current.simulated).toBe(false);
  });

  it('reports notFound on an empty live result without falling back', async () => {
    fetchHistory.mockResolvedValue([]);
    fetchQuotes.mockResolvedValue([]);
    const { result } = renderHook(() => useCustomSymbolData('QQQQQ', { useMock: false }));
    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(result.current.simulated).toBe(false);
  });

  it('is not simulated when live data is returned', async () => {
    fetchHistory.mockResolvedValue([{ symbol: 'IBM', date: new Date(), close: 1 }]);
    fetchQuotes.mockResolvedValue([{ symbol: 'IBM', price: 1 }]);
    const { result } = renderHook(() => useCustomSymbolData('IBM', { useMock: false }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.simulated).toBe(false);
    expect(result.current.quote?.price).toBe(1);
  });
});

describe('fallback is opt-in (default hook behaviour is unchanged)', () => {
  it('useHistory surfaces the error on HTTP 429 when fallback is not requested', async () => {
    fetchHistory.mockRejectedValue(httpError(429));
    const { result } = renderHook(() => useHistory('IBM', 'WEEK', { useMock: false }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toContain('HTTP 429');
    expect(result.current.history).toEqual([]);
    expect(result.current.source).toBeNull();
  });

  it('useQuotes surfaces the error on HTTP 429 when fallback is not requested', async () => {
    fetchQuotes.mockRejectedValue(httpError(429));
    const { result } = renderHook(() => useQuotes(['IBM'], { useMock: false }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toContain('HTTP 429');
    expect(result.current.quotes).toEqual([]);
  });

  it('useHistory in mock mode without fallback keeps the legacy series', async () => {
    const { result } = renderHook(() => useHistory('IBM', 'WEEK', { useMock: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.history).toHaveLength(8); // 7 days back + today
    expect(fetchHistory).not.toHaveBeenCalled();
  });
});
