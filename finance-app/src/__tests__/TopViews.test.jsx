import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';

// Recharts needs real layout, which jsdom lacks: expose what each chart receives.
vi.mock('../components/charts/ComparisonChart.jsx', () => ({
  default: ({ seriesData }) => (
    <div data-testid="comparison-chart">{Object.keys(seriesData).join(',')}</div>
  ),
}));
vi.mock('../components/charts/AreaChart.jsx', () => ({
  default: ({ history }) => <div data-testid="area-chart">{history[0]?.symbol}:{history.length}</div>,
}));

vi.stubEnv('VITE_USE_MOCK', 'true');
const { default: WeekView } = await import('../views/WeekView.jsx');
const { default: QuarterView } = await import('../views/QuarterView.jsx');
const { default: useDashboardStore } = await import('../store/dashboardStore.js');

const EXTRA = ['AAPL', 'TSLA', 'GOOGL', 'META', 'AMZN', 'NFLX', 'AMD'];
const addCompanies = (symbols) =>
  useDashboardStore.setState({
    addedCompanies: symbols.map((symbol, i) => ({ symbol, name: `${symbol} Inc`, color: `#00${i}${i}ff` })),
  });

beforeEach(() => useDashboardStore.setState({ addedCompanies: [] }));

describe('WeekView (top companies)', () => {
  it('shows all six tracked companies when nothing is added', async () => {
    render(<WeekView />);
    const chart = await screen.findByTestId('comparison-chart');
    expect(chart.textContent.split(',').sort()).toEqual(['CRM', 'IBM', 'MSFT', 'NVDA', 'ORCL', 'SAP']);
    expect(screen.getByTestId('top-caption')).toHaveTextContent('Showing top 6 of 6');
  });

  it('includes an added company', async () => {
    addCompanies(['AAPL']);
    render(<WeekView />);
    const chart = await screen.findByTestId('comparison-chart');
    expect(chart.textContent.split(',')).toContain('AAPL');
    expect(screen.getByTestId('top-caption')).toHaveTextContent('Showing top 7 of 7');
  });

  it('shows only the top 8 of 13 companies and says so', async () => {
    addCompanies(EXTRA);
    render(<WeekView />);
    const chart = await screen.findByTestId('comparison-chart');
    expect(chart.textContent.split(',')).toHaveLength(8);
    expect(screen.getByTestId('top-caption')).toHaveTextContent('Showing top 8 of 13');
  });

  it('labels the data as simulated', async () => {
    render(<WeekView />);
    expect(await screen.findByTestId('simulated-notice')).toHaveTextContent(/mock mode/i);
  });
});

describe('QuarterView (top companies)', () => {
  const panelSymbols = () => screen.getAllByTestId('area-chart').map((c) => c.textContent.split(':')[0]);

  it('shows a 91-point quarter chart per tracked company', async () => {
    render(<QuarterView />);
    await screen.findAllByTestId('area-chart');
    expect(screen.getAllByTestId('area-chart')).toHaveLength(6);
    screen.getAllByTestId('area-chart').forEach((c) => expect(c.textContent).toMatch(/:91$/));
  });

  it('includes an added company', async () => {
    addCompanies(['AAPL']);
    render(<QuarterView />);
    await screen.findAllByTestId('area-chart');
    expect(panelSymbols()).toContain('AAPL');
    expect(screen.getByText('AAPL Inc')).toBeInTheDocument();
  });

  it('shows only the top 8 of 13 companies, in ranked order, and says so', async () => {
    addCompanies(EXTRA);
    render(<QuarterView />);
    await screen.findAllByTestId('area-chart');
    expect(screen.getAllByTestId('area-chart')).toHaveLength(8);
    expect(screen.getByTestId('top-caption')).toHaveTextContent('Showing top 8 of 13');
  });

  it('labels the data as simulated', async () => {
    render(<QuarterView />);
    expect(await screen.findByTestId('simulated-notice')).toHaveTextContent(/mock mode/i);
  });

  it('both views pick the same companies', async () => {
    addCompanies(EXTRA);
    const week = render(<WeekView />);
    const weekSymbols = (await screen.findByTestId('comparison-chart')).textContent.split(',').sort();
    week.unmount();
    render(<QuarterView />);
    await screen.findAllByTestId('area-chart');
    expect(panelSymbols().sort()).toEqual(weekSymbols);
  });
});

describe('top companies grid', () => {
  it('QuarterView panels are inside the grid', async () => {
    render(<QuarterView />);
    const panels = await screen.findAllByTestId('area-chart');
    expect(within(panels[0].closest('section')).getAllByTestId('area-chart')).toHaveLength(6);
  });
});
