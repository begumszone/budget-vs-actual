import type { Locale } from '../types';
import { useT } from '../lib/i18n';

interface Props {
  value: Locale;
  onChange: (value: Locale) => void;
}

export function LocaleToggle({ value, onChange }: Props) {
  const t = useT();
  return (
    <div className="locale-toggle" role="radiogroup" aria-label={t('locale.label')}>
      <button
        type="button"
        className={value === 'en' ? 'locale-toggle__btn locale-toggle__btn--active' : 'locale-toggle__btn'}
        onClick={() => onChange('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={value === 'tr' ? 'locale-toggle__btn locale-toggle__btn--active' : 'locale-toggle__btn'}
        onClick={() => onChange('tr')}
      >
        TR
      </button>
    </div>
  );
}
