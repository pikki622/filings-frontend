"""Filings CLI command schema definitions.

This module defines all CLI commands available in the filings package,
organized by functional groups for the frontend interface.
"""

from backend.models.command_schema import Argument, CommandSchema, Option, OptionType

# =============================================================================
# Download Commands Group
# =============================================================================

DOWNLOAD_COMMAND = CommandSchema(
    name="download",
    description="Download filings for a single ticker. Downloads primary documents and exhibits (unless --no-exhibits), saves metadata JSON, and organizes files by form type/ticker/date.",
    group="download",
    arguments=[
        Argument(
            name="ticker",
            required=True,
            description="Ticker symbol for the company (e.g., AAPL, MSFT)",
        ),
    ],
    options=[
        Option(
            name="types",
            short="t",
            type=OptionType.MULTI_SELECT,
            description="Filing types to download (e.g., 10-K, 10-Q, 8-K, 20-F, S-1, DEF 14A). If omitted, downloads all filing types.",
        ),
        Option(
            name="start-date",
            short="s",
            type=OptionType.DATE,
            description="Start date filter (YYYY-MM-DD). Only downloads filings on or after this date.",
        ),
        Option(
            name="end-date",
            short="e",
            type=OptionType.DATE,
            description="End date filter (YYYY-MM-DD). Only downloads filings on or before this date.",
        ),
        Option(
            name="limit",
            short="l",
            type=OptionType.INTEGER,
            description="Maximum number of filings to download per ticker per filing type. When multiple types are specified, limit applies SEPARATELY to each type.",
        ),
        Option(
            name="format",
            short="f",
            type=OptionType.MULTI_SELECT,
            choices=["pdf", "htm"],
            description="Download formats: pdf, htm. Default: both formats. PDFs are preferred for older filings, HTML for newer.",
        ),
        Option(
            name="no-exhibits",
            type=OptionType.FLAG,
            default=False,
            description="Skip downloading exhibit documents. Significantly reduces download size and time.",
        ),
        Option(
            name="no-check-aliases",
            type=OptionType.FLAG,
            default=False,
            description="Disable automatic checking for historical CIKs. Speeds up searches if ticker is current.",
        ),
        Option(
            name="output-dir",
            short="o",
            type=OptionType.PATH,
            description="Output directory path. Default: auto-detected Dropbox path or ./data.",
        ),
        Option(
            name="no-database",
            type=OptionType.FLAG,
            default=False,
            description="Disable database usage. By default, uses database to skip already-downloaded filings.",
        ),
    ],
)

BATCH_COMMAND = CommandSchema(
    name="batch",
    description="Download filings for multiple tickers. Processes tickers sequentially with progress output. Best for batch operations on multiple companies.",
    group="download",
    arguments=[],
    options=[
        Option(
            name="tickers",
            short="t",
            type=OptionType.TEXT,
            description="Comma-separated list of tickers (e.g., AAPL,MSFT,GOOGL). If neither --tickers nor --file specified, uses Config.INITIAL_TICKERS (~340 tickers).",
        ),
        Option(
            name="file",
            short="f",
            type=OptionType.PATH,
            description="File path containing tickers (one per line). Alternative to --tickers. Useful for large ticker lists.",
        ),
        Option(
            name="types",
            type=OptionType.MULTI_SELECT,
            description="Filing types to download (e.g., 10-K, 10-Q, 8-K). If omitted, downloads all filing types.",
        ),
        Option(
            name="start-date",
            short="s",
            type=OptionType.DATE,
            description="Start date filter (YYYY-MM-DD). Only downloads filings on or after this date.",
        ),
        Option(
            name="end-date",
            short="e",
            type=OptionType.DATE,
            description="End date filter (YYYY-MM-DD). Only downloads filings on or before this date.",
        ),
        Option(
            name="limit",
            short="l",
            type=OptionType.INTEGER,
            description="Maximum filings per ticker per filing type. Limit applies SEPARATELY to each type.",
        ),
        Option(
            name="no-exhibits",
            type=OptionType.FLAG,
            default=False,
            description="Skip downloading exhibit documents. Reduces download size for batch operations.",
        ),
        Option(
            name="format",
            type=OptionType.MULTI_SELECT,
            choices=["pdf", "htm"],
            description="Download formats: pdf, htm. Default: both formats.",
        ),
        Option(
            name="output-dir",
            short="o",
            type=OptionType.PATH,
            description="Output directory path. Default: auto-detected Dropbox path or ./data.",
        ),
        Option(
            name="no-check-aliases",
            type=OptionType.FLAG,
            default=False,
            description="Disable automatic checking for historical CIKs. Speeds up batch operations.",
        ),
        Option(
            name="update-db-first",
            type=OptionType.FLAG,
            default=False,
            description="Update the filing database before downloading. Ensures database has latest filing information.",
        ),
        Option(
            name="no-database",
            type=OptionType.FLAG,
            default=False,
            description="Disable database usage. By default, uses database to skip already-downloaded filings.",
        ),
    ],
)

