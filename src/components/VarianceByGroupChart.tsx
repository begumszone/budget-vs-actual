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
  /** Which dimension to total over. */
  groupBy: 'department' | 'account';
  /** Keep the chart readable: bars past this are dropped, and the lede says so. */
  limit?: number;
}

interface Row {
  key: string;
  /** Bold line of the axis tick: the cost centre, or the account code. */
  title: string;
  /** Muted second line: the account name, where there is one. */
  subtitle: string | null;
  variance: number;
  percent: number | null;
  bad: boolean;
}

/** Long account names are cut rather than allowed to collide with the plot. */
function clip(text: string, max = 26): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * The variance itself, one horizontal bar per group, diverging from zero.
 *
 * The grouped column chart shows two absolute columns and leaves the reader to
 * work out the gap between them by eye. That gap is the arithmetic they came
 * for, so this chart does it for them: each bar is the variance, its direction
 * is the sign, its colour is whether that direction is the one the user called
 * bad, and the figure is written on the bar end rather than left to an axis.
 * Horizontal, because cost centre and account names are words, not dates.
 *
 * The same component serves both cuts. By cost centre it answers "which part
 * of the business missed"; by account, "which line item did it".
 */
export function VarianceByGroupChart({
  rows,
  locale,
  displayCurrency,
  labels,
  threshold,
  groupBy,
  limit,
}: Props) {
  const t = useT();
  const dark = usePrefersDark();
  const palette = getChartPalette(dark);
  const unassigned = t('chart.unassigned');

  const hasDepartments = rows.some((r) => r.department);

  const { data, total } = useMemo(() => {
    const groups = new Map<
      string,
      { key: string; title: string; subtitle: string | null; base: number; comparison: number }
    >();
    for (const row of rows) {
      if (row.displayBase === null && row.displayComparison === null) continue;
      // Unit separator: a composite key that cannot collide with a code or a
      // name containing spaces. It is never displayed -- title and subtitle
      // carry the text.
      const key =
        groupBy === 'department'
          ? row.department ?? unassigned
          : `${row.account_code}\u001F${row.account_name}`;
      const bucket = groups.get(key) ?? {
        key,
        title: groupBy === 'department' ? row.department ?? unassigned : row.account_code || unassigned,
        subtitle: groupBy === 'department' ? null : row.account_name || null,
        base: 0,
        comparison: 0,
      };
      bucket.base += row.displayBase ?? 0;
      bucket.comparison += row.displayComparison ?? 0;
      groups.set(key, bucket);
    }

    const all: Row[] = [...groups.values()]
      .map((g) => {
        const variance = g.comparison - g.base;
        return {
          key: g.key,
          title: g.title,
          subtitle: g.subtitle,
          variance,
          // formatPercent takes percentage points, not a ratio.
          percent: g.base === 0 ? null : (variance / g.base) * 100,
          // "Bad" is the direction the user called bad, not the arithmetic
          // sign: under budget is the red case on a revenue line.
          bad: variance !== 0 && (variance > 0) === threshold.increaseIsBad,
        };
      })
      // Biggest movement first, so the line that needs explaining is on top.
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
      .filter((r) => r.variance !== 0);

    return { data: limit ? all.slice(0, limit) : all, total: all.length };
  }, [rows, groupBy, unassigned, threshold.increaseIsBad, limit]);

  // A department cut needs departments; an account cut always has accounts.
  if (groupBy === 'department' && !hasDepartments) return null;
  if (data.length === 0) return null;

  const good = dark ? '#3fb27a' : '#0f7d47';
  const bad = dark ? '#e2726b' : '#c0403a';
  const axisWidth = groupBy === 'department' ? 140 : 200;

  // Reserve room for the bar-end figures in the chart margin rather than by
  // padding the scale: a proportional pad still clips once one bar dwarfs the
  // rest, because the label's width is in pixels and the pad is in data units.
  const LABEL_ROOM = 168;
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.variance)), 1);
  const hasNegative = data.some((d) => d.variance < 0);
  const hasPositive = data.some((d) => d.variance > 0);
  const domain: [number, number] = [hasNegative ? -maxAbs : 0, hasPositive ? maxAbs : 0];

  /**
   * The figure sits just past the bar end, on whichever side the bar grew.
   * Recharts hands over the rendered geometry, so the label follows a short
   * bar outward instead of being clipped inside it.
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
    // Recharts reports a leftward bar as a negative width from the zero line,
    // so neither x nor x + width is reliably an edge on its own -- take both.
    //
    // Every figure then goes to the right of the bar's rightmost point, the
    // bar tip for an overspend and just past the zero line for an underspend.
    // Putting it on the outer side instead looked natural but had nowhere to
    // go: a leftward label runs into the account name beside it, and widening
    // the margin does not help because the axis labels sit in that same band.
    // Right of zero is always free on that row, and it lines the figures up
    // into a column that can be read down.
    const labelX = Math.max(x, x + w) + 8;
    const text =
      formatCurrency(row.variance, locale, displayCurrency) +
      (row.percent === null ? '' : `  ${formatPercent(row.percent, locale)}`);
    return (
      <text
        x={labelX}
        y={y + h / 2}
        textAnchor="start"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
        fill={row.bad ? bad : good}
      >
        {(row.bad ? '▲ ' : '▼ ') + text}
      </text>
    );
  };

  /** Account rows carry a code and a name; stack them rather than run them together. */
  const renderTick = (props: {
    x?: number | string;
    y?: number | string;
    payload?: { value?: string | number };
  }) => {
    const row = data.find((d) => d.key === String(props.payload?.value ?? ''));
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    if (!row) return <g />;
    return (
      <g>
        <text
          x={x - 10}
          y={row.subtitle ? y - 6 : y}
          textAnchor="end"
          dominantBaseline="central"
          fontSize={13}
          fill={palette.ink}
        >
          {clip(row.title, 22)}
        </text>
        {row.subtitle && (
          <text x={x - 10} y={y + 9} textAnchor="end" dominantBaseline="central" fontSize={11.5} fill={palette.mutedInk}>
            {clip(row.subtitle)}
          </text>
        )}
      </g>
    );
  };

  const titleKey = groupBy === 'department' ? 'chart.varianceByDept' : 'chart.varianceByAccount';
  const truncated = limit != null && total > limit;

  return (
    <section className="chart-section">
      <h2>{t(titleKey)}</h2>
      <p className="chart-section__lede">
        {t('chart.varianceLede', { base: labels.base, comparison: labels.comparison })}
        {truncated ? ` ${t('chart.varianceTopN', { n: data.length, total })}` : ''}
      </p>
      <ResponsiveContainer width="100%" height={Math.max(150, data.length * 46 + 40)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: LABEL_ROOM, left: 4, bottom: 4 }}
        >
          <XAxis
            type="number"
            hide
            domain={domain}
            tickFormatter={(v) => formatAxisCurrency(v, locale, displayCurrency)}
          />
          <YAxis
            type="category"
            dataKey="key"
            axisLine={false}
            tickLine={false}
            width={axisWidth}
            tick={renderTick}
          />
          <ReferenceLine x={0} stroke={palette.border} strokeWidth={1} />
          <Bar dataKey="variance" radius={5} barSize={20} isAnimationActive={false}>
            {data.map((row) => (
              <Cell key={row.key} fill={row.bad ? bad : good} />
            ))}
            <LabelList dataKey="variance" content={renderLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
