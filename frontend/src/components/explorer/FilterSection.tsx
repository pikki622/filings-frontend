import { useState, ReactNode } from 'react';

interface FilterSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Reusable collapsible filter section with toggle header
 */
export function FilterSection({
  title,
  children,
  defaultExpanded = true,
  className = '',
}: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`border-b border-border ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title} section`}
        className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-surface/50 transition-colors"
      >
        <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          {title}
        </span>
        <ChevronIcon isExpanded={isExpanded} />
      </button>

      {isExpanded && (
        <div className="px-4 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-text-secondary transition-transform duration-200 ${
        isExpanded ? 'rotate-180' : ''
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

export default FilterSection;
