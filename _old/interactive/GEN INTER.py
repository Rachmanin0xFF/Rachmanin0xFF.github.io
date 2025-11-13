#!/usr/bin/python
import os, sys, time
from datetime import datetime

from PIL import Image

path = "C:/Users/Adam/website/src/interactive/"
dirs = os.listdir(path)


def is_locked(filepath):
    locked = None
    file_object = None
    if os.path.exists(filepath):
        try:
            buffer_size = 8
            # Opening file in append mode and read the first 8 characters.
            file_object = open(filepath, "a", buffer_size)
            if file_object:
                locked = False
        except IOError as message:
            locked = True
        finally:
            if file_object:
                file_object.close()
    return locked


def wait_for_file(filepath):
    wait_time = 1
    while is_locked(filepath):
        time.sleep(wait_time)


def gen():
    for item in dirs:
        if not os.path.isfile(path + item):
            if not item in ("descs", "thumb", "libraries"):
                print(path + item)
                f, e = os.path.splitext(path + item)

                ts = os.path.getmtime(path + item)

                try:
                    epp = open(
                        "/".join(f.split("/")[:-1])
                        + "/descs/"
                        + f.split("/")[-1]
                        + ".md",
                        "x",
                    )
                    epp.write(
                        "---\ntitle: "
                        + f.split("/")[-1]
                        + "\ndescription: This is about page\nlayout: interpage.hbs\ninterpath: "
                        + f.split("/")[-1]
                        + e
                        + "\ndate: "
                        + datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d")
                        + "\n---\n"
                    )
                    epp.close()

                    image = Image.new("RGB", (256, 256))
                    image.save(path + "/thumb/" + f.split("/")[-1] + ".jpg", "JPG")
                except FileExistsError:
                    print(f.split("/")[-1] + "description already exists")

                print("processed " + path + item)


gen()
