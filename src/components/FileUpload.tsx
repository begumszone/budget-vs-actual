import { useState } from 'react';
import type { ParsedFile, UploadMode } from '../types';
import { parseFile, FileParseError } from '../lib/parseFile';

interface TwoFilesResult {
  mode: 'two-files';
  budget: ParsedFile;
  actual: ParsedFile;
}

interface SingleFileResult {
  mode: 'single-file';
  combined: ParsedFile;
}

export type UploadResult = TwoFilesResult | SingleFileResult;

interface Props {
  mode: UploadMode;
  onModeChange: (mode: UploadMode) => void;
  onReady: (result: UploadResult) => void;
}

function FilePicker({
  label,
  file,
  onFile,
  error,
}: {
  label: string;
  file: File | null;
  onFile: (file: File) => void;
  error: string | null;
}) {
  return (
    <div className="file-picker">
      <label className="file-picker__label">{label}</label>
      <input
        type="file"
        accept=".csv,.xlsx,.xlsm"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      {file && !error && <p className="file-picker__hint">Selected: {file.name}</p>}
      {error && <p className="file-picker__error">{error}</p>}
    </div>
  );
}

export function FileUpload({ mode, onModeChange, onReady }: Props) {
  const [budgetFile, setBudgetFile] = useState<File | null>(null);
  const [actualFile, setActualFile] = useState<File | null>(null);
  const [combinedFile, setCombinedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ budget?: string; actual?: string; combined?: string }>({});
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setErrors({});
    setLoading(true);
    try {
      if (mode === 'two-files') {
        if (!budgetFile || !actualFile) {
          setErrors({
            budget: budgetFile ? undefined : 'Please choose a budget file.',
            actual: actualFile ? undefined : 'Please choose an actual file.',
          });
          return;
        }
        const [budget, actual] = await Promise.all([
          parseFile(budgetFile).catch((e) => {
            throw { field: 'budget', error: e };
          }),
          parseFile(actualFile).catch((e) => {
            throw { field: 'actual', error: e };
          }),
        ]);
        onReady({ mode: 'two-files', budget, actual });
      } else {
        if (!combinedFile) {
          setErrors({ combined: 'Please choose a file.' });
          return;
        }
        const combined = await parseFile(combinedFile);
        onReady({ mode: 'single-file', combined });
      }
    } catch (err) {
      const asFieldError = err as { field?: string; error?: unknown };
      if (asFieldError?.field && asFieldError.error instanceof FileParseError) {
        setErrors({ [asFieldError.field]: asFieldError.error.message });
      } else if (err instanceof FileParseError) {
        setErrors({ combined: err.message });
      } else {
        setErrors({ combined: 'Something went wrong while reading the file.' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="upload-panel">
      <h2>1. Upload your data</h2>
      <div className="mode-toggle" role="radiogroup" aria-label="Upload mode">
        <label>
          <input
            type="radio"
            name="upload-mode"
            checked={mode === 'two-files'}
            onChange={() => onModeChange('two-files')}
          />
          Two separate files (Budget + Actual)
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
          <FilePicker label="Budget file" file={budgetFile} onFile={setBudgetFile} error={errors.budget ?? null} />
          <FilePicker label="Actual file" file={actualFile} onFile={setActualFile} error={errors.actual ?? null} />
        </div>
      ) : (
        <div className="upload-grid">
          <FilePicker
            label="Combined file (with budget & actual columns)"
            file={combinedFile}
            onFile={setCombinedFile}
            error={errors.combined ?? null}
          />
        </div>
      )}

      <button className="btn btn--primary" onClick={handleContinue} disabled={loading}>
        {loading ? 'Reading files…' : 'Continue to column mapping'}
      </button>
    </section>
  );
}
