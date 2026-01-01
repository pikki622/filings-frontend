import { useState, useEffect, useRef, useCallback } from 'react';
import { useFileStore } from '../../store/fileStore';
import { SOURCES, FILE_TYPES } from '../../types/file';
import { fetchTickers } from '../../api/files';

export function FileFilters() {
  const { filters, setFilters, resetFilters } = useFileStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const hasActiveFilters =
    filters.sources.length > 0 ||
    filters.fileTypes.length > 0 ||
    filters.tickers.length > 0 ||
    filters.search !== '' ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null;

  return (
    <div className="border-b border-border bg-surface">
      {/* Filter header */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
        >
          <ChevronIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
              Active
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-text-secondary hover:text-accent"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter content */}
      {isExpanded && (
        <div className="space-y-3 px-4 pb-3">
          {/* Search input */}
          <SearchInput
            value={filters.search}
            onChange={(search) => setFilters({ search })}
          />

          {/* Source toggle buttons */}
          <FilterSection label="Sources">
            <ToggleButtonGroup
              options={SOURCES}
              selected={filters.sources}
              onChange={(sources) => setFilters({ sources })}
              colorMap={{
                Filings: 'bg-accent',
                Transcripts: 'bg-success',
                Research: 'bg-warning',
                Presentations: 'bg-purple-500',
              }}
            />
          </FilterSection>

          {/* File type toggle buttons */}
          <FilterSection label="File Types">
            <ToggleButtonGroup
              options={FILE_TYPES}
              selected={filters.fileTypes}
              onChange={(fileTypes) => setFilters({ fileTypes })}
              colorMap={{
                PDF: 'bg-red-500',
                MD: 'bg-blue-500',
                HTM: 'bg-orange-500',
                TXT: 'bg-gray-500',
                JSON: 'bg-yellow-500',
              }}
            />
          </FilterSection>

          {/* Ticker autocomplete */}
          <FilterSection label="Tickers">
            <TickerSelect
              selected={filters.tickers}
              onChange={(tickers) => setFilters({ tickers })}
            />
          </FilterSection>

          {/* Date range */}
          <FilterSection label="Date Range">
            <DateRangePicker
              startDate={filters.dateRange.start}
              endDate={filters.dateRange.end}
              onChange={(dateRange) => setFilters({ dateRange })}
            />
          </FilterSection>
        </div>
      )}
    </div>
  );
}

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-text-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder="Search files..."
        className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
      />
      {localValue && (
        <button
          onClick={() => {
            setLocalValue('');
            onChange('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function ToggleButtonGroup({
  options,
  selected,
  onChange,
  colorMap,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  colorMap?: Record<string, string>;
}) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        const color = colorMap?.[option] || 'bg-accent';

        return (
          <button
            key={option}
            onClick={() => toggle(option)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              isSelected
                ? `${color} text-white`
                : 'border border-border bg-background text-text-secondary hover:border-text-secondary'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function TickerSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions on input change
  useEffect(() => {
    if (!inputValue) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const tickers = await fetchTickers(inputValue);
        setSuggestions(tickers.filter((t) => !selected.includes(t)));
      } catch {
        setSuggestions([]);
      }
      setLoading(false);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [inputValue, selected]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTicker = useCallback(
    (ticker: string) => {
      if (!selected.includes(ticker)) {
        onChange([...selected, ticker]);
      }
      setInputValue('');
      setIsOpen(false);
    },
    [selected, onChange]
  );

  const removeTicker = (ticker: string) => {
    onChange(selected.filter((t) => t !== ticker));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      addTicker(inputValue.trim().toUpperCase());
    } else if (e.key === 'Backspace' && !inputValue && selected.length > 0) {
      removeTicker(selected[selected.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex min-h-[38px] flex-wrap gap-1.5 rounded-md border border-border bg-background p-1.5 focus-within:border-accent">
        {selected.map((ticker) => (
          <span
            key={ticker}
            className="flex items-center gap-1 rounded bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent"
          >
            {ticker}
            <button
              onClick={() => removeTicker(ticker)}
              className="hover:text-white"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value.toUpperCase());
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? 'Type ticker symbols...' : ''}
          className="min-w-[100px] flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
        />
      </div>

      {isOpen && (suggestions.length > 0 || loading) && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-text-secondary">
              Loading...
            </div>
          ) : (
            suggestions.map((ticker) => (
              <button
                key={ticker}
                onClick={() => addTicker(ticker)}
                className="flex w-full items-center px-3 py-2 text-left text-sm text-text-primary hover:bg-background"
              >
                {ticker}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string | null;
  endDate: string | null;
  onChange: (range: { start: string | null; end: string | null }) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={startDate || ''}
        onChange={(e) =>
          onChange({ start: e.target.value || null, end: endDate })
        }
        className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
      />
      <span className="text-text-secondary">to</span>
      <input
        type="date"
        value={endDate || ''}
        onChange={(e) =>
          onChange({ start: startDate, end: e.target.value || null })
        }
        className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
      />
    </div>
  );
}

// Icons
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export default FileFilters;
