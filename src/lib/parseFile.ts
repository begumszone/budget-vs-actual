import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import type { ParsedFile, RawRow } from '../types';

export class FileParseError extends Error {}

function rowsFromAoa(aoa: unknown[][]): { headers: string[]; rows: RawRow[] } {
  const [headerRow, ...dataRows] = aoa;
  if (!headerRow || headerRow.length === 0) {
    throw new FileParseError('The file has no header row.');
  }
  const headers = headerRow.map((h) => String(h ?? '').trim());
  const rows: RawRow[] = dataRows
    .filter((row) => row.some((cell) => cell !== null && cell !== undefined && cell !== ''))
    .map((row) => {
      const obj: RawRow = {};
      headers.forEach((header, i) => {
        const cell = row[i];
        obj[header] = cell === undefined || cell === '' ? null : (cell as string | number);
      });
      return obj;
    });
  return { headers, rows };
}

async function parseCsv(file: File): Promise<ParsedFile> {
  const text = await file.text();
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
  if (result.errors.length > 0 && (!result.data || result.data.length === 0)) {
    throw new FileParseError(`Could not read "${file.name}" as CSV: ${result.errors[0].message}`);
  }
  const { headers, rows } = rowsFromAoa(result.data as unknown[][]);
  return { fileName: file.name, headers, rows };
}

async function parseXlsx(file: File): Promise<ParsedFile> {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new FileParseError(`"${file.name}" does not contain any worksheets.`);
  }
  const aoa: unknown[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values = row.values as unknown[];
    // ExcelJS row.values is 1-indexed with a leading empty slot; drop it.
    aoa.push(values.slice(1).map((v) => normalizeCell(v)));
  });
  const { headers, rows } = rowsFromAoa(aoa);
  return { fileName: file.name, headers, rows };
}

function normalizeCell(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') {
    // Rich text, formula results, or dates
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    const asAny = value as { text?: string; result?: unknown; richText?: { text: string }[] };
    if (asAny.richText) return asAny.richText.map((r) => r.text).join('');
    if (typeof asAny.result === 'number' || typeof asAny.result === 'string') return asAny.result;
    if (typeof asAny.text === 'string') return asAny.text;
    return String(value);
  }
  return value as string | number;
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) {
    return parseCsv(file);
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xlsm')) {
    return parseXlsx(file);
  }
  throw new FileParseError(
    `Unsupported file type for "${file.name}". Please upload a .csv or .xlsx file.`,
  );
}
