"""Application configuration with cross-platform path detection."""

import sys
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


def detect_dropbox_root() -> Path:
    """Detect Dropbox root path based on operating system."""
    if sys.platform == "win32":
        return Path("D:/pl3 dropbox")
    return Path("/Users/npw/PL3 Dropbox")


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Server settings
    host: str = "127.0.0.1"
    port: int = 8000
    debug: bool = False

    # Path settings - auto-detected based on platform
    dropbox_root: Path = detect_dropbox_root()

    @property
    def files_root(self) -> Path:
        """Root directory for files."""
        return self.dropbox_root / "files"

    @property
    def filings_code(self) -> Path:
        """Path to filings code directory."""
        return self.dropbox_root / "Code" / "filings"

    @property
    def transcripts_code(self) -> Path:
        """Path to transcripts code directory."""
        return self.dropbox_root / "Code" / "transcripts"

    @property
    def filings_root(self) -> Path:
        """Root directory for filings."""
        return self.files_root / "filings"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance (singleton pattern)."""
    return Settings()
