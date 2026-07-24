interface Props {
  onReset: () => void;
}

export function ResetButton({ onReset }: Props) {
  return (
    <button
      className="btn btn--ghost"
      onClick={() => {
        if (window.confirm('Start over? This clears the uploaded files, mapping, and results.')) {
          onReset();
        }
      }}
    >
      Reset / start over
    </button>
  );
}
