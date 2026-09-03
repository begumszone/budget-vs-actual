import { useLocale, useT } from '../lib/i18n';
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
  const t = useT();
  const localeTag = useLocale() === 'tr' ? 'tr-TR' : 'en-US';
  const sameCurrency = value.targetCurrency === dataCurrency;

  return (
    <div className="fx-panel">
      <label className="fx-panel__toggle">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
        />
        {t('fxPanel.toggle')}
      </label>

      {value.enabled && (
        <div className="fx-panel__body">
          <label className="field-select">
            {t('fxPanel.target')}
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
              {t('fxPanel.sameCurrency', { currency: dataCurrency })}
            </p>
          ) : (
            <>
              <p className="fx-panel__note">
                {t('fxPanel.convention', {
                  comparison: labels.comparison.toLocaleLowerCase(localeTag),
                  base: labels.base.toLocaleLowerCase(localeTag),
                  target: value.targetCurrency,
                  data: dataCurrency,
                })}
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
