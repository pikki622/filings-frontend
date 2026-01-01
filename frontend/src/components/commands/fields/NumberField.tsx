import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

export interface NumberFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  required?: boolean;
  description?: string;
  disabled?: boolean;
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  integer = false,
  required = false,
  description,
  disabled = false,
}: NumberFieldProps) {
  const formatLabel = (name: string) => {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      onChange(undefined);
      return;
    }

    const parsed = integer ? parseInt(rawValue, 10) : parseFloat(rawValue);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-medium text-text-primary">
        {formatLabel(label)}
        {required && <span className="text-error">*</span>}
      </label>
      <input
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        min={min}
        max={max}
        step={step ?? (integer ? 1 : 'any')}
        disabled={disabled}
        required={required}
        className={cn(
          'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary',
          'placeholder:text-text-secondary/50',
          'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          'transition-colors'
        )}
      />
      {description && (
        <p className="text-xs text-text-secondary">{description}</p>
      )}
    </div>
  );
}

export default NumberField;
