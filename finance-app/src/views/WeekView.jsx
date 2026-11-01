import { useTopCompanies } from '../hooks/useTopCompanies.js';
import { useHistories } from '../hooks/useHistories.js';
import ComparisonChart from '../components/charts/ComparisonChart.jsx';
import SimulatedDataNotice from '../components/common/SimulatedDataNotice.jsx';
import { SOURCE } from '../services/marketDataService.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * WeekView
 *
 * Last-7-days relative price comparison for the top companies by today's
 * performance (tracked plus any added from Custom Company, at most 8).
 * Each series is normalised to 100 at day 0 for a fair comparison.
 */
export default function WeekView() {
  const ranking = useTopCompanies();
  const { histories, errors, loading: historyLoading, source, reason, refetch: refetchHistory } =
    useHistories(ranking.symbols, 'WEEK', { useMock: USE_MOCK });

  const loading = ranking.loading || (ranking.symbols.length > 0 && historyLoading);

  if (loading && !ranking.top.length) return <div style={styles.state}>Loading 7-day trend…</div>;

  if (ranking.error) {
    return (
      <div style={styles.errorBox}>
        <span>⚠ Unable to load trend data: {ranking.error}</span>
        <button onClick={ranking.refetch} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  const seriesData = Object.fromEntries(
    ranking.symbols.filter((s) => histories[s]?.length).map((s) => [s, histories[s]])
  );
  const failed = ranking.symbols.filter((s) => errors[s]);

  if (!loading && !Object.keys(seriesData).length) {
    return (
      <div style={styles.errorBox}>
        <span>⚠ Unable to load trend data{failed.length ? `: ${errors[failed[0]]}` : ''}</span>
        <button onClick={refetchHistory} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  const simulated = ranking.source === SOURCE.SIMULATED || source === SOURCE.SIMULATED;

  return (
    <section>
      {simulated && <SimulatedDataNotice reason={ranking.reason ?? reason} />}
      <h2 style={styles.heading}>7-Day Relative Performance</h2>
      <p style={styles.sub}>
        Indexed to 100 at market open — shows relative movement, not absolute price.{' '}
        <span data-testid="top-caption">
          Showing top {ranking.top.length} of {ranking.total} companies by today&apos;s performance.
        </span>
      </p>
      {failed.length > 0 && (
        <p role="alert" style={styles.warn}>
          Could not load history for {failed.join(', ')}.
        </p>
      )}
      <div style={styles.chartWrap}>
        <ComparisonChart seriesData={seriesData} colors={ranking.colors} height={340} />
      </div>
    </section>
  );
}

const styles = {
  heading:   { fontSize: '1rem', fontWeight: 700, color: '#57606a', marginBottom: 4, marginTop: 0 },
  sub:       { fontSize: '0.78rem', color: '#57606a', marginBottom: 16, marginTop: 0 },
  warn:      { fontSize: '0.75rem', color: '#b91c1c', margin: '0 0 8px' },
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
