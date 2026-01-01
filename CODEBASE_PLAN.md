# Filings Frontend - Detailed Codebase Plan

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Backend** | FastAPI (Python 3.12+) | Async, fast, type-safe, integrates with existing Python CLIs |
| **Frontend** | React 18 + TypeScript | Modern, performant, excellent ecosystem |
| **Build Tool** | Vite | Fast HMR, optimized builds |
| **Styling** | Tailwind CSS | Utility-first, minimal CSS, consistent design |
| **State** | Zustand | Lightweight, simple, no boilerplate |
| **File Tree** | react-arborist | Virtualized tree, handles 100k+ nodes |
| **PDF Viewer** | react-pdf | Native PDF rendering |
| **Markdown** | react-markdown | Fast rendering with syntax highlighting |
| **Package Mgmt** | uv (backend), pnpm (frontend) | Fast, modern package managers |
| **IPC** | WebSocket | Real-time CLI output streaming |

---

## Directory Structure

```
filings_frontend/
├── pyproject.toml              # Backend dependencies (uv)
├── uv.lock
├── .env                        # Environment configuration
├── .env.example
│
├── backend/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Path detection, settings
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── files.py            # File system operations
│   │   ├── commands.py         # CLI command execution
│   │   └── settings.py         # User preferences
│   ├── services/
│   │   ├── __init__.py
│   │   ├── file_scanner.py     # Async file system traversal
│   │   ├── command_executor.py # Subprocess management + streaming
│   │   └── path_resolver.py    # Cross-platform path handling
│   ├── models/
│   │   ├── __init__.py
│   │   ├── file_node.py        # File/folder tree node
│   │   ├── command_schema.py   # CLI command definitions
│   │   └── settings.py         # User settings model
│   └── cli_schemas/
│       ├── __init__.py
│       ├── filings.py          # Filings CLI command schemas
│       └── transcripts.py      # Transcripts CLI command schemas
│
├── frontend/
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── index.html
│   │
│   ├── src/
│   │   ├── main.tsx            # React entry point
│   │   ├── App.tsx             # Root component + routing
│   │   ├── index.css           # Tailwind imports
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── TabNav.tsx
│   │   │   │   └── SettingsModal.tsx
│   │   │   │
│   │   │   ├── explorer/
│   │   │   │   ├── Explorer.tsx          # Main explorer container
│   │   │   │   ├── FileTree.tsx          # Virtualized tree (react-arborist)
│   │   │   │   ├── FileFilters.tsx       # Filter controls
│   │   │   │   ├── HierarchySelector.tsx # Hierarchy dropdown
│   │   │   │   ├── FileDetails.tsx       # Selected file info
│   │   │   │   └── FilePreview.tsx       # PDF/MD/TXT preview
│   │   │   │
│   │   │   ├── commands/
│   │   │   │   ├── Commands.tsx          # Main commands container
│   │   │   │   ├── CommandList.tsx       # Grouped command sidebar
│   │   │   │   ├── CommandForm.tsx       # Dynamic form builder
│   │   │   │   ├── CommandPreview.tsx    # Generated command display
│   │   │   │   └── CommandOutput.tsx     # Streaming output display
│   │   │   │
│   │   │   └── shared/
│   │   │       ├── SearchInput.tsx
│   │   │       ├── MultiSelect.tsx
│   │   │       ├── DatePicker.tsx
│   │   │       ├── TickerInput.tsx       # Autocomplete ticker input
│   │   │       └── LoadingSpinner.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useFiles.ts               # File data fetching
│   │   │   ├── useCommands.ts            # Command execution
│   │   │   ├── useWebSocket.ts           # WS connection management
│   │   │   └── useSettings.ts            # Settings persistence
│   │   │
│   │   ├── store/
│   │   │   ├── index.ts                  # Zustand store setup
│   │   │   ├── fileStore.ts              # File tree state
│   │   │   ├── commandStore.ts           # Command execution state
│   │   │   └── settingsStore.ts          # User preferences
│   │   │
│   │   ├── api/
│   │   │   ├── client.ts                 # Axios instance
│   │   │   ├── files.ts                  # File API calls
│   │   │   ├── commands.ts               # Command API calls
│   │   │   └── settings.ts               # Settings API calls
│   │   │
│   │   ├── types/
│   │   │   ├── file.ts                   # File/folder types
│   │   │   ├── command.ts                # Command schema types
│   │   │   └── settings.ts               # Settings types
│   │   │
│   │   └── utils/
│   │       ├── formatters.ts             # Size, date formatting
│   │       ├── tree.ts                   # Tree transformation utils
│   │       └── constants.ts              # File types, form types, etc.
│   │
│   └── public/
│       └── favicon.svg
│
└── scripts/
    ├── dev.sh                  # Start both backend + frontend
    └── build.sh                # Production build
```

