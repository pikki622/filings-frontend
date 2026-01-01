import { useState } from 'react';
import { useFileStore } from '../../store/fileStore';
import { FilePreview } from './FilePreview';

export function FileDetails() {
  const { selectedFile, selectedFileMetadata, metadataLoading } = useFileStore();
  const [copySuccess, setCopySuccess] = useState(false);

  if (!selectedFile) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <FileIcon className="mx-auto h-12 w-12 text-text-secondary opacity-50" />
          <p className="mt-3 text-sm text-text-secondary">
            Select a file to view details
          </p>
        </div>
      </div>
    );
  }

  if (selectedFile.type === 'folder') {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3">
          <FolderIcon className="h-10 w-10 text-accent" />
          <div>
            <h3 className="text-lg font-medium text-text-primary">
              {selectedFile.name}
            </h3>
            <p className="text-sm text-text-secondary">Folder</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <DetailRow label="Path" value={selectedFile.path} mono />
          {selectedFile.count !== undefined && (
            <DetailRow
              label="Items"
              value={`${selectedFile.count} ${
                selectedFile.count === 1 ? 'item' : 'items'
              }`}
            />
          )}
        </div>
      </div>
    );
  }

  const metadata = selectedFileMetadata;

  const copyPath = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.path);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy path:', err);
    }
  };

  const openFile = () => {
    // This would typically open the file in a viewer or download it
    // For now, we'll open a new tab with the file URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    window.open(`${apiUrl}/api/files/download?path=${encodeURIComponent(selectedFile.path)}`, '_blank');
  };

  return (
    <div className="p-4">
      {/* File header */}
      <div className="flex items-start gap-3">
        <FileTypeIcon
          extension={selectedFile.extension}
          className="h-10 w-10 flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-medium text-text-primary">
            {selectedFile.name}
          </h3>
          <p className="text-sm text-text-secondary">
            {selectedFile.extension?.toUpperCase() || 'File'}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={openFile}
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80"
        >
          <ExternalLinkIcon className="h-4 w-4" />
          Open
        </button>
        <button
          onClick={copyPath}
          className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent"
        >
          {copySuccess ? (
            <>
              <CheckIcon className="h-4 w-4 text-success" />
              Copied!
            </>
          ) : (
            <>
              <CopyIcon className="h-4 w-4" />
              Copy Path
            </>
          )}
        </button>
      </div>

      {/* Metadata section */}
      <div className="mt-6">
        <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-secondary">
          File Information
        </h4>

        {metadataLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-surface" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
          </div>
        ) : (
          <div className="space-y-3">
            <DetailRow label="Path" value={selectedFile.path} mono />
            {metadata?.size !== undefined && (
              <DetailRow label="Size" value={formatFileSize(metadata.size)} />
            )}
            {metadata?.modified && (
              <DetailRow
                label="Modified"
                value={formatDate(metadata.modified)}
              />
            )}
            {metadata?.mimeType && (
              <DetailRow label="Type" value={metadata.mimeType} />
            )}
            {metadata?.ticker && (
              <DetailRow label="Ticker" value={metadata.ticker} />
            )}
            {metadata?.formType && (
              <DetailRow label="Form Type" value={metadata.formType} />
            )}
            {metadata?.source && (
              <DetailRow label="Source" value={metadata.source} />
            )}
            {metadata?.filingDate && (
              <DetailRow label="Filing Date" value={metadata.filingDate} />
            )}
          </div>
        )}
      </div>

      {/* File Preview Section */}
      {selectedFile.type === 'file' && (
        <div className="mt-6">
          <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-secondary">
            Preview
          </h4>
          <div className="overflow-hidden rounded-lg border border-border">
            <FilePreview />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-text-secondary">{label}</span>
      <span
        className={`text-sm text-text-primary ${
          mono ? 'break-all font-mono text-xs' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Icons
function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

function FileTypeIcon({
  extension,
  className,
}: {
  extension?: string;
  className?: string;
}) {
  const ext = extension?.toLowerCase();

  const colorMap: Record<string, string> = {
    pdf: 'text-red-400',
    md: 'text-blue-400',
    htm: 'text-orange-400',
    html: 'text-orange-400',
    txt: 'text-gray-400',
    json: 'text-yellow-400',
    xml: 'text-green-400',
  };

  const color = colorMap[ext || ''] || 'text-text-secondary';

  return (
    <div className={`${className} ${color}`}>
      <svg fill="currentColor" viewBox="0 0 20 20" className="h-full w-full">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
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

export default FileDetails;
