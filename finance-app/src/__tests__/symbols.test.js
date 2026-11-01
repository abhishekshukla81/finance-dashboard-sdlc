import { describe, it, expect } from 'vitest';
import { normalizeSymbol, isValidSymbol } from '../utils/symbols.js';

describe('normalizeSymbol', () => {
  it('trims and uppercases', () => {
    expect(normalizeSymbol('  aapl ')).toBe('AAPL');
  });
  it('handles null/undefined', () => {
    expect(normalizeSymbol(null)).toBe('');
    expect(normalizeSymbol(undefined)).toBe('');
  });
});

describe('isValidSymbol', () => {
  it.each(['AAPL', 'IBM', 'NVDA', 'A', 'GOOGL'])('accepts %s', (s) => {
    expect(isValidSymbol(s)).toBe(true);
  });
  it.each(['', 'TOOLONG', 'IBM1', '123', 'AA PL', 'A/B', "A'; DROP", '<script>', 'BRK-B', '^GSPC'])(
    'rejects %j', (s) => {
      expect(isValidSymbol(s)).toBe(false);
    }
  );
});
