import { useState } from 'react';
import { TICKERS } from '../constants/tickers.js';
import { useQuotes } from '../hooks/useQuotes.js';
import useDashboardStore from '../store/dashboardStore.js';
import { paginate, clampPage, needsPagination, startRank } from '../utils/pagination.js';
import QuoteCard from '../components/cards/QuoteCard.jsx';
import PerformanceRanking from '../components/cards/PerformanceRanking.jsx';
import Pagination from '../components/common/Pagination.jsx';
import SimulatedDataNotice from '../components/common/SimulatedDataNotice.jsx';
import { SOURCE } from '../services/marketDataService.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const TRACKED_SYMBOLS = TICKERS.map((t) => t.symbol);
const TRACKED_COLORS  = Object.fromEntries(TICKERS.map((t) => [t.symbol, t.color]));

/** Best daily change first; quotes without a change go last. */
const byDailyChange = (a, b) => {
  const pa = a.changePercent ?? -Infinity;
  const pb = b.changePercent ?? -Infinity;
  return pa === pb ? 0 : pb - pa;
};

/**
 * DayView
 *
 * Current-day market summary for the tracked companies plus any companies
 * added from the Custom Company section. Above 6 companies, Daily Performance
 * Ranking and Quote Detail share one ranked order and one page.
 */
export default function DayView() {
  const addedCompanies = useDashboardStore((s) => s.addedCompanies);
  const [page, setPage] = useState(1);

  const symbols = [...TRACKED_SYMBOLS, ...addedCompanies.map((c) => c.symbol)];
  const colors  = {
    ...TRACKED_COLORS,
    ...Object.fromEntries(addedCompanies.map((c) => [c.symbol, c.color])),
  };

  const { quotes, loading, error, source, reason, refetch } =
    useQuotes(symbols, { useMock: USE_MOCK, fallback: true });

  // Keep showing the previous quotes while an added company is being fetched.
  if (loading && !quotes.length) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={refetch} />;
  if (!quotes.length) return <EmptyState />;

  const total     = quotes.length;
  const paginated = needsPagination(total);
  const current   = clampPage(page, total);

  // With more than 6 companies both sections use the same ranked order, so each
  // page shows the same companies. Otherwise Quote Detail keeps tracked order.
  const ranked       = [...quotes].sort(byDailyChange);
  const rankingItems = paginated ? paginate(ranked, current) : quotes;
  const detailItems  = paginated ? rankingItems : quotes;

  return (
    <section>
      {source === SOURCE.SIMULATED && <SimulatedDataNotice reason={reason} />}

      <h2 style={styles.heading}>Daily Performance Ranking</h2>
      <PerformanceRanking
        quotes={rankingItems}
        colors={colors}
        startRank={paginated ? startRank(current, total) : 1}
      />
      <Pagination page={current} total={total} onPageChange={setPage} label="Ranking pages" />

      <h2 style={{ ...styles.heading, marginTop: 28 }}>Quote Detail</h2>
      <div style={styles.grid} data-testid="quote-detail">
        {detailItems.map((q) => (
          <div key={q.symbol} data-testid="quote-card" data-symbol={q.symbol}>
            <QuoteCard quote={q} color={colors[q.symbol] ?? '#0f62fe'} />
          </div>
        ))}
      </div>
      <Pagination page={current} total={total} onPageChange={setPage} label="Quote detail pages" />
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
  heading: {
    fontSize: '0.62rem', fontWeight: 700, color: '#57606a', marginBottom: 8, marginTop: 0,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
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
