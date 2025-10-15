import markdown
from pathlib import Path
import shutil
import jinja2
import logging
import yaml

logging.basicConfig(level=logging.INFO)

CONTENT_ROOT = Path("content")
OUTPUT_ROOT = Path("../docs")
TEMPLATE_ROOT = Path("templates")
with open("config.yaml", "r") as f:
    GLOBAL_CONTEXT = yaml.safe_load(f)

template_env = jinja2.Environment(loader=jinja2.FileSystemLoader(TEMPLATE_ROOT))

md = markdown.Markdown(
    extensions=[
        "pymdownx.arithmatex",
        "fenced_code",
        "footnotes",
        "tables",
        "meta",
    ]
)


def render_directory(
    input_directory: Path | str,
    pattern="**/*.md",
    reverse=True,
    sort_by="date",
):
    """
    Recursively renders all matching files in the input directory.
    """
    logging.debug(f"Rendering directory {input_directory} using pattern {pattern}")
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
    files = {}
    for path in input_directory.glob(pattern):
        with open(path, "r") as f:
            text = f.read()
            html_converted = md.convert(text)
            cleaned_metadata = {k: clean(v) for k, v in md.Meta.items()}
            relative_path = path.relative_to(CONTENT_ROOT)
            if not metadata_contains_required_fields(cleaned_metadata):
                logging.warning(
                    f"File {relative_path} is missing required metadata fields. Skipping!"
                )
            else:
                files[relative_path] = {
                    "html": html_converted,
                    "meta": cleaned_metadata,
                }
            md.reset()

    if not files:
        logging.info(f"No files found in {input_directory} matching pattern {pattern}")
        return

    logging.debug(f"Found {len(files)} files to render, sorting...")
    sorted_files = sorted(
        files.items(), key=lambda item: item[1]["meta"].get(sort_by), reverse=reverse
    )

    for i in range(len(sorted_files) - 1):
        sorted_files[i][1]["meta"]["next"] = sorted_files[i + 1][0]
        sorted_files[i + 1][1]["meta"]["prev"] = sorted_files[i][0]

    # render into templates
    for filename, data in sorted_files:
        try:
            template = template_env.get_template(data["meta"]["layout"])
        except jinja2.TemplateNotFound:
            logging.error(
                f"{filename} - template not found: {data['meta']['layout']}, skipping!"
            )
            continue
        except jinja2.TemplateError as e:
            logging.error(
                f"{filename} - template error in {data['meta']['layout']}: {e}, skipping!"
            )
            continue

        output_path = OUTPUT_ROOT / filename.with_suffix(".html")
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w") as f:
            f.write(
                template.render(html=data["html"], **GLOBAL_CONTEXT, **data["meta"])
            )

    # copy static files
    static_input = input_directory
    static_output = OUTPUT_ROOT / input_directory.relative_to(CONTENT_ROOT)
    for path in static_input.glob("**/*.*"):
        if path.suffix in [".md", ".markdown", ".mdx", ".html", ".htm"]:
            continue
        relative_path = path.relative_to(static_input)
        output_path = static_output / relative_path
        output_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            shutil.copy2(path, output_path)
        except Exception as e:
            logging.error(f"Error copying {path} to {output_path}: {e}")


render_directory("posts")
render_directory("arts")