DOWNLOAD_ALL_TYPES_COMMAND = CommandSchema(
    name="download-all-types",
    description="Download ALL filing types for configured tickers and automatically extract sections. Comprehensive command that downloads all available filings and processes them.",
    group="download",
    arguments=[],
    options=[
        Option(
            name="tickers",
            short="t",
            type=OptionType.TEXT,
            description="Comma-separated list of tickers. Default: uses Config.INITIAL_TICKERS (~340 tickers).",
        ),
        Option(
            name="start-date",
            short="s",
            type=OptionType.DATE,
            description="Start date filter (YYYY-MM-DD). Only downloads filings on or after this date.",
        ),
        Option(
            name="end-date",
            short="e",
            type=OptionType.DATE,
            description="End date filter (YYYY-MM-DD). Only downloads filings on or before this date.",
        ),
        Option(
            name="limit",
            short="l",
            type=OptionType.INTEGER,
            description="Maximum filings per company per filing type. Limits download size for large datasets.",
        ),
        Option(
            name="only-common",
            type=OptionType.FLAG,
            default=False,
            description="Only download common filing types (10-K, 10-Q, 8-K, etc.) instead of ALL types.",
        ),
        Option(
            name="no-extract",
            type=OptionType.FLAG,
            default=False,
            description="Skip automatic section extraction after download. By default, cleans all filings and extracts sections from 10-K and 10-Q.",
        ),
        Option(
            name="extract-format",
            type=OptionType.SELECT,
            choices=["json", "separate", "both"],
            default="json",
            description="Extraction output format: 'json' saves all sections in one file, 'separate' saves each section individually, 'both' creates both.",
        ),
        Option(
            name="update-db-first",
            type=OptionType.FLAG,
            default=False,
            description="Update the filing database before downloading. Improves download efficiency.",
        ),
        Option(
            name="no-database",
            type=OptionType.FLAG,
            default=False,
            description="Disable database usage. By default, uses database to skip already-downloaded filings.",
        ),
    ],
)

DOWNLOAD_PDFS_COMMAND = CommandSchema(
    name="download-pdfs",
    description="Download PDF copies of filings using SEC ePrints API. Scans the file system for filings without PDFs and downloads them using browser automation (~10s per filing).",
    group="download",
    arguments=[],
    options=[
        Option(
            name="types",
            short="t",
            type=OptionType.MULTI_SELECT,
            default=["10-K", "10-Q", "8-K", "6-K", "20-F", "S-1"],
            description="Form types to download. Default: 10-K, 10-Q, 8-K, 6-K, 20-F, S-1.",
        ),
        Option(
            name="tickers",
            type=OptionType.TEXT,
            description="Filter to specific tickers (e.g., AAPL,MSFT).",
        ),
        Option(
            name="limit",
            short="l",
            type=OptionType.INTEGER,
            description="Maximum number of PDFs to download.",
        ),
        Option(
            name="scan-only",
            type=OptionType.FLAG,
            default=False,
            description="Only scan and show missing PDF count, don't download.",
        ),
        Option(
            name="headless",
            type=OptionType.FLAG,
            default=False,
            description="Run browser in headless mode. Default: visible for reliability.",
        ),
        Option(
            name="max-wait",
            type=OptionType.INTEGER,
            default=180,
            description="Max seconds to wait for each PDF generation. Default: 180.",
        ),
    ],
)

