import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../services/yahooFinance.js', () => ({
  fetchQuotes: vi.fn(),
  fetchHistory: vi.fn(),
}));

import { fetchHistory } from '../services/yahooFinance.js';
import { useHistories } from '../hooks/useHistories.js';

const httpError = (status) => Object.assign(new Error(`HTTP ${status} from /chart`), { status });
const pts = (symbol) => [{ symbol, date: new Date(), close: 1 }, { symbol, date: new Date(), close: 2 }];

beforeEach(() => vi.resetAllMocks());

describe('useHistories', () => {
  it('serves simulated 7-day history per symbol in mock mode', async () => {
    const { result } = renderHook(() => useHistories(['IBM', 'AAPL'], 'WEEK', { useMock: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(Object.keys(result.current.histories)).toEqual(['IBM', 'AAPL']);
    expect(result.current.histories.AAPL).toHaveLength(8);
    expect(result.current.source).toBe('simulated');
    expect(result.current.reason).toBe('mock-mode');
    expect(fetchHistory).not.toHaveBeenCalled();
  });

  it('returns live data without a simulated flag', async () => {
    fetchHistory.mockImplementation(async (s) => pts(s));
    const { result } = renderHook(() => useHistories(['IBM'], 'QUARTER'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchHistory).toHaveBeenCalledWith('IBM', '3mo', '1wk');
    expect(result.current.source).toBe('live');
    expect(result.current.reason).toBeNull();
  });

  it('falls back to simulated history on HTTP 429', async () => {
    fetchHistory.mockRejectedValue(httpError(429));
    const { result } = renderHook(() => useHistories(['IBM'], 'WEEK'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.histories.IBM).toHaveLength(8);
    expect(result.current.source).toBe('simulated');
    expect(result.current.reason).toBe('unavailable');
  });

  it('keeps other symbols when one fails with a non-fallback error', async () => {
    fetchHistory.mockImplementation(async (s) => {
      if (s === 'BAD') throw httpError(404);
      return pts(s);
    });
    const { result } = renderHook(() => useHistories(['IBM', 'BAD'], 'WEEK'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.histories.IBM).toHaveLength(2);
    expect(result.current.histories.BAD).toBeUndefined();
    expect(result.current.errors.BAD).toContain('HTTP 404');
  });

  it('copes with a changing number of symbols', async () => {
    const { result, rerender } = renderHook(
      ({ symbols }) => useHistories(symbols, 'WEEK', { useMock: true }),
      { initialProps: { symbols: ['IBM'] } }
    );
    await waitFor(() => expect(Object.keys(result.current.histories)).toEqual(['IBM']));
    rerender({ symbols: ['IBM', 'MSFT', 'AAPL'] });
    await waitFor(() => expect(Object.keys(result.current.histories)).toEqual(['IBM', 'MSFT', 'AAPL']));
  });

  it('is idle for an empty list', async () => {
    const { result } = renderHook(() => useHistories([], 'WEEK', { useMock: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.histories).toEqual({});
  });
});
