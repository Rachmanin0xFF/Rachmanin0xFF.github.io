#!/usr/bin/python
import os, sys, time
from datetime import datetime

path = "C:/Users/Adam/website/src/audio/"
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
        if os.path.isfile(path + item):
            if item.split(".")[-1].lower() in ("mp3"):
                wait_for_file(path + item)
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
                        + "\ndescription: This is about page\nlayout: audiopage.hbs\naudiopath: "
                        + f.split("/")[-1]
                        + e
                        + "\ndate: "
                        + datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d")
                        + "\n---\n"
                    )
                    epp.close()
                except FileExistsError:
                    print(f.split("/")[-1] + "description already exists")

                print("processed " + path + item)


gen()
