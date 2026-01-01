"""
Executes CLI commands (filings, transcripts) with real-time output streaming.
Uses asyncio subprocess for non-blocking execution.
"""

import asyncio
import logging
from collections.abc import AsyncIterator
from pathlib import Path

from backend.config import get_settings

logger = logging.getLogger(__name__)

# Limit concurrent command executions to prevent resource exhaustion
MAX_CONCURRENT_COMMANDS = 3


class CommandExecutor:
    """Manages CLI command execution with streaming output and proper cleanup."""

    def __init__(self) -> None:
        settings = get_settings()
        self.filings_path = settings.filings_code
        self.transcripts_path = settings.transcripts_code
        self._semaphore = asyncio.Semaphore(MAX_CONCURRENT_COMMANDS)

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

        Note:
            Uses a semaphore to limit concurrent executions.
            Properly terminates subprocess if client disconnects.
        """
        async with self._semaphore:
            cmd_name, cwd = self._get_command_and_cwd(cli)

            # Use uv run to execute within the project's venv
            full_cmd = ["uv", "run", cmd_name, command, *args]

            logger.info(f"Executing: {' '.join(full_cmd)} in {cwd}")

            process = await asyncio.create_subprocess_exec(
                *full_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=cwd,
            )

            try:
                if process.stdout is not None:
                    async for line in process.stdout:
                        yield line.decode().rstrip()

                await process.wait()
                yield f"\n[Process exited with code {process.returncode}]"
                logger.info(f"Command completed with exit code {process.returncode}")

            except GeneratorExit:
                # Client disconnected - clean up the subprocess
                logger.warning(f"Client disconnected, terminating subprocess {process.pid}")
                try:
                    process.terminate()
                    # Give it a moment to terminate gracefully
                    try:
                        await asyncio.wait_for(process.wait(), timeout=5.0)
                    except asyncio.TimeoutError:
                        # Force kill if it doesn't terminate
                        logger.warning(f"Force killing subprocess {process.pid}")
                        process.kill()
                        await process.wait()
                except ProcessLookupError:
                    # Process already terminated
                    pass
                raise

            except Exception as e:
                logger.exception(f"Error during command execution: {e}")
                # Ensure process is cleaned up on any error
                if process.returncode is None:
                    try:
                        process.terminate()
                        await process.wait()
                    except ProcessLookupError:
                        pass
                raise

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
