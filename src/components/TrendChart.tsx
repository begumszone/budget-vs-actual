import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Locale, VarianceRow } from '../types';
import { formatCurrency } from '../lib/formatters';
import { getChartPalette } from '../lib/chartPalette';
import { usePrefersDark } from '../hooks/usePrefersDark';

interface Props {
  rows: VarianceRow[];
  locale: Locale;
}

export function TrendChart({ rows, locale }: Props) {
  const dark = usePrefersDark();
  const palette = getChartPalette(dark);

  const data = useMemo(() => {
    const months = new Map<string, { month: string; budget: number; actual: number }>();
    for (const row of rows) {
      const bucket = months.get(row.month) ?? { month: row.month, budget: 0, actual: 0 };
      bucket.budget += row.budget_amount ?? 0;
      bucket.actual += row.actual_amount ?? 0;
      months.set(row.month, bucket);
    }
    return [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [rows]);

  if (data.length < 2) return null;

  return (
    <section className="chart-section">
      <h2>Monthly trend</h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke={palette.grid} vertical={false} />
          <XAxis dataKey="month" stroke={palette.mutedInk} tick={{ fill: palette.mutedInk, fontSize: 12 }} />
          <YAxis
            stroke={palette.mutedInk}
            tick={{ fill: palette.mutedInk, fontSize: 12 }}
            tickFormatter={(v) => formatCurrency(v, locale)}
            width={90}
          />
          <Tooltip
            formatter={(value) => formatCurrency(typeof value === 'number' ? value : Number(value), locale)}
            contentStyle={{ fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Line type="monotone" dataKey="budget" name="Budget" stroke={palette.budget} strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="actual" name="Actual" stroke={palette.actual} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
