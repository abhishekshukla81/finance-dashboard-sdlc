import { TICKERS } from '../../constants/tickers.js';
import useDashboardStore from '../../store/dashboardStore.js';
import { useCustomSymbolData } from '../../hooks/useMarketData.js';
import AreaChart from '../charts/AreaChart.jsx';
import QuoteCard from '../cards/QuoteCard.jsx';
import styles from './CustomSymbolPanel.module.css';

const USE_MOCK     = import.meta.env.VITE_USE_MOCK === 'true';
const CUSTOM_COLOR = '#d12771';
const COLOR_MAP    = Object.fromEntries(TICKERS.map((t) => [t.symbol, t.color]));

/**
 * CustomSymbolPanel
 *
 * Shows the user-selected company's quote card and 30-day price chart. It
 * renders nothing until a symbol is loaded, and Clear removes it again. It
 * reads only `customSymbol` from the store and never touches TICKERS' data,
 * so the existing views are unchanged.
 */
export default function CustomSymbolPanel() {
  const customSymbol      = useDashboardStore((s) => s.customSymbol);
  const clearCustomSymbol = useDashboardStore((s) => s.clearCustomSymbol);

  if (!customSymbol) return null;

  return (
    <div className={styles.panel} data-testid="custom-panel" aria-label="Custom company chart">
      <div className={styles.header}>
        <span className={styles.current}>
          Currently showing: <strong>{customSymbol}</strong>
        </span>
        <button type="button" onClick={clearCustomSymbol} className={styles.clear}>Clear</button>
      </div>
      <div className={styles.body}>
        {/* Keyed by symbol so a new symbol always starts from a fresh loading state. */}
        <CustomChart key={customSymbol} symbol={customSymbol} />
      </div>
    </div>
  );
}

function CustomChart({ symbol }) {
  const { history, quote, loading, error, notFound, refetch } =
    useCustomSymbolData(symbol, { useMock: USE_MOCK });

  if (notFound) {
    return (
      <div role="alert" className={styles.errorBox}>
        No data found for symbol &quot;{symbol}&quot;. Check the ticker and try again.
      </div>
    );
  }
  if (loading) {
    return (
      <div className={styles.state} role="status" aria-live="polite">
        <div className={styles.spinner} aria-hidden="true" />
        Loading {symbol}…
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" className={styles.errorBox}>
        <span>Unable to load data for {symbol}. Please try again.</span>
        <button onClick={refetch} className={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  const color = COLOR_MAP[symbol] ?? CUSTOM_COLOR;
  return (
    <div className={styles.content}>
      {quote && (
        <div className={styles.summary} data-testid="summary-card">
          <QuoteCard quote={quote} color={color} />
        </div>
      )}
      <div className={styles.chart} data-testid="price-chart">
        <div className={styles.chartTitle}>30-day price history</div>
        <AreaChart history={history} color={color} height={200} />
      </div>
    </div>
  );
}
