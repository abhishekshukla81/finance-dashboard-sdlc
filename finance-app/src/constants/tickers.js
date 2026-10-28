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
];

/** Allowed Yahoo Finance range values for history calls */
export const RANGES = {
  DAY:     { range: '1d',  interval: '5m',  label: 'Today' },
  WEEK:    { range: '5d',  interval: '1d',  label: '7 Days' },
  QUARTER: { range: '3mo', interval: '1wk', label: 'Quarter' },
};
