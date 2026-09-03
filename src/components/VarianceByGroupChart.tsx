import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import type { CurrencyCode, Locale, ThresholdSettings } from '../types';
import type { EnrichedVarianceRow } from '../lib/enrichRowsWithFx';
import { formatAxisCurrency, formatCurrency, formatPercent } from '../lib/formatters';
import { getChartPalette } from '../lib/chartPalette';
import { usePrefersDark } from '../hooks/usePrefersDark';
import { useT } from '../lib/i18n';
import type { ModeLabels } from '../lib/modeLabels';

interface Props {
  rows: EnrichedVarianceRow[];
  locale: Locale;
  displayCurrency: CurrencyCode;
  labels: ModeLabels;
  threshold: ThresholdSettings;
}

interface Row {
  name: string;
  variance: number;
  percent: number | null;
  bad: boolean;
}

/**
 * The variance itself, one bar per cost centre, diverging from zero.
 *
 * The grouped chart below this one shows two absolute columns per department
 * and leaves the reader to work out the gap between them by eye. That is the
 * arithmetic they came for, so this chart does it: each bar is the variance,
 * its direction is the sign, its colour is whether that direction is the bad
 * one, and the figure is written on the bar end rather than left to an axis.
 * Horizontal bars because cost centre names are words, not dates.
 */
export function VarianceByGroupChart({ rows, locale, displayCurrency, labels, threshold }: Props) {
  const t = useT();
  const dark = usePrefersDark();
  const palette = getChartPalette(dark);
  const unassigned = t('chart.unassigned');

  const hasDepartments = rows.some((r) => r.department);
  const groupKey: 'department' | 'account_code' = hasDepartments ? 'department' : 'account_code';

  const data = useMemo<Row[]>(() => {
    const groups = new Map<string, { name: string; base: number; comparison: number }>();
    for (const row of rows) {
      if (row.displayBase === null && row.displayComparison === null) continue;
      const name = (groupKey === 'department' ? row.department : row.account_code) ?? unassigned;
      const bucket = groups.get(name) ?? { name, base: 0, comparison: 0 };
      bucket.base += row.displayBase ?? 0;
      bucket.comparison += row.displayComparison ?? 0;
      groups.set(name, bucket);
    }
    return [...groups.values()]
      .map((g) => {
        const variance = g.comparison - g.base;
        return {
          name: g.name,
          variance,
          // formatPercent takes percentage points, not a ratio.
          percent: g.base === 0 ? null : (variance / g.base) * 100,
          // "Bad" is the direction the user called bad, not the arithmetic sign:
          // under budget is the red case on a revenue line.
          bad: variance !== 0 && (variance > 0) === threshold.increaseIsBad,
        };
      })
      // Largest movement first, so the line that needs explaining is on top.
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
      .slice(0, 12);
  }, [rows, groupKey, unassigned, threshold.increaseIsBad]);

  if (data.length === 0) return null;

  const good = dark ? '#3fb27a' : '#0f7d47';
  const bad = dark ? '#e2726b' : '#c0403a';

  // Leave a third of the axis free on whichever side carries bars, so the
  // longest bar never runs into its own label. Without this the widest label
  // is clipped at the panel edge, which is worse than no label at all.
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.variance)), 1);
  const domain: [number, number] = [
    data.some((d) => d.variance < 0) ? -maxAbs * 1.35 : 0,
    data.some((d) => d.variance > 0) ? maxAbs * 1.35 : 0,
  ];

  /**
   * The figure sits just past the bar end, on whichever side the bar grew.
   * Recharts gives the rendered geometry, so the label follows a short bar
   * outward instead of being clipped inside it.
   */
  const renderLabel = (props: {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
    index?: number;
  }) => {
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    const w = Number(props.width ?? 0);
    const h = Number(props.height ?? 0);
    const row = data[props.index ?? 0];
    if (!row) return null;
    const positive = row.variance >= 0;
    const text =
      formatCurrency(row.variance, locale, displayCurrency) +
      (row.percent === null ? '' : `  ${formatPercent(row.percent, locale)}`);
    return (
      <text
        x={positive ? x + w + 8 : x - 8}
        y={y + h / 2}
        textAnchor={positive ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
        fill={row.bad ? bad : good}
      >
        {(row.bad ? '▲ ' : '▼ ') + text}
      </text>
    );
  };

  return (
    <section className="chart-section">
      <h2>{t(groupKey === 'department' ? 'chart.varianceByDept' : 'chart.varianceByAccount')}</h2>
      <p className="chart-section__lede">
        {t('chart.varianceLede', { base: labels.base, comparison: labels.comparison })}
      </p>
      <ResponsiveContainer width="100%" height={Math.max(150, data.length * 46 + 40)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
          <XAxis type="number" hide domain={domain} tickFormatter={(v) => formatAxisCurrency(v, locale, displayCurrency)} />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            width={130}
            tick={{ fill: palette.ink, fontSize: 13 }}
          />
          <ReferenceLine x={0} stroke={palette.border} strokeWidth={1} />
          <Bar dataKey="variance" radius={5} barSize={20} isAnimationActive={false}>
            {data.map((row) => (
              <Cell key={row.name} fill={row.bad ? bad : good} />
            ))}
            <LabelList dataKey="variance" content={renderLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
