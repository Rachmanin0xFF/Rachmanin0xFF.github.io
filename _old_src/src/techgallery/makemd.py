md_text = """---
title: Project Image Gallery
description: Photos of some of the projects I've worked on.
layout: gallery.hbs
date: 2024-09-28
---

Hi!

Below is a collection of images from (mostly personal) projects I've worked on over the years.
A few things to keep in mind:
1. This gallery is **not comprehensive**; I've done more than what's shown here.
2. It is biased towards projects that are visually interesting (so expect a disproportionate amount of computer graphics work).
3. This is an unordered collection (I sorted alphabetically by file name).
4. I'll try to make this page prettier soon, but I don't have time to muck with CSS right now.

There are 50-100 MB of images here, but they're set to `loading="lazy"`. I've tried to keep any wallpaper-worthy photos at their full 1920x1080 resolution. Enjoy!
"""

with open("./descs.txt", "r") as file:
    for line in file:
        parts = line.split(",")
        name = parts[0]
        description = ",".join(parts[1:]).strip()
        md_text += '<div class="imblock">\n<img class="postim" src="'
        md_text += name
        md_text += '" loading="lazy"></img>'
        md_text += description
        md_text += "</div>\n\n"

with open("gallery.md", "w") as text_file:
    text_file.write(md_text)

print(md_text)
print("done")
