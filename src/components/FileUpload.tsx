import { useState } from 'react';
import type { AnalysisMode, ParsedWorkbook, UploadMode } from '../types';
import { parseWorkbook, FileParseError } from '../lib/parseFile';
import { describeSample, getBudgetVsActualSample, getYoySample } from '../lib/sampleData';

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

const BENEFITS = [
  { title: 'Nothing leaves your browser', body: 'Files are parsed locally. No upload, no account, no server.' },
  { title: 'Your column names, not ours', body: 'Headers are auto-detected and you can correct any guess.' },
  { title: 'Back to Excel in one click', body: 'Export the variance detail, YTD totals and a summary sheet.' },
];

export function FileUpload({ analysisMode, mode, onModeChange, onReady }: Props) {
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
          setErrors({ yoy: 'Please choose an actuals file.' });
          return;
        }
        const file = await parseWorkbook(yoyFile);
        onReady({ mode: 'yoy-actuals', file });
      } else if (mode === 'two-files') {
        if (!budgetFile || !actualFile) {
          setErrors({
            budget: budgetFile ? undefined : 'Please choose a budget file.',
            actual: actualFile ? undefined : 'Please choose an actual file.',
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
          setErrors({ combined: 'Please choose a file.' });
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
        setErrors({ combined: 'Something went wrong while reading the file.', yoy: 'Something went wrong while reading the file.' });
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
        {loadingSample ? 'Loading sample…' : '▸ Try it with sample data'}
      </button>
      <p className="sample-cta__note">
        No file handy? {describeSample(analysisMode)}.
      </p>
    </div>
  );

  return (
    <section className="upload-panel">
      <div className="hero">
        <h2 className="hero__title">
          {analysisMode === 'yoy'
            ? 'Compare this year against last year, line by line'
            : 'See exactly where you landed off budget'}
        </h2>
        <p className="hero__subtitle">
          {analysisMode === 'yoy'
            ? 'Upload one actuals export covering both years. Every account is matched month to month, so new and discontinued lines stand out instead of disappearing.'
            : 'Upload your budget and your actuals. Every account is matched by month and department, variances are calculated for you, and anything past your threshold is flagged.'}
        </p>
        {sampleCta}
      </div>

      <div className="upload-divider">
        <span>or use your own files</span>
      </div>

      {analysisMode === 'yoy' ? (
        <div className="upload-grid upload-grid--single">
          <FilePicker
            label="Actuals file"
            hint="One file covering both years — you'll pick which two to compare next."
            file={yoyFile}
            onFile={setYoyFile}
            error={errors.yoy ?? null}
          />
        </div>
      ) : (
        <>
          <div className="mode-toggle" role="radiogroup" aria-label="Upload mode">
            <label>
              <input
                type="radio"
                name="upload-mode"
                checked={mode === 'two-files'}
                onChange={() => onModeChange('two-files')}
              />
              Two separate files
            </label>
            <label>
              <input
                type="radio"
                name="upload-mode"
                checked={mode === 'single-file'}
                onChange={() => onModeChange('single-file')}
              />
              One combined file
            </label>
          </div>

          {mode === 'two-files' ? (
            <div className="upload-grid">
              <FilePicker
                label="Budget file"
                hint="CSV or Excel"
                file={budgetFile}
                onFile={setBudgetFile}
                error={errors.budget ?? null}
              />
              <FilePicker
                label="Actual file"
                hint="CSV or Excel"
                file={actualFile}
                onFile={setActualFile}
                error={errors.actual ?? null}
              />
            </div>
          ) : (
            <div className="upload-grid upload-grid--single">
              <FilePicker
                label="Combined file"
                hint="Must contain both a budget and an actual amount column"
                file={combinedFile}
                onFile={setCombinedFile}
                error={errors.combined ?? null}
              />
            </div>
          )}
        </>
      )}

      <button className="btn btn--secondary" onClick={handleContinue} disabled={loading}>
        {loading ? 'Reading files…' : 'Continue to column mapping'}
      </button>

      <ul className="benefit-list">
        {BENEFITS.map((b) => (
          <li key={b.title} className="benefit-list__item">
            <span className="benefit-list__title">{b.title}</span>
            <span className="benefit-list__body">{b.body}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
