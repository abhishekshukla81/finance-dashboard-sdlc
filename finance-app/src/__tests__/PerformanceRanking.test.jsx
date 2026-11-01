import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PerformanceRanking from '../components/cards/PerformanceRanking.jsx';
import { MOCK_QUOTES } from '../services/mockData.js';

describe('PerformanceRanking', () => {
  it('ranks companies by daily % change, best first', () => {
    render(<PerformanceRanking quotes={MOCK_QUOTES} />);
    const rows = screen.getAllByRole('listitem');
    const order = rows.map((r) => r.dataset.symbol);
    expect(order).toEqual(['NVDA', 'SAP', 'IBM', 'ORCL', 'CRM', 'MSFT']);
  });

  it('shows price and signed daily percentage', () => {
    render(<PerformanceRanking quotes={MOCK_QUOTES} />);
    expect(screen.getByText('$135.58')).toBeInTheDocument();
    expect(screen.getByText('+1.60%')).toBeInTheDocument();
    expect(screen.getByText('-0.59%')).toBeInTheDocument();
  });
});
