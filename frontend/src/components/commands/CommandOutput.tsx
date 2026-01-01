import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useCommandStore } from '../../store/commandStore';

function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Parse ANSI escape codes for basic color support
function parseAnsiToHtml(text: string): React.ReactNode {
  // Remove common ANSI codes and convert to styled spans
  const ansiRegex = /\x1b\[(\d+(?:;\d+)*)m/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let currentStyle: React.CSSProperties = {};
  let match: RegExpExecArray | null;

  const ansiToStyle: Record<number, React.CSSProperties> = {
    0: {}, // Reset
    1: { fontWeight: 'bold' },
    2: { opacity: 0.7 },
    3: { fontStyle: 'italic' },
    4: { textDecoration: 'underline' },
    30: { color: '#6e7681' }, // Black
    31: { color: '#f85149' }, // Red
    32: { color: '#3fb950' }, // Green
    33: { color: '#d29922' }, // Yellow
    34: { color: '#58a6ff' }, // Blue
    35: { color: '#bc8cff' }, // Magenta
    36: { color: '#39c5cf' }, // Cyan
    37: { color: '#e6edf3' }, // White
    90: { color: '#7d8590' }, // Bright black (gray)
    91: { color: '#ff7b72' }, // Bright red
    92: { color: '#7ee787' }, // Bright green
    93: { color: '#e3b341' }, // Bright yellow
    94: { color: '#79c0ff' }, // Bright blue
    95: { color: '#d2a8ff' }, // Bright magenta
    96: { color: '#56d4dd' }, // Bright cyan
    97: { color: '#ffffff' }, // Bright white
  };

  while ((match = ansiRegex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index);
      if (Object.keys(currentStyle).length > 0) {
        parts.push(
          <span key={lastIndex} style={currentStyle}>
            {textContent}
          </span>
        );
      } else {
        parts.push(textContent);
      }
    }

    // Parse ANSI codes
    const codes = match[1].split(';').map(Number);
    codes.forEach((code) => {
      if (code === 0) {
        currentStyle = {};
      } else if (ansiToStyle[code]) {
        currentStyle = { ...currentStyle, ...ansiToStyle[code] };
      }
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const textContent = text.slice(lastIndex);
    if (Object.keys(currentStyle).length > 0) {
      parts.push(
        <span key={lastIndex} style={currentStyle}>
          {textContent}
        </span>
      );
    } else {
      parts.push(textContent);
    }
  }

  return parts.length > 0 ? parts : text;
}

export function CommandOutput() {
  const { output, executing, exitCode, clearOutput } = useCommandStore();
  const outputRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (autoScrollRef.current && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Handle scroll to detect if user scrolled up
  const handleScroll = () => {
    if (outputRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = outputRef.current;
      autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 50;
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-primary">Output</span>
          {executing && (
            <div className="flex items-center gap-2 text-accent">
              <SpinnerIcon />
              <span className="text-xs">Running...</span>
            </div>
          )}
          {exitCode !== null && (
            <span
              className={cn(
                'rounded px-2 py-0.5 text-xs font-medium',
                exitCode === 0
                  ? 'bg-success/20 text-success'
                  : 'bg-error/20 text-error'
              )}
            >
              Exit: {exitCode}
            </span>
          )}
        </div>
        <button
          onClick={clearOutput}
          disabled={executing}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-border hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          title="Clear output"
        >
          <TrashIcon />
          Clear
        </button>
      </div>

      {/* Output content */}
      <div
        ref={outputRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
      >
        {output.length === 0 ? (
          <div className="flex h-full items-center justify-center text-text-secondary">
            Command output will appear here
          </div>
        ) : (
          <div className="space-y-0.5">
            {output.map((line) => (
              <div
                key={line.id}
                className={cn(
                  'whitespace-pre-wrap break-all leading-relaxed',
                  line.type === 'stderr' && 'text-error',
                  line.type === 'system' && 'text-text-secondary italic'
                )}
              >
                {line.type === 'system' ? (
                  line.content
                ) : (
                  parseAnsiToHtml(line.content)
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommandOutput;
