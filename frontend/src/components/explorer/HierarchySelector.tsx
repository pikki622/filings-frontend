import { useState, useRef, useEffect } from 'react';
import { useFileStore } from '../../store/fileStore';
import { HIERARCHY_LABELS, type Hierarchy } from '../../types/file';

const hierarchyOptions: Hierarchy[] = [
  'source_form_ticker_date',
  'source_ticker_form_date',
  'ticker_source_form_date',
  'form_ticker_date',
  'date_source_ticker',
  'filetype_source_ticker',
];

export function HierarchySelector() {
  const { hierarchy, setHierarchy } = useFileStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSelect = (newHierarchy: Hierarchy) => {
    setHierarchy(newHierarchy);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-text-primary transition-colors hover:border-accent focus:border-accent focus:outline-none"
      >
        <span className="text-text-secondary">Hierarchy:</span>
        <span className="font-medium">{HIERARCHY_LABELS[hierarchy]}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[280px] rounded-md border border-border bg-surface py-1 shadow-lg">
          {hierarchyOptions.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-background ${
                hierarchy === option
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-primary'
              }`}
            >
              {hierarchy === option && <CheckIcon className="h-4 w-4" />}
              {hierarchy !== option && <span className="w-4" />}
              {HIERARCHY_LABELS[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default HierarchySelector;
