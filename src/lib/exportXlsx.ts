import ExcelJS from 'exceljs';
import type { CurrencyCode, FxReportingSettings, Locale, ThresholdSettings, VarianceRow } from '../types';
import type { EnrichedVarianceRow } from './enrichRowsWithFx';
import { isFxActive } from './enrichRowsWithFx';

function statusLabel(status: VarianceRow['status']): string {
  if (status === 'budget-only') return 'Budget only (no actual)';
  if (status === 'actual-only') return 'Actual only (no budget)';
  return 'Matched';
}

export async function exportVarianceWorkbook(
  rows: EnrichedVarianceRow[],
  threshold: ThresholdSettings,
  locale: Locale,
  dataCurrency: CurrencyCode,
  fx: FxReportingSettings,
): Promise<Blob> {
  const fxActive = isFxActive(fx, dataCurrency);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Budget vs Actual';
  workbook.created = new Date();

  const dataSheet = workbook.addWorksheet('Variance Detail');
  dataSheet.columns = [
    { header: 'Account Code', key: 'account_code', width: 16 },
    { header: 'Account Name', key: 'account_name', width: 28 },
    { header: 'Department', key: 'department', width: 18 },
    { header: 'Month', key: 'month', width: 10 },
    { header: `Budget Amount (${dataCurrency})`, key: 'budget_amount', width: 18 },
    { header: `Actual Amount (${dataCurrency})`, key: 'actual_amount', width: 18 },
    { header: `Variance Amount (${dataCurrency})`, key: 'variance_amount', width: 18 },
    { header: 'Variance %', key: 'variance_percent', width: 12 },
    { header: 'Significant?', key: 'significant', width: 12 },
    { header: 'Status', key: 'status', width: 20 },
    ...(fxActive
      ? [
          { header: `Operational Variance (${fx.targetCurrency})`, key: 'operational_variance', width: 22 },
          { header: `FX Variance (${fx.targetCurrency})`, key: 'fx_variance', width: 18 },
        ]
      : []),
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
      ...(fxActive
        ? {
            operational_variance: row.fx ? row.fx.operationalVarianceTarget : 'N/A',
            fx_variance: row.fx ? row.fx.fxVarianceTarget : 'N/A',
          }
        : {}),
    });
    if (row.variance_percent !== null) {
      excelRow.getCell('variance_percent').numFmt = '0.0%';
    }
    excelRow.getCell('budget_amount').numFmt = '#,##0.00';
    excelRow.getCell('actual_amount').numFmt = '#,##0.00';
    excelRow.getCell('variance_amount').numFmt = '#,##0.00';
    if (fxActive && row.fx) {
      excelRow.getCell('operational_variance').numFmt = '#,##0.00';
      excelRow.getCell('fx_variance').numFmt = '#,##0.00';
    }
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
    { header: `Total Budget (${dataCurrency})`, key: 'budget', width: 18 },
    { header: `Total Actual (${dataCurrency})`, key: 'actual', width: 18 },
    { header: `Total Variance (${dataCurrency})`, key: 'variance', width: 18 },
    { header: 'Variance %', key: 'percent', width: 12 },
    { header: '# Significant Variances', key: 'sig_count', width: 20 },
    ...(fxActive
      ? [
          { header: `Total Operational Variance (${fx.targetCurrency})`, key: 'operational', width: 26 },
          { header: `Total FX Variance (${fx.targetCurrency})`, key: 'fx', width: 20 },
        ]
      : []),
  ];
  summarySheet.getRow(1).font = { bold: true };

  const byDept = new Map<string, { budget: number; actual: number; sig: number; operational: number; fx: number }>();
  for (const row of rows) {
    const dept = row.department ?? 'Unassigned';
    const bucket = byDept.get(dept) ?? { budget: 0, actual: 0, sig: 0, operational: 0, fx: 0 };
    bucket.budget += row.budget_amount ?? 0;
    bucket.actual += row.actual_amount ?? 0;
    if (row.isSignificant) bucket.sig += 1;
    if (row.fx) {
      bucket.operational += row.fx.operationalVarianceTarget;
      bucket.fx += row.fx.fxVarianceTarget;
    }
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
      ...(fxActive ? { operational: bucket.operational, fx: bucket.fx } : {}),
    });
    excelRow.getCell('budget').numFmt = '#,##0.00';
    excelRow.getCell('actual').numFmt = '#,##0.00';
    excelRow.getCell('variance').numFmt = '#,##0.00';
    if (percent !== null) excelRow.getCell('percent').numFmt = '0.0%';
    if (fxActive) {
      excelRow.getCell('operational').numFmt = '#,##0.00';
      excelRow.getCell('fx').numFmt = '#,##0.00';
    }
  }

  const notesSheet = workbook.addWorksheet('Notes');
  notesSheet.columns = [{ header: 'Export Details', key: 'note', width: 70 }];
  notesSheet.getRow(1).font = { bold: true };
  notesSheet.addRow({ note: `Generated: ${new Date().toISOString()}` });
  notesSheet.addRow({ note: `Number format locale: ${locale === 'tr' ? 'Turkish (TR)' : 'English (EN)'}` });
  notesSheet.addRow({ note: `Data currency: ${dataCurrency}` });
  notesSheet.addRow({
    note: `Significance threshold: +/-${threshold.percent}% (${threshold.overIsBad ? 'over' : 'under'} budget flagged as bad)`,
  });
  notesSheet.addRow({ note: `Total rows: ${rows.length}` });
  if (fxActive) {
    notesSheet.addRow({ note: '' });
    notesSheet.addRow({ note: 'Currency reporting' });
    notesSheet.addRow({ note: `Target currency: ${fx.targetCurrency}` });
    notesSheet.addRow({ note: `Budget rate: 1 ${dataCurrency} = ${fx.budgetRate} ${fx.targetCurrency}` });
    notesSheet.addRow({ note: `Actual rate: 1 ${dataCurrency} = ${fx.actualRate} ${fx.targetCurrency}` });
    notesSheet.addRow({
      note: 'Convention: FX variance is measured on actual volume (actual_local x (actual_rate - budget_rate)); operational variance is the budget/actual difference valued at the budget rate. Operational + FX = Total variance for every row.',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
