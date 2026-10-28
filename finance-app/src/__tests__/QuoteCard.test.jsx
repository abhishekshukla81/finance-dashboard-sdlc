import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuoteCard from '../components/cards/QuoteCard.jsx';

const mockQuote = {
  symbol: 'IBM',
  name: 'International Business Machines',
  price: 171.42,
  change: 1.23,
  changePercent: 0.72,
  volume: 4_200_000,
  marketCap: 154_000_000_000,
  currency: 'USD',
  marketState: 'REGULAR',
};

describe('QuoteCard', () => {
  it('renders company name and symbol', () => {
    render(<QuoteCard quote={mockQuote} />);
    expect(screen.getByText('International Business Machines')).toBeInTheDocument();
    expect(screen.getByText('IBM')).toBeInTheDocument();
  });

  it('renders the price', () => {
    render(<QuoteCard quote={mockQuote} />);
    expect(screen.getByText('$171.42')).toBeInTheDocument();
  });

  it('shows market state badge when not REGULAR', () => {
    const q = { ...mockQuote, marketState: 'PRE' };
    render(<QuoteCard quote={q} />);
    expect(screen.getByText('PRE')).toBeInTheDocument();
  });

  it('does not show badge for REGULAR state', () => {
    render(<QuoteCard quote={mockQuote} />);
    expect(screen.queryByText('REGULAR')).not.toBeInTheDocument();
  });

  it('shows em-dash when change is null', () => {
    const q = { ...mockQuote, change: null, changePercent: null };
    render(<QuoteCard quote={q} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
