import { useState } from 'react';
import { TICKERS } from '../../constants/tickers.js';
import useDashboardStore from '../../store/dashboardStore.js';
import { useCustomSymbolData, BASELINE_SYMBOL } from '../../hooks/useMarketData.js';
import ComparisonChart from '../charts/ComparisonChart.jsx';
import CompanySelector from './CompanySelector.jsx';
import styles from './CustomSymbolPanel.module.css';

const USE_MOCK     = import.meta.env.VITE_USE_MOCK === 'true';
const CUSTOM_COLOR = '#d12771';
const COLOR_MAP    = Object.fromEntries(TICKERS.map((t) => [t.symbol, t.color]));
const WINDOWS      = [
  { key: 'WEEK',    label: '7 Days'  },
  { key: 'QUARTER', label: 'Quarter' },
];

/**
 * CustomSymbolPanel
 *
 * Shown below whichever dashboard view is active. Lets the user pick any
 * company and compares it with IBM. It reads only `customSymbol` from the
 * store and never touches TICKERS, so the existing views are unchanged.
 */
export default function CustomSymbolPanel() {
  const customSymbol = useDashboardStore((s) => s.customSymbol);
  const [windowKey, setWindowKey] = useState('WEEK');

  return (
    <section className={styles.panel} aria-label="Custom company comparison">
      <h2 className={styles.heading}>Custom Company vs {BASELINE_SYMBOL}</h2>
      <p className={styles.sub}>
        Indexed to 100 at the start of the window — shows relative movement, not absolute price.
      </p>
      <CompanySelector />
      <div className={styles.windows} role="group" aria-label="Time window">
        {WINDOWS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={windowKey === key}
            onClick={() => setWindowKey(key)}
            className={`${styles.windowBtn} ${windowKey === key ? styles.windowActive : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.chartWrap}>
        {customSymbol
          ? <CustomChart key={customSymbol} symbol={customSymbol} windowKey={windowKey} />
          : <div className={styles.state}>Enter a ticker symbol to compare it with {BASELINE_SYMBOL}.</div>}
      </div>
    </section>
  );
}

/** Keyed by symbol in the parent so a new symbol always starts from a fresh loading state. */
function CustomChart({ symbol, windowKey }) {
  const { seriesData, loading, error, notFound, refetch } =
    useCustomSymbolData(symbol, windowKey, { useMock: USE_MOCK });

  if (notFound) {
    return (
      <div role="alert" className={styles.errorBox}>
        No data found for {symbol}. Check the symbol and try again.
      </div>
    );
  }
  if (loading) return <div className={styles.state}>Loading {symbol}…</div>;
  if (error) {
    return (
      <div role="alert" className={styles.errorBox}>
        <span>Unable to load data for {symbol}. Please try again.</span>
        <button onClick={refetch} className={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  const colors = { ...COLOR_MAP, ...(COLOR_MAP[symbol] ? {} : { [symbol]: CUSTOM_COLOR }) };
  return <ComparisonChart seriesData={seriesData} colors={colors} height={340} />;
}
