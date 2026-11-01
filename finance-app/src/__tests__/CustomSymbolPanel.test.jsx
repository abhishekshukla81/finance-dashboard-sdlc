import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../services/yahooFinance.js', () => ({
  fetchHistory: vi.fn(),
  fetchQuotes: vi.fn(),
}));
// Stub the chart: Recharts needs real layout, which jsdom lacks.
vi.mock('../components/charts/AreaChart.jsx', () => ({
  default: ({ history }) => <div data-testid="area-chart">{history[0]?.symbol}:{history.length}</div>,
}));

import { fetchHistory, fetchQuotes } from '../services/yahooFinance.js';
import useDashboardStore from '../store/dashboardStore.js';

// The panel reads VITE_USE_MOCK at import time. Force live mode (mocked
// service) so results do not depend on a developer's local .env file.
vi.stubEnv('VITE_USE_MOCK', 'false');
const { default: CustomSymbolPanel } = await import('../components/custom/CustomSymbolPanel.jsx');

const quote = (symbol) => ({
  symbol, name: `${symbol} Corp`, price: 123.45, change: 1, changePercent: 0.8,
  previousClose: 122.45, volume: 1_000_000, marketCap: 5e9, currency: 'USD', marketState: 'REGULAR',
});
const points = (symbol) => [
  { symbol, date: new Date('2025-01-01'), close: 100 },
  { symbol, date: new Date('2025-01-02'), close: 101 },
];

beforeEach(() => {
  vi.clearAllMocks();
  fetchQuotes.mockImplementation(async (symbols) => symbols.map(quote));
  useDashboardStore.setState({ customSymbol: null, addedCompanies: [] });
});