---

## Backend Implementation Details

### 1. `backend/config.py` - Cross-Platform Path Detection

```python
"""
Handles path detection across Mac/Windows.
Uses environment variables with fallback detection.
"""

import os
import platform
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings with cross-platform path detection."""

    # Auto-detected based on platform
    dropbox_root: Path = None
    files_root: Path = None
    filings_code: Path = None
    transcripts_code: Path = None

    # Server settings
    host: str = "127.0.0.1"
    port: int = 8000

    class Config:
        env_file = ".env"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._detect_paths()

    def _detect_paths(self):
        """Detect Dropbox paths based on platform."""
        system = platform.system()

        if system == "Darwin":  # macOS
            self.dropbox_root = Path("/Users/npw/PL3 Dropbox")
        elif system == "Windows":
            self.dropbox_root = Path("D:/pl3 dropbox")
        else:
            raise RuntimeError(f"Unsupported platform: {system}")

        # Derived paths
        self.files_root = self.dropbox_root / "files"
        self.filings_code = self.dropbox_root / "Code" / "filings"
        self.transcripts_code = self.dropbox_root / "Code" / "transcripts"
```

### 2. `backend/services/file_scanner.py` - Async File Traversal

```python
"""
High-performance async file scanner with caching.
Uses asyncio for non-blocking I/O.
"""

import asyncio
from pathlib import Path
from typing import AsyncIterator
from backend.models.file_node import FileNode

class FileScanner:
    """Scans file system and builds tree structure."""

    def __init__(self, root: Path):
        self.root = root
        self._cache: dict[str, FileNode] = {}
        self._cache_time: float = 0

    async def scan(
        self,
        sources: list[str] = None,
        file_types: list[str] = None,
        tickers: list[str] = None,
        search: str = None,
        hierarchy: str = "source_form_ticker_date"
    ) -> FileNode:
        """
        Scan files with filters and return tree structure.

        Args:
            sources: Filter by source (Filings, Transcripts, etc.)
            file_types: Filter by extension (pdf, md, htm, etc.)
            tickers: Filter by ticker symbol
            search: Filename search string
            hierarchy: Tree organization mode

        Returns:
            Root FileNode with filtered children
        """
        # Implementation uses os.scandir for speed
        # Applies filters during traversal (not after)
        # Builds tree according to hierarchy param
        ...

    async def get_file_metadata(self, path: Path) -> dict:
        """Get detailed metadata for a single file."""
        stat = path.stat()
        return {
            "path": str(path),
            "name": path.name,
            "size": stat.st_size,
            "modified": stat.st_mtime,
            "extension": path.suffix.lower(),
        }
```

### 3. `backend/services/command_executor.py` - CLI Execution with Streaming

