import AppShell from './components/layout/AppShell.jsx';
import useDashboardStore from './store/dashboardStore.js';
import DayView from './views/DayView.jsx';
import WeekView from './views/WeekView.jsx';
import QuarterView from './views/QuarterView.jsx';
import CustomSymbolPanel from './components/custom/CustomSymbolPanel.jsx';

export default function App() {
  const { activeTab } = useDashboardStore();

  const view = {
    day:     <DayView />,
    week:    <WeekView />,
    quarter: <QuarterView />,
  }[activeTab] ?? <DayView />;

  return (
    <AppShell>
      {view}
      <CustomSymbolPanel />
    </AppShell>
  );
}
