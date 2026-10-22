// − number + control, limited to 1…max (when stock fell below the value, − goes straight to max).
export function QuantityStepper({
  value,
  max,
  onChange,
  disabled = false,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center rounded-xl border border-field bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.min(value - 1, max))}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
        className="h-11 w-11 text-xl disabled:opacity-40"
      >
        −
      </button>
      <span className="min-w-7 text-center font-extrabold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className="h-11 w-11 text-xl disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
