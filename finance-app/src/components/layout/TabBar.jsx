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
 * Navigation strip that switches the active dashboard view.
 */
export default function TabBar() {
  const { activeTab, setActiveTab } = useDashboardStore();

  return (
    <nav style={styles.nav} role="tablist">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          role="tab"
          aria-selected={activeTab === key}
          onClick={() => setActiveTab(key)}
          style={{
            ...styles.tab,
            ...(activeTab === key ? styles.active : {}),
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    gap: 4,
    padding: '0 24px',
    borderBottom: '1px solid #e5e7eb',
    background: '#fff',
  },
  tab: {
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#57606a',
    marginBottom: -1,
    transition: 'color 0.15s',
  },
  active: {
    color: '#0f62fe',
    borderBottomColor: '#0f62fe',
    fontWeight: 700,
  },
};
