"""CLI entry point for filings-frontend."""

import argparse
import os
import subprocess
import sys
import signal
from pathlib import Path

# Default project location
DEFAULT_PROJECT_PATH = Path("/Users/npw/PL3 Dropbox/Code/filings_frontend")


def get_project_root() -> Path:
    """Get the project root directory."""
    # Check environment variable first
    env_path = os.environ.get("FILINGS_FRONTEND_PATH")
    if env_path:
        return Path(env_path)

    # Check if current directory is the project
    cwd = Path.cwd()
    if (cwd / "pyproject.toml").exists() and (cwd / "frontend").exists():
        return cwd

    # Fall back to default path
    if DEFAULT_PROJECT_PATH.exists():
        return DEFAULT_PROJECT_PATH

    raise FileNotFoundError(
        "Cannot find filings-frontend project. Either:\n"
        "  1. Run from the project directory\n"
        "  2. Set FILINGS_FRONTEND_PATH environment variable\n"
        f"  3. Ensure project exists at {DEFAULT_PROJECT_PATH}"
    )


def launch():
    """Launch both backend and frontend servers."""
    try:
        project_root = get_project_root()
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)

    frontend_dir = project_root / "frontend"

    print("Starting Filings Frontend...")
    print(f"Project: {project_root}")
    print("=" * 40)

    processes = []

    try:
        # Start backend
        print("Starting backend on http://localhost:8000...")
        backend_proc = subprocess.Popen(
            ["uv", "run", "uvicorn", "backend.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"],
            cwd=project_root,
        )
        processes.append(backend_proc)

        # Start frontend
        print("Starting frontend on http://localhost:5173...")
        frontend_proc = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=frontend_dir,
        )
        processes.append(frontend_proc)

        print()
        print("Both servers running!")
        print("  Frontend: http://localhost:5173")
        print("  Backend:  http://localhost:8000")
        print("  API Docs: http://localhost:8000/docs")
        print()
        print("Press Ctrl+C to stop.")

        # Wait for processes
        for proc in processes:
            proc.wait()

    except KeyboardInterrupt:
        print("\nShutting down...")
        for proc in processes:
            proc.terminate()
        for proc in processes:
            proc.wait()
        print("Done.")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        prog="filingsfrontend",
        description="Filings Frontend - SEC filings and transcripts management"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # launch command
    subparsers.add_parser("launch", help="Launch both backend and frontend servers")

    args = parser.parse_args()

    if args.command == "launch":
        launch()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
