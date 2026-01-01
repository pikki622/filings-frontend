# Filings Frontend - UI Mockup

## Overall Layout
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FILINGS & TRANSCRIPTS                                    ☰ Settings            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐                                                │
│  │ 📁 Explorer │ │ ⚡ Commands │                                                 │
│  └─────────────┘ └─────────────┘                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                           [ACTIVE TAB CONTENT]                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tab 1: File Explorer

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  HIERARCHY: ┌──────────────────────────────────────┐                            │
│             │ Source → Form Type → Ticker → Date ▼ │                            │
│             └──────────────────────────────────────┘                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 🔍  Search files...                                              [×]    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  FILTERS:                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Source:     [Filings ✓] [Transcripts ✓] [Research ✓] [Presentations ✓]  │   │
│  │ File Type:  [PDF ✓] [MD ✓] [HTM ✓] [TXT] [JSON] [XLSX]                  │   │
│  │ Form Type:  [10-K ✓] [10-Q ✓] [8-K ✓] [S-1] [DEF 14A] [+12 more...]     │   │
│  │ Ticker:     ┌─────────────────────────────────────────────────────────┐ │   │
│  │             │ AAPL, MSFT, GOOGL...                           [×] [+]  │ │   │
│  │             └─────────────────────────────────────────────────────────┘ │   │
│  │ Date Range: [2020-01-01] to [2025-12-30]                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌───────────────────────────────────┬─────────────────────────────────────┐   │
│  │ TREE VIEW                         │ FILE DETAILS / PREVIEW              │   │
│  │ ─────────────────────────────     │ ──────────────────────────────────  │   │
│  │                                   │                                     │   │
│  │ ▼ 📁 Filings                      │ ┌─────────────────────────────────┐ │   │
│  │   ▼ 📁 10-K                       │ │ AAPL_10-K_2024-10-31.pdf        │ │   │
│  │     ▼ 📁 AAPL                     │ ├─────────────────────────────────┤ │   │
│  │       ▶ 📁 2024-10-31_000032...   │ │ Path: Filings/10-K/AAPL/...     │ │   │
│  │       ▶ 📁 2023-10-27_000032...   │ │ Size: 2.4 MB                    │ │   │
│  │       ▶ 📁 2022-10-28_000032...   │ │ Modified: 2024-11-01            │ │   │
│  │     ▶ 📁 MSFT                     │ │ Type: PDF                       │ │   │
│  │     ▶ 📁 GOOGL                    │ ├─────────────────────────────────┤ │   │
│  │   ▶ 📁 10-Q                       │ │ [Open] [Open Folder] [Copy Path]│ │   │
│  │   ▶ 📁 8-K                        │ └─────────────────────────────────┘ │   │
│  │ ▶ 📁 Transcripts                  │                                     │   │
│  │ ▶ 📁 Research                     │ ─────── PREVIEW ──────────────────  │   │
│  │ ▶ 📁 Presentations                │                                     │   │
│  │                                   │ ┌─────────────────────────────────┐ │   │
│  │                                   │ │                                 │ │   │
│  │                                   │ │   [PDF/MD/TXT Preview Area]     │ │   │
│  │                                   │ │                                 │ │   │
│  │                                   │ │   Embedded viewer for:          │ │   │
│  │                                   │ │   - PDF files                   │ │   │
│  │                                   │ │   - Markdown (rendered)         │ │   │
│  │                                   │ │   - Plain text                  │ │   │
│  │                                   │ │   - HTML                        │ │   │
│  │                                   │ │                                 │ │   │
│  │                                   │ └─────────────────────────────────┘ │   │
│  │                                   │                                     │   │
│  │ ─────────────────────────────     │                                     │   │
│  │ 📊 12,456 files (64.2 GB)         │                                     │   │
│  └───────────────────────────────────┴─────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Hierarchy Dropdown Options:
1. Source → Form Type → Ticker → Date (default)
2. Source → Ticker → Form Type → Date
3. Ticker → Source → Form Type → Date
4. Form Type → Ticker → Date
5. Date → Source → Ticker
6. File Type → Source → Ticker

---

