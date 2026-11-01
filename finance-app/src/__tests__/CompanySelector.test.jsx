import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanySelector from '../components/custom/CompanySelector.jsx';

const input = () => screen.getByLabelText(/ticker symbol/i);
const load  = () => userEvent.click(screen.getByRole('button', { name: /^load$/i }));

describe('CompanySelector', () => {
  it('shows one line of instruction, an input and a Load button (no Compare button)', () => {
    render(<CompanySelector onSubmit={vi.fn()} />);
    expect(screen.getByText(/enter a ticker symbol to load/i)).toBeInTheDocument();
    expect(input()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^load$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /compare/i })).not.toBeInTheDocument();
  });

  it('calls onSubmit with a normalised valid symbol', async () => {
    const onSubmit = vi.fn();
    render(<CompanySelector onSubmit={onSubmit} />);
    await userEvent.type(input(), 'nvda');
    await load();
    expect(onSubmit).toHaveBeenCalledWith('NVDA');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each(['', 'IBM1', 'TOOLONG', 'A B'])('shows an inline error for %j', async (text) => {
    const onSubmit = vi.fn();
    render(<CompanySelector onSubmit={onSubmit} />);
    if (text) await userEvent.type(input(), text);
    await load();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  describe('suggestion list', () => {
    const options = () => [...document.querySelectorAll('#custom-symbol-options option')].map((o) => o.value);

    it('offers the tracked companies by default', () => {
      render(<CompanySelector onSubmit={vi.fn()} />);
      expect(options()).toEqual(['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM', 'NVDA']);
    });

    it('offers tracked and added companies when suggestions are passed', () => {
      const suggestions = [{ symbol: 'IBM', name: 'IBM' }, { symbol: 'AAPL', name: 'Apple Inc.' }];
      render(<CompanySelector onSubmit={vi.fn()} suggestions={suggestions} />);
      expect(options()).toEqual(['IBM', 'AAPL']);
      expect(document.querySelector('#custom-symbol-options option[value="AAPL"]')).toHaveTextContent('Apple Inc.');
    });
  });
});
