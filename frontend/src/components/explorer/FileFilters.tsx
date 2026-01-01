import { useState, useEffect, useRef, useMemo } from 'react';
import { useFileStore } from '../../store/fileStore';
import { SOURCES, FILE_TYPES, ALL_SEC_FORM_TYPES, TRANSCRIPT_EVENT_TYPES } from '../../types/file';
import { fetchTickers } from '../../api/files';
import { FilterSection } from './FilterSection';
import { TypeFilterGrid } from './TypeFilterGrid';
import { TickerFilterGrid } from './TickerFilterGrid';
import { DateRangeSlider } from './DateRangeSlider';

export function FileFilters() {
  const { filters, setFilters, resetFilters, availableOptions, refreshAvailableOptions } = useFileStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [allTickers, setAllTickers] = useState<string[]>([]);

  // Fetch available tickers on mount
  useEffect(() => {
    fetchTickers().then(setAllTickers).catch(console.error);
  }, []);

  // Refresh available options on mount
  useEffect(() => {
    refreshAvailableOptions();
  }, [refreshAvailableOptions]);

  // Determine if we're filtering Filings, Transcripts, or both
  const showFilingsFilters = filters.sources.includes('Filings');
  const showTranscriptsFilters = filters.sources.includes('Transcripts');

  // Check if any non-default filters are active
  const hasActiveFilters =
    filters.sources.length !== 1 ||
    filters.sources[0] !== 'Filings' ||
    filters.fileTypes.length > 0 ||
    filters.formTypes.length > 0 ||
    filters.eventTypes.length > 0 ||
    filters.tickers.length > 0 ||
    filters.search !== '' ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null;

  // Toggle file type selection
  const toggleFileType = (fileType: string) => {
    if (filters.fileTypes.includes(fileType)) {
      setFilters({ fileTypes: filters.fileTypes.filter((t) => t !== fileType) });
    } else {
      setFilters({ fileTypes: [...filters.fileTypes, fileType] });
    }
  };

  // Set all file types (clear selection = show all)
  const setAllFileTypes = () => {
    setFilters({ fileTypes: [] });
  };

  // Toggle form type selection
  const toggleFormType = (formType: string) => {
    if (filters.formTypes.includes(formType)) {
      setFilters({ formTypes: filters.formTypes.filter((t) => t !== formType) });
    } else {
      setFilters({ formTypes: [...filters.formTypes, formType] });
    }
  };

  // Toggle event type selection
  const toggleEventType = (eventType: string) => {
    if (filters.eventTypes.includes(eventType)) {
      setFilters({ eventTypes: filters.eventTypes.filter((t) => t !== eventType) });
    } else {
      setFilters({ eventTypes: [...filters.eventTypes, eventType] });
    }
  };

  // Toggle ticker selection
  const toggleTicker = (ticker: string) => {
    if (filters.tickers.includes(ticker)) {
      setFilters({ tickers: filters.tickers.filter((t) => t !== ticker) });
    } else {
      setFilters({ tickers: [...filters.tickers, ticker] });
    }
  };

  // Toggle source selection
  const toggleSource = (source: string) => {
    if (filters.sources.includes(source)) {
      // Don't allow deselecting all sources
      if (filters.sources.length > 1) {
        const newSources = filters.sources.filter((s) => s !== source);
        setFilters({ sources: newSources });
        // Clear form/event types if the corresponding source is deselected
        if (source === 'Filings') {
          setFilters({ sources: newSources, formTypes: [] });
        } else if (source === 'Transcripts') {
          setFilters({ sources: newSources, eventTypes: [] });
        }
      }
    } else {
      setFilters({ sources: [...filters.sources, source] });
    }
  };

  // Available years from options or generate defaults
  const availableYears = useMemo(() => {
    if (availableOptions?.years && availableOptions.years.length > 0) {
      return availableOptions.years;
    }
    // Generate default years from 2000 to current year
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2000; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  }, [availableOptions?.years]);

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
        <div className="pb-2">
          {/* Search input */}
          <div className="px-4 pb-3">
            <SearchInput
              value={filters.search}
              onChange={(search) => setFilters({ search })}
            />
          </div>

          {/* Source toggle buttons */}
          <FilterSection title="Sources" defaultExpanded={true}>
            <div className="flex gap-2">
              {SOURCES.map((source) => {
                const isSelected = filters.sources.includes(source);
                const colorClass = source === 'Filings' ? 'bg-accent' : 'bg-success';

                return (
                  <button
                    key={source}
                    onClick={() => toggleSource(source)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? `${colorClass} text-white`
                        : 'border border-border bg-background text-text-secondary hover:border-text-secondary'
                    }`}
                  >
                    {source}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* File type toggle buttons with "All" option */}
          <FilterSection title="File Types" defaultExpanded={true}>
            <div className="flex flex-wrap gap-1.5">
              {/* All button */}
              <button
                onClick={setAllFileTypes}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filters.fileTypes.length === 0
                    ? 'bg-accent text-white'
                    : 'border border-border bg-background text-text-secondary hover:border-text-secondary'
                }`}
              >
                All
              </button>
              {/* Individual file type buttons */}
              {FILE_TYPES.map((fileType) => {
                const isSelected = filters.fileTypes.includes(fileType);
                const colorMap: Record<string, string> = {
                  PDF: 'bg-red-500',
                  MD: 'bg-blue-500',
                  HTM: 'bg-orange-500',
                  TXT: 'bg-gray-500',
                  JSON: 'bg-yellow-500',
                };

                return (
                  <button
                    key={fileType}
                    onClick={() => toggleFileType(fileType)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? `${colorMap[fileType] || 'bg-accent'} text-white`
                        : 'border border-border bg-background text-text-secondary hover:border-text-secondary'
                    }`}
                  >
                    {fileType}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* Form Types (when Filings selected) */}
          {showFilingsFilters && (
            <FilterSection title="Form Types" defaultExpanded={false}>
              <TypeFilterGrid
                types={ALL_SEC_FORM_TYPES}
                selectedTypes={filters.formTypes}
                onToggle={toggleFormType}
                availableTypes={availableOptions?.formTypes}
                maxHeight="180px"
                columns={3}
                showSearch={true}
                searchPlaceholder="Search form types..."
              />
            </FilterSection>
          )}

          {/* Event Types (when Transcripts selected) */}
          {showTranscriptsFilters && (
            <FilterSection title="Event Types" defaultExpanded={false}>
              <TypeFilterGrid
                types={TRANSCRIPT_EVENT_TYPES}
                selectedTypes={filters.eventTypes}
                onToggle={toggleEventType}
                availableTypes={availableOptions?.eventTypes}
                maxHeight="180px"
                columns={3}
              />
            </FilterSection>
          )}

          {/* Ticker filter grid */}
          <FilterSection title="Tickers" defaultExpanded={false}>
            <TickerFilterGrid
              tickers={allTickers}
              selectedTickers={filters.tickers}
              onToggle={toggleTicker}
              availableTickers={availableOptions?.tickers}
              maxHeight="180px"
              columns={3}
            />
          </FilterSection>

          {/* Date range with year/month buttons */}
          <FilterSection title="Date Range" defaultExpanded={false}>
            <DateRangeSlider
              minDate={availableOptions?.dateRange?.min || null}
              maxDate={availableOptions?.dateRange?.max || null}
              selectedStart={filters.dateRange.start}
              selectedEnd={filters.dateRange.end}
              availableYears={availableYears}
              onRangeChange={(start, end) => setFilters({ dateRange: { start, end } })}
            />
          </FilterSection>
        </div>
      )}
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

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

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
          type="button"
          onClick={() => {
            setLocalValue('');
            onChange('');
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
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
