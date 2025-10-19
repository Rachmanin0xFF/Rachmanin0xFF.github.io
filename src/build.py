import markdown
from pathlib import Path
import shutil
import jinja2
import logging
import yaml
import coloredlogs
import sys
import argparse
import hashlib
from dataclasses import dataclass
from typing import Any

script_name = sys.argv[0].split("/")[-1]


@dataclass
class Page:
    """Represents a parsed markdown file with metadata"""
    path: Path  # relative to CONTENT_ROOT
    html: str
    meta: dict[str, Any]

parser = argparse.ArgumentParser(script_name)
parser.add_argument("output", nargs='?', help="The directory to build to. Defaults to 'build'.", type=str, default="build")
args = parser.parse_args()

logger = logging.getLogger(script_name)
logging.basicConfig(level=logging.INFO)
coloredlogs.install(level='DEBUG', logger=logger)

CONTENT_ROOT = Path("content")
if args.output:
    OUTPUT_ROOT = Path("..") / Path(args.output)
else:
    OUTPUT_ROOT = Path("..") / Path("build")
logger.info(f"Building to output directory: {OUTPUT_ROOT.resolve()}")
TEMPLATE_ROOT = Path("templates")
with open("config.yaml", "r") as f:
    try:
        GLOBAL_CONTEXT = yaml.safe_load(f)
    except Exception as e:
        logger.error(f"Error reading config.yaml: {e}")
        logger.error(f"No config file found or file is malformed; exiting.")
        sys.exit(1)

template_env = jinja2.Environment(loader=jinja2.FileSystemLoader(TEMPLATE_ROOT))

md = markdown.Markdown(
    extensions=[
        "fenced_code",
        "footnotes",
        "tables",
        "meta",
    ],
    extension_configs={}
)


def parse_directory(
    input_directory: Path | str,
    pattern="**/*.md",
    reverse=True,
    sort_by="date",
):
    """
    Recursively parses all matching files in the input directory.
    """
    logger.debug(f"Rendering directory {input_directory} using pattern {pattern}")
    if type(input_directory) is str:
        input_directory = Path(input_directory)

    input_directory = CONTENT_ROOT / input_directory

    # helpers to clean metadata
    flatten = lambda x: (x[0] if type(x) is list and len(x) == 1 else x)
    separate_by_comma = lambda x: (
        x.split(", ") if type(x) is str and len(x.split(", ")) > 1 else x
    )
    trim_whitespace = lambda x: x.strip() if type(x) is str else x
    clean = lambda x: trim_whitespace(separate_by_comma(flatten(x)))

    def metadata_contains_required_fields(meta):
        required_fields = ["title", "date", "layout"]
        return all(field in meta for field in required_fields)

    # read files, parse markdown, extract metadata & check completeness
    pages = []
    for path in input_directory.glob(pattern):
        with open(path, "r") as f:
            text = f.read()
            html_converted = md.convert(text)
            cleaned_metadata = {k: clean(v) for k, v in md.Meta.items()}
            relative_path = path.relative_to(CONTENT_ROOT)
            if not metadata_contains_required_fields(cleaned_metadata):
                logger.warning(
                    f"File {relative_path} is missing required metadata fields. Skipping!"
                )
            else:
                pages.append(Page(
                    path=relative_path,
                    html=html_converted,
                    meta=cleaned_metadata
                ))
            md.reset()

    if not pages:
        logger.info(f"No files found in {input_directory} matching pattern {pattern}")
        return

    logger.debug(f"Found {len(pages)} files to render, sorting...")
    sorted_pages = sorted(
        pages, key=lambda page: page.meta.get(sort_by), reverse=reverse
    )

    # link adjacent pages
    for i in range(len(sorted_pages) - 1):
        sorted_pages[i].meta["next"] = sorted_pages[i + 1].path
        sorted_pages[i + 1].meta["prev"] = sorted_pages[i].path

    return sorted_pages


def render_pages(pages):
    """Render pages into HTML using templates"""
    if pages is None:
        logger.info("No pages to render.")
        return
    if type(pages) is Page:
        pages = [pages]
    for page in pages:
        try:
            template = template_env.get_template(page.meta["layout"])
        except jinja2.TemplateNotFound:
            logger.error(
                f"{page.path} - template not found: {page.meta['layout']}, skipping!"
            )
            continue
        except jinja2.TemplateError as e:
            logger.error(
                f"{page.path} - template error in {page.meta['layout']}: {e}, skipping!"
            )
            continue

        output_path = OUTPUT_ROOT / page.path.with_suffix(".html")
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w") as f:
            f.write(
                template.render(html=page.html, **GLOBAL_CONTEXT, **page.meta)
            )

def copy_static_files_recursive(input_directory: Path | str):
    # copy static files
    static_input = input_directory
    static_output = OUTPUT_ROOT / input_directory.relative_to(CONTENT_ROOT)
    file_hash = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()
    
    for path in static_input.glob("**/*.*"):
        if path.suffix in [".md", ".markdown", ".mdx", ".html", ".htm"]:
            continue
        relative_path = path.relative_to(static_input)
        output_path = static_output / relative_path
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # copy iff content differs or file doesn't exist
        if output_path.exists():
            try:
                if file_hash(path) == file_hash(output_path):
                    continue
            except Exception as e:
                logger.warning(f"Hash comparison failed for {path} and {output_path}: {e}")
        try:
            shutil.copy2(path, output_path)
        except Exception as e:
            logger.error(f"Error copying {path} to {output_path}: {e}")


render_pages(parse_directory("posts"))
copy_static_files_recursive(CONTENT_ROOT)