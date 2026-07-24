import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

export function SummaryCharts({ rows, locale }: Props) {
  const dark = usePrefersDark();
  const palette = getChartPalette(dark);

  const hasDepartments = rows.some((r) => r.department);
  const groupKey: 'department' | 'account_code' = hasDepartments ? 'department' : 'account_code';

  const data = useMemo(() => {
    const groups = new Map<string, { name: string; budget: number; actual: number }>();
    for (const row of rows) {
      const name = (groupKey === 'department' ? row.department : row.account_code) ?? 'Unassigned';
      const bucket = groups.get(name) ?? { name, budget: 0, actual: 0 };
      bucket.budget += row.budget_amount ?? 0;
      bucket.actual += row.actual_amount ?? 0;
      groups.set(name, bucket);
    }
    return [...groups.values()].sort((a, b) => b.budget + b.actual - (a.budget + a.actual));
  }, [rows, groupKey]);

  if (data.length === 0) return null;

  return (
    <section className="chart-section">
      <h2>Budget vs Actual by {groupKey === 'department' ? 'department' : 'account'}</h2>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke={palette.grid} vertical={false} />
          <XAxis dataKey="name" stroke={palette.mutedInk} tick={{ fill: palette.mutedInk, fontSize: 12 }} />
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
          <Bar dataKey="budget" name="Budget" fill={palette.budget} radius={[4, 4, 0, 0]} />
          <Bar dataKey="actual" name="Actual" fill={palette.actual} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
