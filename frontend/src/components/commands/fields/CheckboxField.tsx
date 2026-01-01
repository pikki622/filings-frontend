import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

export interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export function CheckboxField({
  label,
  checked,
  onChange,
  description,
  disabled = false,
}: CheckboxFieldProps) {
  const formatLabel = (name: string) => {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-1.5">
      <label className="flex cursor-pointer items-center gap-3">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className={cn(
              'h-4 w-4 rounded border border-border bg-background',
              'checked:border-accent checked:bg-accent',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-colors',
              'cursor-pointer'
            )}
          />
        </div>
        <span className="text-sm font-medium text-text-primary">
          {formatLabel(label)}
        </span>
      </label>
      {description && (
        <p className="ml-7 text-xs text-text-secondary">{description}</p>
      )}
    </div>
  );
}

export default CheckboxField;
