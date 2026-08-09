export type Cell = string | number | null;

function isBlank(cell: Cell): boolean {
  return cell === null || cell === undefined || String(cell).trim() === '';
}

function filled(row: Cell[]): number {
  return row.filter((c) => !isBlank(c)).length;
}

function numericCount(row: Cell[]): number {
  return row.filter((c) => typeof c === 'number' || (typeof c === 'string' && /^-?[\d.,\s]+$/.test(c.trim()) && /\d/.test(c))).length;
}

/**
 * Finds the row that is actually the column header.
 *
 * Real exports rarely start with the header: there is usually a report
 * title, a company name, a date range, and a blank row or two above it.
 * Taking row 0 blindly turns "ACME Ltd — 2026 Budget" into the column
 * names and every real column into data.
 *
 * The header is scored as the row that (a) has many non-blank cells,
 * (b) is mostly text rather than numbers, and (c) is followed by a row
 * that looks like data. Ties break toward the earliest row.
 */
export function detectHeaderRowIndex(grid: Cell[][]): number {
  const limit = Math.min(grid.length, 25); // headers never live 25 rows down
  let bestIndex = 0;
  let bestScore = -Infinity;

  const widest = Math.max(1, ...grid.slice(0, limit).map(filled));

  for (let i = 0; i < limit; i++) {
    const row = grid[i];
    const cells = filled(row);
    if (cells < 2) continue; // a title row is typically one lonely cell

    const numbers = numericCount(row);
    const textCells = cells - numbers;

    const next = grid[i + 1];
    if (!next || filled(next) === 0) continue; // a header must be followed by data

    // A header is wide, textual, and sits above a row with real values.
    let score = 0;
    score += (cells / widest) * 3;
    score += (textCells / cells) * 3;
    score += numbers === 0 ? 1.5 : 0;
    score += filled(next) >= cells - 1 ? 1 : 0;
    score += numericCount(next) > 0 ? 1 : 0; // data rows usually carry numbers
    score -= i * 0.12; // prefer the earliest plausible row

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}
