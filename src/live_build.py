"""Watch content and templates directories for changes and rebuild on file modification."""

import sys
import time
import hashlib
import logging
from pathlib import Path
from subprocess import run
import coloredlogs

WATCH_DIRS = [Path(".")]
POLL_INTERVAL = 1

logger = logging.getLogger("live_build")
logging.basicConfig(level=logging.INFO)
coloredlogs.install(level="DEBUG", logger=logger)


def get_file_hashes(directory: Path) -> dict:
    """Get hash of all files in directory."""
    hashes = {}
    for file_path in directory.rglob("*"):
        if file_path.is_file():
            try:
                with open(file_path, "rb") as f:
                    file_hash = hashlib.md5(f.read()).hexdigest()
                    hashes[str(file_path)] = file_hash
            except Exception as e:
                logger.warning(f"Error hashing {file_path}: {e}")
    return hashes


def run_build_script(output_dir: str) -> int:
    """Run the build script and return the exit code."""
    result = run([sys.executable, "build.py", output_dir])
    if result.returncode == 0:
        logger.info("Build complete!")
    else:
        logger.error("Build failed!")
    return result.returncode


def main():
    output_dir = sys.argv[1] if len(sys.argv) > 1 else "../build"

    # initial build
    result = run_build_script(output_dir)

    logger.info(f"Watching {', '.join(str(d) for d in WATCH_DIRS)} for changes...")
    logger.info(f"Building to {output_dir}")
    logger.info("Press Ctrl+C to stop.")

    file_hashes = {}
    for watch_dir in WATCH_DIRS:
        file_hashes.update(get_file_hashes(watch_dir))
    logger.debug(f"Initial state: {len(file_hashes)} files tracked")

    try:
        while True:
            time.sleep(POLL_INTERVAL)
            new_hashes = {}
            for watch_dir in WATCH_DIRS:
                new_hashes.update(get_file_hashes(watch_dir))

            if new_hashes != file_hashes:
                # Find what changed
                added = set(new_hashes.keys()) - set(file_hashes.keys())
                removed = set(file_hashes.keys()) - set(new_hashes.keys())
                modified = {
                    f
                    for f in file_hashes
                    if f in new_hashes and file_hashes[f] != new_hashes[f]
                }

                if added or removed or modified:
                    logger.info("Changes detected!")
                    if added:
                        logger.debug(f"Added: {len(added)} files")
                    if removed:
                        logger.debug(f"Removed: {len(removed)} files")
                    if modified:
                        logger.debug(f"Modified: {list(modified)[:3]}")  # Show first 3
                    logger.info("Rebuilding...")

                    result = run_build_script(output_dir)

                    file_hashes = new_hashes

    except KeyboardInterrupt:
        logger.info("Stopping watcher.")


if __name__ == "__main__":
    main()
