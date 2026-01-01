import { useState, useCallback } from 'react';
import { useCommandStore } from '../../store/commandStore';

function CopyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

interface TokenProps {
  type: 'command' | 'subcommand' | 'argument' | 'flag' | 'value';
  children: React.ReactNode;
}

function Token({ type, children }: TokenProps) {
  const colorClasses = {
    command: 'text-accent',
    subcommand: 'text-success',
    argument: 'text-warning',
    flag: 'text-text-secondary',
    value: 'text-text-primary',
  };

  return <span className={colorClasses[type]}>{children}</span>;
}

function tokenizeCommand(commandString: string): React.ReactNode[] {
  const parts = commandString.split(' ');
  const tokens: React.ReactNode[] = [];

  let isFirstCommand = true;
  let expectValue = false;

  parts.forEach((part, index) => {
    if (index > 0) {
      tokens.push(' ');
    }

    if (isFirstCommand) {
      tokens.push(<Token key={index} type="command">{part}</Token>);
      isFirstCommand = false;
    } else if (part.startsWith('--')) {
      tokens.push(<Token key={index} type="flag">{part}</Token>);
      expectValue = true;
    } else if (part.startsWith('-')) {
      tokens.push(<Token key={index} type="flag">{part}</Token>);
      expectValue = true;
    } else if (expectValue) {
      tokens.push(<Token key={index} type="value">{part}</Token>);
      expectValue = false;
    } else if (index === 1) {
      tokens.push(<Token key={index} type="subcommand">{part}</Token>);
    } else {
      tokens.push(<Token key={index} type="argument">{part}</Token>);
    }
  });

  return tokens;
}

export function CommandPreview() {
  const { getCommandString, selectedCommand } = useCommandStore();
  const [copied, setCopied] = useState(false);

  const commandString = getCommandString();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(commandString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy command:', error);
    }
  }, [commandString]);

  if (!selectedCommand || !commandString) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          Command Preview
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-border hover:text-text-primary"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <CheckIcon />
              Copied
            </>
          ) : (
            <>
              <CopyIcon />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-3">
        <code className="block whitespace-pre-wrap break-all font-mono text-sm">
          {tokenizeCommand(commandString)}
        </code>
      </div>
    </div>
  );
}

export default CommandPreview;
