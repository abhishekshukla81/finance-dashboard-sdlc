import { formatPrice, formatPercent, formatVolume, formatBillions } from '../../utils/formatters.js';

const GREEN = '#0ca678';
const RED   = '#e03131';

/** Position (0–100) of `price` inside the 52-week range, or null if unknown. */
function rangePosition(price, low, high) {
  if (price == null || low == null || high == null || high <= low) return null;
  return Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100));
}

function Stat({ label, value }) {
  return (
    <>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>{value}</span>
    </>
  );
}

/**
 * QuoteCard
 *
 * Detailed card for one company's current-day quote: price, change, previous
 * close, open/high/low, volume, market cap and a 52-week range marker.
 *
 * Props:
 *   quote  {QuoteShape}  - normalized quote object
 *   color  {string}      - brand color for the company dot
 */
export default function QuoteCard({ quote, color = '#0f62fe' }) {
  const {
    name, symbol, price, change, changePercent, previousClose,
    open, high, low, volume, marketCap, marketState,
    fiftyTwoWeekLow, fiftyTwoWeekHigh,
  } = quote;

  const hasChange = change != null && changePercent != null;
  const positive  = hasChange && change >= 0;
  const tone      = positive ? GREEN : RED;
  const position  = rangePosition(price, fiftyTwoWeekLow, fiftyTwoWeekHigh);

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <span style={{ ...styles.dot, backgroundColor: color }} />
        <span style={styles.symbol}>{symbol}</span>
        <span style={styles.name} title={name}>{name}</span>
        {marketState && marketState !== 'REGULAR' && (
          <span style={styles.badge}>{marketState}</span>
        )}
      </div>

      <div style={styles.priceRow}>
        <span style={styles.price}>{formatPrice(price)}</span>
        {hasChange && (
          <span style={{ ...styles.changeAbs, color: tone }}>
            {positive ? '+' : '-'}{Math.abs(change).toFixed(2)}
          </span>
        )}
      </div>

      <div style={styles.pctRow} data-testid="change">
        {hasChange ? (
          <>
            <span style={{ color: tone, fontWeight: 600 }}>
              {positive ? '▲' : '▼'} {formatPercent(changePercent)}
            </span>
            {previousClose != null && (
              <span style={styles.prev}>prev {formatPrice(previousClose)}</span>
            )}
          </>
        ) : (
          <span style={{ color: '#888' }}>—</span>
        )}
      </div>

      <div style={styles.stats}>
        <Stat label="Open"   value={formatPrice(open)} />
        <Stat label="High"   value={formatPrice(high)} />
        <Stat label="Low"    value={formatPrice(low)} />
        <Stat label="Volume" value={formatVolume(volume)} />
      </div>
      <div style={styles.capRow}>
        <span style={styles.label}>Mkt Cap</span>
        <span style={styles.value}>{formatBillions(marketCap)}</span>
      </div>

      <div style={styles.range} aria-label="52-week range">
        <span>{formatPrice(fiftyTwoWeekLow)}</span>
        <div style={styles.track}>
          {position != null && (
            <span style={{ ...styles.marker, left: `${position}%` }} />
          )}
        </div>
        <span>{formatPrice(fiftyTwoWeekHigh)}</span>
      </div>
    </div>
  );
}

const styles = {
  card: {
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    background: '#fff',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 0,
    fontSize: '0.72rem',
    color: '#57606a',
  },
  topRow:  { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 },
  dot:     { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  symbol:  { fontWeight: 700, color: '#1f2328', fontSize: '0.78rem' },
  name:    { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.68rem', minWidth: 0 },
  badge: {
    marginLeft: 'auto', fontSize: '0.6rem', padding: '1px 5px', background: '#f3f4f6',
    borderRadius: 4, color: '#57606a', fontWeight: 600, textTransform: 'uppercase',
  },
  priceRow:  { display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 },
  price:     { fontSize: '1.15rem', fontWeight: 700, color: '#1f2328' },
  changeAbs: { fontSize: '0.75rem', fontWeight: 600 },
  pctRow:    { display: 'flex', alignItems: 'center', gap: 10, minHeight: 16, fontSize: '0.72rem' },
  prev:      { color: '#57606a', fontSize: '0.68rem' },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto 1fr',
    columnGap: 8,
    rowGap: 4,
    marginTop: 4,
    alignItems: 'baseline',
  },
  capRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  label:   { color: '#57606a' },
  value:   { color: '#1f2328', fontWeight: 600, textAlign: 'right' },
  range: {
    display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
    fontSize: '0.6rem', color: '#57606a', whiteSpace: 'nowrap',
  },
  track:  { position: 'relative', flex: 1, height: 1, background: '#d0d7de' },
  marker: {
    position: 'absolute', top: -2, width: 5, height: 5, marginLeft: -2.5,
    borderRadius: '50%', background: '#3b82d4',
  },
};
