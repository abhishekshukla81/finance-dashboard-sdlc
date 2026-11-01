import { create } from 'zustand';
import { TICKERS, ADDED_PALETTE } from '../constants/tickers.js';
import { normalizeSymbol, isValidSymbol } from '../utils/symbols.js';

/**
 * dashboardStore.js
 *
 * Global UI state only — no remote data lives here.
 * Remote data is owned by hooks (useQuotes, useHistory).
 */
const useDashboardStore = create((set) => ({
  /** Which tab is active: 'day' | 'week' | 'quarter' */
  activeTab: 'day',
  setActiveTab: (tab) => set({ activeTab: tab }),

  /**
   * User-selected ticker for the "custom company" panel shown below the
   * active view. null means no selection yet.
   */
  customSymbol: null,
  setCustomSymbol: (symbol) => set({ customSymbol: symbol }),
  clearCustomSymbol: () => set({ customSymbol: null }),

  /**
   * Companies added from the Custom Company section, in the order added.
   * Kept separate from the fixed TICKERS list. Shape: { symbol, name, color }.
   */
  addedCompanies: [],

  /**
   * Add a company once its quote has loaded. Ignores invalid symbols and
   * duplicates (case-insensitive, against TICKERS and already-added entries).
   * @param {string} rawSymbol
   * @param {string} [name]
   */
  addCompany: (rawSymbol, name) =>
    set((state) => {
      const symbol = normalizeSymbol(rawSymbol);
      if (!isValidSymbol(symbol)) return state;

      const known = [...TICKERS, ...state.addedCompanies];
      if (known.some((c) => c.symbol === symbol)) return state;

      const color = ADDED_PALETTE[state.addedCompanies.length % ADDED_PALETTE.length];
      return {
        addedCompanies: [...state.addedCompanies, { symbol, name: name || symbol, color }],
      };
    }),
}));

export default useDashboardStore;