# =============================================================================
# Search & Info Commands Group
# =============================================================================

SEARCH_COMMAND = CommandSchema(
    name="search",
    description="Search for filings without downloading. Displays filing metadata in a table format. Shows date, type, description, and accession number. For 8-K filings, also displays item numbers.",
    group="search_info",
    arguments=[
        Argument(
            name="ticker",
            required=True,
            description="Ticker symbol for the company to search.",
        ),
    ],
    options=[
        Option(
            name="types",
            short="t",
            type=OptionType.MULTI_SELECT,
            description="Filing types to search (e.g., 10-K, 10-Q). If omitted, searches all filing types.",
        ),
        Option(
            name="start-date",
            short="s",
            type=OptionType.DATE,
            description="Start date filter (YYYY-MM-DD). Only shows filings on or after this date.",
        ),
        Option(
            name="end-date",
            short="e",
            type=OptionType.DATE,
            description="End date filter (YYYY-MM-DD). Only shows filings on or before this date.",
        ),
        Option(
            name="limit",
            short="l",
            type=OptionType.INTEGER,
            description="Maximum number of results to display. Results are sorted by date (newest first).",
        ),
    ],
)

CIK_COMMAND = CommandSchema(
    name="cik",
    description="Look up CIK (Central Index Key) for a ticker symbol. CIK is the SEC's unique identifier for companies. Returns ticker, CIK number, and company name.",
    group="search_info",
    arguments=[
        Argument(
            name="ticker",
            required=True,
            description="Ticker symbol to look up CIK for.",
        ),
    ],
    options=[],
)

# =============================================================================
# Processing Commands Group
# =============================================================================

EXTRACT_SECTIONS_COMMAND = CommandSchema(
    name="extract-sections",
    description="Process filing text files: clean all filings (remove HTML, normalize whitespace) and extract sections from 10-K and 10-Q filings only.",
    group="processing",
    arguments=[
        Argument(
            name="filing_path",
            required=False,
            description="Path to a specific filing text file. Optional if using --all.",
        ),
    ],
    options=[
        Option(
            name="all",
            type=OptionType.FLAG,
            default=False,
            description="Process all .txt files in the data directory recursively.",
        ),
        Option(
            name="form-type",
            type=OptionType.SELECT,
            choices=["10-K", "10-Q"],
            description="Form type (10-K or 10-Q). Auto-detects if not specified.",
        ),
        Option(
            name="output-format",
            type=OptionType.SELECT,
            choices=["json", "separate", "both"],
            default="json",
            description="Output format: 'json' saves all sections in one file, 'separate' saves each section individually, 'both' creates both.",
        ),
        Option(
            name="output-dir",
            type=OptionType.PATH,
            description="Output directory path. Defaults to same directory as the filing file.",
        ),
        Option(
            name="force",
            type=OptionType.FLAG,
            default=False,
            description="Force re-extraction even if output already exists.",
        ),
        Option(
            name="no-clean",
            type=OptionType.FLAG,
            default=False,
            description="Skip cleaning step (HTML removal, whitespace normalization).",
        ),
    ],
)

