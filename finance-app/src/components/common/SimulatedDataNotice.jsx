import { REASON } from '../../services/marketDataService.js';
import styles from './SimulatedDataNotice.module.css';

const MESSAGES = {
  [REASON.MOCK_MODE]:
    'Simulated data: the dashboard is running in mock mode. Values are generated and unverified, and added tickers are not checked against a real market.',
  [REASON.UNAVAILABLE]:
    'Simulated data: live market data is currently unavailable. Values are generated and unverified, and added tickers are not checked against a real market.',
};

/**
 * SimulatedDataNotice
 *
 * Visible notice shown whenever any displayed data is generated rather than
 * live. Renders nothing when `reason` is not provided.
 *
 * Props:
 *   reason {'mock-mode'|'unavailable'|null}
 */
export default function SimulatedDataNotice({ reason }) {
  if (!reason) return null;
  return (
    <div className={styles.notice} role="note" data-testid="simulated-notice">
      {MESSAGES[reason] ?? MESSAGES[REASON.UNAVAILABLE]}
    </div>
  );
}
