# Filings & Transcripts Frontend

A modern web interface for managing SEC filings and earnings transcripts. Features a file explorer with multi-format preview and a CLI command runner with real-time streaming output.

## Features

- **File Explorer**: Browse 787K+ files across Filings, Transcripts, Research, and Presentations
  - Multiple hierarchy views (by source, ticker, form type, date)
  - Filters by source, file type, ticker, date range
  - Text search across filenames
  - Virtualized tree for smooth performance
  - Preview for PDF, Markdown, HTML, and text files

- **CLI Commands**: Run filings and transcripts CLI commands with a visual interface
  - 16 filings commands + 4 transcripts commands
  - Dynamic form generation from command schemas
  - Real-time streaming output via WebSocket
  - Command preview and copy functionality

## Tech Stack

- **Backend**: FastAPI (Python 3.12+), WebSocket streaming, async file scanning
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand
- **File Tree**: react-arborist (virtualized, handles 100k+ nodes)
- **Preview**: react-pdf, react-markdown, syntax highlighting

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv) package manager
- Access to PL3 Dropbox (Mac: `/Users/npw/PL3 Dropbox`, Windows: `D:/pl3 dropbox`)

### Installation

```bash
# Clone and enter directory
cd "/Users/npw/PL3 Dropbox/Code/filings_frontend"

# Install backend dependencies
uv sync

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Development

```bash
# Option 1: Run both servers with script
./scripts/dev.sh

# Option 2: Run separately
# Terminal 1 - Backend
uv run uvicorn backend.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Open http://localhost:5173 in your browser.

### Production Build

```bash
./scripts/build.sh
```

## API Endpoints

### Files API
- `GET /api/files/tree` - Get filtered file tree
- `GET /api/files/metadata/{path}` - Get file metadata
- `GET /api/files/content/{path}` - Get file content/URL
- `GET /api/files/tickers` - List available tickers
- `GET /api/files/form-types` - List available form types

### Commands API
- `GET /api/commands/schemas/{cli}` - Get command schemas
- `GET /api/commands/schemas/{cli}/groups` - Get grouped commands
- `GET /api/commands/status/{cli}` - Check CLI availability
- `WS /api/commands/execute` - Execute command with streaming

### Utility
- `GET /health` - Health check
- `GET /api/config` - Current configuration

## Project Structure

```
filings_frontend/
├── backend/
│   ├── cli_schemas/      # CLI command definitions
│   ├── models/           # Pydantic models
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── config.py         # Cross-platform configuration
│   └── main.py           # FastAPI application
├── frontend/
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── store/        # Zustand stores
│   │   └── types/        # TypeScript types
│   └── ...
├── scripts/              # Dev/build scripts
└── pyproject.toml        # Python dependencies
```

## Configuration

The app auto-detects the Dropbox path based on platform:
- **macOS**: `/Users/npw/PL3 Dropbox`
- **Windows**: `D:/pl3 dropbox`

Override via `.env` file:
```env
DROPBOX_ROOT=/custom/path
HOST=127.0.0.1
PORT=8000
```

## CLI Commands Supported

### Filings (16 commands)
- **Download**: `download`, `batch`, `download-all-types`, `download-pdfs`
- **Search**: `search`, `cik`
- **Processing**: `extract-sections`, `convert-paper`, `convert-pdfs`, `find-aliases`, `sync-downloads`
- **Database**: `update-database`, `database-stats`
- **Config**: `config`, `refresh-cache`, `tickers`

### Transcripts (4 commands)
- **Pipeline**: `zips`
- **Processing**: `convert-md`, `postprocess-md`
- **Utilities**: `earnings`
