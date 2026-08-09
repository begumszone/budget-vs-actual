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
import type { CurrencyCode, Locale } from '../types';
import type { EnrichedVarianceRow } from '../lib/enrichRowsWithFx';
import { formatCurrency } from '../lib/formatters';
import { getChartPalette } from '../lib/chartPalette';
import { usePrefersDark } from '../hooks/usePrefersDark';
import type { ModeLabels } from '../lib/modeLabels';

interface Props {
  rows: EnrichedVarianceRow[];
  locale: Locale;
  displayCurrency: CurrencyCode;
  labels: ModeLabels;
  formatMonth: (month: string) => string;
}

export function TrendChart({ rows, locale, displayCurrency, labels, formatMonth }: Props) {
  const dark = usePrefersDark();
  const palette = getChartPalette(dark);

  /**
   * A month with no exchange rate cannot be converted, so its rows carry no
   * displayable figure. Summing those as zero would draw the line straight
   * down to the axis and read as a collapse in trading. Leave the point as
   * null instead: Recharts breaks the line there, which is what a gap in the
   * data actually looks like.
   */
  const data = useMemo(() => {
    const months = new Map<string, { month: string; base: number | null; comparison: number | null }>();
    for (const row of rows) {
      const bucket = months.get(row.month) ?? { month: row.month, base: null, comparison: null };
      if (row.displayBase !== null) bucket.base = (bucket.base ?? 0) + row.displayBase;
      if (row.displayComparison !== null) {
        bucket.comparison = (bucket.comparison ?? 0) + row.displayComparison;
      }
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
          <XAxis
            dataKey="month"
            stroke={palette.mutedInk}
            tick={{ fill: palette.mutedInk, fontSize: 12 }}
            tickFormatter={formatMonth}
          />
          <YAxis
            stroke={palette.mutedInk}
            tick={{ fill: palette.mutedInk, fontSize: 12 }}
            tickFormatter={(v) => formatCurrency(v, locale, displayCurrency)}
            width={90}
          />
          <Tooltip
            labelFormatter={(label) => formatMonth(String(label))}
            formatter={(value) =>
              formatCurrency(typeof value === 'number' ? value : Number(value), locale, displayCurrency)
            }
            contentStyle={{ fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Line type="monotone" dataKey="base" name={labels.base} stroke={palette.budget} strokeWidth={2} dot={{ r: 3 }} />
          <Line
            type="monotone"
            dataKey="comparison"
            name={labels.comparison}
            stroke={palette.actual}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