describe('CustomSymbolPanel', () => {
  it('renders nothing until a symbol is loaded', () => {
    const { container } = render(<CustomSymbolPanel />);
    expect(container).toBeEmptyDOMElement();
    expect(fetchHistory).not.toHaveBeenCalled();
  });

  it('shows "Currently showing", the quote card and the price chart', async () => {
    fetchHistory.mockImplementation(async (s) => points(s));
    useDashboardStore.setState({ customSymbol: 'NVDA' });
    render(<CustomSymbolPanel />);
    expect(screen.getByText(/currently showing/i)).toHaveTextContent('Currently showing: NVDA');
    expect(await screen.findByTestId('area-chart')).toHaveTextContent('NVDA:2');
    expect(screen.getByTestId('summary-card')).toHaveTextContent('NVDA Corp');
    expect(screen.getByTestId('summary-card')).toHaveTextContent('$123.45');
    expect(fetchHistory).toHaveBeenCalledWith('NVDA', '1mo', '1d');
  });

  it('shows a spinner while loading', async () => {
    fetchHistory.mockImplementation(() => new Promise(() => {}));
    useDashboardStore.setState({ customSymbol: 'NVDA' });
    render(<CustomSymbolPanel />);
    expect(await screen.findByRole('status')).toHaveTextContent(/loading nvda/i);
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
  });

  it('shows the exact no-data message for an unknown symbol (HTTP 404)', async () => {
    fetchHistory.mockRejectedValue(new Error('HTTP 404 from /chart/AAPL'));
    useDashboardStore.setState({ customSymbol: 'AAPL' });
    render(<CustomSymbolPanel />);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No data found for symbol "AAPL". Check the ticker and try again.'
      )
    );
    expect(screen.getByText(/currently showing/i)).toHaveTextContent('AAPL');
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).not.toHaveTextContent(/HTTP/);
  });

  it('treats an empty result as no data and never shows another company', async () => {
    fetchHistory.mockResolvedValue([]);
    useDashboardStore.setState({ customSymbol: 'EMPTY' });
    render(<CustomSymbolPanel />);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('No data found for symbol "EMPTY"')
    );
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
  });

  it('shows a clear error with Retry when the quote request is rejected', async () => {
    // Timeouts, 429 and 5xx now fall back to simulated data, so use a
    // non-fallback failure (HTTP 401) on the quote request.
    fetchHistory.mockImplementation(async (s) => points(s));
    fetchQuotes.mockRejectedValue(Object.assign(new Error('HTTP 401 from /quote'), { status: 401 }));
    useDashboardStore.setState({ customSymbol: 'NVDA' });
    render(<CustomSymbolPanel />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to load data for NVDA/i);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('Clear removes the panel and resets the store', async () => {
    fetchHistory.mockImplementation(async (s) => points(s));
    useDashboardStore.setState({ customSymbol: 'NVDA' });
    const { container } = render(<CustomSymbolPanel />);
    await screen.findByTestId('area-chart');
    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(container).toBeEmptyDOMElement();
    expect(useDashboardStore.getState().customSymbol).toBeNull();
  });

  describe('ingestion into the dashboard list', () => {
    const added = () => useDashboardStore.getState().addedCompanies.map((c) => c.symbol);

    it('adds a company once its quote has loaded', async () => {
      fetchHistory.mockImplementation(async (s) => points(s));
      useDashboardStore.setState({ customSymbol: 'AAPL' });
      render(<CustomSymbolPanel />);
      await screen.findByTestId('area-chart');
      await waitFor(() => expect(added()).toEqual(['AAPL']));
      expect(useDashboardStore.getState().addedCompanies[0].name).toBe('AAPL Corp');
    });

    it('does not add a company twice', async () => {
      fetchHistory.mockImplementation(async (s) => points(s));
      useDashboardStore.setState({ customSymbol: 'AAPL' });
      const { unmount } = render(<CustomSymbolPanel />);
      await screen.findByTestId('area-chart');
      unmount();
      render(<CustomSymbolPanel />);
      await screen.findByTestId('area-chart');
      expect(added()).toEqual(['AAPL']);
    });

    it('does not add a tracked company', async () => {
      fetchHistory.mockImplementation(async (s) => points(s));
      useDashboardStore.setState({ customSymbol: 'NVDA' });
      render(<CustomSymbolPanel />);
      await screen.findByTestId('area-chart');
      expect(added()).toEqual([]);
    });

    it('does not add a no-data symbol', async () => {
      fetchHistory.mockRejectedValue(new Error('HTTP 404 from /chart/QQQQQ'));
      fetchQuotes.mockResolvedValue([]);
      useDashboardStore.setState({ customSymbol: 'QQQQQ' });
      render(<CustomSymbolPanel />);
      await screen.findByRole('alert');
      expect(added()).toEqual([]);
    });

    it('does not add a symbol whose load failed', async () => {
      fetchHistory.mockImplementation(async (s) => points(s));
      fetchQuotes.mockRejectedValue(Object.assign(new Error('HTTP 401 from /quote'), { status: 401 }));
      useDashboardStore.setState({ customSymbol: 'AAPL' });
      render(<CustomSymbolPanel />);
      await screen.findByRole('alert');
      expect(added()).toEqual([]);
    });

    it('keeps the company after Clear', async () => {
      fetchHistory.mockImplementation(async (s) => points(s));
      useDashboardStore.setState({ customSymbol: 'AAPL' });
      render(<CustomSymbolPanel />);
      await screen.findByTestId('area-chart');
      await waitFor(() => expect(added()).toEqual(['AAPL']));
      await userEvent.click(screen.getByRole('button', { name: /clear/i }));
      expect(added()).toEqual(['AAPL']);
    });
  });

  describe('simulated tag', () => {
    it('is hidden for live data', async () => {
      fetchHistory.mockImplementation(async (s) => points(s));
      useDashboardStore.setState({ customSymbol: 'NVDA' });
      render(<CustomSymbolPanel />);
      await screen.findByTestId('area-chart');
      expect(screen.queryByTestId('simulated-tag')).not.toBeInTheDocument();
    });

    it('is shown when the source is rate limited (HTTP 429) and data falls back', async () => {
      fetchHistory.mockRejectedValue(Object.assign(new Error('HTTP 429 from /chart/AAPL'), { status: 429 }));
      fetchQuotes.mockRejectedValue(Object.assign(new Error('HTTP 429 from /quote'), { status: 429 }));
      useDashboardStore.setState({ customSymbol: 'AAPL' });
      render(<CustomSymbolPanel />);
      expect(await screen.findByTestId('simulated-tag')).toHaveTextContent(/simulated/i);
      expect(screen.getByTestId('simulated-notice')).toHaveTextContent(/live market data is currently unavailable/i);
      expect(screen.getByTestId('price-chart')).toBeInTheDocument();
      expect(screen.queryByText(/no data found/i)).not.toBeInTheDocument();
    });
  });
});
