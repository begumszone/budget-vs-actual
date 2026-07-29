import { CURRENCIES, type CurrencyCode, type FxReportingSettings, type Locale } from '../types';
import type { ModeLabels } from '../lib/modeLabels';
import type { MonthlyRateEntry } from '../lib/monthlyRates';
import { RateTableEditor } from './RateTableEditor';

interface Props {
  value: FxReportingSettings;
  onChange: (value: FxReportingSettings) => void;
  dataCurrency: CurrencyCode;
  locale: Locale;
  labels: ModeLabels;
  rateEntries: MonthlyRateEntry[];
}

export function FxReportingPanel({ value, onChange, dataCurrency, locale, labels, rateEntries }: Props) {
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

          {sameCurrency ? (
            <p className="fx-panel__note">
              Target currency matches the data currency ({dataCurrency}) — there's nothing to convert, so the
              variance split is hidden.
            </p>
          ) : (
            <>
              <p className="fx-panel__note">
                Convention: the FX effect is measured on <strong>{labels.comparison.toLowerCase()} volume</strong> —
                it's the difference the rate movement alone would make if the {labels.comparison.toLowerCase()}{' '}
                amount had been converted at the {labels.base.toLowerCase()} rate instead. Once enabled, every
                figure on screen and in the export switches to {value.targetCurrency} — nothing stays in{' '}
                {dataCurrency}.
              </p>
              <RateTableEditor
                entries={rateEntries}
                rates={value.rates}
                onChange={(rates) => onChange({ ...value, rates })}
                labels={labels}
                locale={locale}
                dataCurrency={dataCurrency}
                targetCurrency={value.targetCurrency}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
