import ExcelJS from 'exceljs';
import type { Locale, ThresholdSettings, VarianceRow } from '../types';

function statusLabel(status: VarianceRow['status']): string {
  if (status === 'budget-only') return 'Budget only (no actual)';
  if (status === 'actual-only') return 'Actual only (no budget)';
  return 'Matched';
}

export async function exportVarianceWorkbook(
  rows: VarianceRow[],
  threshold: ThresholdSettings,
  locale: Locale,
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Budget vs Actual';
  workbook.created = new Date();

  const dataSheet = workbook.addWorksheet('Variance Detail');
  dataSheet.columns = [
    { header: 'Account Code', key: 'account_code', width: 16 },
    { header: 'Account Name', key: 'account_name', width: 28 },
    { header: 'Department', key: 'department', width: 18 },
    { header: 'Month', key: 'month', width: 10 },
    { header: 'Budget Amount', key: 'budget_amount', width: 16 },
    { header: 'Actual Amount', key: 'actual_amount', width: 16 },
    { header: 'Variance Amount', key: 'variance_amount', width: 16 },
    { header: 'Variance %', key: 'variance_percent', width: 12 },
    { header: 'Significant?', key: 'significant', width: 12 },
    { header: 'Status', key: 'status', width: 20 },
  ];
  dataSheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    const excelRow = dataSheet.addRow({
      account_code: row.account_code,
      account_name: row.account_name,
      department: row.department ?? '',
      month: row.month,
      budget_amount: row.budget_amount,
      actual_amount: row.actual_amount,
      variance_amount: row.variance_amount,
      variance_percent: row.variance_percent === null ? 'N/A' : row.variance_percent / 100,
      significant: row.isSignificant ? 'Yes' : 'No',
      status: statusLabel(row.status),
    });
    if (row.variance_percent !== null) {
      excelRow.getCell('variance_percent').numFmt = '0.0%';
    }
    excelRow.getCell('budget_amount').numFmt = '#,##0.00';
    excelRow.getCell('actual_amount').numFmt = '#,##0.00';
    excelRow.getCell('variance_amount').numFmt = '#,##0.00';
    if (row.isSignificant) {
      const fill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: row.direction === 'over' ? 'FFFCE4E4' : 'FFE4F7E9' },
      };
      excelRow.eachCell((cell) => {
        cell.fill = fill;
      });
    }
  }

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Total Budget', key: 'budget', width: 16 },
    { header: 'Total Actual', key: 'actual', width: 16 },
    { header: 'Total Variance', key: 'variance', width: 16 },
    { header: 'Variance %', key: 'percent', width: 12 },
    { header: '# Significant Variances', key: 'sig_count', width: 20 },
  ];
  summarySheet.getRow(1).font = { bold: true };

  const byDept = new Map<string, { budget: number; actual: number; sig: number }>();
  for (const row of rows) {
    const dept = row.department ?? 'Unassigned';
    const bucket = byDept.get(dept) ?? { budget: 0, actual: 0, sig: 0 };
    bucket.budget += row.budget_amount ?? 0;
    bucket.actual += row.actual_amount ?? 0;
    if (row.isSignificant) bucket.sig += 1;
    byDept.set(dept, bucket);
  }
  for (const [dept, bucket] of [...byDept.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const variance = bucket.actual - bucket.budget;
    const percent = bucket.budget === 0 ? null : variance / Math.abs(bucket.budget);
    const excelRow = summarySheet.addRow({
      department: dept,
      budget: bucket.budget,
      actual: bucket.actual,
      variance,
      percent: percent === null ? 'N/A' : percent,
      sig_count: bucket.sig,
    });
    excelRow.getCell('budget').numFmt = '#,##0.00';
    excelRow.getCell('actual').numFmt = '#,##0.00';
    excelRow.getCell('variance').numFmt = '#,##0.00';
    if (percent !== null) excelRow.getCell('percent').numFmt = '0.0%';
  }

  const notesSheet = workbook.addWorksheet('Notes');
  notesSheet.columns = [{ header: 'Export Details', key: 'note', width: 60 }];
  notesSheet.getRow(1).font = { bold: true };
  notesSheet.addRow({ note: `Generated: ${new Date().toISOString()}` });
  notesSheet.addRow({ note: `Locale: ${locale === 'tr' ? 'Turkish (TR)' : 'English (EN)'}` });
  notesSheet.addRow({
    note: `Significance threshold: +/-${threshold.percent}% (${threshold.overIsBad ? 'over' : 'under'} budget flagged as bad)`,
  });
  notesSheet.addRow({ note: `Total rows: ${rows.length}` });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
