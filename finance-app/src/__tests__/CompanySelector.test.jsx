import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanySelector from '../components/custom/CompanySelector.jsx';

const input  = () => screen.getByLabelText(/compare a company/i);
const submit = () => userEvent.click(screen.getByRole('button', { name: /^compare$/i }));

describe('CompanySelector', () => {
  it('calls onSubmit with a normalised valid symbol', async () => {
    const onSubmit = vi.fn();
    render(<CompanySelector onSubmit={onSubmit} onClear={vi.fn()} />);
    await userEvent.type(input(), 'nvda');
    await submit();
    expect(onSubmit).toHaveBeenCalledWith('NVDA');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each(['', 'IBM1', 'TOOLONG', 'A B'])('shows an inline error for %j', async (text) => {
    const onSubmit = vi.fn();
    render(<CompanySelector onSubmit={onSubmit} onClear={vi.fn()} />);
    if (text) await userEvent.type(input(), text);
    await submit();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('hides Clear when nothing is selected', () => {
    render(<CompanySelector onSubmit={vi.fn()} onClear={vi.fn()} value={null} />);
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('Clear calls onClear and empties the input', async () => {
    const onClear = vi.fn();
    render(<CompanySelector onSubmit={vi.fn()} onClear={onClear} value="NVDA" />);
    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(input()).toHaveValue('');
  });
});
