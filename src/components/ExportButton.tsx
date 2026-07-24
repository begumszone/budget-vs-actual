import { useState } from 'react';
import type { CurrencyCode, FxReportingSettings, Locale, ThresholdSettings } from '../types';
import type { EnrichedVarianceRow } from '../lib/enrichRowsWithFx';
import { exportVarianceWorkbook } from '../lib/exportXlsx';

interface Props {
  rows: EnrichedVarianceRow[];
  threshold: ThresholdSettings;
  locale: Locale;
  dataCurrency: CurrencyCode;
  fx: FxReportingSettings;
}

export function ExportButton({ rows, threshold, locale, dataCurrency, fx }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const blob = await exportVarianceWorkbook(rows, threshold, locale, dataCurrency, fx);
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
