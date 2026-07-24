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
import type { CurrencyCode, Locale, VarianceRow } from '../types';
import { formatCurrency } from '../lib/formatters';
import { getChartPalette } from '../lib/chartPalette';
import { usePrefersDark } from '../hooks/usePrefersDark';
import type { ModeLabels } from '../lib/modeLabels';

interface Props {
  rows: VarianceRow[];
  locale: Locale;
  dataCurrency: CurrencyCode;
  labels: ModeLabels;
}

export function SummaryCharts({ rows, locale, dataCurrency, labels }: Props) {
  const dark = usePrefersDark();
  const palette = getChartPalette(dark);

  const hasDepartments = rows.some((r) => r.department);
  const groupKey: 'department' | 'account_code' = hasDepartments ? 'department' : 'account_code';

  const data = useMemo(() => {
    const groups = new Map<string, { name: string; base: number; comparison: number }>();
    for (const row of rows) {
      const name = (groupKey === 'department' ? row.department : row.account_code) ?? 'Unassigned';
      const bucket = groups.get(name) ?? { name, base: 0, comparison: 0 };
      bucket.base += row.base_amount ?? 0;
      bucket.comparison += row.comparison_amount ?? 0;
      groups.set(name, bucket);
    }
    return [...groups.values()].sort((a, b) => b.base + b.comparison - (a.base + a.comparison));
  }, [rows, groupKey]);

  if (data.length === 0) return null;

  return (
    <section className="chart-section">
      <h2>
        {labels.base} vs {labels.comparison} by {groupKey === 'department' ? 'department' : 'account'}
      </h2>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke={palette.grid} vertical={false} />
          <XAxis dataKey="name" stroke={palette.mutedInk} tick={{ fill: palette.mutedInk, fontSize: 12 }} />
          <YAxis
            stroke={palette.mutedInk}
            tick={{ fill: palette.mutedInk, fontSize: 12 }}
            tickFormatter={(v) => formatCurrency(v, locale, dataCurrency)}
            width={90}
          />
          <Tooltip
            formatter={(value) =>
              formatCurrency(typeof value === 'number' ? value : Number(value), locale, dataCurrency)
            }
            contentStyle={{ fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Bar dataKey="base" name={labels.base} fill={palette.budget} radius={[4, 4, 0, 0]} />
          <Bar dataKey="comparison" name={labels.comparison} fill={palette.actual} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
