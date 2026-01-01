import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { FileNode, FileFilters, Hierarchy } from '../types/file';
import { DEFAULT_FILTERS } from '../types/file';
import { fetchFileTree, fetchFileMetadata, fetchFolderChildren, type FileMetadata } from '../api/files';

interface FileState {
  // Tree state
  tree: FileNode[];
  totalFiles: number;
  totalFolders: number;

  // Selection state
  selectedFile: FileNode | null;
  selectedFileMetadata: FileMetadata | null;

  // Filters and hierarchy
  filters: FileFilters;
  hierarchy: Hierarchy;

  // Loading states
  loading: boolean;
  metadataLoading: boolean;
  loadingNodes: Set<string>; // Track nodes that are loading children
  error: string | null;

  // Actions
  setFilters: (filters: Partial<FileFilters>) => void;
  resetFilters: () => void;
  setHierarchy: (hierarchy: Hierarchy) => void;
  selectFile: (file: FileNode | null) => void;
  fetchTree: () => Promise<void>;
  fetchMetadata: (path: string) => Promise<void>;
  loadChildren: (node: FileNode) => Promise<boolean>; // Returns true if children were loaded
  isNodeLoading: (nodeId: string) => boolean;
}

// Debounce helper
function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Helper to update a node's children in the tree (immutable update)
function updateNodeChildren(
  nodes: FileNode[],
  nodeId: string,
  children: FileNode[]
): FileNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, children };
    }
    if (node.children && node.children.length > 0) {
      return { ...node, children: updateNodeChildren(node.children, nodeId, children) };
    }
    return node;
  });
}

export const useFileStore = create<FileState>()(
  subscribeWithSelector((set, get) => {
    // Debounced fetch function
    const debouncedFetch = debounce(() => {
      get().fetchTree();
    }, 300);

    return {
      // Initial state
      tree: [],
      totalFiles: 0,
      totalFolders: 0,
      selectedFile: null,
      selectedFileMetadata: null,
      filters: DEFAULT_FILTERS,
      hierarchy: 'source_form_ticker_date',
      loading: false,
      metadataLoading: false,
      loadingNodes: new Set<string>(),
      error: null,

      // Actions
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
        debouncedFetch();
      },

      resetFilters: () => {
        set({ filters: DEFAULT_FILTERS });
        debouncedFetch();
      },

      setHierarchy: (hierarchy) => {
        set({ hierarchy });
        get().fetchTree();
      },

      selectFile: async (file) => {
        set({ selectedFile: file, selectedFileMetadata: null });
        if (file && file.type === 'file') {
          await get().fetchMetadata(file.path);
        }
      },

      fetchTree: async () => {
        const { filters, hierarchy } = get();
        set({ loading: true, error: null });

        try {
          const response = await fetchFileTree(filters, hierarchy);
          set({
            tree: response.tree,
            totalFiles: response.totalFiles,
            totalFolders: response.totalFolders,
            loading: false,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to fetch file tree';
          set({ error: message, loading: false });
        }
      },

      fetchMetadata: async (path) => {
        set({ metadataLoading: true });

        try {
          const metadata = await fetchFileMetadata(path);
          set({ selectedFileMetadata: metadata, metadataLoading: false });
        } catch (error) {
          console.error('Failed to fetch metadata:', error);
          set({ metadataLoading: false });
        }
      },

      loadChildren: async (node: FileNode) => {
        // Skip if not a folder or already has children loaded
        if (node.type !== 'folder') {
          return false;
        }

        // Skip if children are already loaded (not empty array)
        if (node.children && node.children.length > 0) {
          return false;
        }

        const { loadingNodes, filters, tree } = get();

        // Skip if already loading
        if (loadingNodes.has(node.id)) {
          return false;
        }

        // Mark as loading
        const newLoadingNodes = new Set(loadingNodes);
        newLoadingNodes.add(node.id);
        set({ loadingNodes: newLoadingNodes });

        try {
          // Fetch children from the API
          const children = await fetchFolderChildren(node.path, filters.fileTypes);

          // Update the tree with the new children
          const updatedTree = updateNodeChildren(tree, node.id, children);

          // Remove from loading set
          const finalLoadingNodes = new Set(get().loadingNodes);
          finalLoadingNodes.delete(node.id);

          set({
            tree: updatedTree,
            loadingNodes: finalLoadingNodes,
          });

          return true;
        } catch (error) {
          console.error('Failed to load children:', error);

          // Remove from loading set on error
          const finalLoadingNodes = new Set(get().loadingNodes);
          finalLoadingNodes.delete(node.id);
          set({ loadingNodes: finalLoadingNodes });

          return false;
        }
      },

      isNodeLoading: (nodeId: string) => {
        return get().loadingNodes.has(nodeId);
      },
    };
  })
);

// Subscribe to filter changes to auto-fetch (alternative approach)
// This runs once when the module is loaded
useFileStore.subscribe(
  (state) => state.filters,
  () => {
    // Filters changed, debounced fetch is already triggered in setFilters
  },
  { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
);
