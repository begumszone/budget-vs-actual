import type { AppStage } from '../types';

const STEPS: { stage: AppStage; label: string }[] = [
  { stage: 'upload', label: 'Upload' },
  { stage: 'mapping', label: 'Map columns' },
  { stage: 'results', label: 'Review' },
];

interface Props {
  stage: AppStage;
}

export function StepIndicator({ stage }: Props) {
  const activeIndex = STEPS.findIndex((s) => s.stage === stage);

  return (
    <ol className="step-indicator" aria-label="Progress">
      {STEPS.map((step, i) => {
        const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'upcoming';
        return (
          <li
            key={step.stage}
            className={`step-indicator__step step-indicator__step--${state}`}
            aria-current={state === 'active' ? 'step' : undefined}
          >
            <span className="step-indicator__marker">{state === 'done' ? '✓' : i + 1}</span>
            <span className="step-indicator__label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
