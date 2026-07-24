import { useMemo, useState } from 'react';
import type {
  AppStage,
  CurrencyCode,
  DualAmountMapping,
  FxReportingSettings,
  Locale,
  MappedRow,
  SingleAmountMapping,
  ThresholdSettings,
  UploadMode,
} from './types';
import { FileUpload, type UploadResult } from './components/FileUpload';
import { SingleAmountFileMapper, DualAmountFileMapper } from './components/ColumnMapper';
import { ThresholdControl } from './components/ThresholdControl';
import { LocaleToggle } from './components/LocaleToggle';
import { DataCurrencySelector } from './components/DataCurrencySelector';
import { FxReportingPanel } from './components/FxReportingPanel';
import { FxSummary } from './components/FxSummary';
import { VarianceTable } from './components/VarianceTable';
import { SummaryCharts } from './components/SummaryCharts';
import { TrendChart } from './components/TrendChart';
import { UnmatchedRows } from './components/UnmatchedRows';
import { ExportButton } from './components/ExportButton';
import { ResetButton } from './components/ResetButton';
import { buildDualAmountRows, buildSingleAmountRows, type DualAmountRow } from './lib/buildMappedRows';
import { matchTwoFiles, buildFromDualAmountRows } from './lib/matchRows';
import { enrichRowsWithFx, isFxActive } from './lib/enrichRowsWithFx';

const DEFAULT_THRESHOLD: ThresholdSettings = { percent: 10, overIsBad: true };
const DEFAULT_FX: FxReportingSettings = {
  enabled: false,
  targetCurrency: 'USD',
  budgetRate: null,
  actualRate: null,
};

type MappedData =
  | { mode: 'two-files'; budgetRows: MappedRow[]; actualRows: MappedRow[] }
  | { mode: 'single-file'; rows: DualAmountRow[] };

