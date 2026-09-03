import { useT } from '../lib/i18n';

interface Props {
  onReset: () => void;
}

export function ResetButton({ onReset }: Props) {
  const t = useT();
  return (
    <button
      className="btn btn--ghost"
      onClick={() => {
        if (window.confirm(t('reset.confirm'))) {
          onReset();
        }
      }}
    >
      {t('reset.label')}
    </button>
  );
}
