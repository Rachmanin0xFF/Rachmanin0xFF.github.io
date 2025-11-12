from tribo import *
from thumbnail_generator import generate_thumbnail
import sys

output_dir = sys.argv[1] if len(sys.argv) > 1 else "../build"

tribo = Tribo(
    content_root="content",
    output_root=output_dir,
    template_root="templates",
    config_path="config.yaml",
)
tribo.copy_all_static_content()

posts = tribo.parse_markdown("posts")
tribo.render_markdown(posts, rename_to_index=True)

artwork = tribo.parse_markdown("art", split_markdown_on="## SEPARATOR ##")
artwork_paths = [
    f"{tribo.content_root}/art/files/{art.meta['artpath']}" for art in artwork
]
thumbnail_paths = [
    f"{tribo.content_root}/art/thumbnails/thumb_{art.meta['artpath']}"
    for art in artwork
]
for src, dest in zip(artwork_paths, thumbnail_paths):
    generate_thumbnail(src, dest, (256, 256))


sounds = tribo.parse_markdown("audio", split_markdown_on="## SEPARATOR ##")

homepage = tribo.parse_markdown("index.md")
about = tribo.parse_markdown("about/about.md", required_fields=["title"])
qa = tribo.parse_markdown("qa/qa.md", required_fields=["title"])


tribo.render_markdown(homepage, posts=posts, artwork=artwork, sounds=sounds)
tribo.render_markdown(sounds + artwork + about + qa, rename_to_index=True)
