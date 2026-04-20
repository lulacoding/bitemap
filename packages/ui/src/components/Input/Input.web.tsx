'use client';

export interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helper?: string;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function Input({
  label,
  value,
  onChange,
  error,
  helper,
  placeholder,
  multiline = false,
}: InputProps) {
  const ringClass = error ? 'border-danger' : 'border-gray-300';
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : undefined}
          className={`rounded-card border px-3 py-2 text-base ${ringClass}`}
          rows={4}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : undefined}
          className={`h-11 rounded-card border px-3 text-base ${ringClass}`}
        />
      )}
      {error ? <span className="text-danger">{error}</span> : helper ? <span className="text-gray-500">{helper}</span> : null}
    </label>
  );
}
