"""
Executes CLI commands (filings, transcripts) with real-time output streaming.
Uses asyncio subprocess for non-blocking execution.
"""

import asyncio
import logging
import re
from collections.abc import AsyncIterator
from pathlib import Path

from backend.config import get_settings

logger = logging.getLogger(__name__)

# Limit concurrent command executions to prevent resource exhaustion
# Module-level semaphore ensures true global limit across all executor instances
MAX_CONCURRENT_COMMANDS = 3
_command_semaphore = asyncio.Semaphore(MAX_CONCURRENT_COMMANDS)

# Allowed commands per CLI to prevent arbitrary command execution
ALLOWED_COMMANDS = {
    "filings": {"download", "parse", "list", "info", "help"},
    "transcripts": {"download", "parse", "list", "info", "help"},
}

# Pattern for validating ticker symbols (1-5 uppercase letters)
TICKER_PATTERN = re.compile(r"^[A-Z]{1,5}$")

# Pattern for validating date formats (YYYY-MM-DD or YYYY)
DATE_PATTERN = re.compile(r"^\d{4}(-\d{2}(-\d{2})?)?$")

# Pattern for validating form types (e.g., 10-K, 10-Q, 8-K)
FORM_PATTERN = re.compile(r"^[0-9A-Z\-/]+$")


def validate_argument(arg: str) -> bool:
    """Validate a command argument to prevent injection attacks.

    Args:
        arg: The argument to validate.

    Returns:
        True if the argument is safe, False otherwise.

    Note:
        Blocks path traversal attempts and shell metacharacters.
    """
    # Block path traversal attempts
    if ".." in arg or arg.startswith("/") or arg.startswith("~"):
        return False

    # Block shell metacharacters and control characters
    dangerous_chars = set(";|&$`\\'\"\n\r\t<>(){}[]!")
    if any(c in arg for c in dangerous_chars):
        return False

    # Block excessively long arguments
    if len(arg) > 256:
        return False

    return True


def sanitize_arguments(args: list[str]) -> list[str]:
    """Sanitize command arguments, raising ValueError for invalid ones.

    Args:
        args: List of arguments to sanitize.

    Returns:
        The same list if all arguments are valid.

    Raises:
        ValueError: If any argument fails validation.
    """
    for arg in args:
        if not validate_argument(arg):
            raise ValueError(f"Invalid argument: {arg!r}")
    return args


class CommandExecutor:
    """Manages CLI command execution with streaming output and proper cleanup."""

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

    def _validate_command(self, cli: str, command: str) -> None:
        """Validate that the command is allowed for this CLI.

        Args:
            cli: The CLI name.
            command: The command to validate.

        Raises:
            ValueError: If the command is not in the allow-list.
        """
        allowed = ALLOWED_COMMANDS.get(cli, set())
        if command not in allowed:
            raise ValueError(
                f"Command '{command}' not allowed for {cli}. "
                f"Allowed: {', '.join(sorted(allowed))}"
            )

    async def _stream_process_output(
        self, process: asyncio.subprocess.Process
    ) -> AsyncIterator[str]:
        """Stream output lines from a subprocess.

        Args:
            process: The subprocess to stream from.

        Yields:
            Decoded output lines with trailing whitespace removed.
        """
        if process.stdout is None:
            return
        async for line in process.stdout:
            yield line.decode().rstrip()

    async def _terminate_process(
        self,
        process: asyncio.subprocess.Process,
        *,
        force_timeout: float = 5.0,
    ) -> None:
        """Terminate a subprocess gracefully, force-killing if needed.

        Args:
            process: The subprocess to terminate.
            force_timeout: Seconds to wait before force-killing.
        """
        if process.returncode is not None:
            return  # Already finished

        try:
            process.terminate()
            try:
                await asyncio.wait_for(process.wait(), timeout=force_timeout)
            except asyncio.TimeoutError:
                logger.warning(f"Force killing subprocess {process.pid}")
                process.kill()
                await process.wait()
        except ProcessLookupError:
            # Process already gone
            pass

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

        Raises:
            ValueError: If command or arguments fail validation.

        Note:
            Uses a module-level semaphore to limit concurrent executions.
            Properly terminates subprocess if client disconnects.
        """
        # Validate command against allow-list
        self._validate_command(cli, command)

        # Sanitize all arguments
        sanitize_arguments(args)

        async with _command_semaphore:
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
                async for line in self._stream_process_output(process):
                    yield line

                await process.wait()
                yield f"\n[Process exited with code {process.returncode}]"
                logger.info(f"Command completed with exit code {process.returncode}")

            except GeneratorExit:
                # Client disconnected - clean up the subprocess
                logger.warning(f"Client disconnected, terminating subprocess {process.pid}")
                await self._terminate_process(process)
                raise

            except Exception:
                logger.exception("Error during command execution")
                await self._terminate_process(process)
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
