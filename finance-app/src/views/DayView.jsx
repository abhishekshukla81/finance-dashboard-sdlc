import { TICKERS } from '../constants/tickers.js';
import { useQuotes } from '../hooks/useQuotes.js';
import QuoteCard from '../components/cards/QuoteCard.jsx';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const SYMBOLS  = TICKERS.map((t) => t.symbol);
const COLOR_MAP = Object.fromEntries(TICKERS.map((t) => [t.symbol, t.color]));

/**
 * DayView
 *
 * Current-day market summary — one QuoteCard per tracked company.
 */
export default function DayView() {
  const { quotes, loading, error, refetch } = useQuotes(SYMBOLS, { useMock: USE_MOCK });

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={refetch} />;
  if (!quotes.length) return <EmptyState />;

  return (
    <section>
      <h2 style={styles.heading}>Today&apos;s Market Summary</h2>
      <div style={styles.grid}>
        {quotes.map((q) => (
          <QuoteCard key={q.symbol} quote={q} color={COLOR_MAP[q.symbol] ?? '#0f62fe'} />
        ))}
      </div>
    </section>
  );
}

function LoadingState() {
  return <div style={styles.state}>Loading quotes…</div>;
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={styles.errorBox}>
      <span>⚠ Unable to load market data: {message}</span>
      <button onClick={onRetry} style={styles.retryBtn}>Retry</button>
    </div>
  );
}

function EmptyState() {
  return <div style={styles.state}>No quote data available.</div>;
}

const styles = {
  heading: { fontSize: '1rem', fontWeight: 700, color: '#57606a', marginBottom: 16, marginTop: 0 },
  grid:    { display: 'flex', flexWrap: 'wrap', gap: 16 },
  state:   { color: '#57606a', padding: 32, textAlign: 'center' },
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
