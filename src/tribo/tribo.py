"""
Tribo - An incredibly simple static site generator

Get the name? "Tribo"? Like, triboelectric effect? Because triboelectric -> static -> site ...
Yeah, it's kind of a stretch...
At least it sounds like a tech product... I feel like ending with a vowel is trendy nowadays.

Built on jinja2 and markdown for adamlastowka.com
"""

import hashlib
import logging
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import coloredlogs
import jinja2
import markdown
from markdown.extensions import Extension
from markdown.blockprocessors import BlockProcessor
import xml.etree.ElementTree as etree
import yaml


@dataclass
class Page:
    """Represents a parsed markdown file with metadata"""

    path: Path  # relative to CONTENT_ROOT
    html: str
    meta: dict[str, Any]


def slugify(text: str) -> str:
    """
    Convert text to a URL-safe slug.
    """
    text = text.lower()
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"[^a-z0-9\-()]", "", text)
    text = re.sub(r"-+", "-", text)
    text = text.strip("-")
    return text


class MathBlockProcessor(BlockProcessor):
    """Process display math blocks ($$...$$) to prevent them from being wrapped in <p> tags."""
    
    DISPLAY_MATH_PATTERN = re.compile(r'^\$\$\s*\n(.*?)\n\$\$', re.MULTILINE | re.DOTALL)
    
    def test(self, parent, block):
        return bool(self.DISPLAY_MATH_PATTERN.search(block))
    
    def run(self, parent, blocks):
        block = blocks.pop(0)
        match = self.DISPLAY_MATH_PATTERN.search(block)
        
        if match:
            # Get text before math
            before = block[:match.start()]
            if before.strip():
                self.parser.parseBlocks(parent, [before])
            
            # Create a div to hold the math
            math_div = etree.SubElement(parent, 'div')
            math_div.set('class', 'math-display')
            # Store the raw math text directly in the div
            math_div.text = match.group(0)
            
            # Get text after math
            after = block[match.end():]
            if after.strip():
                self.parser.parseBlocks(parent, [after])


class MathExtension(Extension):
    """Extension to handle LaTeX math blocks."""
    
    def extendMarkdown(self, md):
        md.parser.blockprocessors.register(
            MathBlockProcessor(md.parser),
            'math-block',
            27  # Priority: just before paragraph (28)
        )


