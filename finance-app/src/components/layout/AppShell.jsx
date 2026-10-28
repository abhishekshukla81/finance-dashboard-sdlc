import Header from './Header.jsx';
import TabBar from './TabBar.jsx';

/**
 * AppShell
 *
 * Top-level layout wrapper.  Children are the active view.
 */
export default function AppShell({ children, onRefresh }) {
  return (
    <div style={styles.shell}>
      <Header onRefresh={onRefresh} />
      <TabBar />
      <main style={styles.main}>{children}</main>
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
    maxWidth: 1200,
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
};
