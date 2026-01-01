import { useState, useMemo, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface TextPreviewProps {
  content: string;
  language?: string;
  onDownload?: () => void;
}

export function TextPreview({ content, language = 'text', onDownload }: TextPreviewProps) {
  const [wordWrap, setWordWrap] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  // Determine the language for syntax highlighting
  const syntaxLanguage = useMemo(() => {
    if (language === 'json') {
      // Try to validate JSON
      try {
        JSON.parse(content);
        return 'json';
      } catch {
        return 'text';
      }
    }
    return language;
  }, [content, language]);

  // Format JSON if applicable
  const formattedContent = useMemo(() => {
    if (syntaxLanguage === 'json') {
      try {
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return content;
      }
    }
    return content;
  }, [content, syntaxLanguage]);

  const copyContent = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formattedContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  }, [formattedContent]);

  const lineCount = useMemo(() => {
    return formattedContent.split('\n').length;
  }, [formattedContent]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2">
        <div className="flex items-center gap-4">
          <span className="text-xs text-text-secondary">
            {lineCount} line{lineCount !== 1 ? 's' : ''}
          </span>
          <span className="text-xs uppercase text-text-secondary">{syntaxLanguage}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Word wrap toggle */}
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs ${
              wordWrap
                ? 'bg-accent/20 text-accent'
                : 'text-text-secondary hover:bg-border hover:text-text-primary'
            }`}
            title={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
          >
            <WrapIcon className="h-4 w-4" />
            Wrap
          </button>

          {/* Copy button */}
          <button
            onClick={copyContent}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-text-secondary hover:bg-border hover:text-text-primary"
          >
            {copySuccess ? (
              <>
                <CheckIcon className="h-4 w-4 text-success" />
                Copied!
              </>
            ) : (
              <>
                <CopyIcon className="h-4 w-4" />
                Copy
              </>
            )}
          </button>

          {/* Download button */}
          {onDownload && (
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/80"
            >
              <DownloadIcon className="h-4 w-4" />
              Download
            </button>
          )}
        </div>
      </div>

      {/* Content with syntax highlighting */}
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language={syntaxLanguage}
          style={oneDark}
          showLineNumbers
          wrapLines={wordWrap}
          wrapLongLines={wordWrap}
          customStyle={{
            margin: 0,
            padding: '1rem',
            minHeight: '100%',
            background: '#0D1117',
            fontSize: '0.8125rem',
            lineHeight: '1.5',
          }}
          lineNumberStyle={{
            minWidth: '3em',
            paddingRight: '1em',
            color: '#7D8590',
            userSelect: 'none',
          }}
        >
          {formattedContent}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

// Icons
function WrapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10m-10 6h16M14 12l3 3m0 0l-3 3m3-3H8" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

export default TextPreview;
