import { useEffect, useMemo, useState } from 'react';
import type {
  AnalysisMode,
  AppStage,
  CurrencyCode,
  DualAmountMapping,
  FxReportingSettings,
  Locale,
  MappedRow,
  SingleAmountMapping,
  ThresholdSettings,
  UploadMode,
  YearSelection,
} from './types';
import { FileUpload, type UploadResult } from './components/FileUpload';
import { SingleAmountFileMapper, DualAmountFileMapper } from './components/ColumnMapper';
import { AnalysisModeSwitch } from './components/AnalysisModeSwitch';
import { StepIndicator } from './components/StepIndicator';
import { HeadlineStats } from './components/HeadlineStats';
import { YearRangeSelector } from './components/YearRangeSelector';
import { ThresholdControl } from './components/ThresholdControl';
import { LocaleToggle } from './components/LocaleToggle';
import { DataCurrencySelector } from './components/DataCurrencySelector';
import { FxReportingPanel } from './components/FxReportingPanel';
import { FxSummary } from './components/FxSummary';
import { VarianceTable } from './components/VarianceTable';
import { YtdTotalsTable } from './components/YtdTotalsTable';
import { SummaryCharts } from './components/SummaryCharts';
import { TrendChart } from './components/TrendChart';
import { UnmatchedRows } from './components/UnmatchedRows';
import { ExportButton } from './components/ExportButton';
import { ResetButton } from './components/ResetButton';
import { buildDualAmountRows, buildSingleAmountRows, type DualAmountRow } from './lib/buildMappedRows';
import { matchBaseAndComparison, buildFromDualAmountRows } from './lib/matchRows';
import { enrichRowsWithFx, isFxActive } from './lib/enrichRowsWithFx';
import { computeYtdTotals } from './lib/computeYtdTotals';
import { extractAvailableYears, splitByYear } from './lib/yoyPeriods';
import { detectMonthlyRateEntries } from './lib/monthlyRates';
import { getModeLabels } from './lib/modeLabels';
import { makeMonthFormatter } from './lib/formatPeriod';

const DEFAULT_THRESHOLD: ThresholdSettings = { percent: 10, increaseIsBad: true };
const DEFAULT_FX: FxReportingSettings = {
  enabled: false,
  targetCurrency: 'USD',
  rates: {},
};
const DEFAULT_YEARS: YearSelection = { baseYear: null, comparisonYear: null };

type MappedData =
  | { mode: 'two-files'; budgetRows: MappedRow[]; actualRows: MappedRow[] }
  | { mode: 'single-file'; rows: DualAmountRow[] }
  | { mode: 'yoy'; baseRows: MappedRow[]; comparisonRows: MappedRow[] };

