import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatDate, formatPrice } from '../../utils/formatters.js';

/**
 * Tooltip rendered outside of ComparisonChart to satisfy the react/static-components rule.
 * Receives `aligned` as a prop so it can look up absolute prices.
 */
function ComparisonTooltip({ active, payload, aligned }) {
  if (!active || !payload?.length) return null;
  const index = payload[0]?.payload?.index;
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        {index != null && aligned[index]?.date ? formatDate(aligned[index].date) : `Day ${index}`}
      </div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, fontSize: '0.8rem' }}>
          {p.dataKey}: {formatPrice(aligned[p.payload.index]?.[`${p.dataKey}_abs`])}
          {' '}({p.value?.toFixed(1)}%)
        </div>
      ))}
    </div>
  );
}

/**
 * ComparisonChart
 *
 * Multi-series line chart comparing history across multiple tickers.
 * Each series is normalized to 100 at its first data point so different
 * price ranges are comparable on the same axis.
 *
 * Props:
 *   seriesData  { [symbol]: HistoryPoint[] }  - keyed by ticker symbol
 *   colors      { [symbol]: string }           - keyed by ticker symbol
 *   height      {number}                       - chart height in px (default 300)
 */
export default function ComparisonChart({ seriesData = {}, colors = {}, height = 300 }) {
  const symbols = Object.keys(seriesData);

  // Align data by index into a flat array of objects: { date, IBM: 100.2, MSFT: 99.8, ... }
  const maxLen = Math.max(...symbols.map((s) => seriesData[s]?.length ?? 0), 0);

  const aligned = Array.from({ length: maxLen }, (_, i) => {
    const point = { index: i };
    symbols.forEach((sym) => {
      const series = seriesData[sym] ?? [];
      const base   = series[0]?.close;
      const cur    = series[i]?.close;
      point.date              = series[i]?.date ?? null;
      point[sym]              = base && cur ? parseFloat(((cur / base) * 100).toFixed(3)) : null;
      point[`${sym}_abs`]     = cur ?? null; // for tooltip
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart data={aligned} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="index"
          tickFormatter={(i) => aligned[i]?.date ? formatDate(aligned[i].date) : ''}
          tick={{ fontSize: 11, fill: '#57606a' }}
        />
        <YAxis
          domain={['auto', 'auto']}
          tickFormatter={(v) => `${v.toFixed(0)}`}
          tick={{ fontSize: 11, fill: '#57606a' }}
          width={40}
        />
        <Tooltip content={<ComparisonTooltip aligned={aligned} />} />
        <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
        {symbols.map((sym) => (
          <Line
            key={sym}
            type="monotone"
            dataKey={sym}
            stroke={colors[sym] ?? '#888'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  );
}

const tooltipStyle = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: '0.8rem',
};
