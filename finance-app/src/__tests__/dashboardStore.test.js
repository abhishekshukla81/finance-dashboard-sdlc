import { describe, it, expect, beforeEach } from 'vitest';
import useDashboardStore from '../store/dashboardStore.js';

beforeEach(() => {
  useDashboardStore.setState({ activeTab: 'day', customSymbol: null });
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
