/** Format a number as a USD price string. */
export function formatPrice(value) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a number as a percentage string with sign. */
export function formatPercent(value) {
  if (value == null || isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/** Format a large number as a compact string (e.g. 1.2B). */
export function formatCompact(value) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

/** Format a Date or timestamp as a short date string. */
export function formatDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Format a share volume as e.g. 3.2M, 42.0M, 850.0K. */
export function formatVolume(value) {
  if (value == null || isNaN(value)) return '—';
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}

/** Format a market cap in billions with two decimals, e.g. 159.80B. */
export function formatBillions(value) {
  if (value == null || isNaN(value)) return '—';
  return `${(value / 1e9).toFixed(2)}B`;
}
