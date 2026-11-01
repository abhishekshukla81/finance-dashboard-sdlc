import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCustomSymbolData } from '../hooks/useMarketData.js';

describe('useCustomSymbolData (mock mode)', () => {
  it('returns 30-day history and the quote for a tracked symbol', async () => {
    const { result } = renderHook(() => useCustomSymbolData('NVDA', { useMock: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.history).toHaveLength(31);
    expect(result.current.history[0].symbol).toBe('NVDA');
    expect(result.current.quote?.name).toBe('NVIDIA Corporation');
    expect(result.current.notFound).toBe(false);
  });

  it.each(['AAPL', 'ZZZZ'])('reports notFound for %s instead of substituting data', async (sym) => {
    const { result } = renderHook(() => useCustomSymbolData(sym, { useMock: true }));
    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(result.current.history).toEqual([]);
    expect(result.current.quote).toBeNull();
  });

  it('is idle without a symbol', () => {
    const { result } = renderHook(() => useCustomSymbolData(null, { useMock: true }));
    expect(result.current.notFound).toBe(false);
    expect(result.current.quote).toBeNull();
  });
});
