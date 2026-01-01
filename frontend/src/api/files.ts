import { apiClient } from './client';
import type { FileNode, FileFilters, AvailableFilterOptions } from '../types/file';

export interface FileTreeResponse {
  tree: FileNode[];
  totalFiles: number;
  totalFolders: number;
}

// Helper to count files and folders in tree
function countNodes(nodes: FileNode[]): { files: number; folders: number } {
  let files = 0;
  let folders = 0;

  function traverse(node: FileNode) {
    if (node.type === 'file') {
      files++;
    } else {
      folders++;
      node.children?.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return { files, folders };
}

export interface FileMetadata {
  name: string;
  path: string;
  size: number;
  modified: number;
  created?: number;
  extension: string;
  mimeType: string;
  ticker?: string;
  formType?: string;
  source?: string;
  filingDate?: string;
}

export interface FileContentResponse {
  content: string;
  mimeType: string;
  encoding?: string;
}

/**
 * Fetch the file tree with filters
 */
export async function fetchFileTree(
  filters: FileFilters
): Promise<FileTreeResponse> {
  const params = new URLSearchParams();

  // Always use fixed hierarchy
  params.append('hierarchy', 'source_form_ticker_date');

  if (filters.search) {
    params.append('search', filters.search);
  }

  if (filters.sources.length > 0) {
    filters.sources.forEach((source) => params.append('sources', source));
  }

  if (filters.fileTypes.length > 0) {
    filters.fileTypes.forEach((type) => params.append('file_types', type));
  }

  if (filters.formTypes.length > 0) {
    filters.formTypes.forEach((type) => params.append('form_types', type));
  }

  if (filters.eventTypes.length > 0) {
    filters.eventTypes.forEach((type) => params.append('event_types', type));
  }

  if (filters.tickers.length > 0) {
    filters.tickers.forEach((ticker) => params.append('tickers', ticker));
  }

  if (filters.dateRange.start) {
    params.append('date_start', filters.dateRange.start);
  }

  if (filters.dateRange.end) {
    params.append('date_end', filters.dateRange.end);
  }

  // Backend returns FileNode[] directly, not wrapped
  const response = await apiClient.get<FileNode[]>('/api/files/tree', {
    params,
  });

  const tree = response.data;
  const counts = countNodes(tree);

  return {
    tree,
    totalFiles: counts.files,
    totalFolders: counts.folders,
  };
}

/**
 * Fetch metadata for a specific file
 */
export async function fetchFileMetadata(path: string): Promise<FileMetadata> {
  // Path is a URL parameter, needs encoding
  const encodedPath = encodeURIComponent(path);
  const response = await apiClient.get<FileMetadata>(`/api/files/metadata/${encodedPath}`);

  return response.data;
}

/**
 * Fetch the content of a file
 */
export async function fetchFileContent(path: string): Promise<FileContentResponse> {
  // Path is a URL parameter, needs encoding
  const encodedPath = encodeURIComponent(path);
  const response = await apiClient.get<FileContentResponse>(`/api/files/content/${encodedPath}`);

  return response.data;
}

/**
 * Fetch available tickers for autocomplete
 */
export async function fetchTickers(search?: string): Promise<string[]> {
  // Backend returns string[] directly
  const response = await apiClient.get<string[]>('/api/files/tickers', {
    params: search ? { search } : undefined,
  });

  return response.data;
}

/**
 * Fetch available form types
 */
export async function fetchFormTypes(): Promise<string[]> {
  // Backend returns string[] directly
  const response = await apiClient.get<string[]>('/api/files/form-types');

  return response.data;
}

/**
 * Fetch available filter options based on current filters
 * Used for cross-filter dynamics (e.g., selecting a ticker limits available dates)
 */
export async function fetchAvailableOptions(
  filters: Partial<FileFilters>
): Promise<AvailableFilterOptions> {
  const params = new URLSearchParams();

  if (filters.sources && filters.sources.length > 0) {
    filters.sources.forEach((source) => params.append('sources', source));
  }

  if (filters.fileTypes && filters.fileTypes.length > 0) {
    filters.fileTypes.forEach((type) => params.append('file_types', type));
  }

  if (filters.formTypes && filters.formTypes.length > 0) {
    filters.formTypes.forEach((type) => params.append('form_types', type));
  }

  if (filters.eventTypes && filters.eventTypes.length > 0) {
    filters.eventTypes.forEach((type) => params.append('event_types', type));
  }

  if (filters.tickers && filters.tickers.length > 0) {
    filters.tickers.forEach((ticker) => params.append('tickers', ticker));
  }

  if (filters.dateRange?.start) {
    params.append('date_start', filters.dateRange.start);
  }

  if (filters.dateRange?.end) {
    params.append('date_end', filters.dateRange.end);
  }

  const response = await apiClient.get<AvailableFilterOptions>('/api/files/available-options', {
    params,
  });

  return response.data;
}

/**
 * Download a file
 */
export async function downloadFile(path: string): Promise<Blob> {
  const response = await apiClient.get('/api/files/download', {
    params: { path },
    responseType: 'blob',
  });

  return response.data;
}

/**
 * Fetch children of a folder (lazy loading)
 */
export async function fetchFolderChildren(
  folderPath: string,
  fileTypes?: string[]
): Promise<FileNode[]> {
  const params = new URLSearchParams();

  if (fileTypes && fileTypes.length > 0) {
    fileTypes.forEach((type) => params.append('file_types', type));
  }

  // Path needs to be URL-encoded for the path parameter
  const encodedPath = encodeURIComponent(folderPath);
  const url = `/api/files/children/${encodedPath}${params.toString() ? '?' + params.toString() : ''}`;

  const response = await apiClient.get<FileNode[]>(url);
  return response.data;
}