```python
"""
Executes CLI commands with real-time output streaming via WebSocket.
"""

import asyncio
import subprocess
from typing import AsyncIterator

class CommandExecutor:
    """Manages CLI command execution with streaming output."""

    def __init__(self, filings_path: Path, transcripts_path: Path):
        self.filings_path = filings_path
        self.transcripts_path = transcripts_path

    async def execute(
        self,
        cli: str,  # "filings" or "transcripts"
        command: str,
        args: list[str]
    ) -> AsyncIterator[str]:
        """
        Execute command and yield output lines as they arrive.

        Uses asyncio.subprocess for non-blocking execution.
        """
        cmd = [cli, command, *args]

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            cwd=self.filings_path if cli == "filings" else self.transcripts_path
        )

        async for line in process.stdout:
            yield line.decode().rstrip()

        await process.wait()
        yield f"[Process exited with code {process.returncode}]"
```

### 4. `backend/cli_schemas/filings.py` - Command Schema Definitions

```python
"""
Schema definitions for filings CLI commands.
Used to generate dynamic forms in frontend.
"""

from backend.models.command_schema import (
    CommandSchema, Argument, Option, OptionType
)

FILINGS_COMMANDS: dict[str, CommandSchema] = {
    "download": CommandSchema(
        name="download",
        description="Download filings for a single ticker",
        group="download",
        arguments=[
            Argument(name="ticker", required=True, description="Ticker symbol")
        ],
        options=[
            Option(
                name="types", short="-t", type=OptionType.MULTI_SELECT,
                choices=["10-K", "10-Q", "8-K", "S-1", "DEF 14A", "6-K", "20-F"],
                description="Filing types to download"
            ),
            Option(
                name="start-date", short="-s", type=OptionType.DATE,
                description="Start date (YYYY-MM-DD)"
            ),
            Option(
                name="end-date", short="-e", type=OptionType.DATE,
                description="End date (YYYY-MM-DD)"
            ),
            Option(
                name="limit", short="-l", type=OptionType.INTEGER,
                description="Max filings per type"
            ),
            Option(
                name="format", short="-f", type=OptionType.MULTI_SELECT,
                choices=["pdf", "htm"], default=["pdf", "htm"],
                description="Download formats"
            ),
            Option(
                name="no-exhibits", type=OptionType.FLAG,
                description="Skip exhibit documents"
            ),
            Option(
                name="no-check-aliases", type=OptionType.FLAG,
                description="Disable alias checking"
            ),
            Option(
                name="no-database", type=OptionType.FLAG,
                description="Disable database usage"
            ),
        ]
    ),
    # ... other commands defined similarly
}
```

### 5. `backend/routes/files.py` - File API Endpoints

```python
"""
File system API endpoints.
"""

from fastapi import APIRouter, Query
from backend.services.file_scanner import FileScanner
from backend.config import get_settings

router = APIRouter(prefix="/api/files", tags=["files"])

@router.get("/tree")
async def get_file_tree(
    sources: list[str] = Query(default=None),
    file_types: list[str] = Query(default=None),
    tickers: list[str] = Query(default=None),
    search: str = Query(default=None),
    hierarchy: str = Query(default="source_form_ticker_date"),
):
    """Get filtered file tree."""
    settings = get_settings()
    scanner = FileScanner(settings.files_root)
    return await scanner.scan(
        sources=sources,
        file_types=file_types,
        tickers=tickers,
        search=search,
        hierarchy=hierarchy,
    )

@router.get("/metadata/{path:path}")
async def get_file_metadata(path: str):
    """Get metadata for a specific file."""
    ...

@router.get("/content/{path:path}")
async def get_file_content(path: str):
    """Get file content (for preview)."""
    ...

@router.get("/tickers")
async def get_available_tickers():
    """Get list of all available ticker symbols."""
    ...

@router.get("/form-types")
async def get_available_form_types():
    """Get list of all available form types."""
    ...
```

### 6. `backend/routes/commands.py` - Command Execution Endpoints

