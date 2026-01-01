import { useMemo, useState } from 'react';

interface TypeFilterGridProps {
  types: readonly string[];
  selectedTypes: string[];
  onToggle: (type: string) => void;
  availableTypes?: string[];
  maxHeight?: string;
  columns?: number;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

/**
 * 3-column scrollable grid of toggle buttons for filtering by type
 * Used for SEC form types (when Filings selected) or event types (when Transcripts selected)
 */
export function TypeFilterGrid({
  types,
  selectedTypes,
  onToggle,
  availableTypes,
  maxHeight = '200px',
  columns = 3,
  showSearch = false,
  searchPlaceholder = 'Search types...',
}: TypeFilterGridProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter types by search query
  const filteredTypes = useMemo(() => {
    if (!searchQuery.trim()) return types;
    const query = searchQuery.toLowerCase();
    return types.filter((type) => type.toLowerCase().includes(query));
  }, [types, searchQuery]);

  // Determine which types are available (for cross-filtering) - O(1) lookup
  const availableTypesSet = useMemo(
    () => (availableTypes ? new Set(availableTypes) : null),
    [availableTypes]
  );
  const isTypeAvailable = (type: string) =>
    availableTypesSet === null || availableTypesSet.has(type);

  return (
    <div className="space-y-2">
      {showSearch && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-text-primary placeholder-text-secondary/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      )}

      <div
        className="overflow-y-auto overflow-x-hidden"
        style={{ maxHeight }}
      >
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {filteredTypes.map((type) => {
            const isSelected = selectedTypes.includes(type);
            const isAvailable = isTypeAvailable(type);

            return (
              <button
                type="button"
                key={type}
                onClick={() => isAvailable && onToggle(type)}
                disabled={!isAvailable}
                className={`
                  truncate rounded px-2 py-1 text-xs font-medium transition-colors
                  ${
                    isSelected
                      ? 'bg-accent text-white'
                      : isAvailable
                        ? 'bg-surface text-text-primary hover:bg-surface-hover'
                        : 'bg-surface/50 text-text-secondary/50 cursor-not-allowed'
                  }
                `}
                title={type}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {filteredTypes.length === 0 && (
        <p className="text-center text-xs text-text-secondary py-2">
          No matching types found
        </p>
      )}
    </div>
  );
}

export default TypeFilterGrid;