export default function App() {
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('budget-vs-actual');
  const [stage, setStage] = useState<AppStage>('upload');
  const [uploadMode, setUploadMode] = useState<UploadMode>('two-files');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [mappedData, setMappedData] = useState<MappedData | null>(null);
  const [threshold, setThreshold] = useState<ThresholdSettings>(DEFAULT_THRESHOLD);
  const [locale, setLocale] = useState<Locale>('en');
  const [dataCurrency, setDataCurrency] = useState<CurrencyCode>('TRY');
  const [fx, setFx] = useState<FxReportingSettings>(DEFAULT_FX);
  const [yearSelection, setYearSelection] = useState<YearSelection>(DEFAULT_YEARS);

  const [budgetMapping, setBudgetMapping] = useState<{ mapping: SingleAmountMapping; valid: boolean } | null>(null);
  const [actualMapping, setActualMapping] = useState<{ mapping: SingleAmountMapping; valid: boolean } | null>(null);
  const [combinedMapping, setCombinedMapping] = useState<{ mapping: DualAmountMapping; valid: boolean } | null>(null);
  const [yoyMapping, setYoyMapping] = useState<{ mapping: SingleAmountMapping; valid: boolean } | null>(null);

  const labels = useMemo(() => getModeLabels(analysisMode, yearSelection), [analysisMode, yearSelection]);
  const formatMonth = useMemo(() => makeMonthFormatter(analysisMode, locale), [analysisMode, locale]);

  const availableYears = useMemo(() => {
    if (uploadResult?.mode !== 'yoy-actuals' || !yoyMapping?.mapping.month) return [];
    return extractAvailableYears(uploadResult.file, yoyMapping.mapping.month);
  }, [uploadResult, yoyMapping]);

  useEffect(() => {
    if (
      analysisMode === 'yoy' &&
      availableYears.length >= 2 &&
      yearSelection.baseYear === null &&
      yearSelection.comparisonYear === null
    ) {
      setYearSelection({ comparisonYear: availableYears[0], baseYear: availableYears[1] });
    }
  }, [analysisMode, availableYears, yearSelection]);

  const varianceRows = useMemo(() => {
    if (!mappedData) return [];
    if (mappedData.mode === 'two-files') {
      return matchBaseAndComparison(mappedData.budgetRows, mappedData.actualRows, threshold);
    }
    if (mappedData.mode === 'single-file') {
      return buildFromDualAmountRows(mappedData.rows, threshold);
    }
    return matchBaseAndComparison(mappedData.baseRows, mappedData.comparisonRows, threshold);
  }, [mappedData, threshold]);

  const rateEntries = useMemo(
    () => detectMonthlyRateEntries(varianceRows, analysisMode, yearSelection),
    [varianceRows, analysisMode, yearSelection],
  );

  const enrichedRows = useMemo(
    () => enrichRowsWithFx(varianceRows, fx, dataCurrency, analysisMode, yearSelection, threshold),
    [varianceRows, fx, dataCurrency, analysisMode, yearSelection, threshold],
  );

  const ytdTotals = useMemo(() => computeYtdTotals(enrichedRows, threshold), [enrichedRows, threshold]);

  const fxActive = isFxActive(fx, dataCurrency);
  const displayCurrency = fxActive ? fx.targetCurrency : dataCurrency;

  function handleReset() {
    setStage('upload');
    setUploadMode('two-files');
    setUploadResult(null);
    setMappedData(null);
    setBudgetMapping(null);
    setActualMapping(null);
    setCombinedMapping(null);
    setYoyMapping(null);
    setYearSelection(DEFAULT_YEARS);
    setThreshold(DEFAULT_THRESHOLD);
    setDataCurrency('TRY');
    setFx(DEFAULT_FX);
  }

  function handleAnalysisModeChange(mode: AnalysisMode) {
    if (mode === analysisMode) return;
    if (stage !== 'upload') {
      const confirmed = window.confirm(
        'Switching analysis mode will clear your current upload and results. Continue?',
      );
      if (!confirmed) return;
    }
    handleReset();
    setAnalysisMode(mode);
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
    } else if (
      uploadResult.mode === 'yoy-actuals' &&
      yoyMapping &&
      yearSelection.baseYear !== null &&
      yearSelection.comparisonYear !== null
    ) {
      const { rows } = buildSingleAmountRows(uploadResult.file, yoyMapping.mapping);
      const baseRows = splitByYear(rows, yearSelection.baseYear);
      const comparisonRows = splitByYear(rows, yearSelection.comparisonYear);
      setMappedData({ mode: 'yoy', baseRows, comparisonRows });
      setStage('results');
    }
  }

  const mappingValid =
    uploadResult?.mode === 'two-files'
      ? Boolean(budgetMapping?.valid && actualMapping?.valid)
      : uploadResult?.mode === 'single-file'
        ? Boolean(combinedMapping?.valid)
        : uploadResult?.mode === 'yoy-actuals'
          ? Boolean(
              yoyMapping?.valid &&
                yearSelection.baseYear !== null &&
                yearSelection.comparisonYear !== null &&
                yearSelection.baseYear !== yearSelection.comparisonYear,
            )
          : false;

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Budget vs Actual</h1>
          <p className="app-header__subtitle">Compare two periods and instantly see variances, entirely in your browser.</p>
        </div>
        <div className="app-header__controls">
          <DataCurrencySelector value={dataCurrency} onChange={setDataCurrency} />
          <LocaleToggle value={locale} onChange={setLocale} />
          {stage === 'results' && <ResetButton onReset={handleReset} />}
        </div>
      </header>

      <div className="mode-switch-row">
        <AnalysisModeSwitch value={analysisMode} onChange={handleAnalysisModeChange} />
        <StepIndicator stage={stage} />
      </div>

      <main className="app-main">
        {stage === 'upload' && (
          <FileUpload analysisMode={analysisMode} mode={uploadMode} onModeChange={setUploadMode} onReady={handleUploadReady} />
        )}

        {stage === 'mapping' && uploadResult && (
          <section className="mapping-panel">
            <h2>2. Map your columns</h2>
            <p className="mapping-panel__hint">
              We've pre-filled our best guess for each field — adjust any that look wrong. Fields marked
              with * are required.
            </p>
            {uploadResult.mode === 'two-files' && (
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
            )}
            {uploadResult.mode === 'single-file' && (
              <DualAmountFileMapper
                file={uploadResult.combined}
                onChange={(mapping, valid) => setCombinedMapping({ mapping, valid })}
              />
            )}
            {uploadResult.mode === 'yoy-actuals' && (
              <>
                <SingleAmountFileMapper
                  title="Actuals file"
                  file={uploadResult.file}
                  amountLabel="Amount"
                  onChange={(mapping, valid) => setYoyMapping({ mapping, valid })}
                />
                <div className="mapping-block">
                  <h3>Which years are you comparing?</h3>
                  <YearRangeSelector
                    years={availableYears}
                    baseYear={yearSelection.baseYear}
                    comparisonYear={yearSelection.comparisonYear}
                    onChange={(baseYear, comparisonYear) => setYearSelection({ baseYear, comparisonYear })}
                  />
                </div>
              </>
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
            <HeadlineStats
              rows={enrichedRows}
              locale={locale}
              displayCurrency={displayCurrency}
              labels={labels}
              threshold={threshold}
            />
            <div className="results-toolbar">
              <ThresholdControl value={threshold} onChange={setThreshold} labels={labels} />
              <ExportButton
                rows={enrichedRows}
                ytdRows={ytdTotals}
                threshold={threshold}
                locale={locale}
                dataCurrency={dataCurrency}
                fx={fx}
                labels={labels}
                formatMonth={formatMonth}
                rateEntries={rateEntries}
              />
            </div>
            <section className="fx-panel-section">
              <FxReportingPanel
                value={fx}
                onChange={setFx}
                dataCurrency={dataCurrency}
                locale={locale}
                labels={labels}
                rateEntries={rateEntries}
              />
            </section>
            {fxActive && <FxSummary rows={enrichedRows} targetCurrency={fx.targetCurrency} locale={locale} />}
            <SummaryCharts rows={enrichedRows} locale={locale} displayCurrency={displayCurrency} labels={labels} />
            <TrendChart
              rows={enrichedRows}
              locale={locale}
              displayCurrency={displayCurrency}
              labels={labels}
              formatMonth={formatMonth}
            />
            <VarianceTable
              rows={enrichedRows}
              locale={locale}
              displayCurrency={displayCurrency}
              fxActive={fxActive}
              targetCurrency={fx.targetCurrency}
              labels={labels}
              formatMonth={formatMonth}
            />
            <YtdTotalsTable
              rows={ytdTotals}
              locale={locale}
              displayCurrency={displayCurrency}
              fxActive={fxActive}
              targetCurrency={fx.targetCurrency}
              labels={labels}
            />
            <UnmatchedRows
              rows={enrichedRows}
              locale={locale}
              displayCurrency={displayCurrency}
              labels={labels}
              formatMonth={formatMonth}
            />
          </section>
        )}
      </main>
    </div>
  );
}
