import ExcelJS from 'exceljs';
import type { CurrencyCode, FxReportingSettings, Locale, ThresholdSettings, VarianceRow } from '../types';
import type { EnrichedVarianceRow } from './enrichRowsWithFx';
import { isFxActive } from './enrichRowsWithFx';
import type { YtdTotalRow } from './computeYtdTotals';
import type { ModeLabels } from './modeLabels';

function statusLabel(status: VarianceRow['status'], labels: ModeLabels): string {
  if (status === 'base-only') return `${labels.baseOnlyLabel} (no ${labels.comparison.toLowerCase()})`;
  if (status === 'comparison-only') return `${labels.comparisonOnlyLabel} (no ${labels.base.toLowerCase()})`;
  return 'Matched';
}

export async function exportVarianceWorkbook(
  rows: EnrichedVarianceRow[],
  ytdRows: YtdTotalRow[],
  threshold: ThresholdSettings,
  locale: Locale,
  dataCurrency: CurrencyCode,
  fx: FxReportingSettings,
  labels: ModeLabels,
  formatMonth: (month: string) => string,
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
    { header: `${labels.base} Amount (${dataCurrency})`, key: 'base_amount', width: 18 },
    { header: `${labels.comparison} Amount (${dataCurrency})`, key: 'comparison_amount', width: 18 },
    { header: `Variance Amount (${dataCurrency})`, key: 'variance_amount', width: 18 },
    { header: 'Variance %', key: 'variance_percent', width: 12 },
    { header: 'Significant?', key: 'significant', width: 12 },
    { header: 'Status', key: 'status', width: 24 },
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
      month: formatMonth(row.month),
      base_amount: row.base_amount,
      comparison_amount: row.comparison_amount,
      variance_amount: row.variance_amount,
      variance_percent: row.variance_percent === null ? 'N/A' : row.variance_percent / 100,
      significant: row.isSignificant ? 'Yes' : 'No',
      status: statusLabel(row.status, labels),
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
    excelRow.getCell('base_amount').numFmt = '#,##0.00';
    excelRow.getCell('comparison_amount').numFmt = '#,##0.00';
    excelRow.getCell('variance_amount').numFmt = '#,##0.00';
    if (fxActive && row.fx) {
      excelRow.getCell('operational_variance').numFmt = '#,##0.00';
      excelRow.getCell('fx_variance').numFmt = '#,##0.00';
    }
    if (row.isSignificant) {
      const fill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: row.direction === 'increase' ? 'FFFCE4E4' : 'FFE4F7E9' },
      };
      excelRow.eachCell((cell) => {
        cell.fill = fill;
      });
    }
  }

  const ytdSheet = workbook.addWorksheet('YTD Totals');
  ytdSheet.columns = [
    { header: 'Account Code', key: 'account_code', width: 16 },
    { header: 'Account Name', key: 'account_name', width: 28 },
    { header: 'Department', key: 'department', width: 18 },
    { header: `${labels.base} Total (${dataCurrency})`, key: 'base_amount', width: 18 },
    { header: `${labels.comparison} Total (${dataCurrency})`, key: 'comparison_amount', width: 18 },
    { header: `Variance Total (${dataCurrency})`, key: 'variance_amount', width: 18 },
    { header: 'Variance %', key: 'variance_percent', width: 12 },
    { header: 'Significant?', key: 'significant', width: 12 },
    { header: 'Months Present', key: 'months', width: 14 },
    ...(fxActive
      ? [
          { header: `Operational Variance (${fx.targetCurrency})`, key: 'operational_variance', width: 22 },
          { header: `FX Variance (${fx.targetCurrency})`, key: 'fx_variance', width: 18 },
        ]
      : []),
  ];
  ytdSheet.getRow(1).font = { bold: true };
  for (const row of ytdRows) {
    const excelRow = ytdSheet.addRow({
      account_code: row.account_code,
      account_name: row.account_name,
      department: row.department ?? '',
      base_amount: row.base_amount,
      comparison_amount: row.comparison_amount,
      variance_amount: row.variance_amount,
      variance_percent: row.variance_percent === null ? 'N/A' : row.variance_percent / 100,
      significant: row.isSignificant ? 'Yes' : 'No',
      months: row.monthsPresent,
      ...(fxActive
        ? {
            operational_variance: row.fx ? row.fx.operationalVarianceTarget : 'N/A',
            fx_variance: row.fx ? row.fx.fxVarianceTarget : 'N/A',
          }
        : {}),
    });
    if (row.variance_percent !== null) excelRow.getCell('variance_percent').numFmt = '0.0%';
    excelRow.getCell('base_amount').numFmt = '#,##0.00';
    excelRow.getCell('comparison_amount').numFmt = '#,##0.00';
    excelRow.getCell('variance_amount').numFmt = '#,##0.00';
    if (fxActive && row.fx) {
      excelRow.getCell('operational_variance').numFmt = '#,##0.00';
      excelRow.getCell('fx_variance').numFmt = '#,##0.00';
    }
    if (row.isSignificant) {
      const fill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: row.direction === 'increase' ? 'FFFCE4E4' : 'FFE4F7E9' },
      };
      excelRow.eachCell((cell) => {
        cell.fill = fill;
      });
    }
  }

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Department', key: 'department', width: 20 },
    { header: `Total ${labels.base} (${dataCurrency})`, key: 'base', width: 18 },
    { header: `Total ${labels.comparison} (${dataCurrency})`, key: 'comparison', width: 18 },
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

  const byDept = new Map<string, { base: number; comparison: number; sig: number; operational: number; fx: number }>();
  for (const row of rows) {
    const dept = row.department ?? 'Unassigned';
    const bucket = byDept.get(dept) ?? { base: 0, comparison: 0, sig: 0, operational: 0, fx: 0 };
    bucket.base += row.base_amount ?? 0;
    bucket.comparison += row.comparison_amount ?? 0;
    if (row.isSignificant) bucket.sig += 1;
    if (row.fx) {
      bucket.operational += row.fx.operationalVarianceTarget;
      bucket.fx += row.fx.fxVarianceTarget;
    }
    byDept.set(dept, bucket);
  }
  for (const [dept, bucket] of [...byDept.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const variance = bucket.comparison - bucket.base;
    const percent = bucket.base === 0 ? null : variance / Math.abs(bucket.base);
    const excelRow = summarySheet.addRow({
      department: dept,
      base: bucket.base,
      comparison: bucket.comparison,
      variance,
      percent: percent === null ? 'N/A' : percent,
      sig_count: bucket.sig,
      ...(fxActive ? { operational: bucket.operational, fx: bucket.fx } : {}),
    });
    excelRow.getCell('base').numFmt = '#,##0.00';
    excelRow.getCell('comparison').numFmt = '#,##0.00';
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
  notesSheet.addRow({ note: `Analysis mode: ${labels.title}` });
  notesSheet.addRow({ note: `Number format locale: ${locale === 'tr' ? 'Turkish (TR)' : 'English (EN)'}` });
  notesSheet.addRow({ note: `Data currency: ${dataCurrency}` });
  notesSheet.addRow({
    note: `Significance threshold: +/-${threshold.percent}% (${threshold.increaseIsBad ? 'an increase' : 'a decrease'} vs ${labels.base} flagged as bad)`,
  });
  notesSheet.addRow({ note: `Total rows: ${rows.length}` });
  if (fxActive) {
    notesSheet.addRow({ note: '' });
    notesSheet.addRow({ note: 'Currency reporting' });
    notesSheet.addRow({ note: `Target currency: ${fx.targetCurrency}` });
    notesSheet.addRow({ note: `${labels.baseRateLabel}: 1 ${dataCurrency} = ${fx.baseRate} ${fx.targetCurrency}` });
    notesSheet.addRow({
      note: `${labels.comparisonRateLabel}: 1 ${dataCurrency} = ${fx.comparisonRate} ${fx.targetCurrency}`,
    });
    notesSheet.addRow({
      note: `Convention: FX variance is measured on ${labels.comparison.toLowerCase()} volume (comparison_local x (comparison_rate - base_rate)); operational variance is the ${labels.base.toLowerCase()}/${labels.comparison.toLowerCase()} difference valued at the ${labels.base.toLowerCase()} rate. Operational + FX = Total variance for every row.`,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
