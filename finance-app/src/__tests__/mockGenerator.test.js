import { describe, it, expect } from 'vitest';
import {
  generateMockQuote,
  generateMockHistory30,
  generateMockSeries,
  MOCK_HISTORY_DAYS,
} from '../services/mockGenerator.js';

const QUOTE_KEYS = [
  'symbol', 'name', 'price', 'change', 'changePercent', 'previousClose', 'open',
  'high', 'low', 'volume', 'marketCap', 'fiftyTwoWeekLow', 'fiftyTwoWeekHigh',
  'currency', 'marketState',
];

describe('generateMockQuote', () => {
  it('returns a full quote shape for any valid ticker', () => {
    const q = generateMockQuote('AAPL');
    expect(Object.keys(q).sort()).toEqual([...QUOTE_KEYS].sort());
    expect(q.symbol).toBe('AAPL');
    expect(q.currency).toBe('USD');
  });

  it('is deterministic for the same symbol', () => {
    expect(generateMockQuote('TSLA')).toEqual(generateMockQuote('TSLA'));
  });

  it('differs between symbols', () => {
    expect(generateMockQuote('AAPL').price).not.toBe(generateMockQuote('TSLA').price);
  });

  it('keeps values internally consistent', () => {
    for (const s of ['A', 'AAPL', 'TSLA', 'GOOGL', 'ZZZZZ', 'META']) {
      const q = generateMockQuote(s);
      expect(q.price).toBeGreaterThan(0);
      expect(q.price).toBeCloseTo(q.previousClose + q.change, 1);
      expect(q.high).toBeGreaterThanOrEqual(Math.max(q.price, q.open));
      expect(q.low).toBeLessThanOrEqual(Math.min(q.price, q.open));
      expect(q.fiftyTwoWeekLow).toBeLessThanOrEqual(q.low);
      expect(q.fiftyTwoWeekHigh).toBeGreaterThanOrEqual(q.high);
      expect(Math.abs(q.changePercent)).toBeLessThanOrEqual(3);
    }
  });

  it.each(['', 'ab', 'TOOLONG', 'A1', 'AA PL', 'aapl'])(
    'rejects invalid symbol %j',
    (bad) => {
      expect(() => generateMockQuote(bad)).toThrow('Invalid ticker symbol');
    }
  );
});

describe('generateMockHistory30', () => {
  it('returns 31 points ending at the quote price', () => {
    const q = generateMockQuote('AAPL');
    const h = generateMockHistory30('AAPL');
    expect(h).toHaveLength(MOCK_HISTORY_DAYS + 1);
    expect(h).toHaveLength(31);
    expect(h[h.length - 1].close).toBe(q.price);
  });

  it('uses the HistoryPoint shape with ascending dates', () => {
    const h = generateMockHistory30('TSLA');
    h.forEach((p) => {
      expect(p.symbol).toBe('TSLA');
      expect(p.date).toBeInstanceOf(Date);
      expect(p.close).toBeGreaterThan(0);
    });
    for (let i = 1; i < h.length; i++) {
      expect(h[i].date.getTime()).toBeGreaterThan(h[i - 1].date.getTime());
    }
  });

  it('is deterministic for closes', () => {
    const a = generateMockHistory30('AAPL').map((p) => p.close);
    const b = generateMockHistory30('AAPL').map((p) => p.close);
    expect(a).toEqual(b);
  });

  it('honours an explicit end price', () => {
    const h = generateMockHistory30('AAPL', 175.4);
    expect(h[h.length - 1].close).toBe(175.4);
  });

  it('rejects an invalid symbol', () => {
    expect(() => generateMockHistory30('nope!')).toThrow('Invalid ticker symbol');
  });
});

describe('generateMockSeries', () => {
  it.each([[7, 8], [30, 31], [90, 91]])('%i days gives %i points ending at the quote price', (days, points) => {
    const h = generateMockSeries('AAPL', days);
    expect(h).toHaveLength(points);
    expect(h[h.length - 1].close).toBe(generateMockQuote('AAPL').price);
  });

  it('is deterministic and the 7-day series is the tail of the 30-day series', () => {
    const week = generateMockSeries('TSLA', 7).map((p) => p.close);
    const month = generateMockSeries('TSLA', 30).map((p) => p.close);
    expect(week).toEqual(generateMockSeries('TSLA', 7).map((p) => p.close));
    expect(month.slice(-8)).toEqual(week);
  });

  it.each([0, -1, 1.5, 366, NaN])('rejects invalid day count %s', (days) => {
    expect(() => generateMockSeries('AAPL', days)).toThrow('Invalid day count');
  });

  it('rejects an invalid symbol', () => {
    expect(() => generateMockSeries('bad!', 7)).toThrow('Invalid ticker symbol');
  });
});
