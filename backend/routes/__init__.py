"""Backend routes package."""

from backend.routes.commands import router as commands_router
from backend.routes.files import router as files_router

__all__ = [
    "commands_router",
    "files_router",
]
