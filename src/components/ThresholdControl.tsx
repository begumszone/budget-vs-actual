import type { ThresholdSettings } from '../types';

interface Props {
  value: ThresholdSettings;
  onChange: (value: ThresholdSettings) => void;
}

export function ThresholdControl({ value, onChange }: Props) {
  return (
    <div className="threshold-control">
      <label className="threshold-control__field">
        Significant variance threshold
        <div className="threshold-control__percent">
          ±
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={value.percent}
            onChange={(e) => onChange({ ...value, percent: Number(e.target.value) })}
          />
          %
        </div>
      </label>
      <label className="threshold-control__field">
        Bad direction
        <select
          value={value.overIsBad ? 'over' : 'under'}
          onChange={(e) => onChange({ ...value, overIsBad: e.target.value === 'over' })}
        >
          <option value="over">Over budget is bad (expenses)</option>
          <option value="under">Under budget is bad (revenue)</option>
        </select>
      </label>
    </div>
  );
}
