/**
 * Header
 *
 * Top application bar with title and an optional refresh action.
 */
export default function Header({ onRefresh }) {
  return (
    <header style={styles.header}>
      <div style={styles.brand}>
        <span style={styles.logo}>📈</span>
        <span style={styles.title}>Finance Dashboard</span>
      </div>
      {onRefresh && (
        <button onClick={onRefresh} style={styles.refreshBtn} title="Refresh data">
          ↻ Refresh
        </button>
      )}
    </header>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: 56,
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    fontSize: '1.3rem',
  },
  title: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#1f2328',
  },
  refreshBtn: {
    background: 'none',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    padding: '5px 14px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    color: '#57606a',
  },
};
