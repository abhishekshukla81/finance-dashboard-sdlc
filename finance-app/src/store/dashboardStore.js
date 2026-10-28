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
   * User-selected ticker for Part 2 "custom company" feature.
   * null means no selection yet.
   */
  selectedTicker: null,
  setSelectedTicker: (symbol) => set({ selectedTicker: symbol }),
}));

export default useDashboardStore;
