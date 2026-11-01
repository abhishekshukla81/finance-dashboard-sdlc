import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Offline mock mode: DayView runs on fixtures and generated data, no network.
vi.stubEnv('VITE_USE_MOCK', 'true');
const { default: DayView } = await import('../views/DayView.jsx');
const { default: useDashboardStore } = await import('../store/dashboardStore.js');
const { generateMockQuote } = await import('../services/mockGenerator.js');

const EXTRA = ['AAPL', 'TSLA', 'GOOGL', 'META', 'AMZN', 'NFLX', 'AMD'];

const addCompanies = (symbols) =>
  useDashboardStore.setState({
    addedCompanies: symbols.map((symbol, i) => ({ symbol, name: symbol, color: `#00${i}${i}ff` })),
  });

const rankingRows = () =>
  within(screen.getByRole('list', { name: /daily performance ranking/i })).getAllByRole('listitem');
const rankingSymbols = () => rankingRows().map((r) => r.dataset.symbol);
const detailSymbols = () =>
  within(screen.getByTestId('quote-detail')).getAllByTestId('quote-card').map((c) => c.dataset.symbol);

beforeEach(() => useDashboardStore.setState({ addedCompanies: [] }));

describe('DayView with the six tracked companies', () => {
  it('shows all six, no pagination, original Quote Detail order', async () => {
    render(<DayView />);
    await screen.findByText('Quote Detail');
    expect(rankingSymbols()).toEqual(['NVDA', 'SAP', 'IBM', 'ORCL', 'CRM', 'MSFT']);
    expect(detailSymbols()).toEqual(['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM', 'NVDA']);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('keeps tracked fixture values', async () => {
    render(<DayView />);
    await screen.findByText('Quote Detail');
    expect(screen.getAllByText('$175.40').length).toBeGreaterThan(0);
  });

  it('labels the data as simulated in mock mode', async () => {
    render(<DayView />);
    expect(await screen.findByTestId('simulated-notice')).toHaveTextContent(/mock mode/i);
  });
});

describe('DayView with added companies', () => {
  it('shows 7 and 8 companies on one page, without controls', async () => {
    addCompanies(['AAPL']);
    const { unmount } = render(<DayView />);
    await screen.findByText('Quote Detail');
    expect(rankingRows()).toHaveLength(7);
    expect(detailSymbols()).toHaveLength(7);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    unmount();

    addCompanies(['AAPL', 'TSLA']);
    render(<DayView />);
    await screen.findByText('Quote Detail');
    expect(rankingRows()).toHaveLength(8);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('a 9th company adds pagination to both sections', async () => {
    addCompanies(['AAPL', 'TSLA', 'GOOGL']);
    render(<DayView />);
    await screen.findByText('Quote Detail');
    expect(screen.getAllByRole('navigation')).toHaveLength(2);
    expect(screen.getAllByText('Page 1 of 2')).toHaveLength(2);
    expect(rankingRows()).toHaveLength(8);
    expect(detailSymbols()).toHaveLength(8);
  });

  it('shows 8 per page, with the same companies in both sections', async () => {
    addCompanies(EXTRA);
    render(<DayView />);
    await screen.findByText('Quote Detail');
    expect(rankingRows()).toHaveLength(8);
    expect(detailSymbols()).toHaveLength(8);
    expect([...detailSymbols()].sort()).toEqual([...rankingSymbols()].sort());
    expect(screen.getAllByText('Page 1 of 2')).toHaveLength(2);
  });

  it('ranks all companies by daily change across pages', async () => {
    addCompanies(EXTRA);
    render(<DayView />);
    await screen.findByText('Quote Detail');
    const page1 = rankingSymbols();
    await userEvent.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    const page2 = rankingSymbols();
    const pct = (s) => (['IBM','MSFT','ORCL','SAP','CRM','NVDA'].includes(s)
      ? { IBM: 0.71, MSFT: -0.59, ORCL: 0.67, SAP: 1.0, CRM: -0.31, NVDA: 1.6 }[s]
      : generateMockQuote(s).changePercent);
    const all = [...page1, ...page2].map(pct);
    expect(all).toEqual([...all].sort((a, b) => b - a));
  });

  it('continues rank numbers on page 2 and synchronizes both sections', async () => {
    addCompanies(EXTRA);
    render(<DayView />);
    await screen.findByText('Quote Detail');
    expect(rankingRows()[0]).toHaveTextContent(/^1/);

    await userEvent.click(screen.getAllByRole('button', { name: 'Next' })[1]); // Quote Detail control
    expect(screen.getAllByText('Page 2 of 2')).toHaveLength(2);
    expect(rankingRows()[0]).toHaveTextContent(/^9/);
    expect([...detailSymbols()].sort()).toEqual([...rankingSymbols()].sort());
  });

  it('shows the remaining companies on the last page', async () => {
    addCompanies(EXTRA);
    render(<DayView />);
    await screen.findByText('Quote Detail');
    await userEvent.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    expect(screen.getAllByText('Page 2 of 2')).toHaveLength(2);
    expect(rankingRows()).toHaveLength(13 - 8);
    expect(detailSymbols()).toHaveLength(13 - 8);
    screen.getAllByRole('button', { name: 'Next' }).forEach((b) => expect(b).toBeDisabled());
  });

  it('every company appears exactly once across the pages', async () => {
    addCompanies(EXTRA);
    render(<DayView />);
    await screen.findByText('Quote Detail');
    const seen = [...rankingSymbols()];
    await userEvent.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    seen.push(...rankingSymbols());
    expect(seen.sort()).toEqual(['IBM','MSFT','ORCL','SAP','CRM','NVDA', ...EXTRA].sort());
  });

  it('clamps the page when the list shrinks', async () => {
    addCompanies(EXTRA);
    render(<DayView />);
    await screen.findByText('Quote Detail');
    await userEvent.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    expect(screen.getAllByText('Page 2 of 2')).toHaveLength(2);

    useDashboardStore.setState({ addedCompanies: [] });
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
    expect(rankingRows()).toHaveLength(6);
  });
});
