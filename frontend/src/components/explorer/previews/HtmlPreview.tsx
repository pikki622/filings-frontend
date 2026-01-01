import { useMemo, useRef, useEffect, useState } from 'react';

interface HtmlPreviewProps {
  content: string;
  onDownload?: () => void;
}

export function HtmlPreview({ content, onDownload }: HtmlPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showSource, setShowSource] = useState(false);

  // Create a sandboxed HTML document with dark theme styling injected
  const sandboxedHtml = useMemo(() => {
    // Create a dark theme style to inject
    const darkThemeStyle = `
      <style>
        :root {
          color-scheme: dark;
        }
        * {
          box-sizing: border-box;
        }
        body {
          background-color: #0D1117 !important;
          color: #E6EDF3 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          margin: 0;
          padding: 1rem;
          line-height: 1.6;
        }
        a {
          color: #58A6FF !important;
        }
        a:hover {
          text-decoration: underline;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        th, td {
          border: 1px solid #30363D !important;
          padding: 0.5rem;
          text-align: left;
        }
        th {
          background-color: #161B22 !important;
          color: #E6EDF3 !important;
        }
        tr:nth-child(even) {
          background-color: #161B22 !important;
        }
        pre, code {
          background-color: #161B22 !important;
          color: #E6EDF3 !important;
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        pre {
          padding: 1rem;
          overflow-x: auto;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        h1, h2, h3, h4, h5, h6 {
          color: #E6EDF3 !important;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        hr {
          border: none;
          border-top: 1px solid #30363D;
          margin: 1.5rem 0;
        }
        blockquote {
          border-left: 4px solid #58A6FF;
          margin: 1rem 0;
          padding-left: 1rem;
          color: #7D8590 !important;
        }
        input, select, textarea, button {
          background-color: #161B22 !important;
          color: #E6EDF3 !important;
          border: 1px solid #30363D !important;
          border-radius: 4px;
          padding: 0.5rem;
        }
        /* Hide scripts display */
        script { display: none !important; }
      </style>
    `;

    // Check if the content already has a head tag
    if (content.includes('<head>')) {
      return content.replace('<head>', `<head>${darkThemeStyle}`);
    } else if (content.includes('<html>')) {
      return content.replace('<html>', `<html><head>${darkThemeStyle}</head>`);
    } else {
      // Wrap content with a basic HTML structure
      return `<!DOCTYPE html><html><head>${darkThemeStyle}</head><body>${content}</body></html>`;
    }
  }, [content]);

  // Update iframe content when sandboxedHtml changes
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(sandboxedHtml);
        doc.close();
      }
    }
  }, [sandboxedHtml]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Toggle view mode */}
          <button
            onClick={() => setShowSource(false)}
            className={`rounded px-2 py-1 text-xs ${
              !showSource
                ? 'bg-accent/20 text-accent'
                : 'text-text-secondary hover:bg-border hover:text-text-primary'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setShowSource(true)}
            className={`rounded px-2 py-1 text-xs ${
              showSource
                ? 'bg-accent/20 text-accent'
                : 'text-text-secondary hover:bg-border hover:text-text-primary'
            }`}
          >
            Source
          </button>
        </div>

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

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {showSource ? (
          <div className="h-full overflow-auto bg-background p-4">
            <pre className="whitespace-pre-wrap break-words font-mono text-xs text-text-primary">
              {content}
            </pre>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title="HTML Preview"
            sandbox="allow-same-origin"
            className="h-full w-full border-0 bg-background"
          />
        )}
      </div>
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

export default HtmlPreview;
