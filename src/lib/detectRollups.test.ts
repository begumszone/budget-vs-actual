import { describe, expect, test } from 'vitest';
import { findRollupRows, isAncestorCode } from './detectRollups';

interface Row {
  account_code: string;
  department: string | null;
  month: string;
  budget: number | null;
  actual: number | null;
}

const row = (
  account_code: string,
  budget: number | null,
  actual: number | null = null,
  extra: Partial<Row> = {},
): Row => ({
  account_code,
  department: 'Merkez',
  month: '2026-01',
  budget,
  actual,
  ...extra,
});

const both = (r: Row) => [r.budget, r.actual];
const budgetOnly = (r: Row) => [r.budget];

describe('isAncestorCode', () => {
  test('recognises the common level separators', () => {
    expect(isAncestorCode('770', '770.01')).toBe(true);
    expect(isAncestorCode('770', '770-01')).toBe(true);
    expect(isAncestorCode('770', '770/01')).toBe(true);
    expect(isAncestorCode('770', '770_01')).toBe(true);
  });

  test('recognises a purely numeric extension', () => {
    expect(isAncestorCode('770', '77001')).toBe(true);
    expect(isAncestorCode('770.01', '770.01.001')).toBe(true);
  });

  test('a code is not its own ancestor', () => {
    expect(isAncestorCode('770', '770')).toBe(false);
  });

  test('a shared prefix alone is not a hierarchy', () => {
    // "5000" must not adopt "5000A" — different code scheme, not a child.
    expect(isAncestorCode('5000', '5000A')).toBe(false);
    expect(isAncestorCode('770.01', '770.02')).toBe(false);
    expect(isAncestorCode('', '770')).toBe(false);
    expect(isAncestorCode('770', '')).toBe(false);
  });
});

describe('findRollupRows', () => {
  test('flags a parent whose amount equals the sum of its children', () => {
    const parent = row('770', 100_000);
    const rows = [parent, row('770.01', 70_000), row('770.02', 20_000), row('770.03', 10_000)];
    const rollups = findRollupRows(rows, budgetOnly);
    expect([...rollups]).toEqual([parent]);
  });

  test('keeps a parent that carries postings of its own on top of its children', () => {
    // 100,000 parent against 90,000 of children: 10,000 was booked directly
    // to the parent, so removing it would lose real money.
    const rows = [row('770', 100_000), row('770.01', 70_000), row('770.02', 20_000)];
    expect(findRollupRows(rows, budgetOnly).size).toBe(0);
  });

  test('requires every amount to tie, not just one', () => {
    // Budget ties, actual does not — a half-match must not remove the row.
    const rows = [
      row('770', 100_000, 112_000),
      row('770.01', 70_000, 78_000),
      row('770.02', 20_000, 21_000),
      row('770.03', 10_000, 9_000),
    ];
    expect(findRollupRows(rows, both).size).toBe(0);
  });

  test('flags the parent when every amount ties', () => {
    const parent = row('770', 100_000, 112_000);
    const rows = [
      parent,
      row('770.01', 70_000, 78_000),
      row('770.02', 20_000, 21_000),
      row('770.03', 10_000, 13_000),
    ];
    expect([...findRollupRows(rows, both)]).toEqual([parent]);
  });

  test('tolerates rounding to the nearest unit', () => {
    const parent = row('770', 100_000.4);
    const rows = [parent, row('770.01', 70_000.1), row('770.02', 30_000.1)];
    expect([...findRollupRows(rows, budgetOnly)]).toEqual([parent]);
  });

  test('handles a three-level tree, attributing children to the nearest parent', () => {
    const top = row('770', 100_000);
    const mid = row('770.01', 70_000);
    const rows = [top, mid, row('770.01.001', 50_000), row('770.01.002', 20_000), row('770.02', 30_000)];
    const rollups = findRollupRows(rows, budgetOnly);
    // 770 == 770.01 + 770.02, and 770.01 == its own two children.
    expect(rollups.has(top)).toBe(true);
    expect(rollups.has(mid)).toBe(true);
    expect(rollups.size).toBe(2);
  });

  test('compares within a department and month, not across them', () => {
    // Parent for January only; the February children must not be swept in.
    const parent = row('770', 100_000);
    const rows = [
      parent,
      row('770.01', 70_000),
      row('770.02', 30_000),
      row('770.01', 60_000, null, { month: '2026-02' }),
      row('770.02', 40_000, null, { month: '2026-02' }),
    ];
    const rollups = findRollupRows(rows, budgetOnly);
    expect([...rollups]).toEqual([parent]);
  });

  test('does not mix departments', () => {
    const rows = [
      row('770', 100_000),
      row('770.01', 70_000, null, { department: 'Satış' }),
      row('770.02', 30_000, null, { department: 'Satış' }),
    ];
    expect(findRollupRows(rows, budgetOnly).size).toBe(0);
  });

  test('a flat chart of accounts produces no roll-ups', () => {
    const rows = [row('5000', 40_000), row('5100', 120_000), row('5200', 30_000)];
    expect(findRollupRows(rows, budgetOnly).size).toBe(0);
  });

  test('a leaf with no children is never flagged', () => {
    const rows = [row('770.01', 70_000), row('770.02', 20_000)];
    expect(findRollupRows(rows, budgetOnly).size).toBe(0);
  });

  test('ignores an amount the parent does not carry', () => {
    // Parent has no actual figure; the budget side alone decides.
    const parent = row('770', 100_000, null);
    const rows = [parent, row('770.01', 70_000, 78_000), row('770.02', 30_000, 21_000)];
    expect([...findRollupRows(rows, both)]).toEqual([parent]);
  });
});
