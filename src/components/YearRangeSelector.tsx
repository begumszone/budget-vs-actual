interface Props {
  years: number[];
  baseYear: number | null;
  comparisonYear: number | null;
  onChange: (baseYear: number | null, comparisonYear: number | null) => void;
}

export function YearRangeSelector({ years, baseYear, comparisonYear, onChange }: Props) {
  if (years.length < 2) {
    return (
      <div className="year-range-selector">
        <p className="fx-panel__note">
          {years.length === 0
            ? "We couldn't detect any years in the mapped month column yet -- check the mapping above."
            : `This file only contains one year of data (${years[0]}). Year-over-year comparison needs at least two.`}
        </p>
      </div>
    );
  }

  return (
    <div className="year-range-selector">
      <label className="field-select">
        Base year
        <select
          value={baseYear ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value), comparisonYear)}
        >
          <option value="">— Select —</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      <label className="field-select">
        Comparison year
        <select
          value={comparisonYear ?? ''}
          onChange={(e) => onChange(baseYear, e.target.value === '' ? null : Number(e.target.value))}
        >
          <option value="">— Select —</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      {baseYear !== null && comparisonYear !== null && baseYear === comparisonYear && (
        <p className="fx-panel__note">Base year and comparison year must be different.</p>
      )}
    </div>
  );
}
