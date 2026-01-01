import { Tree, NodeRendererProps } from 'react-arborist';
import { useFileStore } from '../../store/fileStore';
import type { FileNode } from '../../types/file';
import { useCallback, useRef, useState, useEffect } from 'react';

// Map file extensions to colors
const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: 'text-red-400',
  md: 'text-blue-400',
  htm: 'text-orange-400',
  html: 'text-orange-400',
  txt: 'text-gray-400',
  json: 'text-yellow-400',
  xml: 'text-green-400',
  csv: 'text-emerald-400',
};

// Map sources to colors for folder icons
const SOURCE_COLORS: Record<string, string> = {
  filings: 'text-accent',
  transcripts: 'text-success',
  research: 'text-warning',
  presentations: 'text-purple-400',
};

export function FileTree() {
  const { tree, selectFile, selectedFile, loadChildren } = useFileStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 320, height: 400 });

  // Track container size with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Handle node toggle with lazy loading
  const handleToggle = useCallback(
    async (nodeId: string) => {
      // Find the node in the tree
      const findNode = (nodes: FileNode[], id: string): FileNode | null => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findNode(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const node = findNode(tree, nodeId);
      if (node && node.type === 'folder') {
        // Load children if needed (the function handles the check internally)
        await loadChildren(node);
      }
    },
    [tree, loadChildren]
  );

  if (tree.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center">
        <p className="text-sm text-text-secondary">
          No files found. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      <Tree<FileNode>
        data={tree}
        openByDefault={false}
        width={dimensions.width}
        height={dimensions.height}
        indent={16}
        rowHeight={28}
        overscanCount={10}
        paddingTop={8}
        paddingBottom={8}
        selection={selectedFile?.id}
        onSelect={(nodes) => {
          if (nodes.length > 0) {
            selectFile(nodes[0].data);
          }
        }}
        onToggle={(nodeId) => handleToggle(nodeId)}
      >
        {Node}
      </Tree>
    </div>
  );
}

function Node({ node, style, dragHandle }: NodeRendererProps<FileNode>) {
  const { data } = node;
  const isFolder = data.type === 'folder';
  const isSelected = node.isSelected;
  const isLoading = useFileStore((state) => state.isNodeLoading(data.id));

  // Get color based on type
  const getColor = () => {
    if (isFolder) {
      const lowerName = data.name.toLowerCase();
      for (const [source, color] of Object.entries(SOURCE_COLORS)) {
        if (lowerName.includes(source)) {
          return color;
        }
      }
      return 'text-text-secondary';
    }

    const ext = data.extension?.toLowerCase() || '';
    return FILE_TYPE_COLORS[ext] || 'text-text-secondary';
  };

  return (
    <div
      ref={dragHandle}
      style={style}
      className={`flex cursor-pointer items-center gap-1.5 rounded px-2 py-0.5 text-sm ${
        isSelected
          ? 'bg-accent/20 text-accent'
          : 'text-text-primary hover:bg-surface'
      }`}
      onClick={() => node.isInternal && node.toggle()}
    >
      {/* Expand/collapse arrow for folders */}
      {isFolder ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            node.toggle();
          }}
          className="flex h-4 w-4 items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner className="h-3 w-3" />
          ) : (
            <ChevronIcon
              className={`h-3 w-3 transition-transform ${
                node.isOpen ? 'rotate-90' : ''
              }`}
            />
          )}
        </button>
      ) : (
        <span className="w-4" />
      )}

      {/* Icon */}
      <span className={getColor()}>
        {isFolder ? (
          node.isOpen ? (
            <FolderOpenIcon className="h-4 w-4" />
          ) : (
            <FolderIcon className="h-4 w-4" />
          )
        ) : (
          <FileIcon className="h-4 w-4" extension={data.extension} />
        )}
      </span>

      {/* Name */}
      <span className="flex-1 truncate">{data.name}</span>

      {/* Count for folders */}
      {isFolder && data.count !== undefined && (
        <span className="text-xs text-text-secondary">{data.count}</span>
      )}

      {/* Extension badge for files */}
      {!isFolder && data.extension && (
        <span
          className={`rounded px-1 text-[10px] font-medium uppercase ${getColor()} opacity-60`}
        >
          {data.extension}
        </span>
      )}
    </div>
  );
}

// Icons
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`${className} animate-spin`}
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

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
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

function FolderOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z"
        clipRule="evenodd"
      />
      <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
    </svg>
  );
}

function FileIcon({
  className,
  extension,
}: {
  className?: string;
  extension?: string;
}) {
  const ext = extension?.toLowerCase();

  // PDF icon
  if (ext === 'pdf') {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  // Code file icon (json, htm, html, xml)
  if (['json', 'htm', 'html', 'xml'].includes(ext || '')) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  // Default document icon
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

export default FileTree;
