import type { Locale } from '../types';

interface Props {
  value: Locale;
  onChange: (value: Locale) => void;
}

export function LocaleToggle({ value, onChange }: Props) {
  return (
    <div className="locale-toggle" role="radiogroup" aria-label="Number format locale">
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
