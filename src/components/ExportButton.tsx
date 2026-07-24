import { useState } from 'react';
import type { CurrencyCode, FxReportingSettings, Locale, ThresholdSettings } from '../types';
import type { EnrichedVarianceRow } from '../lib/enrichRowsWithFx';
import type { YtdTotalRow } from '../lib/computeYtdTotals';
import type { ModeLabels } from '../lib/modeLabels';
import { exportVarianceWorkbook } from '../lib/exportXlsx';

interface Props {
  rows: EnrichedVarianceRow[];
  ytdRows: YtdTotalRow[];
  threshold: ThresholdSettings;
  locale: Locale;
  dataCurrency: CurrencyCode;
  fx: FxReportingSettings;
  labels: ModeLabels;
  formatMonth: (month: string) => string;
}

export function ExportButton({ rows, ytdRows, threshold, locale, dataCurrency, fx, labels, formatMonth }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const blob = await exportVarianceWorkbook(rows, ytdRows, threshold, locale, dataCurrency, fx, labels, formatMonth);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `budget-vs-actual-${timestamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn btn--secondary" onClick={handleExport} disabled={busy || rows.length === 0}>
      {busy ? 'Preparing export…' : 'Export to Excel'}
    </button>
  );
}
