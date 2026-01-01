"""Command schema models for CLI command definitions.

This module provides Pydantic models for defining CLI command schemas that can be
serialized to JSON and used by frontend applications to dynamically build command
interfaces.
"""

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class OptionType(str, Enum):
    """Types of CLI options supported by the schema."""

    TEXT = "text"
    INTEGER = "integer"
    FLOAT = "float"
    DATE = "date"
    FLAG = "flag"
    SELECT = "select"
    MULTI_SELECT = "multi_select"
    TICKER = "ticker"
    PATH = "path"


class Argument(BaseModel):
    """A positional argument for a CLI command.

    Attributes:
        name: The argument name as it appears in the command.
        required: Whether the argument is required (default True).
        description: Human-readable description of the argument.
    """

    name: str
    required: bool = True
    description: str = ""


class Option(BaseModel):
    """An optional flag or parameter for a CLI command.

    Attributes:
        name: The long option name (e.g., "output-dir").
        short: Optional single-character short option (e.g., "o").
        type: The option type determining how it should be rendered/validated.
        choices: For SELECT/MULTI_SELECT types, the available choices.
        default: Default value if option is not provided.
        description: Human-readable description of the option.
    """

    name: str
    short: Optional[str] = None
    type: OptionType = OptionType.TEXT
    choices: Optional[list[str]] = None
    default: Optional[Any] = None
    description: str = ""


class CommandSchema(BaseModel):
    """Schema definition for a CLI command.

    This model captures the complete structure of a CLI command including its
    arguments, options, and metadata for generating user interfaces.

    Attributes:
        name: The command name (e.g., "download", "batch").
        description: Human-readable description of what the command does.
        group: Logical grouping for organizing related commands.
        arguments: List of positional arguments.
        options: List of optional flags and parameters.
    """

    name: str
    description: str
    group: str
    arguments: list[Argument] = Field(default_factory=list)
    options: list[Option] = Field(default_factory=list)
