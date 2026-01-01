import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewProps {
  url: string;
  onDownload?: () => void;
}

export function PdfPreview({ url, onDownload }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInputValue, setPageInputValue] = useState('1');

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
    setPageLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('PDF load error:', err);
    setError('Failed to load PDF. The file may be corrupted or inaccessible.');
    setPageLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback(() => {
    setPageLoading(false);
  }, []);

  const goToPrevPage = () => {
    setPageNumber((prev) => {
      const newPage = Math.max(prev - 1, 1);
      setPageInputValue(String(newPage));
      return newPage;
    });
    setPageLoading(true);
  };

  const goToNextPage = () => {
    setPageNumber((prev) => {
      const newPage = Math.min(prev + 1, numPages || 1);
      setPageInputValue(String(newPage));
      return newPage;
    });
    setPageLoading(true);
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value);
  };

  const handlePageInputBlur = () => {
    const parsed = parseInt(pageInputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= (numPages || 1)) {
      setPageNumber(parsed);
      setPageLoading(true);
    } else {
      setPageInputValue(String(pageNumber));
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
    }
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setScale(1.0);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <ErrorIcon className="h-12 w-12 text-error" />
        <p className="text-center text-sm text-error">{error}</p>
        {onDownload && (
          <button
            onClick={onDownload}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80"
          >
            Download Instead
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2">
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="rounded p-1 hover:bg-border disabled:opacity-50 disabled:hover:bg-transparent"
            title="Previous page"
          >
            <ChevronLeftIcon className="h-5 w-5 text-text-primary" />
          </button>

          <div className="flex items-center gap-1.5 text-sm text-text-primary">
            <input
              type="text"
              value={pageInputValue}
              onChange={handlePageInputChange}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              className="w-12 rounded border border-border bg-background px-2 py-1 text-center text-sm focus:border-accent focus:outline-none"
            />
            <span className="text-text-secondary">of</span>
            <span>{numPages || '...'}</span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= (numPages || 1)}
            className="rounded p-1 hover:bg-border disabled:opacity-50 disabled:hover:bg-transparent"
            title="Next page"
          >
            <ChevronRightIcon className="h-5 w-5 text-text-primary" />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="rounded p-1 hover:bg-border disabled:opacity-50 disabled:hover:bg-transparent"
            title="Zoom out"
          >
            <MinusIcon className="h-5 w-5 text-text-primary" />
          </button>

          <button
            onClick={resetZoom}
            className="rounded px-2 py-1 text-sm text-text-secondary hover:bg-border hover:text-text-primary"
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            onClick={zoomIn}
            disabled={scale >= 3}
            className="rounded p-1 hover:bg-border disabled:opacity-50 disabled:hover:bg-transparent"
            title="Zoom in"
          >
            <PlusIcon className="h-5 w-5 text-text-primary" />
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

      {/* PDF viewer */}
      <div className="flex-1 overflow-auto bg-background/50 p-4">
        <div className="flex justify-center">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex h-96 items-center justify-center">
                <LoadingSpinner />
              </div>
            }
            className="pdf-document"
          >
            <div className="relative">
              {pageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                  <LoadingSpinner />
                </div>
              )}
              <Page
                pageNumber={pageNumber}
                scale={scale}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
              />
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <span className="text-xs text-text-secondary">Loading...</span>
    </div>
  );
}

// Icons
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

export default PdfPreview;
