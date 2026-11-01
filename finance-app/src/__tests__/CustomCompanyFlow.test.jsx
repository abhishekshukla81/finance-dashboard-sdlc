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

    // Valid but unresolvable: AAPL -> clear no-data message.
    await load('AAPL');
    expect(await screen.findByText(/currently showing/i)).toHaveTextContent('AAPL');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No data found for symbol "AAPL". Check the ticker and try again.'
    );

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
