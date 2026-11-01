import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SimulatedDataNotice from '../components/common/SimulatedDataNotice.jsx';

describe('SimulatedDataNotice', () => {
  it('renders nothing without a reason', () => {
    const { container } = render(<SimulatedDataNotice reason={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('explains mock mode and warns the data is unverified', () => {
    render(<SimulatedDataNotice reason="mock-mode" />);
    const note = screen.getByRole('note');
    expect(note).toHaveTextContent(/simulated data/i);
    expect(note).toHaveTextContent(/mock mode/i);
    expect(note).toHaveTextContent(/unverified/i);
  });

  it('explains that live data is unavailable', () => {
    render(<SimulatedDataNotice reason="unavailable" />);
    const note = screen.getByRole('note');
    expect(note).toHaveTextContent(/live market data is currently unavailable/i);
    expect(note).toHaveTextContent(/unverified/i);
  });
});
