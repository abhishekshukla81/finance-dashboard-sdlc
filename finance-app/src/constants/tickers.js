/**
 * Tracked companies.
 * To add or swap a competitor, edit this array only.
 * symbol must match a valid Yahoo Finance ticker.
 */
export const TICKERS = [
  { symbol: 'IBM',  name: 'IBM',        color: '#0f62fe' },
  { symbol: 'MSFT', name: 'Microsoft',  color: '#7c5cd8' },
  { symbol: 'ORCL', name: 'Oracle',     color: '#e8612c' },
  { symbol: 'SAP',  name: 'SAP',        color: '#00b050' },
  { symbol: 'CRM',  name: 'Salesforce', color: '#00a1e0' },
  { symbol: 'NVDA', name: 'NVIDIA',     color: '#4589ff' },
];

/** Companies shown per page in Daily Performance Ranking and Quote Detail. */
export const PAGE_SIZE = 8;

/** Companies shown in Last 7 Days and Last Quarter (top by daily performance). */
export const TOP_N = 8;

/**
 * Colours for dynamically added companies, assigned in order and cycled.
 * Distinct from the tracked-company colours above.
 */
export const ADDED_PALETTE = [
  '#d12771', '#009d9a', '#8a3ffc', '#b28600',
  '#198038', '#fa4d56', '#1192e8', '#9f1853',
];

/** Allowed Yahoo Finance range values for history calls */
export const RANGES = {
  DAY:     { range: '1d',  interval: '5m',  label: 'Today' },
  MONTH:   { range: '1mo', interval: '1d',  label: 'Last 30 Days' },
  WEEK:    { range: '5d',  interval: '1d',  label: 'Last 7 Days' },
  QUARTER: { range: '3mo', interval: '1wk', label: 'Last Quarter' },
};
