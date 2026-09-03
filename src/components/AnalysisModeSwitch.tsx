import type { AnalysisMode } from '../types';
import { useT } from '../lib/i18n';

interface Props {
  value: AnalysisMode;
  onChange: (mode: AnalysisMode) => void;
}

export function AnalysisModeSwitch({ value, onChange }: Props) {
  const t = useT();
  return (
    <div className="mode-switch" role="radiogroup" aria-label={t('analysisMode.label')}>
      <button
        type="button"
        className={value === 'budget-vs-actual' ? 'mode-switch__btn mode-switch__btn--active' : 'mode-switch__btn'}
        onClick={() => onChange('budget-vs-actual')}
      >
        {t('mode.bva')}
      </button>
      <button
        type="button"
        className={value === 'yoy' ? 'mode-switch__btn mode-switch__btn--active' : 'mode-switch__btn'}
        onClick={() => onChange('yoy')}
      >
        {t('mode.yoy')}
      </button>
    </div>
  );
}
