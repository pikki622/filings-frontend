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
  ticker?: string;
  formType?: string;
  eventType?: string;
}

export interface FileFilters {
  sources: string[];
  fileTypes: string[];  // Empty array means "All"
  formTypes: string[];  // SEC form types (when Filings selected)
  eventTypes: string[]; // Transcript event types (when Transcripts selected)
  tickers: string[];
  search: string;
  dateRange: { start: string | null; end: string | null };
}

export interface AvailableFilterOptions {
  tickers: string[];
  formTypes: string[];
  eventTypes: string[];
  dateRange: {
    min: string | null;
    max: string | null;
  };
  years: number[];
}

export type SortColumn = 'name' | 'date' | 'size' | 'type' | 'ticker' | null;
export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

export const DEFAULT_FILTERS: FileFilters = {
  sources: ['Filings'],
  fileTypes: [],  // Empty = All file types
  formTypes: [],
  eventTypes: [],
  tickers: [],
  search: '',
  dateRange: { start: null, end: null },
};

export const DEFAULT_SORT: SortState = {
  column: null,
  direction: null,
};

// Sources available
export const SOURCES = ['Filings', 'Transcripts'] as const;
export const FILE_TYPES = ['PDF', 'MD', 'HTM', 'TXT', 'JSON'] as const;

// Common SEC form types (grouped by category)
export const SEC_FORM_TYPES = {
  annual: ['10-K', '10-K-A', '10-K405', '10-KT', '20-F', '40-F'],
  quarterly: ['10-Q', '10-Q-A', '10-QT'],
  current: ['8-K', '8-K-A', '8-K12B', '6-K'],
  ownership: ['3', '4', '5', '144', 'SC 13D', 'SC 13G', 'SC 13D-A', 'SC 13G-A'],
  proxy: ['DEF 14A', 'PRE 14A', 'DEFA14A', 'DEFM14A', 'DEF 14C'],
  registration: ['S-1', 'S-3', 'S-4', 'S-8', 'S-11', 'F-1', 'F-3', 'F-4'],
  other: ['424B2', '424B5', '425', 'FWP', 'D', 'ARS', 'CORRESP'],
} as const;

// All SEC form types in a flat array for display
export const ALL_SEC_FORM_TYPES = [
  '10-K', '10-K-A', '10-K405', '10-KT', '10-KT-A',
  '10-Q', '10-Q-A', '10-QT',
  '8-K', '8-K-A', '8-K12B', '8-K12G3',
  '20-F', '20-F-A', '40-F', '40-F-A',
  '6-K', '6-K-A',
  '3', '3-A', '4', '4-A', '5', '5-A',
  '144', '144-A',
  'SC 13D', 'SC 13D-A', 'SC 13G', 'SC 13G-A',
  'SC 14D9', 'SC TO-C', 'SC TO-I', 'SC TO-T',
  'DEF 14A', 'DEF 14C', 'DEFA14A', 'DEFA14C',
  'DEFM14A', 'DEFM14C', 'DEFN14A', 'DEFR14A',
  'PRE 14A', 'PRE 14C', 'PREC14A', 'PREM14A',
  'S-1', 'S-1-A', 'S-3', 'S-3-A', 'S-4', 'S-4-A',
  'S-8', 'S-11', 'F-1', 'F-1-A', 'F-3', 'F-3-A', 'F-4',
  '424A', '424B1', '424B2', '424B3', '424B4', '424B5', '424B7', '424B8',
  '425', 'FWP',
  'D', 'D-A',
  'ARS', 'CORRESP',
  'NT 10-K', 'NT 10-Q',
  '11-K', '13F-HR',
] as const;

// Transcript event types
export const TRANSCRIPT_EVENT_TYPES = [
  'Earnings',
  'Conference',
  'SalesRelease',
  'MergerAcquisition',
  'ShareholderMeeting',
  'Guidance',
  'InvestorDay',
  'ProductEvent',
  'BI',
  'ModelingCall',
  'Partnership',
] as const;

export type TranscriptEventType = typeof TRANSCRIPT_EVENT_TYPES[number];
