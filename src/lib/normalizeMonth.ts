const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function fullYear(y: number): number {
  if (y >= 100) return y;
  return y >= 70 ? 1900 + y : 2000 + y;
}

/**
 * Normalizes a wide range of month/date representations (e.g. "2026-01",
 * "Jan-26", "January 2026", "01/2026", ISO date strings) into a canonical
 * sortable "YYYY-MM" string. Returns null if the value can't be interpreted.
 */
export function normalizeMonth(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    // Excel serial date number.
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(epoch.getTime() + value * 86400000);
    if (Number.isNaN(date.getTime())) return null;
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
  }

  const raw = value.trim();
  if (!raw) return null;

  // YYYY-MM or YYYY/MM
  let m = raw.match(/^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?$/);
  if (m) return `${m[1]}-${pad2(Number(m[2]))}`;

  // MM-YYYY or MM/YYYY
  m = raw.match(/^(\d{1,2})[-/](\d{4})$/);
  if (m) return `${m[2]}-${pad2(Number(m[1]))}`;

  // MonthName-YY or MonthName-YYYY or MonthName YYYY (e.g. "Jan-26", "January 2026")
  m = raw.match(/^([A-Za-z]+)[\s-]+(\d{2,4})$/);
  if (m) {
    const monthNum = MONTH_NAMES[m[1].toLowerCase()];
    if (monthNum) return `${fullYear(Number(m[2]))}-${pad2(monthNum)}`;
  }

  // YYYY MonthName (e.g. "2026 January")
  m = raw.match(/^(\d{4})[\s-]+([A-Za-z]+)$/);
  if (m) {
    const monthNum = MONTH_NAMES[m[2].toLowerCase()];
    if (monthNum) return `${m[1]}-${pad2(monthNum)}`;
  }

  // Fall back to native Date parsing (handles full ISO dates, "Jan 1 2026", etc.)
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}`;
  }

  return null;
}

export function monthLabel(canonical: string, locale: 'en' | 'tr'): string {
  const [year, month] = canonical.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  const formatter = new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  return formatter.format(date);
}
