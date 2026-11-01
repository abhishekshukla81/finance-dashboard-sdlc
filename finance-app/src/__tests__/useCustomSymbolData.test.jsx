import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCustomSymbolData } from '../hooks/useMarketData.js';

describe('useCustomSymbolData (mock mode)', () => {
  it('returns 30-day history and the fixture quote for a tracked symbol', async () => {
    const { result } = renderHook(() => useCustomSymbolData('NVDA', { useMock: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.history).toHaveLength(31);
    expect(result.current.history[0].symbol).toBe('NVDA');
    expect(result.current.quote?.name).toBe('NVIDIA Corporation');
    expect(result.current.quote?.price).toBe(135.58);
    expect(result.current.notFound).toBe(false);
  });

  it.each(['AAPL', 'ZZZZ'])('serves simulated data for any valid ticker (%s)', async (sym) => {
    const { result } = renderHook(() => useCustomSymbolData(sym, { useMock: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notFound).toBe(false);
    expect(result.current.history).toHaveLength(31);
    expect(result.current.quote?.symbol).toBe(sym);
    expect(result.current.history.at(-1).close).toBe(result.current.quote.price);
    expect(result.current.simulated).toBe(true);
    expect(result.current.simulatedReason).toBe('mock-mode');
  });

  it('is idle without a symbol', () => {
    const { result } = renderHook(() => useCustomSymbolData(null, { useMock: true }));
    expect(result.current.notFound).toBe(false);
    expect(result.current.simulated).toBe(false);
    expect(result.current.quote).toBeNull();
  });
});
