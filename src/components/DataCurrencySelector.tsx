import { CURRENCIES, type CurrencyCode } from '../types';
import { useT } from '../lib/i18n';

interface Props {
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
}

export function DataCurrencySelector({ value, onChange }: Props) {
  const t = useT();
  return (
    <label className="data-currency-selector">
      {t('app.dataCurrency')}
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
