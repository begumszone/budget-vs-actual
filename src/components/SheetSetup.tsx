import { useT } from '../lib/i18n';
import type { ParsedWorkbook, PeriodLayout, SheetSelection } from '../types';
import { detectMonthColumns } from '../lib/unpivot';
import { detectSelectionForSheet } from '../lib/resolveSheet';

interface Props {
  workbook: ParsedWorkbook;
  selection: SheetSelection;
  headers: string[];
  onChange: (selection: SheetSelection) => void;
  title: string;
}

/**
 * The controls that make a real company export usable: which sheet, which
 * row is the header, and whether the months run down a column or across
 * the top. Everything is pre-guessed; this is here for when the guess is
 * wrong.
 */
export function SheetSetup({ workbook, selection, headers, onChange, title }: Props) {
  const t = useT();
  const sheet = workbook.sheets[selection.sheetIndex];
  const headerRowOptions = sheet ? sheet.grid.slice(0, Math.min(sheet.grid.length, 15)) : [];
  const monthLike = detectMonthColumns(headers);

  function setLayout(layout: PeriodLayout) {
    onChange({
      ...selection,
      layout,
      monthColumns: layout === 'wide' ? (selection.monthColumns.length ? selection.monthColumns : monthLike) : [],
    });
  }

  function toggleMonthColumn(header: string) {
    const next = selection.monthColumns.includes(header)
      ? selection.monthColumns.filter((h) => h !== header)
      : [...selection.monthColumns, header];
    onChange({ ...selection, monthColumns: next });
  }

  return (
    <div className="sheet-setup">
      <h3>{title}</h3>
      <p className="mapping-block__file">{workbook.fileName}</p>

      <div className="sheet-setup__row">
        {workbook.sheets.length > 1 && (
          <label className="field-select">
            {t('sheet.sheet')}
            <select
              value={selection.sheetIndex}
              onChange={(e) => {
                const sheetIndex = Number(e.target.value);
                // Re-detect for the new sheet: its layout has nothing to do
                // with whatever the previous sheet looked like.
                onChange(
                  detectSelectionForSheet(
                    workbook,
                    sheetIndex,
                    workbook.sheets[sheetIndex].suggestedHeaderRow,
                  ),
                );
              }}
            >
              {workbook.sheets.map((s, i) => (
                <option key={s.name} value={i}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="field-select">
          {t('sheet.headerRow')}
          <select
            value={selection.headerRowIndex}
            onChange={(e) =>
              onChange(detectSelectionForSheet(workbook, selection.sheetIndex, Number(e.target.value)))
            }
          >
            {headerRowOptions.map((row, i) => {
              const preview = row
                .filter((c) => c !== null && String(c).trim() !== '')
                .slice(0, 4)
                .join(' · ');
              return (
                <option key={i} value={i}>
                  {t('sheet.rowPreview', { n: i + 1, preview: preview.slice(0, 60) || t('sheet.blank') })}
                </option>
              );
            })}
          </select>
        </label>
      </div>

      <fieldset className="sheet-setup__layout">
        <legend>{t('sheet.layoutLegend')}</legend>
        <label>
          <input
            type="radio"
            name={`layout-${title}`}
            checked={selection.layout === 'long'}
            onChange={() => setLayout('long')}
          />
          {t('sheet.longOption')} <span className="sheet-setup__hint">{t('sheet.longHint')}</span>
        </label>
        <label>
          <input
            type="radio"
            name={`layout-${title}`}
            checked={selection.layout === 'wide'}
            onChange={() => setLayout('wide')}
          />
          {t('sheet.wideOption')} <span className="sheet-setup__hint">{t('sheet.wideHint')}</span>
        </label>
      </fieldset>

      {selection.layout === 'wide' && (
        <div className="month-columns">
          <p className="sheet-setup__hint">
            {t(monthLike.length > 0 ? 'sheet.monthsFound' : 'sheet.monthsNotFound')}
          </p>
          <div className="month-columns__grid">
            {headers.map((h) => (
              <label key={h} className="month-columns__item">
                <input
                  type="checkbox"
                  checked={selection.monthColumns.includes(h)}
                  onChange={() => toggleMonthColumn(h)}
                />
                {h}
              </label>
            ))}
          </div>
          {selection.monthColumns.length === 0 && (
            <p className="file-picker__error">{t('sheet.needPeriod')}</p>
          )}
        </div>
      )}
    </div>
  );
}
