import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../services/yahooFinance.js', () => ({
  fetchQuotes: vi.fn(),
  fetchHistory: vi.fn(),
}));

import { fetchQuotes } from '../services/yahooFinance.js';

// Live mode (mocked service) so the fallback path is exercised.
vi.stubEnv('VITE_USE_MOCK', 'false');
const { default: DayView } = await import('../views/DayView.jsx');
const { default: useDashboardStore } = await import('../store/dashboardStore.js');

const httpError = (status) => Object.assign(new Error(`HTTP ${status} from /quote`), { status });
const liveQuote = (symbol) => ({
  symbol, name: `${symbol} Corp`, price: 100, change: 1, changePercent: 1, previousClose: 99,
  open: 99, high: 101, low: 98, volume: 1_000_000, marketCap: 5e9, currency: 'USD', marketState: 'REGULAR',
  fiftyTwoWeekLow: 80, fiftyTwoWeekHigh: 120,
});

beforeEach(() => {
  vi.resetAllMocks();
  useDashboardStore.setState({ addedCompanies: [] });
});

describe('DayView in live mode', () => {
  it('shows live data without a simulated notice', async () => {
    fetchQuotes.mockImplementation(async (symbols) => symbols.map(liveQuote));
    render(<DayView />);
    await screen.findByText('Quote Detail');
    expect(screen.queryByTestId('simulated-notice')).not.toBeInTheDocument();
  });

  it.each([429, 503])('falls back to simulated quotes on HTTP %i and says so', async (status) => {
    fetchQuotes.mockRejectedValue(httpError(status));
    render(<DayView />);
    expect(await screen.findByText('Quote Detail')).toBeInTheDocument();
    expect(screen.getByTestId('simulated-notice')).toHaveTextContent(/live market data is currently unavailable/i);
    expect(screen.getAllByTestId('quote-card')).toHaveLength(6);
  });

  it('still shows the error state for a non-fallback failure (HTTP 401)', async () => {
    fetchQuotes.mockRejectedValue(httpError(401));
    render(<DayView />);
    expect(await screen.findByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.queryByTestId('simulated-notice')).not.toBeInTheDocument();
  });
});