```python
"""
CLI command execution endpoints with WebSocket streaming.
"""

from fastapi import APIRouter, WebSocket
from backend.services.command_executor import CommandExecutor
from backend.cli_schemas import FILINGS_COMMANDS, TRANSCRIPTS_COMMANDS

router = APIRouter(prefix="/api/commands", tags=["commands"])

@router.get("/schemas/{cli}")
async def get_command_schemas(cli: str):
    """Get command schemas for UI form generation."""
    if cli == "filings":
        return FILINGS_COMMANDS
    elif cli == "transcripts":
        return TRANSCRIPTS_COMMANDS
    raise HTTPException(404, "Unknown CLI")

@router.websocket("/execute")
async def execute_command(websocket: WebSocket):
    """WebSocket endpoint for command execution with streaming."""
    await websocket.accept()

    data = await websocket.receive_json()
    cli = data["cli"]
    command = data["command"]
    args = data["args"]

    executor = CommandExecutor(...)

    async for line in executor.execute(cli, command, args):
        await websocket.send_text(line)

    await websocket.close()
```

---

## Frontend Implementation Details

### 1. `frontend/src/store/fileStore.ts` - Zustand File State

```typescript
/**
 * File explorer state management with Zustand.
 */

import { create } from 'zustand';
import { FileNode, FileFilters, Hierarchy } from '@/types/file';
import { fetchFileTree } from '@/api/files';

interface FileStore {
  // State
  tree: FileNode | null;
  selectedFile: FileNode | null;
  filters: FileFilters;
  hierarchy: Hierarchy;
  loading: boolean;
  error: string | null;

  // Actions
  setFilters: (filters: Partial<FileFilters>) => void;
  setHierarchy: (hierarchy: Hierarchy) => void;
  selectFile: (file: FileNode | null) => void;
  fetchTree: () => Promise<void>;
}

export const useFileStore = create<FileStore>((set, get) => ({
  tree: null,
  selectedFile: null,
  filters: {
    sources: ['Filings', 'Transcripts'],
    fileTypes: ['pdf', 'md'],
    tickers: [],
    search: '',
    dateRange: { start: null, end: null },
  },
  hierarchy: 'source_form_ticker_date',
  loading: false,
  error: null,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
    get().fetchTree(); // Debounced in actual implementation
  },

  setHierarchy: (hierarchy) => {
    set({ hierarchy });
    get().fetchTree();
  },

  selectFile: (file) => set({ selectedFile: file }),

  fetchTree: async () => {
    const { filters, hierarchy } = get();
    set({ loading: true, error: null });

    try {
      const tree = await fetchFileTree(filters, hierarchy);
      set({ tree, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
}));
```

### 2. `frontend/src/components/explorer/FileTree.tsx` - Virtualized Tree

```tsx
/**
 * Virtualized file tree using react-arborist.
 * Handles 100k+ nodes efficiently.
 */

import { Tree } from 'react-arborist';
import { useFileStore } from '@/store/fileStore';
import { FileNode } from '@/types/file';
import { FileIcon } from './FileIcon';

export function FileTree() {
  const { tree, selectedFile, selectFile } = useFileStore();

  if (!tree) return <LoadingSpinner />;

  return (
    <Tree
      data={tree.children}
      width="100%"
      height={600}
      rowHeight={28}
      indent={16}
      overscanCount={20}
      selection={selectedFile?.id}
      onSelect={(nodes) => selectFile(nodes[0]?.data)}
    >
      {({ node, style, dragHandle }) => (
        <div
          style={style}
          ref={dragHandle}
          className={cn(
            'flex items-center gap-2 px-2 py-1 cursor-pointer rounded',
            'hover:bg-surface-hover',
            node.isSelected && 'bg-accent/20'
          )}
          onClick={() => node.isLeaf ? selectFile(node.data) : node.toggle()}
        >
          <FileIcon type={node.data.type} extension={node.data.extension} />
          <span className="truncate text-sm">{node.data.name}</span>
          {node.data.count && (
            <span className="text-xs text-secondary ml-auto">
              {node.data.count}
            </span>
          )}
        </div>
      )}
    </Tree>
  );
}
```

### 3. `frontend/src/components/commands/CommandForm.tsx` - Dynamic Form

