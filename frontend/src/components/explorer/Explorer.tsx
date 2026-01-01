import { useEffect } from 'react';
import { useFileStore } from '../../store/fileStore';
import { HierarchySelector } from './HierarchySelector';
import { FileFilters } from './FileFilters';
import { FileTree } from './FileTree';
import { FileDetails } from './FileDetails';

export function Explorer() {
  const { fetchTree, loading, error, totalFiles, totalFolders } = useFileStore();

  // Fetch tree on mount
  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Header with hierarchy selector and stats */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-medium text-text-primary">File Explorer</h2>
          <HierarchySelector />
        </div>
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span>{totalFolders.toLocaleString()} folders</span>
          <span>{totalFiles.toLocaleString()} files</span>
        </div>
      </div>

      {/* Filters section */}
      <FileFilters />

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-2 rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </div>
      )}

      {/* Main split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* File tree panel */}
        <div className="flex w-80 flex-shrink-0 flex-col border-r border-border">
          <div className="flex h-9 items-center border-b border-border bg-background px-3">
            <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Files
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <FileTree />
            )}
          </div>
        </div>

        {/* File details / preview panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex h-9 items-center border-b border-border bg-background px-3">
            <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Details & Preview
            </span>
          </div>
          <div className="flex-1 overflow-auto bg-surface/50">
            <FileDetails />
          </div>
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

export default Explorer;
