"""File API routes for file tree browsing and content retrieval."""

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse

from backend.config import get_settings, Settings
from backend.models.file_node import FileNode
from backend.services.file_scanner import FileScanner
from backend.services.file_cache import FileTreeCache, get_file_cache

router = APIRouter(prefix="/api/files", tags=["files"])

# Scanner instance (lazy initialization)
_scanner: FileScanner | None = None


def get_scanner(settings: Annotated[Settings, Depends(get_settings)]) -> FileScanner:
    """Get or create FileScanner instance."""
    global _scanner
    if _scanner is None:
        _scanner = FileScanner(settings.files_root)
    return _scanner


def get_cache(settings: Annotated[Settings, Depends(get_settings)]) -> FileTreeCache:
    """Get the global FileTreeCache instance (same one loaded at startup)."""
    return get_file_cache(settings.files_root)


@router.get("/tree", response_model=list[FileNode])
async def get_file_tree(
    scanner: Annotated[FileScanner, Depends(get_scanner)],
    sources: Annotated[
        list[str] | None,
        Query(description="Source directories to include"),
    ] = None,
    file_types: Annotated[
        list[str] | None,
        Query(description="File extensions to include (pdf, md, htm, txt, json)"),
    ] = None,
    tickers: Annotated[
        list[str] | None,
        Query(description="Ticker symbols to filter by"),
    ] = None,
    search: Annotated[
        str,
        Query(description="Search query for filename"),
    ] = "",
    hierarchy: Annotated[
        str,
        Query(description="Hierarchy organization pattern"),
    ] = "source_form_ticker_date",
    max_depth: Annotated[
        int,
        Query(description="Maximum directory depth to scan", ge=1, le=20),
    ] = 2,
) -> list[FileNode]:
    """Get filtered file tree structure.

    Returns a hierarchical tree of files and folders matching the specified
    filters. Designed for efficient handling of large file systems.

    Args:
        sources: Source directories (Filings, Transcripts, Research, Presentations)
        file_types: File extensions to include
        tickers: Ticker symbols to filter by
        search: Filename search query (case-insensitive)
        hierarchy: Hierarchy organization (reserved for future use)
        max_depth: Maximum recursion depth

    Returns:
        List of FileNode trees representing the filtered directory structure
    """
    try:
        return await scanner.scan(
            sources=sources,
            file_types=file_types,
            tickers=tickers,
            search=search,
            hierarchy=hierarchy,
            max_depth=max_depth,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


@router.get("/metadata/{path:path}")
async def get_file_metadata(
    path: str,
    scanner: Annotated[FileScanner, Depends(get_scanner)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    """Get detailed metadata for a single file.

    Args:
        path: Relative or absolute path to the file

    Returns:
        Dictionary containing file metadata including size, dates, and type info
    """
    # Handle both relative and absolute paths
    if not path.startswith("/"):
        full_path = str(settings.files_root / path)
    else:
        full_path = path

    metadata = await scanner.get_file_metadata(full_path)
    if metadata is None:
        raise HTTPException(status_code=404, detail="File not found")

    return metadata


@router.get("/content/{path:path}", response_model=None)
async def get_file_content(
    path: str,
    scanner: Annotated[FileScanner, Depends(get_scanner)],
    settings: Annotated[Settings, Depends(get_settings)],
):
    """Get file content.

    For text files (txt, md, htm, json), returns the content directly.
    For PDF files, returns the file for download/viewing.

    Args:
        path: Relative or absolute path to the file

    Returns:
        JSON response with text content, or FileResponse for PDFs
    """
    # Handle both relative and absolute paths
    if not path.startswith("/"):
        full_path = str(settings.files_root / path)
    else:
        full_path = path

    # Security check
    file_path = Path(full_path)
    try:
        file_path.resolve().relative_to(settings.files_root.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    content, content_type = await scanner.get_file_content(full_path)

    if content_type == "error":
        raise HTTPException(status_code=500, detail="Failed to read file")

    if content_type == "pdf":
        return FileResponse(
            path=full_path,
            media_type="application/pdf",
            filename=file_path.name,
        )

    # Text content
    return JSONResponse(
        content={
            "content": content,
            "type": content_type,
            "path": full_path,
            "name": file_path.name,
        }
    )


@router.get("/tickers", response_model=list[str])
async def get_available_tickers(
    scanner: Annotated[FileScanner, Depends(get_scanner)],
    refresh: Annotated[
        bool,
        Query(description="Force refresh of cached ticker list"),
    ] = False,
) -> list[str]:
    """Get list of available ticker symbols.

    Scans the file system to collect unique ticker symbols from
    the Filings and Transcripts directories.

    Args:
        refresh: Force re-scan even if cached

    Returns:
        Sorted list of ticker symbols
    """
    try:
        return await scanner.get_available_tickers(force_refresh=refresh)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tickers: {str(e)}")


@router.get("/form-types", response_model=list[str])
async def get_available_form_types(
    scanner: Annotated[FileScanner, Depends(get_scanner)],
    refresh: Annotated[
        bool,
        Query(description="Force refresh of cached form type list"),
    ] = False,
) -> list[str]:
    """Get list of available form types.

    Scans the Filings directory structure to collect unique form types.

    Args:
        refresh: Force re-scan even if cached

    Returns:
        Sorted list of form types (e.g., 10-K, 10-Q, 8-K)
    """
    try:
        return await scanner.get_available_form_types(force_refresh=refresh)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get form types: {str(e)}"
        )


@router.get("/sources", response_model=list[dict])
async def get_available_sources(
    settings: Annotated[Settings, Depends(get_settings)],
) -> list[dict]:
    """Get list of available source directories.

    Returns information about each source directory including
    whether it exists and its path.

    Returns:
        List of source directory information
    """
    sources = []
    for name, dirname in FileScanner.SOURCE_DIRS.items():
        dir_path = settings.files_root / dirname
        sources.append(
            {
                "name": name,
                "path": str(dir_path),
                "exists": dir_path.exists(),
            }
        )
    return sources


@router.get("/children/{path:path}", response_model=list[FileNode])
async def get_folder_children(
    path: str,
    scanner: Annotated[FileScanner, Depends(get_scanner)],
    cache: Annotated[FileTreeCache, Depends(get_cache)],
    settings: Annotated[Settings, Depends(get_settings)],
    file_types: Annotated[
        list[str] | None,
        Query(description="File extensions to include"),
    ] = None,
    max_depth: Annotated[
        int,
        Query(description="Depth to scan from this folder", ge=1, le=5),
    ] = 2,
    use_cache: Annotated[
        bool,
        Query(description="Use cache if available"),
    ] = True,
) -> list[FileNode]:
    """Get children of a specific folder (lazy loading).

    Used when expanding a folder in the file tree to load its contents on demand.
    If cache is available and use_cache=True, returns cached children instantly.
    """
    from backend.services.file_scanner import ScanFilters

    # Handle path
    if not path.startswith("/"):
        full_path = settings.files_root / path
    else:
        full_path = Path(path)

    # Security check
    try:
        full_path.resolve().relative_to(settings.files_root.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")

    if not full_path.exists() or not full_path.is_dir():
        raise HTTPException(status_code=404, detail="Folder not found")

    # Try cache first if enabled
    if use_cache:
        cached_children = cache.get_cached_children(str(full_path))
        if cached_children is not None:
            # Convert cached dicts to FileNode objects
            return [FileNode(**child) for child in cached_children]

    # Fall back to live scan
    filters = ScanFilters(
        sources=[],
        file_types=file_types or [],
        tickers=[],
        search="",
        hierarchy="",
    )

    result = scanner._scan_directory_sync(full_path, filters, 0, max_depth)
    return result.children if result and result.children else []


# Cache endpoints

@router.get("/cache/info")
async def get_cache_info(
    cache: Annotated[FileTreeCache, Depends(get_cache)],
) -> dict:
    """Get information about the file tree cache.

    Returns cache status, age, and statistics.
    """
    return cache.get_cache_info()


@router.post("/cache/build")
async def build_cache(
    cache: Annotated[FileTreeCache, Depends(get_cache)],
    sources: Annotated[
        list[str] | None,
        Query(description="Source directories to cache (default: all)"),
    ] = None,
    file_types: Annotated[
        list[str] | None,
        Query(description="File types to include"),
    ] = None,
    background: Annotated[
        bool,
        Query(description="Run build in background"),
    ] = False,
) -> dict:
    """Build or rebuild the file tree cache.

    This scans all files at full depth and saves to a JSON cache file.
    Can be run in the background for large file systems.
    """
    import asyncio

    if background:
        # Start background task
        asyncio.create_task(cache.build_cache(sources, file_types))
        return {
            "status": "started",
            "message": "Cache build started in background. Check /cache/info for progress.",
        }

    # Foreground build
    stats = await cache.build_cache(sources, file_types)
    return {
        "status": "completed",
        "stats": stats,
    }


@router.delete("/cache")
async def clear_cache(
    cache: Annotated[FileTreeCache, Depends(get_cache)],
) -> dict:
    """Clear the file tree cache."""
    cache.clear_cache()
    return {"status": "cleared"}


@router.post("/cache/load")
async def load_cache(
    cache: Annotated[FileTreeCache, Depends(get_cache)],
) -> dict:
    """Load cache from disk into memory.

    Called on startup or to reload the cache.
    """
    success = await cache.load_cache()
    return {
        "status": "loaded" if success else "not_found",
        "info": cache.get_cache_info(),
    }
