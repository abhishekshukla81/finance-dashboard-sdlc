import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Recharts needs real layout, which jsdom lacks.
vi.mock('../components/charts/AreaChart.jsx', () => ({
  default: ({ history }) => <div data-testid="area-chart">{history[0]?.symbol}</div>,
}));
vi.mock('../components/charts/ComparisonChart.jsx', () => ({
  default: () => <div data-testid="comparison-chart" />,
}));

// Offline mock mode: the whole app runs on fixtures, no network.
vi.stubEnv('VITE_USE_MOCK', 'true');
const { default: App } = await import('../App.jsx');
const { default: useDashboardStore } = await import('../store/dashboardStore.js');

const input = () => screen.getByLabelText(/ticker symbol/i);
const load  = async (text) => {
  await userEvent.clear(input());
  await userEvent.type(input(), text);
  await userEvent.click(screen.getByRole('button', { name: /^load$/i }));
};

beforeEach(() => useDashboardStore.setState({ activeTab: 'day', customSymbol: null }));

describe('Custom Company flow (offline mock mode)', () => {
  it('follows the full walkthrough', async () => {
    render(<App />);

    // Section sits below Quote Detail, with instruction, input and Load button.
    const section = screen.getByRole('region', { name: /custom company/i });
    expect(within(section).getByText(/enter a ticker symbol to load/i)).toBeInTheDocument();
    expect(await screen.findByText('Quote Detail')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-panel')).not.toBeInTheDocument();

    // Malformed entry: IBM1 -> inline error, panel not opened.
    await load('IBM1');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-panel')).not.toBeInTheDocument();

    // Any valid ticker resolves to simulated data in mock mode (plan decision D1);
    // the no-data message is covered by the live-mode tests in CustomSymbolPanel.test.jsx.
    await load('AAPL');
    expect(await screen.findByText(/currently showing/i)).toHaveTextContent('AAPL');
    expect(await screen.findByTestId('price-chart')).toBeInTheDocument();
    expect(screen.queryByText(/no data found/i)).not.toBeInTheDocument();

    // NVDA -> quote card and 30-day chart.
    await load('NVDA');
    expect(await screen.findByTestId('price-chart')).toBeInTheDocument();
    expect(within(screen.getByTestId('summary-card')).getByText('NVIDIA Corporation')).toBeInTheDocument();

    // Clear -> panel disappears.
    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.queryByTestId('custom-panel')).not.toBeInTheDocument();

    // Load again, then switch Today -> Last 7 Days -> Last Quarter: panel stays.
    await load('NVDA');
    expect(await screen.findByTestId('custom-panel')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Last 7 Days' }));
    expect(screen.getByTestId('custom-panel')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Last Quarter' }));
    expect(screen.getByTestId('custom-panel')).toHaveTextContent('Currently showing: NVDA');
    await userEvent.click(screen.getByRole('tab', { name: 'Today' }));
    expect(screen.getByTestId('custom-panel')).toBeInTheDocument();
  });
});

describe('Dynamic ticker ingestion (offline mock mode)', () => {
  it('adds loaded tickers to the Today lists and paginates above eight companies', async () => {
    useDashboardStore.setState({ addedCompanies: [] });
    render(<App />);
    await screen.findByText('Quote Detail');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    // Failed validation adds nothing.
    await load('IBM1');
    expect(useDashboardStore.getState().addedCompanies).toEqual([]);

    // A tracked company is not duplicated.
    await load('NVDA');
    await screen.findByTestId('price-chart');
    expect(useDashboardStore.getState().addedCompanies).toEqual([]);

    // New valid tickers join the dashboard: 7 and 8 companies fit on one page.
    await load('aapl');
    await screen.findByTestId('price-chart');
    await load('TSLA');
    await screen.findByTestId('price-chart');
    expect(useDashboardStore.getState().addedCompanies).toHaveLength(2);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    // The 9th company introduces pagination on both sections.
    await load('GOOGL');
    await screen.findByTestId('price-chart');
    expect(await screen.findAllByText('Page 1 of 2')).toHaveLength(2);

    // Loading the same ticker again does not duplicate it; Clear keeps it.
    await load('AAPL');
    await screen.findByTestId('price-chart');
    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(useDashboardStore.getState().addedCompanies.map((c) => c.symbol)).toEqual(['AAPL', 'TSLA', 'GOOGL']);

    // The 9th company is on page 2 of the ranking, with rank 9.
    await userEvent.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    const rows = within(screen.getByRole('list', { name: /daily performance ranking/i })).getAllByRole('listitem');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent(/^9/);
  });
});
