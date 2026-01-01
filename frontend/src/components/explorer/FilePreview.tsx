import { useState, useEffect, useCallback } from 'react';
import { useFileStore } from '../../store/fileStore';
import { fetchFileContent, downloadFile } from '../../api/files';
import { PdfPreview } from './previews/PdfPreview';
import { MarkdownPreview } from './previews/MarkdownPreview';
import { TextPreview } from './previews/TextPreview';
import { HtmlPreview } from './previews/HtmlPreview';

type PreviewType = 'pdf' | 'markdown' | 'html' | 'text' | 'json' | 'unsupported';

interface PreviewState {
  loading: boolean;
  error: string | null;
  content: string | null;
  previewType: PreviewType;
}

const SUPPORTED_EXTENSIONS: Record<string, PreviewType> = {
  pdf: 'pdf',
  md: 'markdown',
  markdown: 'markdown',
  htm: 'html',
  html: 'html',
  txt: 'text',
  json: 'json',
  xml: 'text',
  csv: 'text',
  log: 'text',
  ini: 'text',
  cfg: 'text',
  conf: 'text',
  yaml: 'text',
  yml: 'text',
  toml: 'text',
};

export function FilePreview() {
  const { selectedFile } = useFileStore();
  const [previewState, setPreviewState] = useState<PreviewState>({
    loading: false,
    error: null,
    content: null,
    previewType: 'unsupported',
  });

  const getPreviewType = useCallback((extension: string | undefined): PreviewType => {
    if (!extension) return 'unsupported';
    return SUPPORTED_EXTENSIONS[extension.toLowerCase()] || 'unsupported';
  }, []);

  const fetchContent = useCallback(async () => {
    if (!selectedFile || selectedFile.type !== 'file') {
      setPreviewState({
        loading: false,
        error: null,
        content: null,
        previewType: 'unsupported',
      });
      return;
    }

    const previewType = getPreviewType(selectedFile.extension);

    // For PDFs, we don't need to fetch content - react-pdf will handle it
    if (previewType === 'pdf') {
      setPreviewState({
        loading: false,
        error: null,
        content: null,
        previewType: 'pdf',
      });
      return;
    }

    if (previewType === 'unsupported') {
      setPreviewState({
        loading: false,
        error: null,
        content: null,
        previewType: 'unsupported',
      });
      return;
    }

    setPreviewState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const response = await fetchFileContent(selectedFile.path);
      setPreviewState({
        loading: false,
        error: null,
        content: response.content,
        previewType,
      });
    } catch (err) {
      console.error('Failed to fetch file content:', err);
      setPreviewState({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load file content',
        content: null,
        previewType,
      });
    }
  }, [selectedFile, getPreviewType]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleDownload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const blob = await downloadFile(selectedFile.path);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  }, [selectedFile]);

  // No file selected
  if (!selectedFile || selectedFile.type !== 'file') {
    return null;
  }

  const { loading, error, content, previewType } = previewState;

  // Loading state
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 p-4">
        <ErrorIcon className="h-12 w-12 text-error" />
        <p className="text-center text-sm text-error">{error}</p>
        <button
          onClick={handleDownload}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80"
        >
          Download File
        </button>
      </div>
    );
  }

  // Unsupported file type
  if (previewType === 'unsupported') {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 p-4">
        <UnsupportedIcon className="h-12 w-12 text-text-secondary" />
        <p className="text-center text-sm text-text-secondary">
          Preview not available for this file type
        </p>
        <button
          onClick={handleDownload}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80"
        >
          Download File
        </button>
      </div>
    );
  }

  // PDF Preview
  if (previewType === 'pdf') {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const pdfUrl = `${apiUrl}/api/files/download?path=${encodeURIComponent(selectedFile.path)}`;

    return (
      <div className="h-[600px] min-h-[400px]">
        <PdfPreview url={pdfUrl} onDownload={handleDownload} />
      </div>
    );
  }

  // Markdown Preview
  if (previewType === 'markdown' && content) {
    return (
      <div className="h-[600px] min-h-[400px]">
        <MarkdownPreview content={content} onDownload={handleDownload} />
      </div>
    );
  }

  // HTML Preview
  if (previewType === 'html' && content) {
    return (
      <div className="h-[600px] min-h-[400px]">
        <HtmlPreview content={content} onDownload={handleDownload} />
      </div>
    );
  }

  // Text/JSON Preview
  if ((previewType === 'text' || previewType === 'json') && content) {
    return (
      <div className="h-[600px] min-h-[400px]">
        <TextPreview
          content={content}
          language={previewType}
          onDownload={handleDownload}
        />
      </div>
    );
  }

  return null;
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <span className="text-xs text-text-secondary">Loading preview...</span>
    </div>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function UnsupportedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default FilePreview;
