import { useT } from '../lib/i18n';
interface Props {
  years: number[];
  baseYear: number | null;
  comparisonYear: number | null;
  onChange: (baseYear: number | null, comparisonYear: number | null) => void;
}

export function YearRangeSelector({ years, baseYear, comparisonYear, onChange }: Props) {
  const t = useT();
  if (years.length < 2) {
    return (
      <div className="year-range-selector">
        <p className="fx-panel__note">
          {years.length === 0 ? t('years.none') : t('years.onlyOne', { year: years[0] })}
        </p>
      </div>
    );
  }

  return (
    <div className="year-range-selector">
      <label className="field-select">
        {t('years.base')}
        <select
          value={baseYear ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value), comparisonYear)}
        >
          <option value="">{t('years.select')}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      <label className="field-select">
        {t('years.comparison')}
        <select
          value={comparisonYear ?? ''}
          onChange={(e) => onChange(baseYear, e.target.value === '' ? null : Number(e.target.value))}
        >
          <option value="">{t('years.select')}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      {baseYear !== null && comparisonYear !== null && baseYear === comparisonYear && (
        <p className="fx-panel__note">{t('years.mustDiffer')}</p>
      )}
    </div>
  );
}
