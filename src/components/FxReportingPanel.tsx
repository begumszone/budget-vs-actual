import { CURRENCIES, type CurrencyCode, type FxReportingSettings, type Locale } from '../types';
import { formatRate } from '../lib/formatters';

interface Props {
  value: FxReportingSettings;
  onChange: (value: FxReportingSettings) => void;
  dataCurrency: CurrencyCode;
  locale: Locale;
}

export function FxReportingPanel({ value, onChange, dataCurrency, locale }: Props) {
  const sameCurrency = value.targetCurrency === dataCurrency;

  return (
    <div className="fx-panel">
      <label className="fx-panel__toggle">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
        />
        Report in a different currency
      </label>

      {value.enabled && (
        <div className="fx-panel__body">
          <div className="fx-panel__fields">
            <label className="field-select">
              Target currency
              <select
                value={value.targetCurrency}
                onChange={(e) => onChange({ ...value, targetCurrency: e.target.value as CurrencyCode })}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-select">
              Budget rate (plan)
              <input
                type="number"
                min={0}
                step="any"
                placeholder={`${dataCurrency} → ${value.targetCurrency}`}
                value={value.budgetRate ?? ''}
                onChange={(e) => onChange({ ...value, budgetRate: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </label>
            <label className="field-select">
              Actual rate (realized)
              <input
                type="number"
                min={0}
                step="any"
                placeholder={`${dataCurrency} → ${value.targetCurrency}`}
                value={value.actualRate ?? ''}
                onChange={(e) => onChange({ ...value, actualRate: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </label>
          </div>

          {sameCurrency ? (
            <p className="fx-panel__note">
              Target currency matches the data currency ({dataCurrency}) — there's nothing to convert, so the
              variance split is hidden.
            </p>
          ) : (
            <>
              <p className="fx-panel__note">
                Applied rates: 1 {dataCurrency} = {formatRate(value.budgetRate, locale)} {value.targetCurrency} (budget) ·
                {' '}1 {dataCurrency} = {formatRate(value.actualRate, locale)} {value.targetCurrency} (actual)
              </p>
              <p className="fx-panel__note">
                Convention: the FX effect is measured on <strong>actual volume</strong> — it's the difference the
                rate movement alone would make if the actual amount had been converted at the budget rate instead.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
