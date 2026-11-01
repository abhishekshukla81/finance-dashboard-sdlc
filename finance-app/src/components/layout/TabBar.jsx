import useDashboardStore from '../../store/dashboardStore.js';
import { RANGES } from '../../constants/tickers.js';

const TABS = [
  { key: 'day',     label: RANGES.DAY.label     },
  { key: 'week',    label: RANGES.WEEK.label    },
  { key: 'quarter', label: RANGES.QUARTER.label },
];

/**
 * TabBar
 *
 * Segmented switch (Today / Last 7 Days / Last Quarter) that selects the
 * active dashboard view.
 */
export default function TabBar() {
  const { activeTab, setActiveTab } = useDashboardStore();

  return (
    <nav style={styles.nav} role="tablist" aria-label="Time window">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          role="tab"
          aria-selected={activeTab === key}
          onClick={() => setActiveTab(key)}
          style={{ ...styles.tab, ...(activeTab === key ? styles.active : {}) }}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

const styles = {
  nav: { display: 'flex', gap: 4 },
  tab: {
    padding: '4px 10px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 5,
    cursor: 'pointer',
    fontSize: '0.68rem',
    fontWeight: 600,
    color: '#57606a',
  },
  active: {
    background: '#3b82d4',
    borderColor: '#3b82d4',
    color: '#fff',
  },
};
