export interface ChartPalette {
  budget: string;
  actual: string;
  ink: string;
  mutedInk: string;
  grid: string;
  /** Chart surface and hairline, so tooltips match the panel they sit on. */
  surface: string;
  border: string;
}

/**
 * The two series hues are the validated categorical slots 1 and 2, kept as they
 * are. What changed around them is the surface: tooltips used to render in the
 * charting library's default white box, which reads as a hole punched in a dark
 * page. They now carry the same surface and hairline as the panel.
 */
export function getChartPalette(dark: boolean): ChartPalette {
  return dark
    ? {
        budget: '#3987e5',
        actual: '#d95926',
        ink: '#e9edf2',
        mutedInk: '#7b8593',
        grid: '#242c37',
        surface: '#1b212a',
        border: '#333d4b',
      }
    : {
        budget: '#2a78d6',
        actual: '#eb6834',
        ink: '#131820',
        mutedInk: '#7f8a99',
        grid: '#e9edf1',
        surface: '#ffffff',
        border: '#e5e9ee',
      };
}

/** Tooltip chrome shared by every chart, built from the active palette. */
export function tooltipStyles(p: ChartPalette) {
  return {
    contentStyle: {
      fontSize: 12.5,
      background: p.surface,
      border: `1px solid ${p.border}`,
      borderRadius: 8,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.16)',
      padding: '8px 10px',
    },
    labelStyle: { color: p.ink, fontWeight: 600, marginBottom: 2 },
    itemStyle: { color: p.mutedInk, padding: '1px 0' },
    cursor: { fill: p.mutedInk, fillOpacity: 0.07 },
  };
}
