import markdown
from pathlib import Path
import shutil
import jinja2
import logging

logging.basicConfig(level=logging.INFO)

GLOBAL_CONTEXT = {
    "site_title": "Adam's Website :-]",
    "site_author": "Adam Lastowka",
}

CONTENT_ROOT = Path("content")
OUTPUT_ROOT = Path("../docs")
TEMPLATE_ROOT = Path("templates")

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
    if type(input_directory) is str:
        input_directory = Path(input_directory)

    input_directory = CONTENT_ROOT / input_directory

    flatten = lambda x: (x[0] if type(x) is list and len(x) == 1 else x)
    separate_by_comma = lambda x: (
        x.split(", ") if type(x) is str and len(x.split(", ")) > 1 else x
    )
    trim_whitespace = lambda x: x.strip() if type(x) is str else x
    clean = lambda x: trim_whitespace(separate_by_comma(flatten(x)))

    def metadata_contains_required_fields(meta):
        required_fields = ["title", "date", "layout"]
        return all(field in meta for field in required_fields)

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

    sorted_files = sorted(
        files.items(), key=lambda item: item[1]["meta"].get(sort_by), reverse=reverse
    )

    for i in range(len(sorted_files) - 1):
        sorted_files[i][1]["meta"]["next"] = sorted_files[i + 1][0]
        sorted_files[i + 1][1]["meta"]["prev"] = sorted_files[i][0]

    for filename, data in sorted_files:
        print(data["meta"])
        # template = template_env.get_template(data["meta"]["layout"])
        template = template_env.get_template("nothing.html")
        output_path = OUTPUT_ROOT / filename.with_suffix(".html")
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "x") as f:
            print(output_path)
            f.write(template.render(**GLOBAL_CONTEXT, **data))


render_directory("posts")
