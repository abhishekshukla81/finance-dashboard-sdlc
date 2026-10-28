import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MOCK_QUOTES } from '../services/mockData.js';
import QuoteCard from '../components/cards/QuoteCard.jsx';
import { TICKERS } from '../constants/tickers.js';

/**
 * DayView integration: render QuoteCards directly with mock data.
 * This mirrors what DayView renders when quotes are available,
 * without triggering the async hook or network calls.
 */
describe('DayView — QuoteCard rendering', () => {
  it('renders a card for each tracked company', () => {
    const colorMap = Object.fromEntries(TICKERS.map((t) => [t.symbol, t.color]));

    render(
      <div>
        {MOCK_QUOTES.map((q) => (
          <QuoteCard key={q.symbol} quote={q} color={colorMap[q.symbol]} />
        ))}
      </div>
    );

    for (const { symbol } of TICKERS) {
      // Each card renders the symbol twice (name div + symbol div for IBM/SAP where name=symbol)
      const matches = screen.getAllByText(symbol);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('renders IBM price from mock data', () => {
    const ibm = MOCK_QUOTES.find((q) => q.symbol === 'IBM');
    const colorMap = Object.fromEntries(TICKERS.map((t) => [t.symbol, t.color]));
    render(<QuoteCard quote={ibm} color={colorMap['IBM']} />);
    expect(screen.getByText('$171.42')).toBeInTheDocument();
  });
});
