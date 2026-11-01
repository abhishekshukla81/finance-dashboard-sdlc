import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/yahooFinance.js', () => ({
  fetchQuotes: vi.fn(),
  fetchHistory: vi.fn(),
}));

import { fetchQuotes, fetchHistory } from '../services/yahooFinance.js';
import {
  getQuotes,
  getHistory,
  isFallbackError,
  SOURCE,
  REASON,
} from '../services/marketDataService.js';

const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { status });
const timeoutError = () => Object.assign(new Error('Request timed out'), { code: 'TIMEOUT' });

beforeEach(() => {
  vi.resetAllMocks();
});

describe('isFallbackError', () => {
  it.each([429, 500, 502, 503, 504])('falls back on HTTP %i', (status) => {
    expect(isFallbackError(httpError(status))).toBe(true);
  });

  it.each([400, 401, 403, 404])('does not fall back on HTTP %i', (status) => {
    expect(isFallbackError(httpError(status))).toBe(false);
  });

  it('falls back on timeout and network errors', () => {
    expect(isFallbackError(timeoutError())).toBe(true);
    expect(isFallbackError(new TypeError('Failed to fetch'))).toBe(true);
  });
});

describe('getQuotes', () => {
  it('serves simulated quotes for every requested symbol in mock mode', async () => {
    const res = await getQuotes(['IBM', 'AAPL'], { useMock: true });
    expect(fetchQuotes).not.toHaveBeenCalled();
    expect(res.source).toBe(SOURCE.SIMULATED);
    expect(res.reason).toBe(REASON.MOCK_MODE);
    expect(res.data.map((q) => q.symbol)).toEqual(['IBM', 'AAPL']);
    expect(res.data[0].price).toBe(175.4); // tracked fixture preserved
  });

  it('returns live data untouched when the source works', async () => {
    fetchQuotes.mockResolvedValue([{ symbol: 'AAPL', price: 1 }]);
    const res = await getQuotes(['AAPL']);
    expect(res).toEqual({ data: [{ symbol: 'AAPL', price: 1 }], source: 'live', reason: null });
  });

  it.each([
    ['HTTP 429', httpError(429)],
    ['HTTP 503', httpError(503)],
    ['timeout', timeoutError()],
    ['network failure', new TypeError('Failed to fetch')],
  ])('falls back to simulated quotes on %s', async (_label, err) => {
    fetchQuotes.mockRejectedValue(err);
    const res = await getQuotes(['AAPL']);
    expect(res.source).toBe(SOURCE.SIMULATED);
    expect(res.reason).toBe(REASON.UNAVAILABLE);
    expect(res.data[0].symbol).toBe('AAPL');
  });

  it('does not mask HTTP 404', async () => {
    fetchQuotes.mockRejectedValue(httpError(404));
    await expect(getQuotes(['QQQQQ'])).rejects.toThrow('HTTP 404');
  });

  it('does not mask an empty live result', async () => {
    fetchQuotes.mockResolvedValue([]);
    const res = await getQuotes(['QQQQQ']);
    expect(res.source).toBe(SOURCE.LIVE);
    expect(res.data).toEqual([]);
  });
});

describe('getHistory', () => {
  it('serves the deterministic 30-day series in mock mode', async () => {
    const res = await getHistory('AAPL', 'MONTH', { useMock: true });
    expect(fetchHistory).not.toHaveBeenCalled();
    expect(res.source).toBe(SOURCE.SIMULATED);
    expect(res.reason).toBe(REASON.MOCK_MODE);
    expect(res.data).toHaveLength(31);
  });

  it.each([['WEEK', 8], ['MONTH', 31], ['QUARTER', 91]])(
    'sizes simulated history to the %s window (%i points)',
    async (windowKey, points) => {
      const res = await getHistory('AAPL', windowKey, { useMock: true });
      expect(res.data).toHaveLength(points);
    }
  );

  it('requests the range for the window in live mode', async () => {
    fetchHistory.mockResolvedValue([{ symbol: 'AAPL', date: new Date(), close: 1 }]);
    const res = await getHistory('AAPL', 'MONTH');
    expect(fetchHistory).toHaveBeenCalledWith('AAPL', '1mo', '1d');
    expect(res.source).toBe(SOURCE.LIVE);
  });

  it('falls back on HTTP 429 with the unavailable reason', async () => {
    fetchHistory.mockRejectedValue(httpError(429));
    const res = await getHistory('AAPL', 'MONTH');
    expect(res.source).toBe(SOURCE.SIMULATED);
    expect(res.reason).toBe(REASON.UNAVAILABLE);
    expect(res.data).toHaveLength(31);
  });

  it('does not mask HTTP 404', async () => {
    fetchHistory.mockRejectedValue(httpError(404));
    await expect(getHistory('QQQQQ', 'MONTH')).rejects.toThrow('HTTP 404');
  });
});
