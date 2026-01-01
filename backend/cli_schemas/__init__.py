"""CLI command schema definitions package.

This package provides schema definitions for all CLI commands in the filings
and transcripts applications. These schemas are used by the frontend to
dynamically generate command interfaces.
"""

from backend.cli_schemas.filings import FILINGS_COMMANDS
from backend.cli_schemas.transcripts import TRANSCRIPTS_COMMANDS

__all__ = [
    "FILINGS_COMMANDS",
    "TRANSCRIPTS_COMMANDS",
]
