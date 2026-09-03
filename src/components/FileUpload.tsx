import { useState } from 'react';
import type { AnalysisMode, ParsedWorkbook, UploadMode } from '../types';
import { parseWorkbook, FileParseError } from '../lib/parseFile';
import { getBudgetVsActualSample, getYoySample } from '../lib/sampleData';
import { useT } from '../lib/i18n';

interface TwoFilesResult {
  mode: 'two-files';
  budget: ParsedWorkbook;
  actual: ParsedWorkbook;
}

interface SingleFileResult {
  mode: 'single-file';
  combined: ParsedWorkbook;
}

interface YoyActualsResult {
  mode: 'yoy-actuals';
  file: ParsedWorkbook;
}

export type UploadResult = TwoFilesResult | SingleFileResult | YoyActualsResult;

interface Props {
  analysisMode: AnalysisMode;
  mode: UploadMode;
  onModeChange: (mode: UploadMode) => void;
  onReady: (result: UploadResult) => void;
}

function FilePicker({
  label,
  hint,
  file,
  onFile,
  error,
}: {
  label: string;
  hint?: string;
  file: File | null;
  onFile: (file: File) => void;
  error: string | null;
}) {
  return (
    <div className={file && !error ? 'file-picker file-picker--filled' : 'file-picker'}>
      <label className="file-picker__label">{label}</label>
      {hint && <p className="file-picker__sublabel">{hint}</p>}
      <input
        type="file"
        accept=".csv,.xlsx,.xlsm"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      {file && !error && <p className="file-picker__hint">✓ {file.name}</p>}
      {error && <p className="file-picker__error">{error}</p>}
    </div>
  );
}

const BENEFITS = [1, 2, 3];

export function FileUpload({ analysisMode, mode, onModeChange, onReady }: Props) {
  const t = useT();
  const [budgetFile, setBudgetFile] = useState<File | null>(null);
  const [actualFile, setActualFile] = useState<File | null>(null);
  const [combinedFile, setCombinedFile] = useState<File | null>(null);
  const [yoyFile, setYoyFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ budget?: string; actual?: string; combined?: string; yoy?: string }>({});
  const [loading, setLoading] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);

  async function handleContinue() {
    setErrors({});
    setLoading(true);
    try {
      if (analysisMode === 'yoy') {
        if (!yoyFile) {
          setErrors({ yoy: t('upload.err.yoy') });
          return;
        }
        const file = await parseWorkbook(yoyFile);
        onReady({ mode: 'yoy-actuals', file });
      } else if (mode === 'two-files') {
        if (!budgetFile || !actualFile) {
          setErrors({
            budget: budgetFile ? undefined : t('upload.err.budget'),
            actual: actualFile ? undefined : t('upload.err.actual'),
          });
          return;
        }
        const [budget, actual] = await Promise.all([
          parseWorkbook(budgetFile).catch((e) => {
            throw { field: 'budget', error: e };
          }),
          parseWorkbook(actualFile).catch((e) => {
            throw { field: 'actual', error: e };
          }),
        ]);
        onReady({ mode: 'two-files', budget, actual });
      } else {
        if (!combinedFile) {
          setErrors({ combined: t('upload.err.combined') });
          return;
        }
        const combined = await parseWorkbook(combinedFile);
        onReady({ mode: 'single-file', combined });
      }
    } catch (err) {
      const asFieldError = err as { field?: string; error?: unknown };
      if (asFieldError?.field && asFieldError.error instanceof FileParseError) {
        setErrors({ [asFieldError.field]: asFieldError.error.message });
      } else if (err instanceof FileParseError) {
        setErrors({ combined: err.message, yoy: err.message });
      } else {
        setErrors({ combined: t('upload.err.read'), yoy: t('upload.err.read') });
      }
    } finally {
      setLoading(false);
    }
  }

  /** Loads the bundled sample through the identical parse path a real upload uses. */
  async function handleTrySample() {
    setErrors({});
    setLoadingSample(true);
    try {
      if (analysisMode === 'yoy') {
        const file = await parseWorkbook(getYoySample());
        onReady({ mode: 'yoy-actuals', file });
      } else {
        const sample = getBudgetVsActualSample();
        const [budget, actual] = await Promise.all([parseWorkbook(sample.budget), parseWorkbook(sample.actual)]);
        onReady({ mode: 'two-files', budget, actual });
      }
    } finally {
      setLoadingSample(false);
    }
  }

  const sampleCta = (
    <div className="sample-cta">
      <button className="btn btn--primary btn--lg" onClick={handleTrySample} disabled={loadingSample}>
        {loadingSample ? t('upload.loadingSample') : t('upload.trySample')}
      </button>
      <p className="sample-cta__note">
        {t('upload.noFile', { description: t(analysisMode === 'yoy' ? 'upload.sample.yoy' : 'upload.sample.bva') })}
      </p>
    </div>
  );

  return (
    <section className="upload-panel">
      <div className="hero">
        <h2 className="hero__title">
          {t(analysisMode === 'yoy' ? 'upload.hero.yoy' : 'upload.hero.bva')}
        </h2>
        <p className="hero__subtitle">
          {t(analysisMode === 'yoy' ? 'upload.sub.yoy' : 'upload.sub.bva')}
        </p>
        {sampleCta}
      </div>

      <div className="upload-divider">
        <span>{t('upload.orOwn')}</span>
      </div>

      {analysisMode === 'yoy' ? (
        <div className="upload-grid upload-grid--single">
          <FilePicker
            label={t('upload.actualsFile')}
            hint={t('upload.actualsHint')}
            file={yoyFile}
            onFile={setYoyFile}
            error={errors.yoy ?? null}
          />
        </div>
      ) : (
        <>
          <div className="mode-toggle" role="radiogroup" aria-label={t('upload.modeLabel')}>
            <label>
              <input
                type="radio"
                name="upload-mode"
                checked={mode === 'two-files'}
                onChange={() => onModeChange('two-files')}
              />
              {t('upload.twoFiles')}
            </label>
            <label>
              <input
                type="radio"
                name="upload-mode"
                checked={mode === 'single-file'}
                onChange={() => onModeChange('single-file')}
              />
              {t('upload.oneFile')}
            </label>
          </div>

          {mode === 'two-files' ? (
            <div className="upload-grid">
              <FilePicker
                label={t('upload.budgetFile')}
                hint={t('upload.csvOrExcel')}
                file={budgetFile}
                onFile={setBudgetFile}
                error={errors.budget ?? null}
              />
              <FilePicker
                label={t('upload.actualFile')}
                hint={t('upload.csvOrExcel')}
                file={actualFile}
                onFile={setActualFile}
                error={errors.actual ?? null}
              />
            </div>
          ) : (
            <div className="upload-grid upload-grid--single">
              <FilePicker
                label={t('upload.combinedFile')}
                hint={t('upload.combinedHint')}
                file={combinedFile}
                onFile={setCombinedFile}
                error={errors.combined ?? null}
              />
            </div>
          )}
        </>
      )}

      <button className="btn btn--secondary" onClick={handleContinue} disabled={loading}>
        {loading ? t('upload.reading') : t('upload.continue')}
      </button>

      <ul className="benefit-list">
        {BENEFITS.map((n) => (
          <li key={n} className="benefit-list__item">
            <span className="benefit-list__title">{t(`benefit.${n}.title`)}</span>
            <span className="benefit-list__body">{t(`benefit.${n}.body`)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
