"""Async file scanner service for efficient directory traversal.

Designed for handling ~800K files efficiently using:
- os.scandir() for fast directory iteration
- concurrent.futures with run_in_executor for non-blocking I/O
- Lazy evaluation and filtering during traversal
"""

import asyncio
import hashlib
import os
import re
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Optional

from backend.models.file_node import FileNode


@dataclass
class ScanFilters:
    """Filters to apply during file scanning."""

    sources: list[str] = field(default_factory=list)
    form_types: list[str] = field(default_factory=list)  # SEC form types (10-K, 8-K, etc.)
    event_types: list[str] = field(default_factory=list)  # Transcript event types
    file_types: list[str] = field(default_factory=list)
    tickers: list[str] = field(default_factory=list)
    search: str = ""
    hierarchy: str = "source_form_ticker_date"


class FileScanner:
    """Async file scanner with filtering and hierarchical organization.

    Attributes:
        root_path: Base directory for all file operations
        executor: Thread pool for CPU-bound directory scanning
    """

    # Source directory mapping
    SOURCE_DIRS = {
        "Filings": "Filings",
        "Transcripts": "Transcripts",
        "Research": "Research",
        "Presentations": "Presentations",
    }

    # File extensions to scan (lowercase)
    ALLOWED_EXTENSIONS = {"pdf", "md", "htm", "html", "txt", "json"}

    def __init__(self, root_path: Path, max_workers: int = 4) -> None:
        """Initialize the file scanner.

        Args:
            root_path: Base directory for file operations
            max_workers: Number of threads for concurrent scanning
        """
        self.root_path = Path(root_path)
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self._ticker_cache: set[str] | None = None
        self._form_type_cache: set[str] | None = None

    def _generate_id(self, path: str) -> str:
        """Generate a unique ID for a file/folder path."""
        return hashlib.md5(path.encode()).hexdigest()[:12]

    def _get_extension(self, name: str) -> str | None:
        """Extract file extension from filename."""
        if "." in name:
            ext = name.rsplit(".", 1)[-1].lower()
            return ext if ext else None
        return None

    def _matches_search(self, name: str, search: str) -> bool:
        """Check if filename matches search query (case-insensitive)."""
        if not search:
            return True
        return search.lower() in name.lower()

    def _matches_file_type(self, name: str, file_types: list[str]) -> bool:
        """Check if file matches allowed file types."""
        if not file_types:
            return True
        ext = self._get_extension(name)
        if not ext:
            return False
        # Normalize htm/html
        if ext == "html":
            ext = "htm"
        return ext in [ft.lower() for ft in file_types]

    def _extract_ticker_from_path(self, path: Path) -> str | None:
        """Extract ticker symbol from path.

        For Filings: /Filings/10-K/AAPL/2024-11-01_xxx/
        For Transcripts: /Transcripts/pdf/AAPL/
        """
        parts = path.parts
        try:
            # Check for Filings structure
            if "Filings" in parts:
                idx = parts.index("Filings")
                if len(parts) > idx + 2:
                    # Ticker is after form type: Filings/10-K/AAPL
                    potential_ticker = parts[idx + 2]
                    if re.match(r"^[A-Z]{1,5}$", potential_ticker):
                        return potential_ticker
            # Check for Transcripts structure
            if "Transcripts" in parts:
                idx = parts.index("Transcripts")
                if len(parts) > idx + 2:
                    potential_ticker = parts[idx + 2]
                    if re.match(r"^[A-Z]{1,5}$", potential_ticker):
                        return potential_ticker
        except (ValueError, IndexError):
            pass
        return None

    def _extract_form_type_from_path(self, path: Path) -> str | None:
        """Extract form type from path.

        For Filings: /Filings/10-K/AAPL/ -> 10-K
        """
        parts = path.parts
        try:
            if "Filings" in parts:
                idx = parts.index("Filings")
                if len(parts) > idx + 1:
                    return parts[idx + 1]
        except (ValueError, IndexError):
            pass
        return None

    def _scan_directory_sync(
        self,
        dir_path: Path,
        filters: ScanFilters,
        depth: int = 0,
        max_depth: int = 10,
    ) -> FileNode | None:
        """Synchronously scan a directory (runs in thread pool).

        Args:
            dir_path: Directory to scan
            filters: Filtering criteria
            depth: Current recursion depth
            max_depth: Maximum recursion depth

        Returns:
            FileNode representing the directory, or None if filtered out
        """
        if depth > max_depth:
            return None

        if not dir_path.is_dir():
            return None

        name = dir_path.name
        path_str = str(dir_path)

        # Skip hidden directories
        if name.startswith("."):
            return None

        children: list[FileNode] = []
        file_count = 0

        try:
            with os.scandir(dir_path) as entries:
                for entry in entries:
                    try:
                        # Skip hidden files
                        if entry.name.startswith("."):
                            continue

                        entry_path = Path(entry.path)

                        if entry.is_dir(follow_symlinks=False):
                            # Check form type filter for Filings structure
                            # Only apply at depth 1 (form type level within Filings)
                            if filters.form_types and "Filings" in dir_path.parts:
                                form_type = self._extract_form_type_from_path(entry_path)
                                if form_type and form_type not in filters.form_types:
                                    continue

                            # Check event type filter for Transcripts structure
                            if filters.event_types and "Transcripts" in dir_path.parts:
                                # Event types are folder names under Transcripts/pdf/TICKER/
                                # or under Transcripts/md/
                                event_type = entry.name
                                # Only filter at appropriate level
                                if event_type in [
                                    "Earnings", "Conference", "SalesRelease",
                                    "MergerAcquisition", "ShareholderMeeting", "Guidance",
                                    "InvestorDay", "ProductEvent", "BI", "ModelingCall",
                                    "Partnership"
                                ]:
                                    if event_type not in filters.event_types:
                                        continue

                            # Check ticker filter for Filings structure
                            if filters.tickers:
                                ticker = self._extract_ticker_from_path(entry_path)
                                # If we're at ticker level, filter
                                if ticker and ticker not in filters.tickers:
                                    continue

                            child = self._scan_directory_sync(
                                entry_path, filters, depth + 1, max_depth
                            )
                            if child:
                                children.append(child)
                                file_count += child.count or 0

                        elif entry.is_file(follow_symlinks=False):
                            # Apply file type filter
                            if not self._matches_file_type(
                                entry.name, filters.file_types
                            ):
                                continue

                            # Apply search filter
                            if not self._matches_search(entry.name, filters.search):
                                continue

                            # Get file stats
                            try:
                                stat = entry.stat()
                                size = stat.st_size
                                modified = stat.st_mtime
                            except OSError:
                                size = None
                                modified = None

                            ext = self._get_extension(entry.name)

                            file_node = FileNode(
                                id=self._generate_id(entry.path),
                                name=entry.name,
                                path=entry.path,
                                type="file",
                                extension=ext,
                                size=size,
                                modified=modified,
                            )
                            children.append(file_node)
                            file_count += 1

                    except (PermissionError, OSError):
                        # Skip inaccessible entries
                        continue

        except (PermissionError, OSError):
            return None

        # If no children after filtering, skip this folder (unless at top level)
        if not children and depth > 1:
            return None

        # Sort children: folders first, then files, both alphabetically
        children.sort(
            key=lambda x: (0 if x.type == "folder" else 1, x.name.lower())
        )

        return FileNode(
            id=self._generate_id(path_str),
            name=name,
            path=path_str,
            type="folder",
            count=file_count,
            children=children if children else None,
        )

    async def scan(
        self,
        sources: list[str] | None = None,
        form_types: list[str] | None = None,
        event_types: list[str] | None = None,
        file_types: list[str] | None = None,
        tickers: list[str] | None = None,
        search: str = "",
        hierarchy: str = "source_form_ticker_date",
        max_depth: int = 10,
    ) -> list[FileNode]:
        """Scan file system and return filtered tree structure.

        Args:
            sources: Source directories to include (Filings, Transcripts, etc.)
            form_types: SEC form types to filter by (10-K, 8-K, etc.)
            event_types: Transcript event types to filter by
            file_types: File extensions to include (pdf, md, htm, etc.)
            tickers: Ticker symbols to filter by
            search: Filename search query
            hierarchy: Hierarchy organization (reserved for future use)
            max_depth: Maximum directory depth to scan

        Returns:
            List of FileNode trees representing the filtered directory structure
        """
        filters = ScanFilters(
            sources=sources or list(self.SOURCE_DIRS.keys()),
            form_types=form_types or [],
            event_types=event_types or [],
            file_types=file_types or [],
            tickers=[t.upper() for t in (tickers or [])],
            search=search,
            hierarchy=hierarchy,
        )

        # Determine which source directories to scan
        source_dirs = []
        for source in filters.sources:
            if source in self.SOURCE_DIRS:
                dir_path = self.root_path / self.SOURCE_DIRS[source]
                if dir_path.exists():
                    source_dirs.append((source, dir_path))

        # Scan directories concurrently
        loop = asyncio.get_event_loop()
        tasks = []

        for source_name, dir_path in source_dirs:
            task = loop.run_in_executor(
                self.executor,
                self._scan_directory_sync,
                dir_path,
                filters,
                0,
                max_depth,
            )
            tasks.append((source_name, task))

        results: list[FileNode] = []
        for source_name, task in tasks:
            try:
                result = await task
                if result:
                    results.append(result)
            except Exception as e:
                # Log error but continue with other sources
                print(f"Error scanning {source_name}: {e}")

        # If exactly one source is selected, return its children directly
        # This prevents showing "Filings" or "Transcripts" as top-level folder
        if len(results) == 1 and len(filters.sources) == 1:
            source_node = results[0]
            if source_node.children:
                return source_node.children
            return []

        return results

    def _get_file_metadata_sync(self, file_path: Path) -> dict | None:
        """Get detailed metadata for a single file (sync)."""
        if not file_path.exists():
            return None

        try:
            stat = file_path.stat()
            return {
                "id": self._generate_id(str(file_path)),
                "name": file_path.name,
                "path": str(file_path),
                "type": "folder" if file_path.is_dir() else "file",
                "extension": self._get_extension(file_path.name),
                "size": stat.st_size,
                "modified": stat.st_mtime,
                "created": stat.st_ctime,
                "ticker": self._extract_ticker_from_path(file_path),
                "form_type": self._extract_form_type_from_path(file_path),
            }
        except OSError:
            return None

    async def get_file_metadata(self, path: str) -> dict | None:
        """Get detailed metadata for a single file.

        Args:
            path: Absolute path to the file

        Returns:
            Dictionary with file metadata, or None if not found
        """
        file_path = Path(path)

        # Security check: ensure path is within root
        try:
            file_path.resolve().relative_to(self.root_path.resolve())
        except ValueError:
            return None

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor, self._get_file_metadata_sync, file_path
        )

    def _collect_tickers_sync(self) -> set[str]:
        """Collect unique tickers from directory structure (sync)."""
        tickers: set[str] = set()

        # Scan Filings directory structure
        filings_path = self.root_path / "Filings"
        if filings_path.exists():
            try:
                with os.scandir(filings_path) as form_types:
                    for form_type in form_types:
                        if form_type.is_dir() and not form_type.name.startswith("."):
                            try:
                                with os.scandir(form_type.path) as ticker_dirs:
                                    for ticker_dir in ticker_dirs:
                                        if (
                                            ticker_dir.is_dir()
                                            and not ticker_dir.name.startswith(".")
                                            and re.match(
                                                r"^[A-Z]{1,5}$", ticker_dir.name
                                            )
                                        ):
                                            tickers.add(ticker_dir.name)
                            except (PermissionError, OSError):
                                continue
            except (PermissionError, OSError):
                pass

        # Scan Transcripts directory structure
        transcripts_pdf = self.root_path / "Transcripts" / "pdf"
        if transcripts_pdf.exists():
            try:
                with os.scandir(transcripts_pdf) as ticker_dirs:
                    for ticker_dir in ticker_dirs:
                        if (
                            ticker_dir.is_dir()
                            and not ticker_dir.name.startswith(".")
                            and re.match(r"^[A-Z]{1,5}$", ticker_dir.name)
                        ):
                            tickers.add(ticker_dir.name)
            except (PermissionError, OSError):
                pass

        return tickers

    async def get_available_tickers(self, force_refresh: bool = False) -> list[str]:
        """Get list of unique ticker symbols from the file system.

        Args:
            force_refresh: Force re-scan even if cached

        Returns:
            Sorted list of ticker symbols
        """
        if self._ticker_cache is None or force_refresh:
            loop = asyncio.get_event_loop()
            self._ticker_cache = await loop.run_in_executor(
                self.executor, self._collect_tickers_sync
            )

        return sorted(self._ticker_cache)

    def _collect_form_types_sync(self) -> set[str]:
        """Collect unique form types from directory structure (sync)."""
        form_types: set[str] = set()

        filings_path = self.root_path / "Filings"
        if filings_path.exists():
            try:
                with os.scandir(filings_path) as entries:
                    for entry in entries:
                        if entry.is_dir() and not entry.name.startswith("."):
                            form_types.add(entry.name)
            except (PermissionError, OSError):
                pass

        return form_types

    async def get_available_form_types(
        self, force_refresh: bool = False
    ) -> list[str]:
        """Get list of unique form types from the file system.

        Args:
            force_refresh: Force re-scan even if cached

        Returns:
            Sorted list of form types
        """
        if self._form_type_cache is None or force_refresh:
            loop = asyncio.get_event_loop()
            self._form_type_cache = await loop.run_in_executor(
                self.executor, self._collect_form_types_sync
            )

        return sorted(self._form_type_cache)

    def _collect_filtered_tickers_sync(
        self,
        sources: list[str] | None,
        form_types: list[str] | None,
    ) -> set[str]:
        """Collect tickers filtered by source and form type (sync)."""
        tickers: set[str] = set()

        include_filings = not sources or "Filings" in sources
        include_transcripts = not sources or "Transcripts" in sources

        # Collect from Filings
        if include_filings:
            filings_path = self.root_path / "Filings"
            if filings_path.exists():
                try:
                    with os.scandir(filings_path) as form_dirs:
                        for form_dir in form_dirs:
                            if not form_dir.is_dir() or form_dir.name.startswith("."):
                                continue
                            # If form_types filter is set, only include matching forms
                            if form_types and form_dir.name not in form_types:
                                continue
                            # Scan tickers within this form type
                            try:
                                with os.scandir(form_dir.path) as ticker_dirs:
                                    for ticker_dir in ticker_dirs:
                                        if (
                                            ticker_dir.is_dir()
                                            and not ticker_dir.name.startswith(".")
                                            and re.match(r"^[A-Z]{1,5}$", ticker_dir.name)
                                        ):
                                            tickers.add(ticker_dir.name)
                            except (PermissionError, OSError):
                                continue
                except (PermissionError, OSError):
                    pass

        # Collect from Transcripts
        if include_transcripts:
            transcripts_pdf = self.root_path / "Transcripts" / "pdf"
            if transcripts_pdf.exists():
                try:
                    with os.scandir(transcripts_pdf) as ticker_dirs:
                        for ticker_dir in ticker_dirs:
                            if (
                                ticker_dir.is_dir()
                                and not ticker_dir.name.startswith(".")
                                and re.match(r"^[A-Z]{1,5}$", ticker_dir.name)
                            ):
                                tickers.add(ticker_dir.name)
                except (PermissionError, OSError):
                    pass

        return tickers

    async def get_filtered_tickers(
        self,
        sources: list[str] | None = None,
        form_types: list[str] | None = None,
    ) -> list[str]:
        """Get tickers filtered by source and form type.

        Args:
            sources: Source directories to include (Filings, Transcripts)
            form_types: Form types to filter by (only applies to Filings)

        Returns:
            Sorted list of ticker symbols available with the given filters
        """
        loop = asyncio.get_event_loop()
        tickers = await loop.run_in_executor(
            self.executor,
            self._collect_filtered_tickers_sync,
            sources,
            form_types,
        )
        return sorted(tickers)

    async def get_file_content(self, path: str) -> tuple[str | None, str]:
        """Get file content for text files or URL for binary files.

        Args:
            path: Absolute path to the file

        Returns:
            Tuple of (content, content_type)
            - For text files: (text_content, "text")
            - For PDF files: (file_path, "pdf")
            - For errors: (None, "error")
        """
        file_path = Path(path)

        # Security check
        try:
            file_path.resolve().relative_to(self.root_path.resolve())
        except ValueError:
            return None, "error"

        if not file_path.exists():
            return None, "error"

        ext = self._get_extension(file_path.name)

        # For PDF files, return path (frontend will request via static serving)
        if ext == "pdf":
            return str(file_path), "pdf"

        # For text files, read content
        if ext in ("txt", "md", "htm", "html", "json"):
            try:
                loop = asyncio.get_event_loop()
                content = await loop.run_in_executor(
                    self.executor,
                    lambda: file_path.read_text(encoding="utf-8", errors="replace"),
                )
                return content, "text"
            except Exception:
                return None, "error"

        return None, "error"

    def close(self) -> None:
        """Clean up resources."""
        self.executor.shutdown(wait=False)
