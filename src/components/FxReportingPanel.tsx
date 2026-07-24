import { CURRENCIES, type CurrencyCode, type FxReportingSettings, type Locale } from '../types';
import { formatRate } from '../lib/formatters';
import type { ModeLabels } from '../lib/modeLabels';

interface Props {
  value: FxReportingSettings;
  onChange: (value: FxReportingSettings) => void;
  dataCurrency: CurrencyCode;
  locale: Locale;
  labels: ModeLabels;
}

export function FxReportingPanel({ value, onChange, dataCurrency, locale, labels }: Props) {
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
              {labels.baseRateLabel}
              <input
                type="number"
                min={0}
                step="any"
                placeholder={`${dataCurrency} → ${value.targetCurrency}`}
                value={value.baseRate ?? ''}
                onChange={(e) => onChange({ ...value, baseRate: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </label>
            <label className="field-select">
              {labels.comparisonRateLabel}
              <input
                type="number"
                min={0}
                step="any"
                placeholder={`${dataCurrency} → ${value.targetCurrency}`}
                value={value.comparisonRate ?? ''}
                onChange={(e) =>
                  onChange({ ...value, comparisonRate: e.target.value === '' ? null : Number(e.target.value) })
                }
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
                Applied rates: 1 {dataCurrency} = {formatRate(value.baseRate, locale)} {value.targetCurrency} (
                {labels.base}) · 1 {dataCurrency} = {formatRate(value.comparisonRate, locale)} {value.targetCurrency} (
                {labels.comparison})
              </p>
              <p className="fx-panel__note">
                Convention: the FX effect is measured on <strong>{labels.comparison.toLowerCase()} volume</strong> —
                it's the difference the rate movement alone would make if the {labels.comparison.toLowerCase()}{' '}
                amount had been converted at the {labels.base.toLowerCase()} rate instead.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
