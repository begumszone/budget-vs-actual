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
import type { CurrencyCode, Locale } from '../types';
import type { EnrichedVarianceRow } from '../lib/enrichRowsWithFx';
import { formatAxisCurrency, formatCurrency } from '../lib/formatters';
import { getChartPalette, tooltipStyles } from '../lib/chartPalette';
import { usePrefersDark } from '../hooks/usePrefersDark';
import type { ModeLabels } from '../lib/modeLabels';

interface Props {
  rows: EnrichedVarianceRow[];
  locale: Locale;
  displayCurrency: CurrencyCode;
  labels: ModeLabels;
}

export function SummaryCharts({ rows, locale, displayCurrency, labels }: Props) {
  const dark = usePrefersDark();
  const palette = getChartPalette(dark);
  const tip = tooltipStyles(palette);

  const hasDepartments = rows.some((r) => r.department);
  const groupKey: 'department' | 'account_code' = hasDepartments ? 'department' : 'account_code';

  const data = useMemo(() => {
    const groups = new Map<string, { name: string; base: number; comparison: number }>();
    for (const row of rows) {
      const name = (groupKey === 'department' ? row.department : row.account_code) ?? 'Unassigned';
      const bucket = groups.get(name) ?? { name, base: 0, comparison: 0 };
      bucket.base += row.displayBase ?? 0;
      bucket.comparison += row.displayComparison ?? 0;
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
      <ResponsiveContainer width="100%" height={250}>
        {/* Thin bars with a 2px gap and a capped width: with only two or three
            cost centres, full-width bars become slabs of saturated colour that
            dominate the page instead of reporting a number. */}
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          barGap={2}
          barCategoryGap="34%"
        >
          <CartesianGrid stroke={palette.grid} vertical={false} />
          <XAxis
            dataKey="name"
            stroke={palette.grid}
            tickLine={false}
            tick={{ fill: palette.mutedInk, fontSize: 11.5 }}
            dy={4}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: palette.mutedInk, fontSize: 11.5 }}
            tickFormatter={(v) => formatAxisCurrency(v, locale, displayCurrency)}
            width={64}
          />
          <Tooltip
            formatter={(value) =>
              formatCurrency(typeof value === 'number' ? value : Number(value), locale, displayCurrency)
            }
            {...tip}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconSize={9} iconType="circle" />
          <Bar dataKey="base" name={labels.base} fill={palette.budget} radius={[3, 3, 0, 0]} maxBarSize={24} />
          <Bar dataKey="comparison" name={labels.comparison} fill={palette.actual} radius={[3, 3, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
