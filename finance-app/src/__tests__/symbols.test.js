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
  it.each(['AAPL', 'BRK-B', 'BF.B', '^GSPC', 'A'])('accepts %s', (s) => {
    expect(isValidSymbol(s)).toBe(true);
  });
  it.each(['', 'TOOLONGSYMBOL', 'AA PL', 'A/B', "A'; DROP", '<script>', '-AAPL', '^^X'])(
    'rejects %j', (s) => {
      expect(isValidSymbol(s)).toBe(false);
    }
  );
});
