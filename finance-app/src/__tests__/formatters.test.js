import { describe, it, expect } from 'vitest';
import { formatPrice, formatPercent, formatCompact, formatDate } from '../utils/formatters.js';

describe('formatPrice', () => {
  it('formats a number as USD', () => {
    expect(formatPrice(171.42)).toBe('$171.42');
  });
  it('returns dash for null', () => {
    expect(formatPrice(null)).toBe('—');
  });
  it('returns dash for NaN', () => {
    expect(formatPrice(NaN)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('formats positive with plus sign', () => {
    expect(formatPercent(1.5)).toBe('+1.50%');
  });
  it('formats negative without extra sign', () => {
    expect(formatPercent(-2.3)).toBe('-2.30%');
  });
  it('returns dash for null', () => {
    expect(formatPercent(null)).toBe('—');
  });
});

describe('formatCompact', () => {
  it('formats billions', () => {
    expect(formatCompact(1_500_000_000)).toMatch(/1\.5B/i);
  });
  it('returns dash for null', () => {
    expect(formatCompact(null)).toBe('—');
  });
});

describe('formatDate', () => {
  it('formats a Date object', () => {
    const d = new Date('2024-01-15T00:00:00Z');
    expect(formatDate(d)).toMatch(/Jan/);
  });
  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('');
  });
});
