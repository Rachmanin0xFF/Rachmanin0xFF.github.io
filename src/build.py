from tribo import *
import sys

output_dir = sys.argv[1] if len(sys.argv) > 1 else "build"

tribo = Tribo(
    content_root="content",
    output_root=output_dir,
    template_root="templates",
    config_path="config.yaml",
)
tribo.copy_all_static_content()

posts = tribo.parse_markdown("posts")
tribo.render_markdown(posts)

arts = tribo.parse_markdown("arts")
tribo.render_markdown(arts)

homepage = tribo.parse_markdown("index.md")
tribo.render_markdown(homepage, posts=posts, arts=arts)
