import { useMemo, useState } from 'react';

interface TickerFilterGridProps {
  tickers: string[];
  selectedTickers: string[];
  onToggle: (ticker: string) => void;
  availableTickers?: string[];
  maxHeight?: string;
  columns?: number;
}

/**
 * 3-column scrollable grid of ticker buttons with search filter
 * Allows filtering visible buttons via text input
 */
export function TickerFilterGrid({
  tickers,
  selectedTickers,
  onToggle,
  availableTickers,
  maxHeight = '200px',
  columns = 3,
}: TickerFilterGridProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tickers by search query
  const filteredTickers = useMemo(() => {
    if (!searchQuery.trim()) return tickers;
    const query = searchQuery.toUpperCase();
    return tickers.filter((ticker) => ticker.toUpperCase().includes(query));
  }, [tickers, searchQuery]);

  // Determine which tickers are available (for cross-filtering) - O(1) lookup
  const availableTickersSet = useMemo(
    () => (availableTickers ? new Set(availableTickers) : null),
    [availableTickers]
  );
  const isTickerAvailable = (ticker: string) =>
    availableTickersSet === null || availableTickersSet.has(ticker);

  // Clear all selected tickers
  const handleClearAll = () => {
    selectedTickers.forEach((ticker) => onToggle(ticker));
  };

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tickers..."
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-text-primary placeholder-text-secondary/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {selectedTickers.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            aria-label="Clear all selected tickers"
          >
            Clear
          </button>
        )}
      </div>

      {/* Selected tickers indicator */}
      {selectedTickers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTickers.map((ticker) => (
            <span
              key={ticker}
              className="inline-flex items-center gap-1 rounded bg-accent/10 px-2 py-0.5 text-xs text-accent"
            >
              {ticker}
              <button
                type="button"
                onClick={() => onToggle(ticker)}
                aria-label={`Remove ${ticker} filter`}
                className="hover:text-error transition-colors"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Ticker grid */}
      <div
        className="overflow-y-auto overflow-x-hidden"
        style={{ maxHeight }}
      >
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {filteredTickers.map((ticker) => {
            const isSelected = selectedTickers.includes(ticker);
            const isAvailable = isTickerAvailable(ticker);

            return (
              <button
                type="button"
                key={ticker}
                onClick={() => isAvailable && onToggle(ticker)}
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
                title={ticker}
              >
                {ticker}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {filteredTickers.length === 0 && (
        <p className="text-center text-xs text-text-secondary py-2">
          {searchQuery ? 'No matching tickers found' : 'No tickers available'}
        </p>
      )}

      {/* Stats */}
      <div className="flex justify-between text-xs text-text-secondary">
        <span>{filteredTickers.length} tickers shown</span>
        {selectedTickers.length > 0 && (
          <span>{selectedTickers.length} selected</span>
        )}
      </div>
    </div>
  );
}

export default TickerFilterGrid;
