import { TICKERS } from '../constants/tickers.js';
import { useHistory } from '../hooks/useHistory.js';
import AreaChart from '../components/charts/AreaChart.jsx';
import { formatPercent } from '../utils/formatters.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * QuarterView
 *
 * Last-quarter area chart for each tracked company, shown as a grid.
 * Each panel also shows the quarter's Δ% at the top.
 */
export default function QuarterView() {
  return (
    <section>
      <h2 style={styles.heading}>Quarterly Trend</h2>
      <div style={styles.grid}>
        {TICKERS.map(({ symbol, name, color }) => (
          <CompanyPanel key={symbol} symbol={symbol} name={name} color={color} />
        ))}
      </div>
    </section>
  );
}

function CompanyPanel({ symbol, name, color }) {
  const { history, loading, error, refetch } = useHistory(symbol, 'QUARTER', { useMock: USE_MOCK });

  const deltaPercent = (() => {
    if (history.length < 2) return null;
    const first = history[0].close;
    const last  = history[history.length - 1].close;
    if (!first) return null;
    return ((last - first) / first) * 100;
  })();

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...styles.dot, backgroundColor: color }} />
          <span style={styles.panelName}>{name}</span>
          <span style={styles.panelSymbol}>{symbol}</span>
        </div>
        {deltaPercent != null && (
          <span style={{ color: deltaPercent >= 0 ? '#0ca678' : '#e03131', fontWeight: 600, fontSize: '0.85rem' }}>
            {formatPercent(deltaPercent)} QTD
          </span>
        )}
      </div>

      {loading && <div style={styles.stateSmall}>Loading…</div>}
      {error   && (
        <div style={styles.errorSmall}>
          ⚠ {error}
          <button onClick={refetch} style={styles.retrySmall}>Retry</button>
        </div>
      )}
      {!loading && !error && history.length === 0 && (
        <div style={styles.stateSmall}>No data available</div>
      )}
      {!loading && !error && history.length > 0 && (
        <AreaChart history={history} color={color} height={150} />
      )}
    </div>
  );
}

const styles = {
  heading: { fontSize: '1rem', fontWeight: 700, color: '#57606a', marginBottom: 16, marginTop: 0 },
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  panel: {
    background: '#fff',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  panelName:   { fontWeight: 700, fontSize: '0.95rem', color: '#1f2328' },
  panelSymbol: { fontSize: '0.72rem', color: '#57606a' },
  stateSmall:  { color: '#57606a', fontSize: '0.8rem', textAlign: 'center', padding: 20 },
  errorSmall: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: '0.78rem', color: '#b91c1c',
  },
  retrySmall: {
    padding: '2px 10px', border: '1px solid #fca5a5', borderRadius: 4,
    background: '#fff', color: '#b91c1c', cursor: 'pointer', fontSize: '0.75rem',
  },
};
