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

import { fetchHistory } from '../services/yahooFinance.js';
import useDashboardStore from '../store/dashboardStore.js';
import CustomView from '../views/CustomView.jsx';

const points = (symbol) => [
  { symbol, date: new Date('2025-01-01'), close: 100 },
  { symbol, date: new Date('2025-01-02'), close: 101 },
];

beforeEach(() => {
  vi.clearAllMocks();
  useDashboardStore.setState({ selectedTicker: null });
});

describe('CustomView', () => {
  it('shows a prompt before any symbol is chosen', () => {
    render(<CustomView />);
    expect(screen.getByText(/enter a ticker symbol to compare/i)).toBeInTheDocument();
    expect(fetchHistory).not.toHaveBeenCalled();
  });

  it('rejects an invalid symbol without fetching', async () => {
    render(<CustomView />);
    await userEvent.type(screen.getByLabelText(/ticker symbol/i), 'A B');
    await userEvent.click(screen.getByRole('button', { name: /compare/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/valid ticker symbol/i);
    expect(fetchHistory).not.toHaveBeenCalled();
  });

  it('renders IBM and the selected company on one chart', async () => {
    fetchHistory.mockImplementation(async (s) => points(s));
    render(<CustomView />);
    await userEvent.type(screen.getByLabelText(/ticker symbol/i), 'aapl');
    await userEvent.click(screen.getByRole('button', { name: /compare/i }));
    expect(await screen.findByTestId('chart')).toHaveTextContent('IBM,AAPL');
    expect(useDashboardStore.getState().selectedTicker).toBe('AAPL');
  });

  it('shows a clear message when the symbol is unknown (HTTP 404)', async () => {
    fetchHistory.mockImplementation(async (s) => {
      if (s === 'ZZZZ') throw new Error('HTTP 404 from /chart/ZZZZ');
      return points(s);
    });
    render(<CustomView />);
    await userEvent.type(screen.getByLabelText(/ticker symbol/i), 'zzzz');
    await userEvent.click(screen.getByRole('button', { name: /compare/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('No data found for ZZZZ')
    );
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).not.toHaveTextContent(/HTTP/);
  });

  it('treats an empty result as not found', async () => {
    fetchHistory.mockImplementation(async (s) => (s === 'EMPTY' ? [] : points(s)));
    render(<CustomView />);
    await userEvent.type(screen.getByLabelText(/ticker symbol/i), 'EMPTY');
    await userEvent.click(screen.getByRole('button', { name: /compare/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('No data found for EMPTY')
    );
  });
});