```tsx
/**
 * Dynamic command form generated from schema.
 */

import { useMemo } from 'react';
import { CommandSchema, Option } from '@/types/command';
import { useCommandStore } from '@/store/commandStore';

interface CommandFormProps {
  schema: CommandSchema;
}

export function CommandForm({ schema }: CommandFormProps) {
  const { formValues, setFormValue } = useCommandStore();

  const generatedCommand = useMemo(() => {
    return buildCommandString(schema, formValues);
  }, [schema, formValues]);

  return (
    <div className="space-y-4">
      {/* Required Arguments */}
      <section className="space-y-3">
        <h4 className="text-sm font-medium text-secondary">Required</h4>
        {schema.arguments.map((arg) => (
          <FormField key={arg.name} arg={arg} />
        ))}
      </section>

      {/* Options */}
      <section className="space-y-3">
        <h4 className="text-sm font-medium text-secondary">Options</h4>
        {schema.options.map((option) => (
          <OptionField key={option.name} option={option} />
        ))}
      </section>

      {/* Generated Command Preview */}
      <CommandPreview command={generatedCommand} />

      {/* Execute Button */}
      <div className="flex gap-2">
        <Button onClick={() => executeCommand(generatedCommand)}>
          ▶ Run
        </Button>
        <Button variant="secondary" onClick={() => copyToClipboard(generatedCommand)}>
          📋 Copy
        </Button>
      </div>
    </div>
  );
}

function OptionField({ option }: { option: Option }) {
  switch (option.type) {
    case 'multi_select':
      return <MultiSelectField option={option} />;
    case 'date':
      return <DateField option={option} />;
    case 'integer':
      return <NumberField option={option} />;
    case 'flag':
      return <CheckboxField option={option} />;
    case 'text':
    default:
      return <TextField option={option} />;
  }
}
```

### 4. `frontend/src/hooks/useWebSocket.ts` - WebSocket Management

```typescript
/**
 * WebSocket hook for command output streaming.
 */

import { useCallback, useRef, useState } from 'react';

interface UseWebSocketOptions {
  onMessage: (data: string) => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(url: string, options: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => setConnected(true);
    wsRef.current.onmessage = (e) => options.onMessage(e.data);
    wsRef.current.onclose = () => {
      setConnected(false);
      options.onClose?.();
    };
    wsRef.current.onerror = (e) => options.onError?.(e);
  }, [url, options]);

  const send = useCallback((data: unknown) => {
    wsRef.current?.send(JSON.stringify(data));
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
  }, []);

  return { connect, send, disconnect, connected };
}
```

### 5. `frontend/src/components/explorer/FilePreview.tsx` - Multi-Format Preview

```tsx
/**
 * File preview component supporting PDF, Markdown, and text.
 */

import { Document, Page } from 'react-pdf';
import ReactMarkdown from 'react-markdown';
import { useFileStore } from '@/store/fileStore';
import { useQuery } from '@tanstack/react-query';
import { fetchFileContent } from '@/api/files';

export function FilePreview() {
  const { selectedFile } = useFileStore();

  const { data: content, isLoading } = useQuery({
    queryKey: ['file-content', selectedFile?.path],
    queryFn: () => fetchFileContent(selectedFile!.path),
    enabled: !!selectedFile && !selectedFile.isDirectory,
  });

  if (!selectedFile) {
    return <EmptyState>Select a file to preview</EmptyState>;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  switch (selectedFile.extension) {
    case '.pdf':
      return <PdfPreview url={content.url} />;
    case '.md':
      return <MarkdownPreview content={content.text} />;
    case '.htm':
    case '.html':
      return <HtmlPreview content={content.text} />;
    case '.txt':
    case '.json':
    default:
      return <TextPreview content={content.text} />;
  }
}

function PdfPreview({ url }: { url: string }) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);

  return (
    <div className="pdf-viewer">
      <Document file={url} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
        <Page pageNumber={page} width={500} />
      </Document>
      <PaginationControls page={page} total={numPages} onChange={setPage} />
    </div>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none p-4">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
```

---

## API Contracts

### File Tree Response

