import { useState } from 'react';
import type { CurrencyCode, Locale, MonthlyRate } from '../types';
import type { MonthlyRateEntry } from '../lib/monthlyRates';
import type { ModeLabels } from '../lib/modeLabels';
import { parseLocaleNumber } from '../lib/parseNumber';
import { formatQuoteLabel } from '../lib/fxQuote';

interface Props {
  entries: MonthlyRateEntry[];
  rates: Record<string, MonthlyRate>;
  onChange: (rates: Record<string, MonthlyRate>) => void;
  labels: ModeLabels;
  locale: Locale;
  dataCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
}

function monthName(entry: MonthlyRateEntry, locale: Locale): string {
  const formatter = new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', timeZone: 'UTC' });
  return formatter.format(new Date(Date.UTC(entry.year, entry.month - 1, 1)));
}

function setRateField(
  rates: Record<string, MonthlyRate>,
  key: string,
  field: keyof MonthlyRate,
  value: number | null,
): Record<string, MonthlyRate> {
  const existing = rates[key] ?? { baseRate: null, comparisonRate: null };
  return { ...rates, [key]: { ...existing, [field]: value } };
}

function RateInput({
  value,
  onChange,
  onPasteColumn,
  placeholder,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  onPasteColumn: (text: string) => boolean;
  placeholder: string;
}) {
  return (
    <input
      type="number"
      min={0}
      step="any"
      placeholder={placeholder}
      className={value === null ? 'rate-input rate-input--missing' : 'rate-input'}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      onPaste={(e) => {
        const text = e.clipboardData.getData('text');
        if (onPasteColumn(text)) e.preventDefault();
      }}
    />
  );
}

function YearGroup({
  year,
  groupEntries,
  rates,
  onChange,
  labels,
  locale,
  quoteLabel,
}: {
  year: number;
  groupEntries: MonthlyRateEntry[];
  rates: Record<string, MonthlyRate>;
  onChange: (rates: Record<string, MonthlyRate>) => void;
  labels: ModeLabels;
  locale: Locale;
  quoteLabel: string;
}) {
  const [applyAllValue, setApplyAllValue] = useState('');
  const hasBase = groupEntries.some((e) => e.appliesTo !== 'comparison');
  const hasComparison = groupEntries.some((e) => e.appliesTo !== 'base');

  const baseColumnEntries = groupEntries.filter((e) => e.appliesTo !== 'comparison');
  const comparisonColumnEntries = groupEntries.filter((e) => e.appliesTo !== 'base');

  function pasteIntoColumn(
    columnEntries: MonthlyRateEntry[],
    field: keyof MonthlyRate,
    startKey: string,
    text: string,
  ): boolean {
    const tokens = text
      .split(/\r\n|\r|\n|\t/)
      .map((s) => s.trim())
      .filter((s) => s !== '');
    if (tokens.length <= 1) return false;
    const startIdx = columnEntries.findIndex((e) => e.key === startKey);
    if (startIdx === -1) return false;
    let next = rates;
    tokens.forEach((token, i) => {
      const target = columnEntries[startIdx + i];
      if (!target) return;
      next = setRateField(next, target.key, field, parseLocaleNumber(token));
    });
    onChange(next);
    return true;
  }

  function applyBaseRateToAll() {
    const parsed = parseLocaleNumber(applyAllValue);
    if (parsed === null) return;
    let next = rates;
    for (const entry of baseColumnEntries) {
      next = setRateField(next, entry.key, 'baseRate', parsed);
    }
    onChange(next);
  }

  return (
    <div className="rate-year-group">
      <div className="rate-year-group__header">
        <h4>{year}</h4>
        {hasBase && (
          <div className="rate-year-group__apply-all">
            <span>
              Apply one {labels.baseRateLabel.toLowerCase()} ({quoteLabel}) to all {baseColumnEntries.length} months:
            </span>
            <input
              type="number"
              min={0}
              step="any"
              value={applyAllValue}
              onChange={(e) => setApplyAllValue(e.target.value)}
              placeholder={quoteLabel}
            />
            <button type="button" className="btn btn--ghost btn--small" onClick={applyBaseRateToAll}>
              Apply
            </button>
          </div>
        )}
      </div>
      <table className="rate-table">
        <thead>
          <tr>
            <th>Month</th>
            {hasBase && <th>{labels.baseRateLabel} ({quoteLabel})</th>}
            {hasComparison && <th>{labels.comparisonRateLabel} ({quoteLabel})</th>}
          </tr>
        </thead>
        <tbody>
          {groupEntries.map((entry) => (
            <tr key={entry.key}>
              <td>{monthName(entry, locale)}</td>
              {hasBase && (
                <td>
                  {entry.appliesTo !== 'comparison' ? (
                    <RateInput
                      value={rates[entry.key]?.baseRate ?? null}
                      onChange={(v) => onChange(setRateField(rates, entry.key, 'baseRate', v))}
                      onPasteColumn={(text) => pasteIntoColumn(baseColumnEntries, 'baseRate', entry.key, text)}
                      placeholder={quoteLabel}
                    />
                  ) : (
                    <span className="rate-table__na">—</span>
                  )}
                </td>
              )}
              {hasComparison && (
                <td>
                  {entry.appliesTo !== 'base' ? (
                    <RateInput
                      value={rates[entry.key]?.comparisonRate ?? null}
                      onChange={(v) => onChange(setRateField(rates, entry.key, 'comparisonRate', v))}
                      onPasteColumn={(text) =>
                        pasteIntoColumn(comparisonColumnEntries, 'comparisonRate', entry.key, text)
                      }
                      placeholder={quoteLabel}
                    />
                  ) : (
                    <span className="rate-table__na">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RateTableEditor({ entries, rates, onChange, labels, locale, dataCurrency, targetCurrency }: Props) {
  const quoteLabel = formatQuoteLabel(dataCurrency, targetCurrency);

  if (entries.length === 0) {
    return <p className="fx-panel__note">Map your data first -- rate entry rows appear once months are detected.</p>;
  }

  const byYear = new Map<number, MonthlyRateEntry[]>();
  for (const entry of entries) {
    const list = byYear.get(entry.year) ?? [];
    list.push(entry);
    byYear.set(entry.year, list);
  }

  return (
    <div className="rate-table-editor">
      <p className="fx-panel__note">
        Every rate below is quoted as <strong>{quoteLabel}</strong> — enter the number exactly as you'd see it
        quoted (e.g. an actual USD/TRY rate around 30-40), regardless of which side is your data currency. The
        column headers repeat this so you can never enter it backwards.
      </p>
      <p className="fx-panel__note">
        Rates apply per calendar month. Leave a month blank to exclude it from the converted figures -- it will be
        flagged in the table and export, never assumed to be 1.0. You can paste a column of rates copied from Excel
        directly into the first cell of a column.
      </p>
      {[...byYear.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([year, groupEntries]) => (
          <YearGroup
            key={year}
            year={year}
            groupEntries={groupEntries}
            rates={rates}
            onChange={onChange}
            labels={labels}
            locale={locale}
            quoteLabel={quoteLabel}
          />
        ))}
    </div>
  );
}