class Tribo:
    def __init__(
        self,
        content_root: Path | str = "content",
        output_root: Path | str = "build",
        template_root: Path | str = "templates",
        config_path: Path | str = "config.yaml",
    ):
        self.logger = logging.getLogger("tribo")
        logging.basicConfig(level=logging.INFO)
        coloredlogs.install(level="DEBUG", logger=self.logger)

        self.content_root = Path(content_root)
        self.output_root = Path(output_root)
        self.template_root = Path(template_root)

        self.logger.info(f"Building to output directory: {self.output_root.resolve()}")

        # Load config
        self.global_context = self._load_config(config_path)

        # Setup Jinja2
        self.template_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(self.template_root)
        )

        # Setup Markdown
        self.md = markdown.Markdown(
            extensions=[
                "fenced_code",
                "footnotes",
                "tables",
                "meta",
                MathExtension(),
            ],
        )

    def _load_config(self, config_path: Path | str) -> dict[str, Any]:
        """Load configuration from YAML file."""
        config_path = Path(config_path)
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                context = yaml.safe_load(f)
                self.logger.info(f"Loaded config from {config_path}")
                return context
        except FileNotFoundError:
            self.logger.error(f"Config file not found: {config_path}")
            sys.exit(1)
        except Exception as e:
            self.logger.error(f"Error reading {config_path}: {e}")
            sys.exit(1)

    def parse_markdown(
        self,
        input_path: Path | str,
        pattern: str = "**/*.md",
        reverse: bool = True,
        sort_by: str = "date",
        required_fields=["title", "date", "layout"],
        split_markdown_on: str | None = None,
    ) -> list[Page] | None:
        """Recursively parses all matching files in the input directory, or a single file."""
        if isinstance(input_path, str):
            input_path = Path(input_path)

        input_path = self.content_root / input_path

        # helpers to clean metadata
        def flatten(x):
            return x[0] if isinstance(x, list) and len(x) == 1 else x

        def trim_whitespace(x):
            return x.strip() if isinstance(x, str) else x

        def clean(x):
            return trim_whitespace(flatten(x))

        def metadata_contains_required_fields(meta: dict) -> bool:
            return all(field in meta for field in required_fields)

        if input_path.is_dir():
            paths = list(input_path.glob(pattern))
            self.logger.debug(
                f"Parsing directory {input_path} using pattern {pattern}, found {len(paths)} files."
            )
        elif input_path.is_file():
            paths = [input_path]
            self.logger.debug(f"Parsing single file {input_path}.")
        else:
            self.logger.error(f"Path not found: {input_path}")
            return None

        # read files, parse markdown, extract metadata & check completeness
        pages = []
        for path in paths:
            with open(path, "r", encoding="utf-8") as f:
                full_text = f.read()
                if split_markdown_on:
                    parts = full_text.split(split_markdown_on)
                    parts = [part.strip() for part in parts if part.strip()]
                    self.logger.debug(
                        f"Splitting {path} on '{split_markdown_on}' into {len(parts)} parts."
                    )
                else:
                    parts = [full_text]
                markdown_was_multipart = len(parts) > 1

                for text in parts:
                    html_converted = self.md.convert(text)
                    cleaned_metadata = {k: clean(v) for k, v in self.md.Meta.items()}
                    relative_path = path.relative_to(self.content_root)
                    cleaned_metadata["parent_folder"] = relative_path.parent.name

                    if cleaned_metadata.get("draft", "").lower() == "true":
                        self.logger.debug(f"Skipping draft: {relative_path}")
                        self.md.reset()
                        continue
                    
                    # Reset markdown parser state for next document
                    self.md.reset()

                    if markdown_was_multipart:
                        # if the markdown was split into multiple parts, we want seperate folders for each part to be created
                        # in the output build dir. This means we should append some unique identifier to the path. We will
                        # get this identifier from the title if it exists, otherwise we will use the index of the part.
                        if "title" in cleaned_metadata:
                            identifier = slugify(cleaned_metadata["title"])
                        else:
                            identifier = f"part-{parts.index(text) + 1}"
                        cleaned_metadata["slug"] = identifier
                        relative_path = (
                            relative_path.parent / identifier / relative_path.name
                        )
                    if not metadata_contains_required_fields(cleaned_metadata):
                        self.logger.warning(
                            f"File {relative_path} only had fields {list(cleaned_metadata.keys())}, "
                            f"required fields are {required_fields}, skipping!"
                        )
                    else:
                        pages.append(
                            Page(
                                path=relative_path,
                                html=html_converted,
                                meta=cleaned_metadata,
                            )
                        )
                    self.md.reset()

        if not pages:
            if input_path.is_dir():
                self.logger.info(
                    f"No files found in {input_path} matching pattern {pattern}"
                )
            else:
                self.logger.info(f"No files found at {input_path}")
            return None

        self.logger.debug(f"Found {len(pages)} content files, sorting...")
        sorted_pages = sorted(
            pages, key=lambda page: page.meta.get(sort_by), reverse=reverse
        )

        # link adjacent pages
        for i in range(len(sorted_pages) - 1):
            sorted_pages[i].meta["next-path"] = sorted_pages[i + 1].path
            sorted_pages[i + 1].meta["prev-path"] = sorted_pages[i].path

        return sorted_pages

    def render_markdown(
        self,
        pages: list[Page] | Page | None,
        layout_override: str | None = None,
        rename_to_index: bool = False,
        **kwargs,
    ) -> None:
        """
        Render pages into HTML using the template specified in page.meta["layout"].
        You can override this by providing a layout argument.

        All page metadata is passed to the template by default.
        If you want any other context passed to the template, provide it in kwargs.
        """
        if pages is None:
            self.logger.info("No pages to render.")
            return
        if isinstance(pages, Page):
            pages = [pages]
        self.logger.info(f"Rendering {len(pages)} pages...")
        for page in pages:
            layout = layout_override or page.meta["layout"]
            try:
                template = self.template_env.get_template(layout)
            except jinja2.TemplateNotFound:
                self.logger.error(
                    f"{page.path} - template not found: {layout}, skipping!"
                )
                continue
            except jinja2.TemplateError as e:
                self.logger.error(
                    f"{page.path} - template error in {layout}: {e}, skipping!"
                )
                continue

            output_path = self.output_root / page.path.with_suffix(".html")
            if rename_to_index:
                output_path = output_path.parent / "index.html"
            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, "w", encoding="utf-8") as f:
                f.write(
                    template.render(
                        html=page.html,
                        **self.global_context,
                        **page.meta,
                        **kwargs,
                    )
                )

    def copy_all_static_content(self, skip_existing: bool = True) -> None:
        """Copy all static files from content root to output."""
        self._copy_static_files_recursive(
            self.content_root, skip_existing=skip_existing
        )

    def _copy_static_files_recursive(
        self, input_directory: Path | str, skip_existing: bool = True
    ) -> None:
        """Copy static files from input directory to output."""
        if isinstance(input_directory, str):
            input_directory = Path(input_directory)

        static_input = input_directory
        static_output = self.output_root / input_directory.relative_to(
            self.content_root
        )
        def file_hash(p):
            return hashlib.sha256(open(p, "rb").read()).hexdigest()

        for path in static_input.glob("**/*.*"):
            if path.suffix in [".md", ".markdown", ".mdx", ".html", ".htm"]:
                continue
            relative_path = path.relative_to(static_input)
            output_path = static_output / relative_path
            output_path.parent.mkdir(parents=True, exist_ok=True)

            # copy iff content differs or file doesn't exist
            if output_path.exists() and skip_existing:
                try:
                    if file_hash(path) == file_hash(output_path):
                        continue
                except Exception as e:
                    self.logger.warning(
                        f"Hash comparison failed for {path} and {output_path}: {e}"
                    )
            try:
                shutil.copy2(path, output_path)
            except Exception as e:
                self.logger.error(f"Error copying {path} to {output_path}: {e}")


if __name__ == "__main__":
    print("Tribo is intended to be used as a module, not run directly.")
    exit(1)
