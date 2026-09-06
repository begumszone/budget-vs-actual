import { useEffect, useMemo, useState } from 'react';
import type {
  AnalysisMode,
  AppStage,
  CurrencyCode,
  DualAmountMapping,
  FxReportingSettings,
  Locale,
  MappedRow,
  ParsedWorkbook,
  SingleAmountMapping,
  ThresholdSettings,
  UploadMode,
  SheetSelection,
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
import { VarianceByGroupChart } from './components/VarianceByGroupChart';
import { ThemeToggle } from './components/ThemeToggle';
import { Faq } from './components/Faq';
import { HowItWorks } from './components/HowItWorks';
import { LocaleContext, translate } from './lib/i18n';
import { useTheme } from './hooks/useTheme';
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
import { defaultSelectionFor, resolveSheet } from './lib/resolveSheet';
import { partitionSubtotals } from './lib/detectSubtotals';
import { findRollupRows } from './lib/detectRollups';
import { SheetSetup } from './components/SheetSetup';
import { ExcludedRowsPanel, type ExcludedRowView } from './components/ExcludedRowsPanel';
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
  const { preference: theme, setTheme } = useTheme();
  const [dataCurrency, setDataCurrency] = useState<CurrencyCode>('TRY');
  const [fx, setFx] = useState<FxReportingSettings>(DEFAULT_FX);
  const [yearSelection, setYearSelection] = useState<YearSelection>(DEFAULT_YEARS);
  const [sheetSelections, setSheetSelections] = useState<Record<string, SheetSelection>>({});
  const [includeSubtotals, setIncludeSubtotals] = useState(false);

  const [budgetMapping, setBudgetMapping] = useState<{ mapping: SingleAmountMapping; valid: boolean } | null>(null);
  const [actualMapping, setActualMapping] = useState<{ mapping: SingleAmountMapping; valid: boolean } | null>(null);
  const [combinedMapping, setCombinedMapping] = useState<{ mapping: DualAmountMapping; valid: boolean } | null>(null);
  const [yoyMapping, setYoyMapping] = useState<{ mapping: SingleAmountMapping; valid: boolean } | null>(null);

  const labels = useMemo(
    () => getModeLabels(analysisMode, locale, yearSelection),
    [analysisMode, locale, yearSelection],
  );
  const formatMonth = useMemo(() => makeMonthFormatter(analysisMode, locale), [analysisMode, locale]);

  /** Sheet/header/layout choices per uploaded file, keyed by role. */
  function selectionFor(key: string, workbook: ParsedWorkbook): SheetSelection {
    return sheetSelections[key] ?? defaultSelectionFor(workbook);
  }
  function updateSelection(key: string, next: SheetSelection) {
    setSheetSelections((prev) => ({ ...prev, [key]: next }));
  }

  /** The long-format table for each uploaded file, after sheet choice and any unpivot. */
  const resolved = useMemo(() => {
    if (!uploadResult) return null;
    if (uploadResult.mode === 'two-files') {
      return {
        mode: 'two-files' as const,
        budget: resolveSheet(uploadResult.budget, selectionFor('budget', uploadResult.budget)),
        actual: resolveSheet(uploadResult.actual, selectionFor('actual', uploadResult.actual)),
      };
    }
    if (uploadResult.mode === 'single-file') {
      return {
        mode: 'single-file' as const,
        combined: resolveSheet(uploadResult.combined, selectionFor('combined', uploadResult.combined)),
      };
    }
    return {
      mode: 'yoy-actuals' as const,
      file: resolveSheet(uploadResult.file, selectionFor('yoy', uploadResult.file)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadResult, sheetSelections]);

  const availableYears = useMemo(() => {
    if (resolved?.mode !== 'yoy-actuals' || !yoyMapping?.mapping.month) return [];
    return extractAvailableYears(resolved.file.file, yoyMapping.mapping.month);
  }, [resolved, yoyMapping]);

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

  /**
   * Roll-up lines are separated before any matching so they cannot
   * double-count, but the split is recomputed from the same mapped rows
   * whenever the user flips the include switch -- no re-mapping needed.
   */
  const { varianceRows, excludedRows } = useMemo(() => {
    if (!mappedData) return { varianceRows: [], excludedRows: [] as ExcludedRowView[] };

    /**
     * Two passes, because a file can hide its roll-ups two different ways:
     * an uncoded "TOPLAM" line, and a coded parent account that simply
     * equals the sum of its children. Both double-count if left in.
     */
    const collect = <T extends { account_code: string; account_name: string; department: string | null; month: string }>(
      rows: T[],
      amountsOf: (row: T) => (number | null)[],
      toView: (row: T) => Omit<ExcludedRowView, 'reason'>,
    ) => {
      const { kept, excluded } = partitionSubtotals(rows);
      const rollups = findRollupRows(kept, amountsOf);
      const views = [
        ...excluded.map((e) => ({ ...toView(e.row), reason: e.reason })),
        ...[...rollups].map((r) => ({ ...toView(r), reason: 'parent-rollup' as const })),
      ];
      return {
        rows: includeSubtotals ? rows : kept.filter((r) => !rollups.has(r)),
        views,
      };
    };

    if (mappedData.mode === 'single-file') {
      const { rows, views } = collect(mappedData.rows, (r) => [r.budget_amount, r.actual_amount], (r) => ({
        account_code: r.account_code,
        account_name: r.account_name,
        department: r.department,
        month: r.month,
        amount: r.actual_amount ?? r.budget_amount,
      }));
      return { varianceRows: buildFromDualAmountRows(rows, threshold), excludedRows: views };
    }

    const toMappedView = (r: MappedRow) => ({
      account_code: r.account_code,
      account_name: r.account_name,
      department: r.department,
      month: r.month,
      amount: r.amount,
    });

    if (mappedData.mode === 'two-files') {
      const b = collect(mappedData.budgetRows, (r) => [r.amount], toMappedView);
      const a = collect(mappedData.actualRows, (r) => [r.amount], toMappedView);
      return {
        varianceRows: matchBaseAndComparison(b.rows, a.rows, threshold),
        excludedRows: [...b.views, ...a.views],
      };
    }

    const base = collect(mappedData.baseRows, (r) => [r.amount], toMappedView);
    const comparison = collect(mappedData.comparisonRows, (r) => [r.amount], toMappedView);
    return {
      varianceRows: matchBaseAndComparison(base.rows, comparison.rows, threshold),
      excludedRows: [...base.views, ...comparison.views],
    };
  }, [mappedData, threshold, includeSubtotals]);

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
        translate(locale, 'mode.switchConfirm'),
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
    if (!resolved) return;
    if (resolved.mode === 'two-files' && budgetMapping && actualMapping) {
      const { rows: budgetRows } = buildSingleAmountRows(resolved.budget.file, budgetMapping.mapping);
      const { rows: actualRows } = buildSingleAmountRows(resolved.actual.file, actualMapping.mapping);
      setMappedData({ mode: 'two-files', budgetRows, actualRows });
      setStage('results');
    } else if (resolved.mode === 'single-file' && combinedMapping) {
      const { rows } = buildDualAmountRows(resolved.combined.file, combinedMapping.mapping);
      setMappedData({ mode: 'single-file', rows });
      setStage('results');
    } else if (
      resolved.mode === 'yoy-actuals' &&
      yoyMapping &&
      yearSelection.baseYear !== null &&
      yearSelection.comparisonYear !== null
    ) {
      const { rows } = buildSingleAmountRows(resolved.file.file, yoyMapping.mapping);
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

  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);

  return (
    <LocaleContext.Provider value={locale}>
    <div className="app">
      <header className="app-header">
        <div>
          <h1>{t('app.title')}</h1>
          <p className="app-header__subtitle">{t('app.subtitle')}</p>
        </div>
        <div className="app-header__controls">
          <DataCurrencySelector value={dataCurrency} onChange={setDataCurrency} />
          <LocaleToggle value={locale} onChange={setLocale} />
          <ThemeToggle value={theme} onChange={setTheme} />
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
            <h2>{t('mapping.title')}</h2>
            <p className="mapping-panel__hint">
              {t('mapping.hint')}
            </p>
            {uploadResult.mode === 'two-files' && resolved?.mode === 'two-files' && (
              <div className="mapping-columns">
                <div className="mapping-block">
                  <SheetSetup
                    title={t('upload.budgetFile')}
                    workbook={uploadResult.budget}
                    selection={selectionFor('budget', uploadResult.budget)}
                    headers={resolved.budget.rawHeaders}
                    onChange={(next) => updateSelection('budget', next)}
                  />
                  <SingleAmountFileMapper
                    key={`budget-${resolved.budget.file.headers.join('|')}`}
                    title={t('mapping.columns')}
                    file={resolved.budget.file}
                    amountLabel="Budget amount"
                    onChange={(mapping, valid) => setBudgetMapping({ mapping, valid })}
                  />
                </div>
                <div className="mapping-block">
                  <SheetSetup
                    title={t('upload.actualFile')}
                    workbook={uploadResult.actual}
                    selection={selectionFor('actual', uploadResult.actual)}
                    headers={resolved.actual.rawHeaders}
                    onChange={(next) => updateSelection('actual', next)}
                  />
                  <SingleAmountFileMapper
                    key={`actual-${resolved.actual.file.headers.join('|')}`}
                    title={t('mapping.columns')}
                    file={resolved.actual.file}
                    amountLabel="Actual amount"
                    onChange={(mapping, valid) => setActualMapping({ mapping, valid })}
                  />
                </div>
              </div>
            )}
            {uploadResult.mode === 'single-file' && resolved?.mode === 'single-file' && (
              <div className="mapping-block">
                <SheetSetup
                  title={t('upload.combinedFile')}
                  workbook={uploadResult.combined}
                  selection={selectionFor('combined', uploadResult.combined)}
                  headers={resolved.combined.rawHeaders}
                  onChange={(next) => updateSelection('combined', next)}
                />
                <DualAmountFileMapper
                  key={`combined-${resolved.combined.file.headers.join('|')}`}
                  file={resolved.combined.file}
                  onChange={(mapping, valid) => setCombinedMapping({ mapping, valid })}
                />
              </div>
            )}
            {uploadResult.mode === 'yoy-actuals' && resolved?.mode === 'yoy-actuals' && (
              <>
                <div className="mapping-block">
                  <SheetSetup
                    title={t('upload.actualsFile')}
                    workbook={uploadResult.file}
                    selection={selectionFor('yoy', uploadResult.file)}
                    headers={resolved.file.rawHeaders}
                    onChange={(next) => updateSelection('yoy', next)}
                  />
                  <SingleAmountFileMapper
                    key={`yoy-${resolved.file.file.headers.join('|')}`}
                    title={t('mapping.columns')}
                    file={resolved.file.file}
                    amountLabel="Amount"
                    onChange={(mapping, valid) => setYoyMapping({ mapping, valid })}
                  />
                </div>
                <div className="mapping-block">
                  <h3>{t('mapping.whichYears')}</h3>
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
                {t('mapping.back')}
              </button>
              <button className="btn btn--primary" onClick={handleConfirmMapping} disabled={!mappingValid}>
                {t('mapping.confirm')}
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
            {/* Threshold, export and the currency switch are one control panel
                divided by a hairline, not three stacked bars each holding a
                single control. */}
            <div className="results-controls">
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
            </div>
            {fxActive && <FxSummary rows={enrichedRows} targetCurrency={fx.targetCurrency} locale={locale} />}
            <VarianceByGroupChart
              groupBy="department"
              rows={enrichedRows}
              locale={locale}
              displayCurrency={displayCurrency}
              labels={labels}
              threshold={threshold}
            />
            <VarianceByGroupChart
              groupBy="account"
              limit={10}
              rows={enrichedRows}
              locale={locale}
              displayCurrency={displayCurrency}
              labels={labels}
              threshold={threshold}
            />
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
            <ExcludedRowsPanel
              excluded={excludedRows}
              locale={locale}
              dataCurrency={dataCurrency}
              included={includeSubtotals}
              onToggleInclude={setIncludeSubtotals}
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

      <HowItWorks />
      <Faq />
    </div>
    </LocaleContext.Provider>
  );
}
