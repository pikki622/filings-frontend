"""CLI entry point for filings-frontend."""

import argparse
import os
import subprocess
import sys
import signal
from pathlib import Path


def get_project_root() -> Path:
    """Get the project root directory."""
    return Path(__file__).parent.parent


def launch():
    """Launch both backend and frontend servers."""
    project_root = get_project_root()
    frontend_dir = project_root / "frontend"

    print("Starting Filings Frontend...")
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
