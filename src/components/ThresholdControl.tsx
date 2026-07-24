import type { ThresholdSettings } from '../types';
import type { ModeLabels } from '../lib/modeLabels';

interface Props {
  value: ThresholdSettings;
  onChange: (value: ThresholdSettings) => void;
  labels: ModeLabels;
}

export function ThresholdControl({ value, onChange, labels }: Props) {
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
          value={value.increaseIsBad ? 'increase' : 'decrease'}
          onChange={(e) => onChange({ ...value, increaseIsBad: e.target.value === 'increase' })}
        >
          <option value="increase">{labels.increaseBadOption}</option>
          <option value="decrease">{labels.decreaseBadOption}</option>
        </select>
      </label>
    </div>
  );
}
