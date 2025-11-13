import os

names = []
for root, dirs, files in os.walk(
    "C:\\Users\\Adam\\Pictures\\TechGallery", topdown=False
):
    for name in files:
        names.append(name)

with open("C:\\Users\\Adam\\Pictures\\TechGallery\\descs_template.txt", "w") as f:
    for name in names:
        f.write(name + ", \n")
