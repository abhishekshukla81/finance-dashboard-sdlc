import { create } from 'zustand';

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
}));

export default useDashboardStore;
