import { describe, it, expect } from 'vitest';
import { normalizeQuote, normalizeHistory } from '../services/normalizer.js';

describe('normalizeQuote', () => {
  it('maps standard Yahoo quote fields to app shape', () => {
    const raw = {
      symbol: 'IBM',
      longName: 'International Business Machines',
      regularMarketPrice: 171.42,
      regularMarketChange: 1.23,
      regularMarketChangePercent: 0.72,
      regularMarketVolume: 4_200_000,
      marketCap: 154_000_000_000,
      currency: 'USD',
      marketState: 'REGULAR',
    };
    const result = normalizeQuote(raw);

    expect(result.symbol).toBe('IBM');
    expect(result.name).toBe('International Business Machines');
    expect(result.price).toBe(171.42);
    expect(result.change).toBe(1.23);
    expect(result.changePercent).toBe(0.72);
    expect(result.currency).toBe('USD');
  });

  it('falls back gracefully when optional fields are missing', () => {
    const raw = { symbol: 'XYZ' };
    const result = normalizeQuote(raw);

    expect(result.symbol).toBe('XYZ');
    expect(result.price).toBeNull();
    expect(result.change).toBeNull();
    expect(result.name).toBe('XYZ'); // fallback to symbol
  });
});

describe('normalizeHistory', () => {
  it('converts chart timestamps and close prices to HistoryPoint array', () => {
    const ts = [1_700_000_000, 1_700_086_400];
    const raw = {
      chart: {
        result: [{ timestamp: ts, indicators: { quote: [{ close: [150.0, 152.5] }] } }],
      },
    };
    const result = normalizeHistory(raw, 'IBM');

    expect(result).toHaveLength(2);
    expect(result[0].symbol).toBe('IBM');
    expect(result[0].close).toBe(150.0);
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[1].close).toBe(152.5);
  });

  it('filters out null close values', () => {
    const raw = {
      chart: {
        result: [{
          timestamp: [1_700_000_000, 1_700_086_400],
          indicators: { quote: [{ close: [150.0, null] }] },
        }],
      },
    };
    const result = normalizeHistory(raw, 'IBM');
    expect(result).toHaveLength(1);
  });

  it('returns empty array when result is missing', () => {
    expect(normalizeHistory({}, 'IBM')).toEqual([]);
    expect(normalizeHistory(null, 'IBM')).toEqual([]);
  });
});
