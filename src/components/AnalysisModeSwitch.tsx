import type { AnalysisMode } from '../types';

interface Props {
  value: AnalysisMode;
  onChange: (mode: AnalysisMode) => void;
}

export function AnalysisModeSwitch({ value, onChange }: Props) {
  return (
    <div className="mode-switch" role="radiogroup" aria-label="Analysis mode">
      <button
        type="button"
        className={value === 'budget-vs-actual' ? 'mode-switch__btn mode-switch__btn--active' : 'mode-switch__btn'}
        onClick={() => onChange('budget-vs-actual')}
      >
        Budget vs Actual
      </button>
      <button
        type="button"
        className={value === 'yoy' ? 'mode-switch__btn mode-switch__btn--active' : 'mode-switch__btn'}
        onClick={() => onChange('yoy')}
      >
        Year over Year
      </button>
    </div>
  );
}
