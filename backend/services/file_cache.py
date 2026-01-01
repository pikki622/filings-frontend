"""Persistent file tree cache for fast loading.

This service provides:
- Full-depth tree scanning and caching to JSON
- Fast tree loading from cache
- Background cache rebuild capability
"""

import asyncio
import json
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Any

from backend.models.file_node import FileNode


class FileTreeCache:
    """Manages persistent file tree cache."""

    def __init__(self, files_root: Path, cache_dir: Path | None = None):
        self.files_root = files_root
        # Store cache in the project directory, not Dropbox
        if cache_dir:
            self.cache_dir = cache_dir
        else:
            # Use backend directory for cache
            self.cache_dir = Path(__file__).parent.parent / ".file_cache"
        self.cache_file = self.cache_dir / "file_tree_cache.json"
        self.metadata_file = self.cache_dir / "cache_metadata.json"

        # In-memory cache
        self._tree_cache: dict[str, list[FileNode]] | None = None
        self._path_index: dict[str, FileNode] | None = None
        self._cache_metadata: dict[str, Any] | None = None

        # Ensure cache directory exists
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    @property
    def is_cached(self) -> bool:
        """Check if cache file exists."""
        return self.cache_file.exists()

    @property
    def cache_age_hours(self) -> float | None:
        """Get cache age in hours, or None if no cache."""
        if not self._cache_metadata:
            self._load_metadata()
        if self._cache_metadata and "built_at" in self._cache_metadata:
            built_at = datetime.fromisoformat(self._cache_metadata["built_at"])
            age = datetime.now() - built_at
            return age.total_seconds() / 3600
        return None

    def _load_metadata(self) -> None:
        """Load cache metadata from file."""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, "r") as f:
                    self._cache_metadata = json.load(f)
            except (json.JSONDecodeError, IOError):
                self._cache_metadata = {}
        else:
            self._cache_metadata = {}

    def _save_metadata(self, stats: dict[str, Any]) -> None:
        """Save cache metadata to file."""
        self._cache_metadata = {
            "built_at": datetime.now().isoformat(),
            "files_root": str(self.files_root),
            **stats,
        }
        with open(self.metadata_file, "w") as f:
            json.dump(self._cache_metadata, f, indent=2)

    async def load_cache(self) -> bool:
        """Load cache from file into memory. Returns True if successful."""
        if not self.cache_file.exists():
            return False

        try:
            # Load in thread pool to not block
            loop = asyncio.get_event_loop()
            data = await loop.run_in_executor(None, self._load_cache_sync)

            if data:
                self._tree_cache = data.get("trees", {})
                self._build_path_index()
                self._load_metadata()
                return True
        except Exception as e:
            print(f"Failed to load cache: {e}")

        return False

    def _load_cache_sync(self) -> dict | None:
        """Synchronously load cache from file."""
        try:
            with open(self.cache_file, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Cache load error: {e}")
            return None

    def _build_path_index(self) -> None:
        """Build path index from tree cache for fast lookups."""
        self._path_index = {}

        def index_node(node_dict: dict) -> None:
            path = node_dict.get("path", "")
            if path:
                # Convert dict to FileNode for the index
                self._path_index[path] = node_dict
            for child in node_dict.get("children", []):
                index_node(child)

        if self._tree_cache:
            for source, nodes in self._tree_cache.items():
                for node in nodes:
                    index_node(node)

    async def build_cache(
        self,
        sources: list[str] | None = None,
        file_types: list[str] | None = None,
        progress_callback: callable | None = None,
    ) -> dict[str, Any]:
        """Build full-depth cache for all sources.

        Args:
            sources: Source directories to cache (default: all)
            file_types: File types to include (default: pdf, md, htm, txt, json)
            progress_callback: Optional callback for progress updates

        Returns:
            Statistics about the cache build
        """
        from backend.services.file_scanner import FileScanner

        start_time = time.time()

        scanner = FileScanner(self.files_root)

        # Default sources and file types
        if sources is None:
            sources = list(FileScanner.SOURCE_DIRS.keys())
        if file_types is None:
            file_types = ["pdf", "md", "htm", "txt", "json"]

        trees: dict[str, list[dict]] = {}
        total_files = 0
        total_folders = 0

        for i, source in enumerate(sources):
            if progress_callback:
                progress_callback(f"Scanning {source}...", i / len(sources))

            try:
                # Scan with high depth to get everything
                nodes = await scanner.scan(
                    sources=[source],
                    file_types=file_types,
                    max_depth=20,  # High depth to get all files
                )

                # Convert to dicts for JSON serialization
                trees[source] = [self._node_to_dict(node) for node in nodes]

                # Count files and folders
                for node in nodes:
                    files, folders = self._count_nodes(node)
                    total_files += files
                    total_folders += folders

            except Exception as e:
                print(f"Error scanning {source}: {e}")
                trees[source] = []

        # Save to file
        cache_data = {"trees": trees}

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._save_cache_sync, cache_data)

        elapsed = time.time() - start_time

        stats = {
            "total_files": total_files,
            "total_folders": total_folders,
            "sources": sources,
            "file_types": file_types,
            "build_time_seconds": round(elapsed, 2),
        }

        self._save_metadata(stats)

        # Update in-memory cache
        self._tree_cache = trees
        self._build_path_index()

        if progress_callback:
            progress_callback("Cache build complete", 1.0)

        return stats

    def _save_cache_sync(self, data: dict) -> None:
        """Synchronously save cache to file."""
        # Write to temp file first, then rename for atomicity
        temp_file = self.cache_file.with_suffix(".tmp")
        with open(temp_file, "w") as f:
            json.dump(data, f)
        temp_file.rename(self.cache_file)

    def _node_to_dict(self, node: FileNode) -> dict:
        """Convert FileNode to dict for JSON serialization."""
        result = {
            "id": node.id,
            "name": node.name,
            "path": node.path,
            "type": node.type,
        }
        if node.extension:
            result["extension"] = node.extension
        if node.size is not None:
            result["size"] = node.size
        if node.modified is not None:
            result["modified"] = node.modified
        if node.count is not None:
            result["count"] = node.count
        if node.children:
            result["children"] = [self._node_to_dict(c) for c in node.children]
        return result

    def _count_nodes(self, node: FileNode) -> tuple[int, int]:
        """Count files and folders in a tree."""
        files = 0
        folders = 0

        if node.type == "file":
            files = 1
        else:
            folders = 1
            for child in node.children or []:
                cf, cfo = self._count_nodes(child)
                files += cf
                folders += cfo

        return files, folders

    def get_cached_tree(self, source: str) -> list[dict] | None:
        """Get cached tree for a source."""
        if self._tree_cache is None:
            return None
        return self._tree_cache.get(source)

    def get_cached_children(self, path: str) -> list[dict] | None:
        """Get cached children for a path."""
        if self._path_index is None:
            return None

        node = self._path_index.get(path)
        if node:
            return node.get("children", [])
        return None

    def get_cache_info(self) -> dict[str, Any]:
        """Get information about the current cache."""
        if not self._cache_metadata:
            self._load_metadata()

        return {
            "cached": self.is_cached,
            "loaded": self._tree_cache is not None,
            "age_hours": self.cache_age_hours,
            "metadata": self._cache_metadata or {},
            "cache_file": str(self.cache_file),
        }

    def clear_cache(self) -> None:
        """Clear the cache from disk and memory."""
        if self.cache_file.exists():
            self.cache_file.unlink()
        if self.metadata_file.exists():
            self.metadata_file.unlink()
        self._tree_cache = None
        self._path_index = None
        self._cache_metadata = None


# Global cache instance
_cache: FileTreeCache | None = None


def get_file_cache(files_root: Path) -> FileTreeCache:
    """Get or create the global file cache instance."""
    global _cache
    if _cache is None:
        _cache = FileTreeCache(files_root)
    return _cache
