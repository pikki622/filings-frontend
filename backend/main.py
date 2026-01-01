"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from backend.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup/shutdown events."""
    settings = get_settings()
    logger.info(f"Starting server on {settings.host}:{settings.port}")
    logger.info(f"Dropbox root: {settings.dropbox_root}")

    # Auto-load file tree cache on startup
    from backend.services.file_cache import get_file_cache

    cache = get_file_cache(settings.files_root)
    if cache.is_cached:
        logger.info("Loading file tree cache...")
        success = await cache.load_cache()
        if success:
            info = cache.get_cache_info()
            logger.info(
                f"Cache loaded: {info['metadata'].get('total_files', 0)} files, "
                f"{info['metadata'].get('total_folders', 0)} folders"
            )
        else:
            logger.warning("Failed to load cache - running without cache")
    else:
        logger.info("No cache file found. Run POST /api/files/cache/build to create one.")

    yield
    logger.info("Shutting down server")


app = FastAPI(
    title="Filings Frontend API",
    description="Backend API for filings frontend application",
    version="0.1.0",
    lifespan=lifespan,
)

# GZip compression for large responses (file trees can be several MB)
app.add_middleware(GZipMiddleware, minimum_size=500)

# CORS middleware for Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept-Encoding"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all unhandled exceptions with proper logging."""
    logger.exception(f"Unhandled exception for {request.method} {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred. Please try again.",
        },
    )


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/api/config")
async def get_config() -> dict[str, str]:
    """Get current configuration paths."""
    settings = get_settings()
    return {
        "dropbox_root": str(settings.dropbox_root),
        "files_root": str(settings.files_root),
        "filings_root": str(settings.filings_root),
    }


# WebSocket connection manager
class ConnectionManager:
    """Manage WebSocket connections with safe disconnect handling."""

    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and track a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.debug(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        """Safely remove a WebSocket connection."""
        try:
            self.active_connections.remove(websocket)
            logger.debug(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
        except ValueError:
            # Already disconnected - this is fine
            pass

    async def broadcast(self, message: dict) -> None:
        """Broadcast message to all connected clients with failure handling."""
        dead_connections: list[WebSocket] = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to WebSocket: {e}")
                dead_connections.append(connection)

        # Clean up dead connections
        for conn in dead_connections:
            self.disconnect(conn)


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """WebSocket endpoint for real-time updates."""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Import and include routers
from backend.routes import commands_router, files_router

app.include_router(commands_router)
app.include_router(files_router)


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
