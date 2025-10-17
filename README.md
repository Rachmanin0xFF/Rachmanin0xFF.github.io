What's up! This is the repo for my personal website.

Lemme give you a quick rundown:

I used to be using [Metalsmith](https://metalsmith.io/), mostly because I liked how simple + lightweight it was. I think it was a great choice... five years ago :P

Since then, [11ty](https://www.11ty.dev/) has gained a lot of traction, as well as a slew of other static site builders. I consdired using it, but I kinda realized that I *really* don't need much from a static site builder, and I'm kind of tired of Node. I just wanted something that:
1. Dumps markdown into templates
2. Does a litle pagination / sorting
3. Runs some random Python scripts I use to generate my nifty dithered thumbnails, etc.
4. Is configurable enough that I could slot in something interactive / complex if I wanted to

Okay, so why not just do it myself??????
that's what is happening here...


## How to Build?

I'm not sure why you want to build ***my*** website :woozy_face:, but here you go. It's just a little Python script...

1. **Set up a virtual environment** (recommended):
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # For Windows users: .venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r src/requirements.txt
   ```

3. **Build the site**:
   ```bash
   cd src
   python build.py
   ```
   
   By default, this builds to `docs`. You can specify a different output directory:
   ```bash
   python build.py my_test_build_folder
   ```
