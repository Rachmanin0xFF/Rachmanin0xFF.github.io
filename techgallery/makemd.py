md_text='''---
title: Project Gallery
description: This is about page
layout: post.hbs
date: 2024-09-28
---

'''

with open('./descs.txt', 'r') as file:
    for line in file:
        parts = line.split(',')
        name = parts[0]
        description = ','.join(parts[1:]).strip()
        md_text += "<div class=\"imblock\">\n<img class=\"postim\" src=\""
        md_text += name
        md_text += "\"></img>"
        md_text += description
        md_text += "</div>\n\n"

with open("gallery.md", "w") as text_file:
    text_file.write(md_text)

print(md_text)
print("done")