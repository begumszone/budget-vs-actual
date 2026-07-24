import { CURRENCIES, type CurrencyCode } from '../types';

interface Props {
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
}

export function DataCurrencySelector({ value, onChange }: Props) {
  return (
    <label className="data-currency-selector">
      Data currency
      <select value={value} onChange={(e) => onChange(e.target.value as CurrencyCode)}>
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
