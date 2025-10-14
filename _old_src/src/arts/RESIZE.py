#!/usr/bin/python
from PIL import Image, ImageOps
import os, sys, time

path = "C:/Users/Adam/website/src/arts/"
dirs = os.listdir( path )

def is_locked(filepath):
    locked = None
    file_object = None
    if os.path.exists(filepath):
        try:
            buffer_size = 8
            # Opening file in append mode and read the first 8 characters.
            file_object = open(filepath, 'a', buffer_size)
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

def resize():
	src = Image.open('resources/PLET.png')
	nos = Image.open('resources/BLUE50_2.png')
	src = src.convert('P')
	for item in dirs:
		if item != 'BLUE50_2.png' and item != 'PLET.png' and os.path.isfile(path+item):
			if item.split('.')[-1].lower() in ('png', 'jpg', 'bmp', 'jfif', 'gif'):
				wait_for_file(path+item)
				
				im = Image.open(path+item).convert('RGB')
				w, h = im.size
				imi = None;
				if w > h:
					imi = im.crop(((w-h)/2, 0, (w-h)/2 + h, h))
				else:
					imi = im.crop((0, (h-w)/2, w, (h-w)/2 + w))
				f, e = os.path.splitext(path+item)
				imResize = imi.resize((426, 426), Image.ANTIALIAS)
				imResize = imResize.convert('RGB')
				imResize = ImageOps.autocontrast(imResize, cutoff = 1, ignore = 1)
				
				imResize.paste(nos, mask=nos)
				
				imResize = imResize.quantize(50, method=1)
				imResize = imResize.convert('RGB')
				imResize.save("/".join(f.split('/')[:-1]) + '/thumb/' + f.split('/')[-1] + '_thumb.jpg', 'JPEG', quality=90)
				
				ts = os.path.getmtime(path+item)
				
				try:
					epp = open("/".join(f.split('/')[:-1]) + '/descs/' + f.split('/')[-1] + '.md', 'x')
					try:
						epp.write('---\ntitle: ' + f.split('/')[-1] + '\ndescription: This is about page\nlayout: artpage.hbs\nartpath: ' + f.split('/')[-1] + e + '\ndate: ' + datetime.utcfromtimestamp(ts).strftime('%Y-%m-%d') + '\n---\n')
					except NameError:
						epp.write('---\ntitle: ' + f.split('/')[-1] + '\ndescription: This is about page\nlayout: artpage.hbs\nartpath: ' + f.split('/')[-1] + e + '\n---\n')
					epp.close()
				except FileExistsError:
					print(f.split('/')[-1] + 'description already exists')
				
				print("resized " + path + item)

resize()