import type { SortColumn, SortDirection } from '../../types/file';

interface SortableHeaderProps {
  column: SortColumn;
  label: string;
  currentSortColumn: SortColumn;
  currentSortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  className?: string;
}

/**
 * Sortable column header with click-to-toggle functionality
 * Click cycle: ascending -> descending -> no sort -> ascending...
 */
export function SortableHeader({
  column,
  label,
  currentSortColumn,
  currentSortDirection,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = currentSortColumn === column;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      aria-label={`Sort by ${label}`}
      className={`
        flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wide
        text-text-secondary hover:text-text-primary transition-colors
        ${className}
      `}
    >
      <span>{label}</span>
      <SortIndicator
        isActive={isActive}
        direction={isActive ? currentSortDirection : null}
      />
    </button>
  );
}

function SortIndicator({
  isActive,
  direction,
}: {
  isActive: boolean;
  direction: SortDirection;
}) {
  if (!isActive || !direction) {
    // Show neutral indicator (both arrows, dimmed)
    return (
      <div className="flex flex-col opacity-30">
        <svg className="h-2 w-2" viewBox="0 0 8 4" fill="currentColor">
          <path d="M4 0L8 4H0L4 0Z" />
        </svg>
        <svg className="h-2 w-2 -mt-0.5" viewBox="0 0 8 4" fill="currentColor">
          <path d="M4 4L0 0H8L4 4Z" />
        </svg>
      </div>
    );
  }

  if (direction === 'asc') {
    // Show up arrow
    return (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  }

  // direction === 'desc' - show down arrow
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default SortableHeader;
