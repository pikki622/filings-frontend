export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  extension?: string;
  size?: number;
  modified?: number;
  count?: number;
  children?: FileNode[];
}

export interface FileFilters {
  sources: string[];
  fileTypes: string[];
  tickers: string[];
  search: string;
  dateRange: { start: string | null; end: string | null };
}

export type Hierarchy =
  | 'source_form_ticker_date'
  | 'source_ticker_form_date'
  | 'ticker_source_form_date'
  | 'form_ticker_date'
  | 'date_source_ticker'
  | 'filetype_source_ticker';

export const HIERARCHY_LABELS: Record<Hierarchy, string> = {
  source_form_ticker_date: 'Source > Form > Ticker > Date',
  source_ticker_form_date: 'Source > Ticker > Form > Date',
  ticker_source_form_date: 'Ticker > Source > Form > Date',
  form_ticker_date: 'Form > Ticker > Date',
  date_source_ticker: 'Date > Source > Ticker',
  filetype_source_ticker: 'File Type > Source > Ticker',
};

export const DEFAULT_FILTERS: FileFilters = {
  sources: ['Filings'],  // Start with just Filings for performance
  fileTypes: ['pdf', 'md'],  // Focus on PDFs and Markdown
  tickers: [],
  search: '',
  dateRange: { start: null, end: null },
};

export const SOURCES = ['Filings', 'Transcripts', 'Research', 'Presentations'] as const;
export const FILE_TYPES = ['PDF', 'MD', 'HTM', 'TXT', 'JSON'] as const;
