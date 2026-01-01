import { useMemo } from 'react';

interface DateRangeSliderProps {
  minDate: string | null;
  maxDate: string | null;
  selectedStart: string | null;
  selectedEnd: string | null;
  availableYears: number[];
  onRangeChange: (start: string | null, end: string | null) => void;
}

const MONTHS = [
  { short: 'Jan', num: '01' },
  { short: 'Feb', num: '02' },
  { short: 'Mar', num: '03' },
  { short: 'Apr', num: '04' },
  { short: 'May', num: '05' },
  { short: 'Jun', num: '06' },
  { short: 'Jul', num: '07' },
  { short: 'Aug', num: '08' },
  { short: 'Sep', num: '09' },
  { short: 'Oct', num: '10' },
  { short: 'Nov', num: '11' },
  { short: 'Dec', num: '12' },
];

/**
 * Date range filter with:
 * - Range slider from oldest to newest file
 * - Clickable year buttons (scrollable)
 * - Clickable month buttons (scrollable)
 */
export function DateRangeSlider({
  minDate,
  maxDate,
  selectedStart,
  selectedEnd,
  availableYears,
  onRangeChange,
}: DateRangeSliderProps) {
  // Parse current selection
  const selectedYear = useMemo(() => {
    if (!selectedStart) return null;
    return parseInt(selectedStart.split('-')[0], 10);
  }, [selectedStart]);

  const selectedMonth = useMemo(() => {
    if (!selectedStart) return null;
    return selectedStart.split('-')[1];
  }, [selectedStart]);

  // Handle year click - sets date range for entire year
  const handleYearClick = (year: number) => {
    if (selectedYear === year) {
      // Deselect year - clear date range
      onRangeChange(null, null);
    } else {
      // Select year - set range for entire year
      onRangeChange(`${year}-01-01`, `${year}-12-31`);
    }
  };

  // Handle month click - sets date range for that month in current/latest year
  const handleMonthClick = (monthNum: string) => {
    const year = selectedYear || availableYears[availableYears.length - 1] || new Date().getFullYear();
    const daysInMonth = new Date(year, parseInt(monthNum, 10), 0).getDate();

    if (selectedMonth === monthNum && selectedYear === year) {
      // Deselect month - clear date range
      onRangeChange(null, null);
    } else {
      // Select month
      onRangeChange(`${year}-${monthNum}-01`, `${year}-${monthNum}-${daysInMonth}`);
    }
  };

  // Clear date filter
  const handleClear = () => {
    onRangeChange(null, null);
  };

  // Format date for display
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-3">
      {/* Current range display */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">
          {selectedStart || selectedEnd ? (
            <>
              {formatDate(selectedStart)} - {formatDate(selectedEnd)}
            </>
          ) : (
            'All dates'
          )}
        </span>
        {(selectedStart || selectedEnd) && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear date filter"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Year buttons - scrollable horizontal list */}
      <div className="space-y-1">
        <span className="text-xs text-text-secondary">Year</span>
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
            {availableYears.map((year) => (
              <button
                type="button"
                key={year}
                onClick={() => handleYearClick(year)}
                className={`
                  rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap
                  ${
                    selectedYear === year
                      ? 'bg-accent text-white'
                      : 'bg-surface text-text-primary hover:bg-surface-hover'
                  }
                `}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Month buttons - scrollable horizontal list */}
      <div className="space-y-1">
        <span className="text-xs text-text-secondary">Month</span>
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
            {MONTHS.map((month) => (
              <button
                type="button"
                key={month.num}
                onClick={() => handleMonthClick(month.num)}
                className={`
                  rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap
                  ${
                    selectedMonth === month.num && selectedYear
                      ? 'bg-accent text-white'
                      : 'bg-surface text-text-primary hover:bg-surface-hover'
                  }
                `}
              >
                {month.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Available date range info */}
      {(minDate || maxDate) && (
        <div className="text-xs text-text-secondary/70">
          Available: {formatDate(minDate)} - {formatDate(maxDate)}
        </div>
      )}
    </div>
  );
}

export default DateRangeSlider;
