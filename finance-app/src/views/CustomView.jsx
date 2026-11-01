import { useState } from 'react';
import { TICKERS } from '../constants/tickers.js';
import { useHistory } from '../hooks/useHistory.js';
import useDashboardStore from '../store/dashboardStore.js';
import ComparisonChart from '../components/charts/ComparisonChart.jsx';
import { MOCK_SUPPORTED_SYMBOLS } from '../services/mockData.js';
import { normalizeSymbol, isValidSymbol } from '../utils/symbols.js';

const USE_MOCK     = import.meta.env.VITE_USE_MOCK === 'true';
const BASELINE     = 'IBM';
const CUSTOM_COLOR = '#d12771';
const WINDOWS      = [
  { key: 'WEEK',    label: '7 Days'  },
  { key: 'QUARTER', label: 'Quarter' },
];
const COLOR_MAP = Object.fromEntries(TICKERS.map((t) => [t.symbol, t.color]));

/** HTTP 4xx from the proxy means Yahoo does not know the symbol. */
const isNotFoundError = (message) => /HTTP 4\d\d/.test(message ?? '');

/**
 * CustomView
 *
 * Lets the user enter any ticker and compares it with IBM on a single
 * relative-performance chart. Does not touch the tracked TICKERS list, so the
 * other dashboards are unaffected.
 */
export default function CustomView() {
  const { selectedTicker, setSelectedTicker } = useDashboardStore();
  const [input, setInput]           = useState(selectedTicker ?? '');
  const [formError, setFormError]   = useState(null);
  const [windowKey, setWindowKey]   = useState('WEEK');

  const onSubmit = (e) => {
    e.preventDefault();
    const next = normalizeSymbol(input);
    if (!isValidSymbol(next)) {
      setFormError('Enter a valid ticker symbol (letters, digits, "." or "-", up to 10 characters).');
      return;
    }
    setFormError(null);
    setInput(next);
    setSelectedTicker(next);
  };

  return (
    <section>
      <h2 style={styles.heading}>Custom Company vs {BASELINE}</h2>
      <p style={styles.sub}>Indexed to 100 at the start of the window — shows relative movement, not absolute price.</p>

      <form onSubmit={onSubmit} style={styles.form} noValidate>
        <label htmlFor="custom-symbol" style={styles.label}>Ticker symbol</label>
        <input
          id="custom-symbol"
          list="custom-symbol-options"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. AAPL"
          maxLength={10}
          autoComplete="off"
          style={styles.input}
          aria-invalid={Boolean(formError)}
        />
        <datalist id="custom-symbol-options">
          {TICKERS.map(({ symbol: s, name }) => (
            <option key={s} value={s}>{name}</option>
          ))}
        </datalist>
        <button type="submit" style={styles.submit}>Compare</button>
        <div style={styles.windows} role="group" aria-label="Time window">
          {WINDOWS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={windowKey === key}
              onClick={() => setWindowKey(key)}
              style={{ ...styles.windowBtn, ...(windowKey === key ? styles.windowActive : {}) }}
            >
              {label}
            </button>
          ))}
        </div>
      </form>
      {formError && <div role="alert" style={styles.formError}>{formError}</div>}

      <div style={styles.chartWrap}>
        {selectedTicker
          ? <CustomChart key={selectedTicker} symbol={selectedTicker} windowKey={windowKey} />
          : <div style={styles.state}>Enter a ticker symbol to compare it with {BASELINE}.</div>}
      </div>
    </section>
  );
}

/**
 * Keyed by symbol in the parent so each new symbol mounts with a fresh
 * loading state (no stale data from the previous symbol, no false "not found").
 */
function CustomChart({ symbol, windowKey }) {
  // Offline mock mode only knows a fixed set of symbols.
  const mockUnknown = USE_MOCK && !MOCK_SUPPORTED_SYMBOLS.includes(symbol);

  const baseline = useHistory(BASELINE, windowKey, { useMock: USE_MOCK });
  const custom   = useHistory(mockUnknown ? null : symbol, windowKey, { useMock: USE_MOCK });

  const refetch = () => { baseline.refetch(); custom.refetch(); };
  const loading = !mockUnknown && (baseline.loading || custom.loading);
  const error   = baseline.error ?? custom.error;
  const notFound = mockUnknown
    || (!loading && (isNotFoundError(custom.error) || (!error && custom.history.length === 0)));

  if (notFound) {
    return (
      <div role="alert" style={styles.errorBox}>
        No data found for {symbol}. Check the symbol and try again.
      </div>
    );
  }
  if (loading) return <div style={styles.state}>Loading {symbol}…</div>;
  if (error) {
    return (
      <div role="alert" style={styles.errorBox}>
        <span>Unable to load data for {symbol}. Please try again.</span>
        <button onClick={refetch} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  const seriesData = symbol === BASELINE
    ? { [BASELINE]: baseline.history }
    : { [BASELINE]: baseline.history, [symbol]: custom.history };
  const colors = { ...COLOR_MAP, ...(COLOR_MAP[symbol] ? {} : { [symbol]: CUSTOM_COLOR }) };

  return <ComparisonChart seriesData={seriesData} colors={colors} height={340} />;
}

const styles = {
  heading:   { fontSize: '1rem', fontWeight: 700, color: '#57606a', marginBottom: 4, marginTop: 0 },
  sub:       { fontSize: '0.78rem', color: '#57606a', marginBottom: 16, marginTop: 0 },
  form:      { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  label:     { fontSize: '0.85rem', fontWeight: 600, color: '#1f2328' },
  input: {
    padding: '6px 10px', border: '1px solid #d0d7de', borderRadius: 6,
    fontSize: '0.9rem', textTransform: 'uppercase', width: 120,
  },
  submit: {
    padding: '6px 16px', border: 'none', borderRadius: 6, background: '#0f62fe',
    color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
  },
  windows:   { display: 'flex', gap: 4, marginLeft: 'auto' },
  windowBtn: {
    padding: '5px 12px', border: '1px solid #d0d7de', borderRadius: 6,
    background: '#fff', color: '#57606a', cursor: 'pointer', fontSize: '0.8rem',
  },
  windowActive: { background: '#0f62fe', color: '#fff', borderColor: '#0f62fe' },
  formError: { color: '#b91c1c', fontSize: '0.8rem', marginBottom: 12 },
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
