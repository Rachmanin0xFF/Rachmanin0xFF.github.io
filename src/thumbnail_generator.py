"""Thumbnail generation utility for images"""

import hashlib
import json
from PIL import Image
from pathlib import Path
import logging


HASH_CACHE_FILE = Path("thumbnail_hashes.json")


def file_hash(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


def generate_thumbnail(
    src: str | Path, dest: str | Path, size: tuple[int, int]
) -> None:
    """
    Generate a thumbnail from a source image.
    Only generates if source hash differs from cached version.

    Args:
        src: Path to the source image
        dest: Path where the thumbnail will be saved
        size: Tuple of (width, height) for the thumbnail
    """
    src = Path(src)
    dest = Path(dest)

    # Compare source file hash to saved version
    cache = {}
    if HASH_CACHE_FILE.exists():
        with open(HASH_CACHE_FILE, "r") as f:
            cache = json.load(f)
    current_hash = file_hash(src)
    cached_hash = cache.get(str(src.name))
    if current_hash == cached_hash:
        return

    logging.debug(f"Generating thumbnail for {src} -> {dest}")
    dest.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(src) as img:
        # crop to centered square
        width, height = img.size
        min_side = min(width, height)
        left = (width - min_side) // 2
        top = (height - min_side) // 2
        right = left + min_side
        bottom = top + min_side
        img = img.crop((left, top, right, bottom))
        img.thumbnail(size, Image.Resampling.LANCZOS)
        img.save(dest, quality=100, optimize=True)

    cache[str(src.name)] = current_hash
    with open(HASH_CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)
