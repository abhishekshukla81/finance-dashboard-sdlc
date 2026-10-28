import { TICKERS } from '../constants/tickers.js';
import { useHistory } from '../hooks/useHistory.js';
import ComparisonChart from '../components/charts/ComparisonChart.jsx';

const USE_MOCK  = import.meta.env.VITE_USE_MOCK === 'true';
const COLOR_MAP = Object.fromEntries(TICKERS.map((t) => [t.symbol, t.color]));

/**
 * WeekView
 *
 * Last-7-days relative price comparison across all tracked companies.
 * Each series is normalised to 100 at day 0 for a fair comparison.
 */
export default function WeekView() {
  // Fetch history for every ticker and collect results
  const results = TICKERS.map(({ symbol }) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHistory(symbol, 'WEEK', { useMock: USE_MOCK })
  );

  const loading  = results.some((r) => r.loading);
  const error    = results.find((r) => r.error)?.error ?? null;
  const refetch  = () => results.forEach((r) => r.refetch());

  const seriesData = Object.fromEntries(
    TICKERS.map(({ symbol }, i) => [symbol, results[i].history])
  );

  if (loading) return <div style={styles.state}>Loading 7-day trend…</div>;

  if (error) {
    return (
      <div style={styles.errorBox}>
        <span>⚠ Unable to load trend data: {error}</span>
        <button onClick={refetch} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  return (
    <section>
      <h2 style={styles.heading}>7-Day Relative Performance</h2>
      <p style={styles.sub}>Indexed to 100 at market open — shows relative movement, not absolute price.</p>
      <div style={styles.chartWrap}>
        <ComparisonChart seriesData={seriesData} colors={COLOR_MAP} height={340} />
      </div>
    </section>
  );
}

const styles = {
  heading:   { fontSize: '1rem', fontWeight: 700, color: '#57606a', marginBottom: 4, marginTop: 0 },
  sub:       { fontSize: '0.78rem', color: '#57606a', marginBottom: 16, marginTop: 0 },
  chartWrap: { background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20 },
  state:     { color: '#57606a', padding: 32, textAlign: 'center' },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 16,
    background: '#fff3f3', border: '1px solid #fca5a5',
    borderRadius: 8, padding: '14px 20px', color: '#b91c1c',
  },
  retryBtn: {
    padding: '4px 14px', border: '1px solid #fca5a5', borderRadius: 6,
    background: '#fff', color: '#b91c1c', cursor: 'pointer', fontSize: '0.85rem',
  },
};
