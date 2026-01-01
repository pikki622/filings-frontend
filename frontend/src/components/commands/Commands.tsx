import { useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useCommandStore } from '../../store/commandStore';
import type { CLI } from '../../types/command';
import { CommandList } from './CommandList';
import { CommandForm } from './CommandForm';
import { CommandOutput } from './CommandOutput';

function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

const CLI_OPTIONS: { value: CLI; label: string }[] = [
  { value: 'filings', label: 'Filings' },
  { value: 'transcripts', label: 'Transcripts' },
];

export function Commands() {
  const { selectedCli, setSelectedCli, loading, error, fetchCommands } =
    useCommandStore();

  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* CLI Selector */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-4 py-2">
        <span className="text-sm font-medium text-text-secondary">CLI:</span>
        <div className="flex gap-1">
          {CLI_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedCli(option.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                selectedCli === option.value
                  ? 'bg-accent text-white'
                  : 'bg-background text-text-secondary hover:bg-border hover:text-text-primary'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {loading && (
          <span className="ml-2 text-sm text-text-secondary">Loading...</span>
        )}
        {error && (
          <span className="ml-2 text-sm text-error">{error}</span>
        )}
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Command list sidebar */}
        <div className="w-64 shrink-0 overflow-y-auto border-r border-border bg-surface">
          <CommandList />
        </div>

        {/* Command form and output */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Command form */}
          <div className="flex-1 overflow-y-auto border-b border-border p-4">
            <CommandForm />
          </div>

          {/* Command output */}
          <div className="h-72 shrink-0 overflow-hidden">
            <CommandOutput />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Commands;
