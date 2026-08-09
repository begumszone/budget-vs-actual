import type { ParsedFile, ParsedWorkbook, SheetSelection } from '../types';
import { sheetToParsedFile } from './parseFile';
import { detectMonthColumns, looksWide, unpivot } from './unpivot';

/**
 * Works out the layout for one specific sheet + header row. Called again
 * whenever the user switches sheet or corrects the header row, so the
 * month detection always reflects the sheet actually on screen rather
 * than whatever the previous one looked like.
 */
export function detectSelectionForSheet(
  workbook: ParsedWorkbook,
  sheetIndex: number,
  headerRowIndex: number,
): SheetSelection {
  const probe = sheetToParsedFile(workbook, sheetIndex, headerRowIndex);
  const wide = looksWide(probe.headers);
  return {
    sheetIndex,
    headerRowIndex,
    layout: wide ? 'wide' : 'long',
    monthColumns: wide ? detectMonthColumns(probe.headers) : [],
  };
}

/**
 * Scores a sheet on how much it looks like the data the user meant to
 * upload. A management pack usually opens on a cover or notes sheet, so
 * landing on sheet 1 by default would show the wrong thing.
 */
function dataLikelihood(workbook: ParsedWorkbook, sheetIndex: number): number {
  const sheet = workbook.sheets[sheetIndex];
  if (!sheet) return -Infinity;
  const probe = sheetToParsedFile(workbook, sheetIndex, sheet.suggestedHeaderRow);
  if (probe.rows.length === 0) return -Infinity;

  const numericCells = probe.rows
    .slice(0, 40)
    .reduce((acc, row) => acc + Object.values(row).filter((v) => typeof v === 'number').length, 0);

  return (
    probe.headers.length * 1.5 +
    Math.min(probe.rows.length, 60) * 0.3 +
    numericCells * 0.15 +
    (looksWide(probe.headers) ? 6 : 0)
  );
}

/** The sheet/header/layout the app starts with for a freshly uploaded workbook. */
export function defaultSelectionFor(workbook: ParsedWorkbook): SheetSelection {
  let best = 0;
  let bestScore = -Infinity;
  workbook.sheets.forEach((_, i) => {
    const score = dataLikelihood(workbook, i);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return detectSelectionForSheet(workbook, best, workbook.sheets[best]?.suggestedHeaderRow ?? 0);
}

export interface ResolvedSheet {
  /** Headers exactly as they appear in the sheet, for the layout controls. */
  rawHeaders: string[];
  /** The long-format view every downstream step consumes. */
  file: ParsedFile;
  /** True when the sheet was reshaped from a column-per-month layout. */
  wasUnpivoted: boolean;
}

/**
 * Turns a raw workbook plus the user's sheet/header/layout choices into the
 * one long-format table the mapping step and everything after it expect.
 * A wide sheet is unpivoted here, which is why no calculation downstream
 * has to know the file was ever laid out with months across the top.
 */
export function resolveSheet(workbook: ParsedWorkbook, selection: SheetSelection): ResolvedSheet {
  const base = sheetToParsedFile(workbook, selection.sheetIndex, selection.headerRowIndex);

  if (selection.layout !== 'wide' || selection.monthColumns.length === 0) {
    return { rawHeaders: base.headers, file: base, wasUnpivoted: false };
  }

  // Ignore any remembered month column that no longer exists (header row changed).
  const valid = selection.monthColumns.filter((c) => base.headers.includes(c));
  if (valid.length === 0) {
    return { rawHeaders: base.headers, file: base, wasUnpivoted: false };
  }

  const { file } = unpivot(base, valid);
  return { rawHeaders: base.headers, file, wasUnpivoted: true };
}