CONVERT_PAPER_COMMAND = CommandSchema(
    name="convert-paper",
    description="Convert SEC .paper files to HTML format. .paper files are legacy SEC format files that need conversion for modern viewing.",
    group="processing",
    arguments=[
        Argument(
            name="path",
            required=False,
            description="Path to .paper file or directory. If omitted, uses default data directory.",
        ),
    ],
    options=[
        Option(
            name="output",
            short="o",
            type=OptionType.PATH,
            description="Output file path for single file conversion. Only used when converting a single file.",
        ),
        Option(
            name="recursive",
            short="r",
            type=OptionType.FLAG,
            default=False,
            description="Recursively convert all .paper files in directory.",
        ),
        Option(
            name="remove-original",
            type=OptionType.FLAG,
            default=False,
            description="Remove original .paper files after successful conversion. WARNING: Cannot be recovered.",
        ),
        Option(
            name="force",
            type=OptionType.FLAG,
            default=False,
            description="Force conversion even if HTML file already exists.",
        ),
    ],
)

CONVERT_PDFS_COMMAND = CommandSchema(
    name="convert-pdfs",
    description="Convert PDF filings to Markdown using Docling. Converts all PDF files found in the filings directory structure.",
    group="processing",
    arguments=[],
    options=[
        Option(
            name="types",
            short="t",
            type=OptionType.MULTI_SELECT,
            description="Filter to specific form types (e.g., 10-K, 10-Q).",
        ),
        Option(
            name="tickers",
            type=OptionType.TEXT,
            description="Filter to specific tickers (e.g., AAPL,MSFT).",
        ),
        Option(
            name="workers",
            short="w",
            type=OptionType.INTEGER,
            default=2,
            description="Number of parallel workers. Default: 2.",
        ),
        Option(
            name="threads",
            type=OptionType.INTEGER,
            description="OMP threads per worker. Default: CPU count / workers.",
        ),
        Option(
            name="status-only",
            type=OptionType.FLAG,
            default=False,
            description="Only show conversion status, don't convert.",
        ),
        Option(
            name="force",
            type=OptionType.FLAG,
            default=False,
            description="Re-convert files that already have markdown.",
        ),
    ],
)

FIND_ALIASES_COMMAND = CommandSchema(
    name="find-aliases",
    description="Find historical CIKs and ticker aliases using AI. Discovers ticker changes, mergers, and historical CIKs to improve filing retrieval accuracy.",
    group="processing",
    arguments=[],
    options=[
        Option(
            name="tickers",
            short="t",
            type=OptionType.TEXT,
            description="Comma-separated list of tickers to check for historical aliases.",
        ),
        Option(
            name="all",
            type=OptionType.FLAG,
            default=False,
            description="Check all tickers in Config.INITIAL_TICKERS (~340 tickers). Can take a long time.",
        ),
        Option(
            name="delay",
            short="d",
            type=OptionType.FLOAT,
            default=4.0,
            description="Delay between API calls in seconds. Default: 4.0.",
        ),
        Option(
            name="auto-update",
            type=OptionType.FLAG,
            default=False,
            description="Automatically update config.py with discovered aliases. Default: save to cache for review.",
        ),
    ],
)

SYNC_DOWNLOADS_COMMAND = CommandSchema(
    name="sync-downloads",
    description="Scan file system for downloaded filings and update database to mark them as downloaded. Useful after manual downloads or when database is out of sync.",
    group="processing",
    arguments=[],
    options=[
        Option(
            name="types",
            short="t",
            type=OptionType.MULTI_SELECT,
            description="Filter to specific form types (e.g., 10-K, 10-Q).",
        ),
        Option(
            name="tickers",
            type=OptionType.TEXT,
            description="Filter to specific tickers (e.g., AAPL,MSFT).",
        ),
        Option(
            name="dry-run",
            type=OptionType.FLAG,
            default=False,
            description="Don't actually update database, just show what would be updated.",
        ),
    ],
)

# =============================================================================
# Database Commands Group
# =============================================================================

