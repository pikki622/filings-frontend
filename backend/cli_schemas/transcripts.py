"""Transcripts CLI command schema definitions.

This module defines all CLI commands available in the transcripts package,
organized by functional groups for the frontend interface.
"""

from backend.models.command_schema import Argument, CommandSchema, Option, OptionType

# =============================================================================
# Pipeline Commands Group
# =============================================================================

ZIPS_COMMAND = CommandSchema(
    name="zips",
    description="Complete Transcript Processing Pipeline: Move BB_Docs from Bloomberg, extract ZIP files, rename and organize PDFs, convert PDFs to Markdown, clean transcript lists, and post-process Markdown files.",
    group="pipeline",
    arguments=[],
    options=[],
)

# =============================================================================
# Processing Commands Group
# =============================================================================

CONVERT_MD_COMMAND = CommandSchema(
    name="convert-md",
    description="Convert PDF transcripts to Markdown using Docling. Processes all PDFs in the transcripts directory and outputs Markdown files.",
    group="processing",
    arguments=[],
    options=[
        Option(
            name="tickers",
            type=OptionType.TEXT,
            description="Comma-separated list of ticker symbols to filter (e.g., AAPL,MSFT,GOOGL).",
        ),
        Option(
            name="force",
            type=OptionType.FLAG,
            default=False,
            description="Force re-conversion even if markdown file already exists.",
        ),
        Option(
            name="threads",
            type=OptionType.INTEGER,
            description="Number of threads for Docling processing. Default: CPU count.",
        ),
        Option(
            name="status-only",
            type=OptionType.FLAG,
            default=False,
            description="Only show conversion status, don't perform conversions.",
        ),
        Option(
            name="verbose",
            type=OptionType.FLAG,
            default=False,
            description="Show detailed output including failed files.",
        ),
        Option(
            name="workers",
            type=OptionType.INTEGER,
            default=1,
            description="Number of parallel worker processes. Default: 1, use 4-8 for speedup.",
        ),
    ],
)

POSTPROCESS_MD_COMMAND = CommandSchema(
    name="postprocess-md",
    description="Post-process markdown files to fix HTML entities and clean up. Applies: HTML entity decoding, Bloomberg disclaimer removal, participant name fixes, image placeholder removal, stray character cleanup, and blank line consolidation.",
    group="processing",
    arguments=[],
    options=[
        Option(
            name="tickers",
            type=OptionType.TEXT,
            description="Comma-separated list of ticker symbols to filter (e.g., AAPL,MSFT,GOOGL).",
        ),
        Option(
            name="workers",
            type=OptionType.INTEGER,
            default=4,
            description="Number of parallel worker processes. Default: 4.",
        ),
        Option(
            name="status-only",
            type=OptionType.FLAG,
            default=False,
            description="Only show status by sampling files, don't process.",
        ),
        Option(
            name="sample-size",
            type=OptionType.INTEGER,
            default=100,
            description="Number of files to sample for status check. Default: 100.",
        ),
        Option(
            name="verbose",
            type=OptionType.FLAG,
            default=False,
            description="Show detailed output including failed files.",
        ),
    ],
)

# =============================================================================
# Utilities Commands Group
# =============================================================================

EARNINGS_COMMAND = CommandSchema(
    name="earnings",
    description="Compare and rename earnings transcript files. DEPRECATED: PDF renaming is now handled only during post-processing. Files maintain original names until the final stage.",
    group="utilities",
    arguments=[],
    options=[
        Option(
            name="dry-run",
            type=OptionType.FLAG,
            default=False,
            description="Preview changes without executing. Default: execute renames.",
        ),
        Option(
            name="tickers",
            type=OptionType.TEXT,
            description="Comma-separated list of ticker symbols to filter (e.g., AAPL,MSFT,GOOGL).",
        ),
        Option(
            name="start-date",
            type=OptionType.TEXT,
            description="Start date filter in YYYYMMDD format (e.g., 20200101).",
        ),
        Option(
            name="end-date",
            type=OptionType.TEXT,
            description="End date filter in YYYYMMDD format (e.g., 20231231).",
        ),
        Option(
            name="verbose",
            type=OptionType.FLAG,
            default=False,
            description="Show detailed output including sample renames and conflicts.",
        ),
    ],
)

# =============================================================================
# Export all commands as a list
# =============================================================================

TRANSCRIPTS_COMMANDS: list[CommandSchema] = [
    # Pipeline group
    ZIPS_COMMAND,
    # Processing group
    CONVERT_MD_COMMAND,
    POSTPROCESS_MD_COMMAND,
    # Utilities group
    EARNINGS_COMMAND,
]
