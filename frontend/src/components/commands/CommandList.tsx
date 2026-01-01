import { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useCommandStore } from '../../store/commandStore';
import type { CommandSchema, CommandGroup } from '../../types/command';

function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

// Icon components
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={cn(
        'h-4 w-4 shrink-0 transition-transform',
        expanded && 'rotate-90'
      )}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  );
}

function CommandIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

interface CommandGroupItemProps {
  group: CommandGroup;
}

function CommandGroupItem({ group }: CommandGroupItemProps) {
  const [expanded, setExpanded] = useState(true);
  const { selectedCommand, setSelectedCommand } = useCommandStore();

  const formatGroupName = (name: string) => {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="mb-1">
      {/* Group header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-text-primary transition-colors hover:bg-border"
      >
        <ChevronIcon expanded={expanded} />
        <FolderIcon />
        <span className="truncate">{formatGroupName(group.name)}</span>
        <span className="ml-auto text-xs text-text-secondary">
          {group.commands.length}
        </span>
      </button>

      {/* Commands list */}
      {expanded && (
        <div className="ml-4 mt-1 space-y-0.5">
          {group.commands.map((command) => (
            <CommandItem
              key={command.name}
              command={command}
              isSelected={selectedCommand?.name === command.name}
              onSelect={() => setSelectedCommand(command)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommandItemProps {
  command: CommandSchema;
  isSelected: boolean;
  onSelect: () => void;
}

function CommandItem({ command, isSelected, onSelect }: CommandItemProps) {
  return (
    <button
      onClick={onSelect}
      title={command.description}
      className={cn(
        'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
        isSelected
          ? 'bg-accent text-white'
          : 'text-text-secondary hover:bg-border hover:text-text-primary'
      )}
    >
      <CommandIcon />
      <span className="truncate">{command.name}</span>
    </button>
  );
}

export function CommandList() {
  const { commandGroups, loading } = useCommandStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <span className="text-sm text-text-secondary">Loading commands...</span>
      </div>
    );
  }

  if (commandGroups.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-text-secondary">No commands available</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
        Commands
      </h3>
      <div className="space-y-1">
        {commandGroups.map((group) => (
          <CommandGroupItem key={group.name} group={group} />
        ))}
      </div>
    </div>
  );
}

export default CommandList;
