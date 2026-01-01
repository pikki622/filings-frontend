import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

function XIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export interface MultiSelectFieldProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  required?: boolean;
  description?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function MultiSelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  description,
  disabled = false,
  placeholder = 'Select options...',
}: MultiSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatLabel = (name: string) => {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== option));
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="flex items-center gap-1 text-sm font-medium text-text-primary">
        {formatLabel(label)}
        {required && <span className="text-error">*</span>}
      </label>

      <div className="relative">
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'flex min-h-[38px] w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-sm',
            'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors'
          )}
        >
          <div className="flex flex-1 flex-wrap gap-1">
            {value.length > 0 ? (
              value.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 rounded bg-border px-2 py-0.5 text-xs text-text-primary"
                >
                  {v}
                  <button
                    type="button"
                    onClick={(e) => removeOption(v, e)}
                    className="rounded-sm hover:bg-surface hover:text-error"
                  >
                    <XIcon />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-text-secondary/50">{placeholder}</span>
            )}
          </div>
          <ChevronDownIcon />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface shadow-lg">
            {options.map((option) => {
              const isSelected = value.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleOption(option)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
                    'hover:bg-border',
                    isSelected && 'bg-accent/10 text-accent'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border',
                      isSelected
                        ? 'border-accent bg-accent text-white'
                        : 'border-border'
                    )}
                  >
                    {isSelected && <CheckIcon />}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-text-secondary">{description}</p>
      )}
    </div>
  );
}

export default MultiSelectField;