UPDATE_DATABASE_COMMAND = CommandSchema(
    name="update-database",
    description="Update the filing database with all available filings for specified tickers. Scans SEC filings and populates/updates the database. Run before batch operations for best performance.",
    group="database",
    arguments=[],
    options=[
        Option(
            name="tickers",
            short="t",
            type=OptionType.TEXT,
            description="Comma-separated list of tickers to update. If omitted, updates all configured tickers.",
        ),
        Option(
            name="types",
            type=OptionType.MULTI_SELECT,
            description="Filing types to update (e.g., 10-K, 10-Q). If omitted, updates all filing types.",
        ),
        Option(
            name="force",
            type=OptionType.FLAG,
            default=False,
            description="Force update even if ticker was recently updated. By default, skips tickers updated within 24 hours.",
        ),
        Option(
            name="no-incremental",
            type=OptionType.FLAG,
            default=False,
            description="Disable incremental updates. Updates all tickers regardless of last update time.",
        ),
        Option(
            name="max-age-hours",
            type=OptionType.INTEGER,
            default=24,
            description="Maximum age in hours before update is needed. Default: 24. Only used with incremental updates.",
        ),
    ],
)

DATABASE_STATS_COMMAND = CommandSchema(
    name="database-stats",
    description="Show filing database statistics including total filings, state counts, and form type breakdown.",
    group="database",
    arguments=[],
    options=[],
)

# =============================================================================
# Config Commands Group
# =============================================================================

CONFIG_COMMAND = CommandSchema(
    name="config",
    description="Show current configuration settings including SEC user agent, rate limits, data directory paths, cache directory, log level, default filing types, and initial ticker list.",
    group="config",
    arguments=[],
    options=[],
)

REFRESH_CACHE_COMMAND = CommandSchema(
    name="refresh-cache",
    description="Refresh the ticker-CIK mapping cache. The cache is stored in cache/ticker_cik_mapping.json and is valid for 24 hours. Force immediate refresh if mappings seem outdated.",
    group="config",
    arguments=[],
    options=[],
)

# =============================================================================
# Utilities Commands Group
# =============================================================================

TICKERS_COMMAND = CommandSchema(
    name="tickers",
    description="Manage the list of tickers to download. The ticker list is stored in tickers.json and used by batch commands when no tickers are specified.",
    group="utilities",
    arguments=[],
    options=[
        Option(
            name="add",
            short="a",
            type=OptionType.TEXT,
            description="Add ticker(s) to the list (e.g., --add AAPL,MSFT). Tickers are automatically uppercased.",
        ),
        Option(
            name="remove",
            short="r",
            type=OptionType.TEXT,
            description="Remove ticker(s) from the list (e.g., --remove AAPL). Tickers are automatically uppercased.",
        ),
        Option(
            name="list",
            short="l",
            type=OptionType.FLAG,
            default=False,
            description="List all tickers in the current list. Also shown by default if no operations are performed.",
        ),
        Option(
            name="file",
            short="f",
            type=OptionType.PATH,
            description="File path containing tickers (one per line). Adds all tickers from the file.",
        ),
        Option(
            name="clear",
            type=OptionType.FLAG,
            default=False,
            description="Clear all tickers from the list. WARNING: Removes all tickers.",
        ),
    ],
)

# =============================================================================
# Export all commands as a list
# =============================================================================

FILINGS_COMMANDS: list[CommandSchema] = [
    # Download group
    DOWNLOAD_COMMAND,
    BATCH_COMMAND,
    DOWNLOAD_ALL_TYPES_COMMAND,
    DOWNLOAD_PDFS_COMMAND,
    # Search & Info group
    SEARCH_COMMAND,
    CIK_COMMAND,
    # Processing group
    EXTRACT_SECTIONS_COMMAND,
    CONVERT_PAPER_COMMAND,
    CONVERT_PDFS_COMMAND,
    FIND_ALIASES_COMMAND,
    SYNC_DOWNLOADS_COMMAND,
    # Database group
    UPDATE_DATABASE_COMMAND,
    DATABASE_STATS_COMMAND,
    # Config group
    CONFIG_COMMAND,
    REFRESH_CACHE_COMMAND,
    # Utilities group
    TICKERS_COMMAND,
]
