import { useEffect, useState } from 'react';
import type { DualAmountMapping, ParsedFile, SingleAmountMapping } from '../types';
import { suggestColumn } from '../lib/suggestMapping';

interface FieldSpec {
  key: string;
  label: string;
  required: boolean;
}

const COMMON_SPECS: FieldSpec[] = [
  { key: 'account_code', label: 'Account code', required: true },
  { key: 'account_name', label: 'Account name', required: false },
  { key: 'department', label: 'Department', required: false },
  { key: 'month', label: 'Month / period', required: true },
];

function FieldSelect({
  spec,
  headers,
  value,
  onChange,
}: {
  spec: FieldSpec;
  headers: string[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="field-select">
      <label>
        {spec.label}
        {spec.required && <span className="field-select__required"> *</span>}
      </label>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">— Not mapped —</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </div>
  );
}

function suggestAll(headers: string[]): Record<string, string | null> {
  return {
    account_code: suggestColumn('account_code', headers),
    account_name: suggestColumn('account_name', headers),
    department: suggestColumn('department', headers),
    month: suggestColumn('month', headers),
  };
}

interface SingleFileMapperProps {
  title: string;
  file: ParsedFile;
  amountLabel: string;
  onChange: (mapping: SingleAmountMapping, valid: boolean) => void;
}

export function SingleAmountFileMapper({ title, file, amountLabel, onChange }: SingleFileMapperProps) {
  const [mapping, setMapping] = useState<SingleAmountMapping>(() => ({
    ...(suggestAll(file.headers) as SingleAmountMapping),
    amount: suggestColumn('amount', file.headers),
  }));

  useEffect(() => {
    const valid = Boolean(mapping.account_code && mapping.month && mapping.amount);
    onChange(mapping, valid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapping]);

  return (
    <div className="mapping-block">
      <h3>{title}</h3>
      <p className="mapping-block__file">{file.fileName}</p>
      <div className="mapping-grid">
        {COMMON_SPECS.map((spec) => (
          <FieldSelect
            key={spec.key}
            spec={spec}
            headers={file.headers}
            value={mapping[spec.key as keyof SingleAmountMapping]}
            onChange={(value) => setMapping((prev) => ({ ...prev, [spec.key]: value }))}
          />
        ))}
        <FieldSelect
          spec={{ key: 'amount', label: amountLabel, required: true }}
          headers={file.headers}
          value={mapping.amount}
          onChange={(value) => setMapping((prev) => ({ ...prev, amount: value }))}
        />
      </div>
    </div>
  );
}

interface DualFileMapperProps {
  file: ParsedFile;
  onChange: (mapping: DualAmountMapping, valid: boolean) => void;
}

export function DualAmountFileMapper({ file, onChange }: DualFileMapperProps) {
  const [mapping, setMapping] = useState<DualAmountMapping>(() => ({
    ...(suggestAll(file.headers) as DualAmountMapping),
    budget_amount: suggestColumn('budget_amount', file.headers),
    actual_amount: suggestColumn('actual_amount', file.headers),
  }));

  useEffect(() => {
    const valid = Boolean(
      mapping.account_code && mapping.month && mapping.budget_amount && mapping.actual_amount,
    );
    onChange(mapping, valid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapping]);

  return (
    <div className="mapping-block">
      <h3>Column mapping</h3>
      <p className="mapping-block__file">{file.fileName}</p>
      <div className="mapping-grid">
        {COMMON_SPECS.map((spec) => (
          <FieldSelect
            key={spec.key}
            spec={spec}
            headers={file.headers}
            value={mapping[spec.key as keyof DualAmountMapping]}
            onChange={(value) => setMapping((prev) => ({ ...prev, [spec.key]: value }))}
          />
        ))}
        <FieldSelect
          spec={{ key: 'budget_amount', label: 'Budget amount', required: true }}
          headers={file.headers}
          value={mapping.budget_amount}
          onChange={(value) => setMapping((prev) => ({ ...prev, budget_amount: value }))}
        />
        <FieldSelect
          spec={{ key: 'actual_amount', label: 'Actual amount', required: true }}
          headers={file.headers}
          value={mapping.actual_amount}
          onChange={(value) => setMapping((prev) => ({ ...prev, actual_amount: value }))}
        />
      </div>
    </div>
  );
}
