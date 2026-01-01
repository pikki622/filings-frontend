import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  description?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'url';
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  description,
  disabled = false,
  type = 'text',
}: TextFieldProps) {
  const formatLabel = (name: string) => {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-medium text-text-primary">
        {formatLabel(label)}
        {required && <span className="text-error">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={cn(
          'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary',
          'placeholder:text-text-secondary/50',
          'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors'
        )}
      />
      {description && (
        <p className="text-xs text-text-secondary">{description}</p>
      )}
    </div>
  );
}

export default TextField;
