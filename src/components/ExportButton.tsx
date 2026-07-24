import { useState } from 'react';
import type { Locale, ThresholdSettings, VarianceRow } from '../types';
import { exportVarianceWorkbook } from '../lib/exportXlsx';

interface Props {
  rows: VarianceRow[];
  threshold: ThresholdSettings;
  locale: Locale;
}

export function ExportButton({ rows, threshold, locale }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const blob = await exportVarianceWorkbook(rows, threshold, locale);
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
