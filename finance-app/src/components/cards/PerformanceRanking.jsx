import { formatPrice, formatPercent } from '../../utils/formatters.js';

const GREEN = '#0ca678';
const RED   = '#e03131';
const BAR_W = 84;

/**
 * PerformanceRanking
 *
 * Tracked companies ranked by today's % change (best first), each with a
 * proportional bar, current price and daily percentage.
 *
 * Props:
 *   quotes  {QuoteShape[]}
 *   colors  {{ [symbol]: string }}
 *   startRank {number} rank shown for the first row (page 2 of 6 starts at 7)
 */
export default function PerformanceRanking({ quotes = [], colors = {}, startRank = 1 }) {
  const ranked = [...quotes]
    .filter((q) => q.changePercent != null)
    .sort((a, b) => b.changePercent - a.changePercent);
  const maxAbs = Math.max(...ranked.map((q) => Math.abs(q.changePercent)), 0.0001);

  return (
    <ol style={styles.list} aria-label="Daily performance ranking">
      {ranked.map((q, i) => {
        const positive = q.changePercent >= 0;
        const width    = Math.max(4, (Math.abs(q.changePercent) / maxAbs) * BAR_W);
        const tone     = positive ? GREEN : RED;
        return (
          <li key={q.symbol} data-symbol={q.symbol} style={{ ...styles.row, borderTop: i === 0 ? 'none' : '1px solid #f0f1f3' }}>
            <span style={styles.rank}>{startRank + i}</span>
            <span style={{ ...styles.dot, backgroundColor: colors[q.symbol] ?? '#0f62fe' }} />
            <span style={styles.symbol}>{q.symbol}</span>
            <span style={styles.name}>{q.name}</span>
            <span style={{ ...styles.track, justifyContent: positive ? 'flex-end' : 'flex-start' }}>
              <span style={{ ...styles.bar, width, background: tone }} />
            </span>
            <span style={styles.price}>{formatPrice(q.price)}</span>
            <span style={{ ...styles.pct, color: tone }}>{formatPercent(q.changePercent)}</span>
          </li>
        );
      })}
    </ol>
  );
}

const styles = {
  list: {
    listStyle: 'none', margin: 0, padding: 0,
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 14px', fontSize: '0.72rem',
  },
  rank:   { width: 10, color: '#57606a', textAlign: 'right' },
  dot:    { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  symbol: { width: 44, fontWeight: 700, color: '#1f2328' },
  name:   { flex: 1, color: '#57606a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  track:  { display: 'flex', width: BAR_W, height: 4, background: '#f3f4f6', borderRadius: 2 },
  bar:    { height: 4, borderRadius: 2 },
  price:  { width: 64, textAlign: 'right', fontWeight: 700, color: '#1f2328' },
  pct:    { width: 52, textAlign: 'right', fontWeight: 700 },
};
