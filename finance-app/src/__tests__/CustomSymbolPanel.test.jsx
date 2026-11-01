import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../services/yahooFinance.js', () => ({
  fetchHistory: vi.fn(),
  fetchQuotes: vi.fn(),
}));
// Stub the chart: Recharts needs real layout, which jsdom lacks.
vi.mock('../components/charts/ComparisonChart.jsx', () => ({
  default: ({ seriesData }) => <div data-testid="chart">{Object.keys(seriesData).join(',')}</div>,
}));

import { fetchHistory, fetchQuotes } from '../services/yahooFinance.js';
import useDashboardStore from '../store/dashboardStore.js';

// The panel reads VITE_USE_MOCK at import time. Force live mode (mocked
// service) so results do not depend on a developer's local .env file.
vi.stubEnv('VITE_USE_MOCK', 'false');
const { default: CustomSymbolPanel } = await import('../components/custom/CustomSymbolPanel.jsx');

const quote = (symbol) => ({
  symbol, name: `${symbol} Corp`, price: 123.45, change: 1, changePercent: 0.8,
  volume: 1_000_000, marketCap: 5e9, currency: 'USD', marketState: 'REGULAR',
});

const points = (symbol) => [
  { symbol, date: new Date('2025-01-01'), close: 100 },
  { symbol, date: new Date('2025-01-02'), close: 101 },
];

const submit = async (text) => {
  await userEvent.type(screen.getByLabelText(/compare a company/i), text);
  await userEvent.click(screen.getByRole('button', { name: /^compare$/i }));
};

beforeEach(() => {
  vi.clearAllMocks();
  fetchQuotes.mockImplementation(async (symbols) => symbols.map(quote));
  useDashboardStore.setState({ customSymbol: null });
});

describe('CustomSymbolPanel', () => {
  it('shows a prompt before any symbol is chosen', () => {
    render(<CustomSymbolPanel />);
    expect(screen.getByText(/enter a ticker symbol to compare/i)).toBeInTheDocument();
    expect(fetchHistory).not.toHaveBeenCalled();
  });

  it('rejects an invalid symbol without fetching', async () => {
    render(<CustomSymbolPanel />);
    await submit('A B');
    expect(screen.getByRole('alert')).toHaveTextContent(/1–5 letters/i);
    expect(fetchHistory).not.toHaveBeenCalled();
  });

  it('renders the chart and a summary card for the chosen company', async () => {
    fetchHistory.mockImplementation(async (s) => points(s));
    render(<CustomSymbolPanel />);
    await submit('nvda');
    expect(await screen.findByTestId('chart')).toHaveTextContent('IBM,NVDA');
    expect(screen.getByTestId('summary-card')).toHaveTextContent('NVDA Corp');
    expect(screen.getByTestId('summary-card')).toHaveTextContent('$123.45');
    expect(useDashboardStore.getState().customSymbol).toBe('NVDA');
  });

  it('shows a spinner while loading', async () => {
    fetchHistory.mockImplementation(() => new Promise(() => {}));
    render(<CustomSymbolPanel />);
    await submit('nvda');
    expect(await screen.findByRole('status')).toHaveTextContent(/loading nvda/i);
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  });

  it('shows a clear error when the fetch fails', async () => {
    fetchHistory.mockRejectedValue(new Error('Request timed out: /chart/NVDA'));
    render(<CustomSymbolPanel />);
    await submit('nvda');
    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to load data for NVDA/i);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('Clear hides the chart panel content and resets the store', async () => {
    fetchHistory.mockImplementation(async (s) => points(s));
    render(<CustomSymbolPanel />);
    await submit('nvda');
    await screen.findByTestId('chart');
    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('summary-card')).not.toBeInTheDocument();
    expect(screen.getByText(/enter a ticker symbol to compare/i)).toBeInTheDocument();
    expect(useDashboardStore.getState().customSymbol).toBeNull();
  });

  it('keeps the selection when the active dashboard tab changes', async () => {
    fetchHistory.mockImplementation(async (s) => points(s));
    render(<CustomSymbolPanel />);
    await submit('nvda');
    await screen.findByTestId('chart');
    useDashboardStore.getState().setActiveTab('quarter');
    expect(useDashboardStore.getState().customSymbol).toBe('NVDA');
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('shows a clear no-data message for an unknown symbol (HTTP 404)', async () => {
    fetchHistory.mockImplementation(async (s) => {
      if (s === 'ZZZZ') throw new Error('HTTP 404 from /chart/ZZZZ');
      return points(s);
    });
    render(<CustomSymbolPanel />);
    await submit('zzzz');
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('No data found for ZZZZ')
    );
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).not.toHaveTextContent(/HTTP/);
  });

  it('treats an empty result as no data and never shows another company', async () => {
    fetchHistory.mockImplementation(async (s) => (s === 'EMPTY' ? [] : points(s)));
    render(<CustomSymbolPanel />);
    await submit('EMPTY');
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('No data found for EMPTY')
    );
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  });
});
