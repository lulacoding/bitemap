export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className="inline-flex rounded-pill bg-gray-100 p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="radio"
            type="button"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-pill px-4 py-1.5 text-sm font-medium ${
              active ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
