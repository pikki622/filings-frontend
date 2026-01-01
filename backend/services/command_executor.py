"""
Executes CLI commands (filings, transcripts) with real-time output streaming.
Uses asyncio subprocess for non-blocking execution.
"""

import asyncio
from collections.abc import AsyncIterator
from pathlib import Path

from backend.config import get_settings


class CommandExecutor:
    """Manages CLI command execution with streaming output."""

    def __init__(self) -> None:
        settings = get_settings()
        self.filings_path = settings.filings_code
        self.transcripts_path = settings.transcripts_code

    def _get_command_and_cwd(self, cli: str) -> tuple[str, Path]:
        """Get the command and working directory for a CLI.

        Args:
            cli: The CLI name ('filings' or 'transcripts').

        Returns:
            Tuple of (command_name, working_directory).

        Raises:
            ValueError: If the CLI name is not recognized.
        """
        if cli == "filings":
            return "filings", self.filings_path
        elif cli == "transcripts":
            return "transcripts", self.transcripts_path
        else:
            raise ValueError(f"Unknown CLI: {cli}")

    async def execute(
        self,
        cli: str,
        command: str,
        args: list[str],
    ) -> AsyncIterator[str]:
        """Execute command and yield output lines as they arrive.

        Args:
            cli: The CLI to use ('filings' or 'transcripts').
            command: The command to execute (e.g., 'download', 'parse').
            args: List of command arguments.

        Yields:
            Output lines from the command as they are produced.
        """
        cmd_name, cwd = self._get_command_and_cwd(cli)

        # Use uv run to execute within the project's venv
        full_cmd = ["uv", "run", cmd_name, command, *args]

        process = await asyncio.create_subprocess_exec(
            *full_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            cwd=cwd,
        )

        if process.stdout is not None:
            async for line in process.stdout:
                yield line.decode().rstrip()

        await process.wait()
        yield f"\n[Process exited with code {process.returncode}]"

    async def check_cli_available(self, cli: str) -> dict[str, str | bool]:
        """Check if a CLI is available and return version info.

        Args:
            cli: The CLI to check ('filings' or 'transcripts').

        Returns:
            Dictionary with availability status and CLI name.
        """
        cmd_name, cwd = self._get_command_and_cwd(cli)
        try:
            proc = await asyncio.create_subprocess_exec(
                "uv",
                "run",
                cmd_name,
                "--help",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd,
            )
            await proc.wait()
            return {"available": proc.returncode == 0, "cli": cli}
        except Exception as e:
            return {"available": False, "cli": cli, "error": str(e)}


# Singleton instance for dependency injection
_executor: CommandExecutor | None = None


def get_command_executor() -> CommandExecutor:
    """Get the command executor singleton instance."""
    global _executor
    if _executor is None:
        _executor = CommandExecutor()
    return _executor
