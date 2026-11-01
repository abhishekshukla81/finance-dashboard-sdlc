const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Header
 *
 * Top application bar: IBM brand, title, a MOCK badge when running on
 * fixture data, an optional refresh action and a status dot.
 */
export default function Header({ onRefresh }) {
  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <div style={styles.brand}>
          <span style={styles.ibm}>IBM</span>
          <span style={styles.title}>Finance Dashboard</span>
          {IS_MOCK && <span style={styles.mock}>MOCK</span>}
        </div>
        <div style={styles.right}>
          {onRefresh && (
            <button onClick={onRefresh} style={styles.refreshBtn} title="Refresh data">
              ↻ Refresh
            </button>
          )}
          <span style={styles.status} title="Data feed active" aria-label="Data feed active" />
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
  },
  inner: {
    maxWidth: 1040,
    margin: '0 auto',
    padding: '0 24px',
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 8 },
  ibm:   { fontSize: '0.7rem', fontWeight: 800, color: '#0f62fe', letterSpacing: '0.02em' },
  title: { fontSize: '0.75rem', fontWeight: 700, color: '#1f2328' },
  mock: {
    fontSize: '0.55rem', fontWeight: 700, padding: '1px 5px', borderRadius: 3,
    background: '#fff3bf', color: '#8a6d00', border: '1px solid #f1d96b',
  },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  refreshBtn: {
    background: 'none', border: '1px solid #e5e7eb', borderRadius: 6,
    padding: '3px 10px', fontSize: '0.72rem', cursor: 'pointer', color: '#57606a',
  },
  status: { width: 7, height: 7, borderRadius: '50%', background: '#0ca678' },
};
