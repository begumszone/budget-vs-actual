import type { ThemePreference } from '../hooks/useTheme';
import { useT } from '../lib/i18n';

interface Props {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

const OPTIONS: { key: ThemePreference; glyph: string }[] = [
  { key: 'light', glyph: '☀' },
  { key: 'dark', glyph: '☾' },
  { key: 'system', glyph: '◐' },
];

export function ThemeToggle({ value, onChange }: Props) {
  const t = useT();
  return (
    <div className="theme-toggle" role="radiogroup" aria-label={t('theme.label')}>
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={value === o.key}
          title={t(`theme.${o.key}`)}
          aria-label={t(`theme.${o.key}`)}
          className={value === o.key ? 'theme-toggle__btn theme-toggle__btn--active' : 'theme-toggle__btn'}
          onClick={() => onChange(o.key)}
        >
          <span aria-hidden="true">{o.glyph}</span>
        </button>
      ))}
    </div>
  );
}
