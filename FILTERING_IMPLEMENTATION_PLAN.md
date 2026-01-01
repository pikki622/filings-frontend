# Advanced Filtering System Implementation Plan

## Overview
This document outlines the implementation plan for overhauling the filtering system in the Filings Frontend application.

## Current State Analysis

### Existing Components
- `FileFilters.tsx` - Main filter UI with search, sources, file types, tickers, date range
- `HierarchySelector.tsx` - Dropdown for hierarchy view (to be removed)
- `Explorer.tsx` - Main container component
- `fileStore.ts` - Zustand store managing filter state
- `file.ts` - Type definitions for filters

### Current Filter Flow
1. User interacts with filter UI
2. `setFilters()` called with partial update
3. 300ms debounce triggers `fetchTree()`
4. API call to `/api/files/tree` with filter params
5. Tree re-renders with filtered results

## Requirements

### 1. Collapsible Filter Section
- Filter panel should be collapsible/expandable
- State preserved across toggles
- Default: expanded

### 2. Remove Hierarchy Selector
- Delete `HierarchySelector.tsx`
- Remove hierarchy from store and API calls
- Use fixed hierarchy (source_form_ticker_date)

### 3. Source Buttons (Filings/Transcripts)
- Keep existing toggle buttons
- Only show Filings and Transcripts (remove Research, Presentations if unused)

### 4. File Type "All" Button
- Add "All" button that shows all file types
- Pre-selected by default
- When specific types selected, "All" becomes unselected
- When "All" clicked, clear all specific type selections

### 5. Dynamic Type Filters (Filing Types / Event Types)

#### When Filings Selected - Show Form Types (3 columns, scrollable):
```
10-K    10-Q    8-K     10-12B  10-12G  144
20-F    3       4       5       6-K     D
DEF 14A DEFA14A S-1     S-3     S-4     F-1
SC 13D  SC 13G  ... (232 total form types)
```

#### When Transcripts Selected - Show Event Types:
```
Earnings           Conference          SalesRelease
MergerAcquisition  ShareholderMeeting  Guidance
InvestorDay        ProductEvent        BI
ModelingCall       Partnership         Acquiring
```

### 6. Enhanced File List with Sortable Columns
- Columns: Name, Date Modified, Size, Type, Ticker
- Click column header to sort:
  - First click: Sort ascending (↑)
  - Second click: Sort descending (↓)
  - Third click: Remove sort
- Visual indicator for sort direction

### 7. Ticker Filter Enhancement
- 3-column scrollable button grid
- Text input that filters visible buttons
- Show available tickers dynamically (based on other filters)

### 8. Date Range Filtering
- Range slider with min/max from available files
- Year buttons (scrollable): 2000, 2001, ..., 2025
- Month buttons (scrollable): Jan, Feb, ..., Dec
- Clicking year/month sets appropriate date range

### 9. Cross-Filter Dynamics
- Each filter affects available options in other filters
- Example: Selecting AAPL limits dates to AAPL's file dates
- Example: Selecting 10-K limits tickers to those with 10-K filings
- Requires backend API to return available filter options

## Implementation Phases

### Phase 1: Backend API Updates
1. Add endpoint to get available filter options based on current filters
2. Return available: tickers, form types, event types, date range
3. Support cross-filtering logic

### Phase 2: Store Updates
1. Remove hierarchy from store
2. Add form types and event types to filters
3. Add available options state
4. Add sort state (column, direction)

### Phase 3: UI Components

#### New Components to Create:
1. `FilterSection.tsx` - Reusable collapsible section wrapper
2. `TypeFilterGrid.tsx` - 3-column scrollable button grid
3. `TickerFilterGrid.tsx` - Ticker buttons with search
4. `DateRangeSlider.tsx` - Slider with year/month buttons
5. `SortableHeader.tsx` - Column header with sort toggle
6. `FileListTable.tsx` - Table view with sortable columns

#### Components to Modify:
1. `FileFilters.tsx` - Restructure with new filter components
2. `Explorer.tsx` - Remove HierarchySelector, add FileListTable
3. `FileTree.tsx` - May become optional/alternate view

#### Components to Delete:
1. `HierarchySelector.tsx`

### Phase 4: Integration & Testing
1. Wire up all components
2. Test cross-filtering
3. Test sort functionality
4. Performance testing with large datasets

## Data Structures

### Updated FileFilters Interface
```typescript
interface FileFilters {
  sources: ('Filings' | 'Transcripts')[];
  fileTypes: string[];  // Empty = all types
  formTypes: string[];  // SEC form types (when Filings)
  eventTypes: string[]; // Transcript event types (when Transcripts)
  tickers: string[];
  search: string;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}
```

### New AvailableOptions Interface
```typescript
interface AvailableFilterOptions {
  tickers: string[];
  formTypes: string[];
  eventTypes: string[];
  dateRange: {
    min: string;
    max: string;
  };
  years: number[];
}
```

### Sort State
```typescript
interface SortState {
  column: 'name' | 'date' | 'size' | 'type' | 'ticker' | null;
  direction: 'asc' | 'desc' | null;
}
```

## SEC Form Types (Full List)
See backend for complete list of 232 form types including:
- Annual Reports: 10-K, 10-K-A, 10-K405, 10-KT, etc.
- Quarterly Reports: 10-Q, 10-Q-A, 10-QT, 10QSB, etc.
- Current Reports: 8-K, 8-K-A, 8-K12B, etc.
- Registration: S-1, S-3, S-4, F-1, F-3, F-4, etc.
- Ownership: 3, 4, 5, SC 13D, SC 13G, 144, etc.
- Proxy: DEF 14A, PRE 14A, DEFA14A, etc.
- Foreign: 20-F, 6-K, 40-F, etc.

## Transcript Event Types
- Earnings - Quarterly/annual earnings calls
- Conference - Investor conferences
- SalesRelease - Sales/revenue announcements
- MergerAcquisition - M&A discussions
- ShareholderMeeting - Annual shareholder meetings
- Guidance - Financial guidance
- InvestorDay - Investor day presentations
- ProductEvent - Product announcements
- BI - Business intelligence updates
- ModelingCall - Financial modeling
- Partnership - Partnership announcements

## File Size Estimates
- New components: ~800 lines
- Modified components: ~400 lines
- Deleted code: ~150 lines
- Net change: ~1050 lines

## Dependencies
- No new npm packages required
- Existing: zustand, react-arborist, tailwindcss
