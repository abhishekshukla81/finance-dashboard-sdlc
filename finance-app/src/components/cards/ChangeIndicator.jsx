/**
 * ChangeIndicator
 *
 * Small inline badge showing a positive (green) or negative (red) change.
 */
export default function ChangeIndicator({ change, changePercent }) {
  const positive = change >= 0;
  const color    = positive ? '#0ca678' : '#e03131';
  const arrow    = positive ? '▲' : '▼';

  return (
    <span style={{ color, fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
      {arrow} {Math.abs(change).toFixed(2)} ({positive ? '+' : ''}{changePercent.toFixed(2)}%)
    </span>
  );
}
