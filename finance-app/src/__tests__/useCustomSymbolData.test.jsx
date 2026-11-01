import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCustomSymbolData } from '../hooks/useMarketData.js';

describe('useCustomSymbolData (mock mode)', () => {
  it('returns IBM plus the chosen supported symbol', async () => {
    const { result } = renderHook(() => useCustomSymbolData('NVDA', 'WEEK', { useMock: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(Object.keys(result.current.seriesData)).toEqual(['IBM', 'NVDA']);
    expect(result.current.seriesData.NVDA.length).toBeGreaterThan(0);
    expect(result.current.notFound).toBe(false);
    expect(result.current.quote?.symbol).toBe('NVDA');
  });

  it('reports notFound for an unsupported symbol instead of substituting data', async () => {
    const { result } = renderHook(() => useCustomSymbolData('ZZZZ', 'WEEK', { useMock: true }));
    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(result.current.seriesData.ZZZZ).toEqual([]);
    expect(result.current.quote).toBeNull();
  });

  it('is idle without a symbol', () => {
    const { result } = renderHook(() => useCustomSymbolData(null, 'WEEK', { useMock: true }));
    expect(result.current.notFound).toBe(false);
  });
});
