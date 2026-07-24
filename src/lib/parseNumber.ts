/**
 * Parses a number that may come formatted with thousand separators and/or a
 * currency symbol, in either US (1,234.56) or EU/TR (1.234,56) style.
 * Returns null when the value can't be interpreted as a number.
 */
export function parseLocaleNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const trimmed = value.trim();
  if (trimmed === '') return null;

  const isParenNegative = /^\(.*\)$/.test(trimmed);
  let cleaned = trimmed.replace(/[^0-9.,-]/g, '');
  if (cleaned === '' || cleaned === '-') return null;

  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');

  if (lastDot !== -1 && lastComma !== -1) {
    // Whichever separator appears last is the decimal separator.
    const decimalIsComma = lastComma > lastDot;
    const decimalChar = decimalIsComma ? ',' : '.';
    const thousandChar = decimalIsComma ? '.' : ',';
    cleaned = cleaned.split(thousandChar).join('');
    if (decimalChar === ',') cleaned = cleaned.replace(',', '.');
  } else if (lastComma !== -1) {
    const fractionLength = cleaned.length - lastComma - 1;
    const commaCount = cleaned.split(',').length - 1;
    if (commaCount === 1 && fractionLength > 0 && fractionLength <= 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.split(',').join('');
    }
  } else if (lastDot !== -1) {
    const fractionLength = cleaned.length - lastDot - 1;
    const dotCount = cleaned.split('.').length - 1;
    if (dotCount > 1 || fractionLength === 3) {
      cleaned = cleaned.split('.').join('');
    }
    // else: single dot with 0-2 or 4+ fraction digits is treated as a decimal point already.
  }

  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return isParenNegative ? -Math.abs(n) : n;
}
