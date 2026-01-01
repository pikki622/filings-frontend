"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup/shutdown events."""
    settings = get_settings()
    print(f"Starting server on {settings.host}:{settings.port}")
    print(f"Dropbox root: {settings.dropbox_root}")

    # Auto-load file tree cache on startup
    from backend.services.file_cache import get_file_cache

    cache = get_file_cache(settings.files_root)
    if cache.is_cached:
        print("Loading file tree cache...")
        success = await cache.load_cache()
        if success:
            info = cache.get_cache_info()
            print(f"Cache loaded: {info['metadata'].get('total_files', 0)} files, "
                  f"{info['metadata'].get('total_folders', 0)} folders")
        else:
            print("Failed to load cache")
    else:
        print("No cache file found. Run POST /api/files/cache/build to create one.")

    yield
    print("Shutting down server")


app = FastAPI(
    title="Filings Frontend API",
    description="Backend API for filings frontend application",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware for Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    """Manage WebSocket connections."""

    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and track a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection."""
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict) -> None:
        """Broadcast message to all connected clients."""
        for connection in self.active_connections:
            await connection.send_json(message)


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