```typescript
interface FileTreeResponse {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  extension?: string;
  size?: number;
  modified?: number;
  count?: number;  // Number of items in folder
  children?: FileTreeResponse[];
}
```

### Command Schema Response

```typescript
interface CommandSchema {
  name: string;
  description: string;
  group: string;
  arguments: {
    name: string;
    required: boolean;
    description: string;
  }[];
  options: {
    name: string;
    short?: string;
    type: 'text' | 'integer' | 'date' | 'flag' | 'multi_select';
    choices?: string[];
    default?: unknown;
    description: string;
  }[];
}
```

### WebSocket Command Execution

```typescript
// Client -> Server
interface ExecuteRequest {
  cli: 'filings' | 'transcripts';
  command: string;
  args: string[];
}

// Server -> Client (streaming)
// Plain text lines, one per message
```

---

## Performance Optimizations

1. **File Tree**
   - Virtualized rendering (only visible nodes in DOM)
   - Lazy loading of deep directories
   - Server-side filtering (don't send filtered-out files)
   - 5-minute cache with manual refresh option

2. **CLI Output**
   - WebSocket streaming (not polling)
   - Output buffering (batch DOM updates)
   - Auto-scroll with pause detection

3. **Frontend**
   - Code splitting per tab
   - React.memo for tree nodes
   - Debounced filter inputs
   - Image/PDF lazy loading

---

## Implementation Phases

### Phase 1: Core Infrastructure (Backend Foundation)
- [ ] Set up project structure with uv
- [ ] Implement `config.py` with path detection
- [ ] Create `file_scanner.py` with basic traversal
- [ ] Build `/api/files/tree` endpoint
- [ ] Add ticker and form-type list endpoints

### Phase 2: CLI Integration (Command System)
- [ ] Define all command schemas in `cli_schemas/`
- [ ] Implement `command_executor.py`
- [ ] Create WebSocket endpoint for streaming
- [ ] Test with actual filings/transcripts CLIs

### Phase 3: Frontend Shell (React Setup)
- [ ] Initialize Vite + React + TypeScript
- [ ] Set up Tailwind with dark theme
- [ ] Create layout components (Header, TabNav)
- [ ] Implement Zustand stores
- [ ] Build API client layer

### Phase 4: File Explorer (Core Feature)
- [ ] Build FileTree with react-arborist
- [ ] Implement FileFilters component
- [ ] Add HierarchySelector dropdown
- [ ] Create FileDetails panel
- [ ] Build FilePreview (PDF, MD, text)

### Phase 5: Command Interface (CLI UI)
- [ ] Build CommandList sidebar
- [ ] Implement dynamic CommandForm
- [ ] Add CommandPreview with copy
- [ ] Create CommandOutput with streaming
- [ ] Connect WebSocket for real-time output

### Phase 6: Polish & Testing
- [ ] Settings modal with persistence
- [ ] Error handling throughout
- [ ] Loading states and skeletons
- [ ] Keyboard navigation
- [ ] Cross-platform testing (Mac/Windows)

---

## File Count Estimates

| Category | Files | Lines (est.) |
|----------|-------|--------------|
| Backend Python | 15 | ~1,200 |
| Frontend TypeScript | 35 | ~2,500 |
| Config/Build | 8 | ~200 |
| **Total** | **~58** | **~3,900** |

---

## Key Design Decisions

1. **Why FastAPI over Flask/Django?**
   - Native async support for file scanning
   - Built-in WebSocket support
   - Automatic OpenAPI docs
   - Type validation with Pydantic

2. **Why Zustand over Redux/Context?**
   - Minimal boilerplate
   - Easy async actions
   - No provider wrapper needed
   - Great TypeScript support

3. **Why react-arborist for tree?**
   - Handles 100k+ nodes via virtualization
   - Built-in keyboard navigation
   - Drag-and-drop ready (future feature)
   - Active maintenance

4. **Why WebSocket for CLI output?**
   - True real-time streaming
   - Lower overhead than polling
   - Server can push immediately
   - Clean connection lifecycle
