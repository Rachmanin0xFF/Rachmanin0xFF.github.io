from tribo import *
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

arts = tribo.parse_markdown("art", split_markdown_on="## SEPARATOR ##")
tribo.render_markdown(arts, rename_to_index=True)

homepage = tribo.parse_markdown("index.md")
about = tribo.parse_markdown("about/about.md", required_fields=["title"])
faq = tribo.parse_markdown("faq/faq.md", required_fields=["title"])
tribo.render_markdown(about + faq, rename_to_index=True)
tribo.render_markdown(homepage, posts=posts, arts=arts)
