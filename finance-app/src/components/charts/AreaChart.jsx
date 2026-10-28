import {
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDate, formatPrice } from '../../utils/formatters.js';

/**
 * AreaChart
 *
 * Single-series filled area chart for one company's price history.
 *
 * Props:
 *   history  {HistoryPoint[]}  - array of { date, close } points
 *   color    {string}          - fill / stroke color
 *   height   {number}          - chart height in px (default 160)
 */
export default function AreaChart({ history = [], color = '#0f62fe', height = 160 }) {
  const data = history.map((p, i) => ({ index: i, date: p.date, close: p.close }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReAreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="index"
          tickFormatter={(i) => data[i]?.date ? formatDate(data[i].date) : ''}
          tick={{ fontSize: 10, fill: '#57606a' }}
        />
        <YAxis
          domain={['auto', 'auto']}
          tickFormatter={(v) => `$${v.toFixed(0)}`}
          tick={{ fontSize: 10, fill: '#57606a' }}
          width={44}
        />
        <Tooltip
          formatter={(val) => [formatPrice(val), 'Close']}
          labelFormatter={(i) => data[i]?.date ? formatDate(data[i].date) : ''}
          contentStyle={{ fontSize: '0.78rem', border: '1px solid #e5e7eb', borderRadius: 6 }}
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace('#', '')})`}
          dot={false}
          connectNulls
        />
      </ReAreaChart>
    </ResponsiveContainer>
  );
}
