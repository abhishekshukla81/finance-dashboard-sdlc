import { describe, it, expect, beforeEach } from 'vitest';
import useDashboardStore from '../store/dashboardStore.js';
import { ADDED_PALETTE } from '../constants/tickers.js';

beforeEach(() => {
  useDashboardStore.setState({ activeTab: 'day', customSymbol: null, addedCompanies: [] });
});

describe('dashboardStore custom symbol', () => {
  it('starts with no custom symbol', () => {
    expect(useDashboardStore.getState().customSymbol).toBeNull();
  });

  it('setCustomSymbol stores the symbol', () => {
    useDashboardStore.getState().setCustomSymbol('NVDA');
    expect(useDashboardStore.getState().customSymbol).toBe('NVDA');
  });

  it('clearCustomSymbol resets it to null', () => {
    useDashboardStore.getState().setCustomSymbol('NVDA');
    useDashboardStore.getState().clearCustomSymbol();
    expect(useDashboardStore.getState().customSymbol).toBeNull();
  });

  it('customSymbol survives switching the time-window tab', () => {
    const { setCustomSymbol, setActiveTab } = useDashboardStore.getState();
    setCustomSymbol('NVDA');
    setActiveTab('week');
    setActiveTab('quarter');
    expect(useDashboardStore.getState().customSymbol).toBe('NVDA');
    expect(useDashboardStore.getState().activeTab).toBe('quarter');
  });
});

describe('dashboardStore addedCompanies', () => {
  const add = (...args) => useDashboardStore.getState().addCompany(...args);
  const list = () => useDashboardStore.getState().addedCompanies;

  it('starts empty', () => {
    expect(list()).toEqual([]);
  });

  it('adds a company with a palette colour', () => {
    add('aapl', 'Apple Inc.');
    expect(list()).toEqual([{ symbol: 'AAPL', name: 'Apple Inc.', color: ADDED_PALETTE[0] }]);
  });

  it('defaults the name to the symbol', () => {
    add('TSLA');
    expect(list()[0].name).toBe('TSLA');
  });

  it('does not duplicate an added company (case-insensitive)', () => {
    add('AAPL');
    add('aapl');
    add(' Aapl ');
    expect(list()).toHaveLength(1);
  });

  it('does not add a tracked company', () => {
    add('IBM');
    add('nvda');
    expect(list()).toEqual([]);
  });

  it.each(['', 'IBM1', 'TOOLONG', 'A B', null, undefined])('ignores invalid symbol %j', (bad) => {
    add(bad);
    expect(list()).toEqual([]);
  });

  it('assigns colours in order and cycles the palette', () => {
    const letters = 'ABCDEFGHIJ'.split('');
    letters.forEach((l) => add(`${l}${l}`));
    expect(list()[0].color).toBe(ADDED_PALETTE[0]);
    expect(list()[1].color).toBe(ADDED_PALETTE[1]);
    expect(list()[ADDED_PALETTE.length].color).toBe(ADDED_PALETTE[0]);
  });

  it('is independent of the custom symbol: Clear does not remove an added company', () => {
    const { setCustomSymbol, clearCustomSymbol } = useDashboardStore.getState();
    setCustomSymbol('AAPL');
    add('AAPL');
    clearCustomSymbol();
    expect(list().map((c) => c.symbol)).toEqual(['AAPL']);
  });
});
