import { TICKERS } from './constants/tickers.js';
import AppShell from './components/layout/AppShell.jsx';
import useDashboardStore from './store/dashboardStore.js';
import DayView from './views/DayView.jsx';
import WeekView from './views/WeekView.jsx';
import QuarterView from './views/QuarterView.jsx';
import CompanySelector from './components/custom/CompanySelector.jsx';
import CustomSymbolPanel from './components/custom/CustomSymbolPanel.jsx';

export default function App() {
  const { activeTab } = useDashboardStore();
  const setCustomSymbol = useDashboardStore((s) => s.setCustomSymbol);
  const addedCompanies   = useDashboardStore((s) => s.addedCompanies);
  const suggestions = [...TICKERS, ...addedCompanies];

  const view = {
    day:     <DayView />,
    week:    <WeekView />,
    quarter: <QuarterView />,
  }[activeTab] ?? <DayView />;

  return (
    <AppShell>
      {view}
      <section style={styles.section} aria-labelledby="custom-company-heading">
        <h2 id="custom-company-heading" style={styles.heading}>Custom Company</h2>
        <CompanySelector onSubmit={setCustomSymbol} suggestions={suggestions} />
        <CustomSymbolPanel />
      </section>
    </AppShell>
  );
}

const styles = {
  section: { marginTop: 28 },
  heading: {
    fontSize: '0.62rem', fontWeight: 700, color: '#57606a', margin: '0 0 8px',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
};
