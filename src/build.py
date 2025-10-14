import markdown

md = markdown.Markdown(extensions=[
    'pymdownx.arithmatex',
    'fenced_code',
    'footnotes',
    'tables',
])

with open('test.md', 'r') as f:
    text = f.read()
    html_converted = md.convert(text)
    print(html_converted)
