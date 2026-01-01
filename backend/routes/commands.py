"""API routes for CLI command schemas and execution.

This module provides endpoints for:
- Retrieving CLI command schema definitions for dynamic UI generation
- WebSocket endpoint for real-time command execution with streaming output
- CLI availability status checks
"""

import contextlib
import json
from typing import Literal

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from backend.cli_schemas import FILINGS_COMMANDS, TRANSCRIPTS_COMMANDS
from backend.models.command_schema import CommandSchema
from backend.services.command_executor import get_command_executor

router = APIRouter(prefix="/api/commands", tags=["commands"])


# --- Pydantic models for WebSocket messages ---


class ExecuteCommandRequest(BaseModel):
    """Request model for command execution via WebSocket."""

    cli: Literal["filings", "transcripts"] = Field(
        ..., description="The CLI to use for command execution"
    )
    command: str = Field(..., description="The command to execute")
    args: list[str] = Field(
        default_factory=list, description="Command arguments"
    )


class CommandOutputMessage(BaseModel):
    """Output message sent during command execution."""

    type: Literal["output", "error", "complete"] = Field(
        ..., description="Message type"
    )
    data: str = Field(..., description="Message content")


# --- Schema endpoints ---


@router.get("/schemas/{cli}", response_model=list[CommandSchema])
async def get_command_schemas(
    cli: Literal["filings", "transcripts"],
) -> list[CommandSchema]:
    """Get all command schemas for a specific CLI application.

    Args:
        cli: The CLI application to get schemas for. Must be either "filings" or "transcripts".

    Returns:
        List of CommandSchema objects defining all available commands.

    Raises:
        HTTPException: If the CLI name is not recognized.
    """
    if cli == "filings":
        return FILINGS_COMMANDS
    elif cli == "transcripts":
        return TRANSCRIPTS_COMMANDS
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown CLI: {cli}. Must be 'filings' or 'transcripts'.",
        )


class CommandGroupResponse(BaseModel):
    """Response model for command groups."""

    name: str
    commands: list[CommandSchema]


@router.get("/schemas/{cli}/groups", response_model=list[CommandGroupResponse])
async def get_command_groups(
    cli: Literal["filings", "transcripts"],
) -> list[CommandGroupResponse]:
    """Get commands organized by group for a specific CLI application.

    Args:
        cli: The CLI application to get groups for.

    Returns:
        List of CommandGroupResponse objects with group names and their commands.
    """
    if cli == "filings":
        commands = FILINGS_COMMANDS
    elif cli == "transcripts":
        commands = TRANSCRIPTS_COMMANDS
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown CLI: {cli}. Must be 'filings' or 'transcripts'.",
        )

    groups: dict[str, list[CommandSchema]] = {}
    for cmd in commands:
        if cmd.group not in groups:
            groups[cmd.group] = []
        groups[cmd.group].append(cmd)

    return [
        CommandGroupResponse(name=name, commands=cmds)
        for name, cmds in groups.items()
    ]


@router.get("/schemas/{cli}/{command}", response_model=CommandSchema)
async def get_command_schema(
    cli: Literal["filings", "transcripts"],
    command: str,
) -> CommandSchema:
    """Get the schema for a specific command.

    Args:
        cli: The CLI application.
        command: The command name.

    Returns:
        CommandSchema for the specified command.

    Raises:
        HTTPException: If the CLI or command is not found.
    """
    if cli == "filings":
        commands = FILINGS_COMMANDS
    elif cli == "transcripts":
        commands = TRANSCRIPTS_COMMANDS
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown CLI: {cli}. Must be 'filings' or 'transcripts'.",
        )

    for cmd in commands:
        if cmd.name == command:
            return cmd

    raise HTTPException(
        status_code=404,
        detail=f"Command '{command}' not found in {cli} CLI.",
    )


# --- Status endpoint ---


@router.get("/status/{cli}")
async def get_cli_status(
    cli: Literal["filings", "transcripts"],
) -> dict[str, str | bool]:
    """Check if a CLI is available and working.

    Args:
        cli: The CLI to check ('filings' or 'transcripts').

    Returns:
        Dictionary with availability status and CLI name.
    """
    executor = get_command_executor()
    return await executor.check_cli_available(cli)


# --- WebSocket endpoint for command execution ---


@router.websocket("/execute")
async def execute_command_websocket(websocket: WebSocket) -> None:
    """WebSocket endpoint for executing CLI commands with streaming output.

    Accepts JSON messages in the format:
    {
        "cli": "filings" | "transcripts",
        "command": "download",
        "args": ["AAPL", "--types", "10-K"]
    }

    Sends back JSON messages in the format:
    {
        "type": "output" | "error" | "complete",
        "data": "..."
    }
    """
    await websocket.accept()
    executor = get_command_executor()

    try:
        while True:
            # Wait for command request
            raw_data = await websocket.receive_text()

            try:
                data = json.loads(raw_data)
                request = ExecuteCommandRequest(**data)
            except (json.JSONDecodeError, ValueError) as e:
                await websocket.send_json(
                    CommandOutputMessage(
                        type="error",
                        data=f"Invalid request format: {e}",
                    ).model_dump()
                )
                continue

            # Send start message
            await websocket.send_json(
                CommandOutputMessage(
                    type="output",
                    data=f"Executing: {request.cli} {request.command} {' '.join(request.args)}",
                ).model_dump()
            )

            try:
                # Stream command output
                async for line in executor.execute(
                    cli=request.cli,
                    command=request.command,
                    args=request.args,
                ):
                    await websocket.send_json(
                        CommandOutputMessage(
                            type="output",
                            data=line,
                        ).model_dump()
                    )

                # Send completion message
                await websocket.send_json(
                    CommandOutputMessage(
                        type="complete",
                        data="Command execution finished",
                    ).model_dump()
                )

            except ValueError as e:
                await websocket.send_json(
                    CommandOutputMessage(
                        type="error",
                        data=str(e),
                    ).model_dump()
                )
            except Exception as e:
                await websocket.send_json(
                    CommandOutputMessage(
                        type="error",
                        data=f"Execution error: {e}",
                    ).model_dump()
                )

    except WebSocketDisconnect:
        # Client disconnected, clean exit
        pass
    except Exception as e:
        # Unexpected error, try to notify client before closing
        with contextlib.suppress(Exception):
            await websocket.send_json(
                CommandOutputMessage(
                    type="error",
                    data=f"WebSocket error: {e}",
                ).model_dump()
            )