export default function App() {
  const [stage, setStage] = useState<AppStage>('upload');
  const [uploadMode, setUploadMode] = useState<UploadMode>('two-files');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [mappedData, setMappedData] = useState<MappedData | null>(null);
  const [threshold, setThreshold] = useState<ThresholdSettings>(DEFAULT_THRESHOLD);
  const [locale, setLocale] = useState<Locale>('en');
  const [dataCurrency, setDataCurrency] = useState<CurrencyCode>('TRY');
  const [fx, setFx] = useState<FxReportingSettings>(DEFAULT_FX);

  const [budgetMapping, setBudgetMapping] = useState<{ mapping: SingleAmountMapping; valid: boolean } | null>(null);
  const [actualMapping, setActualMapping] = useState<{ mapping: SingleAmountMapping; valid: boolean } | null>(null);
  const [combinedMapping, setCombinedMapping] = useState<{ mapping: DualAmountMapping; valid: boolean } | null>(null);

  const varianceRows = useMemo(() => {
    if (!mappedData) return [];
    if (mappedData.mode === 'two-files') {
      return matchTwoFiles(mappedData.budgetRows, mappedData.actualRows, threshold);
    }
    return buildFromDualAmountRows(mappedData.rows, threshold);
  }, [mappedData, threshold]);

  const enrichedRows = useMemo(
    () => enrichRowsWithFx(varianceRows, fx, dataCurrency),
    [varianceRows, fx, dataCurrency],
  );

  const fxActive = isFxActive(fx, dataCurrency);

  function handleReset() {
    setStage('upload');
    setUploadMode('two-files');
    setUploadResult(null);
    setMappedData(null);
    setBudgetMapping(null);
    setActualMapping(null);
    setCombinedMapping(null);
    setThreshold(DEFAULT_THRESHOLD);
    setDataCurrency('TRY');
    setFx(DEFAULT_FX);
  }

  function handleUploadReady(result: UploadResult) {
    setUploadResult(result);
    setStage('mapping');
  }

  function handleConfirmMapping() {
    if (!uploadResult) return;
    if (uploadResult.mode === 'two-files' && budgetMapping && actualMapping) {
      const { rows: budgetRows } = buildSingleAmountRows(uploadResult.budget, budgetMapping.mapping);
      const { rows: actualRows } = buildSingleAmountRows(uploadResult.actual, actualMapping.mapping);
      setMappedData({ mode: 'two-files', budgetRows, actualRows });
      setStage('results');
    } else if (uploadResult.mode === 'single-file' && combinedMapping) {
      const { rows } = buildDualAmountRows(uploadResult.combined, combinedMapping.mapping);
      setMappedData({ mode: 'single-file', rows });
      setStage('results');
    }
  }

  const mappingValid =
    uploadResult?.mode === 'two-files'
      ? Boolean(budgetMapping?.valid && actualMapping?.valid)
      : Boolean(combinedMapping?.valid);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Budget vs Actual</h1>
          <p className="app-header__subtitle">Compare budgeted and actual amounts, entirely in your browser.</p>
        </div>
        <div className="app-header__controls">
          <DataCurrencySelector value={dataCurrency} onChange={setDataCurrency} />
          <LocaleToggle value={locale} onChange={setLocale} />
          {stage === 'results' && <ResetButton onReset={handleReset} />}
        </div>
      </header>

      <main className="app-main">
        {stage === 'upload' && (
          <FileUpload mode={uploadMode} onModeChange={setUploadMode} onReady={handleUploadReady} />
        )}

        {stage === 'mapping' && uploadResult && (
          <section className="mapping-panel">
            <h2>2. Map your columns</h2>
            <p className="mapping-panel__hint">
              We've pre-filled our best guess for each field — adjust any that look wrong. Fields marked
              with * are required.
            </p>
            {uploadResult.mode === 'two-files' ? (
              <div className="mapping-columns">
                <SingleAmountFileMapper
                  title="Budget file"
                  file={uploadResult.budget}
                  amountLabel="Budget amount"
                  onChange={(mapping, valid) => setBudgetMapping({ mapping, valid })}
                />
                <SingleAmountFileMapper
                  title="Actual file"
                  file={uploadResult.actual}
                  amountLabel="Actual amount"
                  onChange={(mapping, valid) => setActualMapping({ mapping, valid })}
                />
              </div>
            ) : (
              <DualAmountFileMapper
                file={uploadResult.combined}
                onChange={(mapping, valid) => setCombinedMapping({ mapping, valid })}
              />
            )}
            <div className="mapping-panel__actions">
              <button className="btn btn--ghost" onClick={handleReset}>
                Back / start over
              </button>
              <button className="btn btn--primary" onClick={handleConfirmMapping} disabled={!mappingValid}>
                Confirm mapping &amp; calculate variance
              </button>
            </div>
          </section>
        )}

        {stage === 'results' && (
          <section className="results-panel">
            <div className="results-toolbar">
              <ThresholdControl value={threshold} onChange={setThreshold} />
              <ExportButton rows={enrichedRows} threshold={threshold} locale={locale} dataCurrency={dataCurrency} fx={fx} />
            </div>
            <section className="fx-panel-section">
              <FxReportingPanel value={fx} onChange={setFx} dataCurrency={dataCurrency} locale={locale} />
            </section>
            {fxActive && <FxSummary rows={enrichedRows} targetCurrency={fx.targetCurrency} locale={locale} />}
            <SummaryCharts rows={varianceRows} locale={locale} dataCurrency={dataCurrency} />
            <TrendChart rows={varianceRows} locale={locale} dataCurrency={dataCurrency} />
            <VarianceTable
              rows={enrichedRows}
              locale={locale}
              dataCurrency={dataCurrency}
              fxActive={fxActive}
              targetCurrency={fx.targetCurrency}
            />
            <UnmatchedRows rows={varianceRows} locale={locale} dataCurrency={dataCurrency} />
          </section>
        )}
      </main>
    </div>
  );
}
