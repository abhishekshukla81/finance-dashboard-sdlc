import ChangeIndicator from './ChangeIndicator.jsx';
import { formatPrice, formatCompact } from '../../utils/formatters.js';

/**
 * QuoteCard
 *
 * Displays a summary card for one company's current-day quote.
 *
 * Props:
 *   quote  {QuoteShape}  - normalized quote object
 *   color  {string}      - brand color for the accent strip
 */
export default function QuoteCard({ quote, color = '#0f62fe' }) {
  const { name, symbol, price, change, changePercent, volume, marketCap, marketState } = quote;

  return (
    <div style={styles.card}>
      <div style={{ ...styles.accent, backgroundColor: color }} />
      <div style={styles.body}>
        <div style={styles.topRow}>
          <div>
            <div style={styles.name}>{name}</div>
            <div style={styles.symbol}>{symbol}</div>
          </div>
          {marketState && marketState !== 'REGULAR' && (
            <span style={styles.badge}>{marketState}</span>
          )}
        </div>

        <div style={styles.price}>{formatPrice(price)}</div>

        <div style={styles.change}>
          {change != null && changePercent != null ? (
            <ChangeIndicator change={change} changePercent={changePercent} />
          ) : (
            <span style={{ color: '#888' }}>—</span>
          )}
        </div>

        <div style={styles.meta}>
          <span>Vol: {formatCompact(volume)}</span>
          <span>Mkt Cap: {formatCompact(marketCap)}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: 'flex',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    background: '#fff',
    overflow: 'hidden',
    minWidth: 200,
    flex: '1 1 200px',
  },
  accent: {
    width: 6,
    flexShrink: 0,
  },
  body: {
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontWeight: 700,
    fontSize: '1rem',
    color: '#1f2328',
  },
  symbol: {
    fontSize: '0.75rem',
    color: '#57606a',
    marginTop: 1,
  },
  badge: {
    fontSize: '0.65rem',
    padding: '2px 6px',
    background: '#f3f4f6',
    borderRadius: 4,
    color: '#57606a',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  price: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1f2328',
  },
  change: {
    minHeight: 20,
  },
  meta: {
    display: 'flex',
    gap: 12,
    fontSize: '0.72rem',
    color: '#57606a',
    marginTop: 4,
  },
};
