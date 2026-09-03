import type { AppStage } from '../types';
import { useT } from '../lib/i18n';

const STEPS: { stage: AppStage; key: string }[] = [
  { stage: 'upload', key: 'step.upload' },
  { stage: 'mapping', key: 'step.map' },
  { stage: 'results', key: 'step.review' },
];

interface Props {
  stage: AppStage;
}

export function StepIndicator({ stage }: Props) {
  const t = useT();
  const activeIndex = STEPS.findIndex((s) => s.stage === stage);

  return (
    <ol className="step-indicator" aria-label={t('progress.label')}>
      {STEPS.map((step, i) => {
        const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'upcoming';
        return (
          <li
            key={step.stage}
            className={`step-indicator__step step-indicator__step--${state}`}
            aria-current={state === 'active' ? 'step' : undefined}
          >
            <span className="step-indicator__marker">{state === 'done' ? '\u2713' : i + 1}</span>
            <span className="step-indicator__label">{t(step.key)}</span>
          </li>
        );
      })}
    </ol>
  );
}
