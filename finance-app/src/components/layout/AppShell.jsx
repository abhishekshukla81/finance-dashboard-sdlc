import { useState } from 'react';
import Header from './Header.jsx';
import TabBar from './TabBar.jsx';

const formatTime = (d) => d.toLocaleTimeString('en-GB', { hour12: false });

/**
 * AppShell
 *
 * Top-level layout wrapper: header bar, page title row with the time-window
 * switch, then the active view as children.
 */
export default function AppShell({ children, onRefresh }) {
  const [updatedAt] = useState(() => new Date());

  return (
    <div style={styles.shell}>
      <Header onRefresh={onRefresh} />
      <main style={styles.main}>
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>Market Dashboard</h1>
            <p style={styles.sub}>Current market prices and daily movements</p>
          </div>
          <div style={styles.controls}>
            <span style={styles.updated}>Updated {formatTime(updatedAt)}</span>
            <TabBar />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

const styles = {
  shell: {
    minHeight: '100vh',
    background: '#f7f8fa',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif',
  },
  main: {
    flex: 1,
    padding: '24px',
    maxWidth: 1040,
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  titleRow: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: 16, flexWrap: 'wrap', marginBottom: 24,
  },
  title:    { fontSize: '1rem', fontWeight: 700, color: '#1f2328', margin: 0 },
  sub:      { fontSize: '0.72rem', color: '#57606a', margin: '2px 0 0' },
  controls: { display: 'flex', alignItems: 'center', gap: 12 },
  updated:  { fontSize: '0.62rem', color: '#57606a' },
};
