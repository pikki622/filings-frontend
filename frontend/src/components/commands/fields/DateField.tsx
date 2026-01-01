import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

export interface DateFieldProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  min?: string;
  max?: string;
  required?: boolean;
  description?: string;
  disabled?: boolean;
}

export function DateField({
  label,
  value,
  onChange,
  min,
  max,
  required = false,
  description,
  disabled = false,
}: DateFieldProps) {
  const formatLabel = (name: string) => {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue || undefined);
  };

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-medium text-text-primary">
        {formatLabel(label)}
        {required && <span className="text-error">*</span>}
      </label>
      <input
        type="date"
        value={value ?? ''}
        onChange={handleChange}
        min={min}
        max={max}
        disabled={disabled}
        required={required}
        className={cn(
          'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary',
          'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[color-scheme:dark]',
          'transition-colors'
        )}
      />
      {description && (
        <p className="text-xs text-text-secondary">{description}</p>
      )}
    </div>
  );
}

export default DateField;
