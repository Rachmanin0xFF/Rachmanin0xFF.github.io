"""Watch content and templates directories for changes and rebuild on file modification."""

import sys
import time
import hashlib
from pathlib import Path
from subprocess import run

WATCH_DIRS = [Path(".")]
POLL_INTERVAL = 1


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
                print(f"Error hashing {file_path}: {e}")
    return hashes

def run_build_script(output_dir: str) -> int:
    """Run the build script and return the exit code."""
    result = run([sys.executable, "build.py", output_dir])
    if result.returncode == 0:
        print(f"[{time.strftime('%H:%M:%S')}] Build complete!\n")
    else:
        print(f"[{time.strftime('%H:%M:%S')}] Build failed!\n")
    return result.returncode

def main():
    output_dir = sys.argv[1] if len(sys.argv) > 1 else "../build"

    # initial build
    result = run_build_script(output_dir)

    print(f"Watching {', '.join(str(d) for d in WATCH_DIRS)} for changes...")
    print(f"Building to {output_dir}")
    print("Press Ctrl+C to stop.\n")
    
    file_hashes = {}
    for watch_dir in WATCH_DIRS:
        file_hashes.update(get_file_hashes(watch_dir))
    print(f"Initial state: {len(file_hashes)} files tracked\n")
    
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
                modified = {f for f in file_hashes if f in new_hashes and file_hashes[f] != new_hashes[f]}
                
                if added or removed or modified:
                    print(f"[{time.strftime('%H:%M:%S')}] Changes detected!")
                    if added:
                        print(f"  Added: {len(added)} files")
                    if removed:
                        print(f"  Removed: {len(removed)} files")
                    if modified:
                        print(f"  Modified: {list(modified)[:3]}")  # Show first 3
                    print("  Rebuilding...")

                    result = run_build_script(output_dir)
                    
                    file_hashes = new_hashes
    
    except KeyboardInterrupt:
        print("\nStopping watcher.")


if __name__ == "__main__":
    main()
