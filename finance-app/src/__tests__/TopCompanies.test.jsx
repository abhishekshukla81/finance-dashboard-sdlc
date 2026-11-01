import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.stubEnv('VITE_USE_MOCK', 'true');
const { useTopCompanies } = await import('../hooks/useTopCompanies.js');
const { default: useDashboardStore } = await import('../store/dashboardStore.js');
const { generateMockQuote } = await import('../services/mockGenerator.js');

const TRACKED = ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM', 'NVDA'];
const EXTRA = ['AAPL', 'TSLA', 'GOOGL', 'META', 'AMZN', 'NFLX', 'AMD'];
const add = (symbols) => act(() => {
  symbols.forEach((s) => useDashboardStore.getState().addCompany(s));
});

beforeEach(() => useDashboardStore.setState({ addedCompanies: [] }));

describe('useTopCompanies', () => {
  it('returns all six tracked companies ranked by daily change when nothing is added', async () => {
    const { result } = renderHook(() => useTopCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.symbols).toEqual(['NVDA', 'SAP', 'IBM', 'ORCL', 'CRM', 'MSFT']);
    expect(result.current.total).toBe(6);
  });

  it('includes added companies', async () => {
    add(['AAPL']);
    const { result } = renderHook(() => useTopCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.total).toBe(7);
    expect(result.current.symbols).toContain('AAPL');
  });

  it('limits to the top 8 by daily performance', async () => {
    add(EXTRA);
    const { result } = renderHook(() => useTopCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.total).toBe(13);
    expect(result.current.top).toHaveLength(8);

    const pct = (s) => (TRACKED.includes(s)
      ? { IBM: 0.71, MSFT: -0.59, ORCL: 0.67, SAP: 1.0, CRM: -0.31, NVDA: 1.6 }[s]
      : generateMockQuote(s).changePercent);
    const all = [...TRACKED, ...EXTRA].sort((a, b) => pct(b) - pct(a));
    expect(result.current.symbols).toEqual(all.slice(0, 8));
  });

  it('exposes colours and names for tracked and added companies', async () => {
    add(['AAPL']);
    const { result } = renderHook(() => useTopCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.colors.IBM).toBe('#0f62fe');
    expect(result.current.colors.AAPL).toBeTruthy();
    expect(result.current.names.IBM).toBe('IBM');
    expect(result.current.names.AAPL).toBe('AAPL');
  });

  it('reports simulated data in mock mode', async () => {
    const { result } = renderHook(() => useTopCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.source).toBe('simulated');
    expect(result.current.reason).toBe('mock-mode');
  });

  it('updates when a company is added later', async () => {
    const { result } = renderHook(() => useTopCompanies());
    await waitFor(() => expect(result.current.total).toBe(6));
    add(['AAPL']);
    await waitFor(() => expect(result.current.total).toBe(7));
  });
});
