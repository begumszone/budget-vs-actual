export interface ChartPalette {
  budget: string;
  actual: string;
  ink: string;
  mutedInk: string;
  grid: string;
}

export function getChartPalette(dark: boolean): ChartPalette {
  return dark
    ? { budget: '#3987e5', actual: '#d95926', ink: '#ffffff', mutedInk: '#898781', grid: '#2c2c2a' }
    : { budget: '#2a78d6', actual: '#eb6834', ink: '#0b0b0b', mutedInk: '#898781', grid: '#e1e0d9' };
}