## Tab 2: CLI Commands

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CATEGORY: ┌─────────────────┐  ┌─────────────────┐                             │
│            │ 📄 Filings  ▼  │  │ 📝 Transcripts  │                             │
│            └─────────────────┘  └─────────────────┘                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────┬───────────────────────────────────────┐   │
│  │ COMMANDS                        │ COMMAND CONFIGURATION                 │   │
│  │ ────────────────────────────    │ ────────────────────────────────────  │   │
│  │                                 │                                       │   │
│  │ ┌─────────────────────────────┐ │ filings download                      │   │
│  │ │ 🔍 Search commands...       │ │ ═══════════════════════════════════   │   │
│  │ └─────────────────────────────┘ │ Download filings for a single ticker  │   │
│  │                                 │                                       │   │
│  │ DOWNLOAD                        │ ┌─────────────────────────────────┐   │   │
│  │ ├─ download         ●          │ │ REQUIRED                        │   │   │
│  │ ├─ batch                       │ │ ────────────────────────────────│   │   │
│  │ ├─ download-all-types          │ │ ticker:  [AAPL          ]       │   │   │
│  │ └─ download-pdfs               │ └─────────────────────────────────┘   │   │
│  │                                 │                                       │   │
│  │ SEARCH & INFO                   │ ┌─────────────────────────────────┐   │   │
│  │ ├─ search                       │ │ OPTIONS                         │   │   │
│  │ ├─ cik                          │ │ ────────────────────────────────│   │   │
│  │ └─ database-stats               │ │                                 │   │   │
│  │                                 │ │ --types (-t):                   │   │   │
│  │ PROCESSING                      │ │ [10-K ✓] [10-Q ✓] [8-K] [S-1]   │   │   │
│  │ ├─ extract-sections             │ │                                 │   │   │
│  │ ├─ convert-pdfs                 │ │ --start-date (-s):              │   │   │
│  │ └─ convert-paper                │ │ [2020-01-01      ] 📅           │   │   │
│  │                                 │ │                                 │   │   │
│  │ DATABASE                        │ │ --end-date (-e):                │   │   │
│  │ ├─ update-database              │ │ [2025-12-30      ] 📅           │   │   │
│  │ └─ sync-downloads               │ │                                 │   │   │
│  │                                 │ │ --limit (-l):                   │   │   │
│  │ CONFIG                          │ │ [         ] (all)               │   │   │
│  │ ├─ config                       │ │                                 │   │   │
│  │ ├─ tickers                      │ │ --format (-f):                  │   │   │
│  │ └─ refresh-cache                │ │ [PDF ✓] [HTM ✓]                 │   │   │
│  │                                 │ │                                 │   │   │
│  │ UTILITIES                       │ │ [✓] --no-exhibits               │   │   │
│  │ └─ find-aliases                 │ │ [ ] --no-check-aliases          │   │   │
│  │                                 │ │ [ ] --no-database               │   │   │
│  │                                 │ └─────────────────────────────────┘   │   │
│  │                                 │                                       │   │
│  │                                 │ GENERATED COMMAND:                    │   │
│  │                                 │ ┌─────────────────────────────────┐   │   │
│  │                                 │ │ filings download AAPL \         │   │   │
│  │                                 │ │   --types 10-K --types 10-Q \   │   │   │
│  │                                 │ │   --start-date 2020-01-01 \     │   │   │
│  │                                 │ │   --format pdf --format htm \   │   │   │
│  │                                 │ │   --no-exhibits                 │   │   │
│  │                                 │ └─────────────────────────────────┘   │   │
│  │                                 │                                       │   │
│  │                                 │ ┌──────────┐  ┌────────────────────┐  │   │
│  │                                 │ │ ▶ RUN    │  │ 📋 Copy Command    │  │   │
│  │                                 │ └──────────┘  └────────────────────┘  │   │
│  └─────────────────────────────────┴───────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ OUTPUT                                                          [Clear] │   │
│  │ ───────────────────────────────────────────────────────────────────────  │   │
│  │ $ filings download AAPL --types 10-K --types 10-Q                       │   │
│  │                                                                          │   │
│  │ [████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 42%  Processing...       │   │
│  │                                                                          │   │
│  │ ✓ Found 45 filings for AAPL                                             │   │
│  │ ✓ Downloading 10-K filing from 2024-10-31...                            │   │
│  │ ✓ Downloading 10-K filing from 2023-10-27...                            │   │
│  │ ⋮                                                                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Settings Modal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Settings                                                          [×]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PATHS                                                                      │
│  ─────────────────────────────────────────────────────────────────────      │
│  Detected Platform: macOS                                                   │
│                                                                             │
│  Dropbox Root:    /Users/npw/PL3 Dropbox                      [Browse]     │
│  Files Root:      /Users/npw/PL3 Dropbox/files                [Browse]     │
│  Filings Code:    /Users/npw/PL3 Dropbox/Code/filings         [Browse]     │
│  Transcripts Code:/Users/npw/PL3 Dropbox/Code/transcripts     [Browse]     │
│                                                                             │
│  DISPLAY                                                                    │
│  ─────────────────────────────────────────────────────────────────────      │
│  Theme:           [◉ Dark  ○ Light  ○ System]                              │
│  Default Tab:     [Explorer ▼]                                              │
│  Tree Expansion:  [2 levels ▼]                                              │
│                                                                             │
│  PERFORMANCE                                                                │
│  ─────────────────────────────────────────────────────────────────────      │
│  File List Limit: [1000    ] files per view                                │
│  Cache Duration:  [5       ] minutes                                        │
│                                                                             │
│                                              [Cancel]  [Save Settings]      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Color Scheme (Dark Theme - Default)

```
Background:     #0D1117 (GitHub dark)
Surface:        #161B22
Border:         #30363D
Text Primary:   #E6EDF3
Text Secondary: #7D8590
Accent:         #58A6FF (blue)
Success:        #3FB950 (green)
Warning:        #D29922 (yellow)
Error:          #F85149 (red)

File Type Colors:
PDF:  #F85149 (red)
MD:   #58A6FF (blue)
HTM:  #D29922 (orange)
TXT:  #7D8590 (gray)
JSON: #3FB950 (green)
XLSX: #238636 (dark green)
```

---

## Responsive Behavior

**Desktop (>1200px)**: Full layout as shown above
**Tablet (768-1200px)**: Collapsible sidebar, stacked panels
**Mobile (<768px)**: Tab navigation, single panel view

---

## Key Interactions

1. **Tree View Navigation**
   - Click folder to expand/collapse
   - Click file to show details + preview
   - Double-click file to open in system viewer
   - Right-click for context menu

2. **Filters**
   - All filters apply immediately (debounced)
   - Clear individual filter with [×]
   - Clear all filters button

3. **Command Builder**
   - Select command from sidebar
   - Form fields auto-populate based on command schema
   - Real-time command preview
   - Validation with inline errors

4. **Command Output**
   - Streamed output (WebSocket)
   - Scrollable with auto-scroll toggle
   - Copy output button
   - Export to file option
