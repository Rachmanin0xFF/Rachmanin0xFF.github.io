"""Build player-facing Az puzzle pages from ordinary authored HTML."""

import base64
import hashlib
import json
from html import escape
from html.parser import HTMLParser
import mimetypes
from pathlib import Path

from PIL import Image

SECRET_FILE = "secret.json"
PAGE_FILE = "index.html"
LINK_MAGIC = "az-link:"
IMAGE_MAGIC = b"az-image:"
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}
SKIP_TEXT_TAGS = {"script", "style", "textarea"}
GARBAGE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%*+=?"
VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "source", "track", "wbr",
}

RUNTIME = """
<style>
    .az-unlock { display: grid; place-items: center; min-height: 9rem; }
    .az-unlock input { min-width: 18rem; }
    .az-cursor { background: #fff; color: #000; }
</style>
<section class="az-unlock">
    <label><input id="az-key" autocomplete="off" spellcheck="false"></label>
    <button id="az-unlock-button" type="button">Unlock</button>
</section>
<script>
document.addEventListener("DOMContentLoaded", () => {
    const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*+=?";
    const unsafe = /[\\p{Cf}\\p{Cs}\\p{Co}\\p{Zl}\\p{Zp}\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F]/gu;
    const decoder = new TextDecoder();
    const cipherNodes = [...document.querySelectorAll("[data-az-cipher]")];
    const linkNodes = [...document.querySelectorAll("[data-az-href]")];
    const imageNodes = [...document.querySelectorAll("[data-az-image]")].map(image => ({ image }));
    const bytes = encoded => Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
    const normalize = key => key.trim().toUpperCase();
    let attempt = 0;

    async function keyStream(key) {
        const keyBytes = new TextEncoder().encode(key);
        const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", keyBytes));
        return {
            permutation: digest,
            xor: new TextEncoder().encode(
                [...digest].map(byte => byte.toString(16).padStart(2, "0")).join("")
            ),
        };
    }

    function xor(cipher, hash) {
        return cipher.map((byte, index) => byte ^ hash[index % hash.length]);
    }

    function xorPixels(pixels, hash) {
        const output = new Uint8ClampedArray(pixels);
        for (let index = 0; index < output.length; index += 4) {
            output[index] ^= hash[index % hash.length];
            output[index + 1] ^= hash[(index + 1) % hash.length];
            output[index + 2] ^= hash[(index + 2) % hash.length];
        }
        return output;
    }

    function shuffledIndices(length, hash) {
        let state = ((hash[0] << 24) | (hash[1] << 16) | (hash[2] << 8) | hash[3]) >>> 0;
        const indices = [...Array(length).keys()];
        for (let index = length - 1; index > 0; index--) {
            state ^= state << 13;
            state ^= state >>> 17;
            state ^= state << 5;
            state >>>= 0;
            const swap = state % (index + 1);
            [indices[index], indices[swap]] = [indices[swap], indices[index]];
        }
        return indices;
    }

    async function decrypt(encoded, key) {
        return decoder.decode(xor(bytes(encoded), (await keyStream(key)).xor));
    }

    function display(text) {
        return text.replace(unsafe, char => glyphs[char.codePointAt(0) % glyphs.length]);
    }

    function showGarbage() {
        for (const node of cipherNodes) node.textContent = node.dataset.azGarbage;
    }

    async function restoreLinks(key) {
        for (const link of linkNodes) {
            const url = await decrypt(link.dataset.azHref, key);
            if (url.startsWith("az-link:")) link.href = url.slice(8);
        }
    }

    async function prepareImage(state) {
        if (state.canvas) return state;
        const { image } = state;
        await image.decode();
        state.canvas = document.createElement("canvas");
        state.width = image.naturalWidth;
        state.height = image.naturalHeight;
        state.canvas.width = state.width;
        state.canvas.height = state.height;
        state.canvas.className = image.className;
        state.canvas.style.cssText = image.style.cssText;
        state.canvas.style.width = `${image.clientWidth}px`;
        state.canvas.style.height = `${image.clientHeight}px`;
        for (const attribute of ["width", "height", "alt"]) {
            if (image.hasAttribute(attribute)) state.canvas.setAttribute(attribute, image.getAttribute(attribute));
        }
        state.context = state.canvas.getContext("2d");
        state.context.drawImage(image, 0, 0, state.width, state.height);
        state.locked = state.context.getImageData(0, 0, state.width, state.height);
        image.replaceWith(state.canvas);
        return state;
    }

    function revealImage(state, hash, permutationHash, currentAttempt) {
        const { context, locked, width, height } = state;
        context.putImageData(locked, 0, 0);
        const unxored = xorPixels(locked.data, hash);
        const pixels = new ImageData(width, height);
        const order = shuffledIndices(width * height, permutationHash);
        for (let destination = 0; destination < order.length; destination++) {
            const source = order[destination];
            pixels.data.set(unxored.slice(destination * 4, destination * 4 + 4), source * 4);
        }
        const revealOrder = [...Array(width * height).keys()];
        for (let index = revealOrder.length - 1; index > 0; index--) {
            const swap = Math.floor(Math.random() * (index + 1));
            [revealOrder[index], revealOrder[swap]] = [revealOrder[swap], revealOrder[index]];
        }
        const visible = new ImageData(new Uint8ClampedArray(locked.data), width, height);
        let offset = 0;
        function frame() {
            if (currentAttempt !== attempt) return;
            for (const pixel of revealOrder.slice(offset, offset + 5000)) {
                visible.data.set(pixels.data.slice(pixel * 4, pixel * 4 + 4), pixel * 4);
            }
            context.putImageData(visible, 0, 0);
            offset += 5000;
            if (offset < order.length) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    async function restoreImages(key, currentAttempt) {
        const stream = await keyStream(key);
        for (const image of imageNodes) {
            if (currentAttempt !== attempt) return;
            revealImage(await prepareImage(image), stream.xor, stream.permutation, currentAttempt);
        }
    }

    function reveal(texts, currentAttempt, nodeIndex = 0, characterIndex = 0) {
        if (currentAttempt !== attempt || nodeIndex === texts.length) return;
        const characters = [...texts[nodeIndex]];
        const node = cipherNodes[nodeIndex];
        const visible = [...node.textContent];
        visible[characterIndex] = characters[characterIndex];
        if (nodeIndex + 1 === texts.length && characterIndex + 1 === characters.length) {
            node.textContent = visible.join("");
            return;
        }
        const cursor = document.createElement("span");
        cursor.className = "az-cursor";
        cursor.textContent = visible[characterIndex];
        node.replaceChildren(
            document.createTextNode(visible.slice(0, characterIndex).join("")),
            cursor,
            document.createTextNode(visible.slice(characterIndex + 1).join("")),
        );
        if (characterIndex + 1 === characters.length) {
            setTimeout(() => {
                node.textContent = visible.join("");
                reveal(texts, currentAttempt, nodeIndex + 1);
            }, 15);
            return;
        }
        setTimeout(() => reveal(texts, currentAttempt, nodeIndex, characterIndex + 1), 15);
    }

    async function unlock() {
        const key = normalize(document.getElementById("az-key").value);
        if (!/^[\x21-\x7e]+$/.test(key)) return showGarbage();
        const currentAttempt = ++attempt;
        showGarbage();
        const texts = await Promise.all(
            cipherNodes.map(node => decrypt(node.dataset.azCipher, key))
        );
        await Promise.all([restoreLinks(key), restoreImages(key, currentAttempt)]);
        setTimeout(() => {
            reveal(texts.map(display), currentAttempt);
        }, 350);
    }

    document.getElementById("az-unlock-button").addEventListener("click", unlock);
    document.getElementById("az-key").addEventListener("keydown", event => {
        if (event.key === "Enter") unlock();
    });
    showGarbage();
});
</script>
"""


class TextEncryptor(HTMLParser):
    """Copy HTML while replacing visible text nodes with encrypted spans."""

    def __init__(self, key: bytes, images: dict[str, tuple[str, str, str]]):
        super().__init__(convert_charrefs=True)
        self.key = key
        self.images = images
        self.parts: list[str] = []
        self.open_tags: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag == "img" and (source := dict(attrs).get("src")) in self.images:
            preview, encrypted, mime_type = self.images[source]
            safe_attrs = [(name, value) for name, value in attrs if name != "src"]
            safe_attrs.extend([
                ("src", preview),
                ("data-az-image", encrypted),
                ("data-az-type", mime_type),
            ])
            rendered = " ".join(
                name if value is None else f'{name}="{escape(value, quote=True)}"'
                for name, value in safe_attrs
            )
            self.parts.append(f"<{tag} {rendered}>")
            return
        href = dict(attrs).get("href") if tag == "a" else None
        if href is None:
            self.parts.append(self.get_starttag_text())
        else:
            safe_attrs = [
                (name, value) for name, value in attrs if name != "href"
            ]
            safe_attrs.append(("data-az-href", encrypt(LINK_MAGIC + href, self.key)))
            rendered = " ".join(
                name if value is None else f'{name}="{escape(value, quote=True)}"'
                for name, value in safe_attrs
            )
            self.parts.append(f"<{tag} {rendered}>")
        if tag not in VOID_TAGS:
            self.open_tags.append(tag)

    def handle_startendtag(self, tag: str, attrs) -> None:
        self.parts.append(self.get_starttag_text())

    def handle_endtag(self, tag: str) -> None:
        self.parts.append(f"</{tag}>")
        if self.open_tags and self.open_tags[-1] == tag:
            self.open_tags.pop()

    def handle_data(self, data: str) -> None:
        if not data.strip() or any(tag in SKIP_TEXT_TAGS for tag in self.open_tags):
            self.parts.append(data)
            return
        cipher = encrypt(data, self.key)
        self.parts.append(
            f'<span data-az-cipher="{cipher}" data-az-garbage="{garbage(data, self.key)}"></span>'
        )

    def handle_comment(self, data: str) -> None:
        self.parts.append(f"<!--{data}-->")

    def handle_decl(self, decl: str) -> None:
        self.parts.append(f"<!{decl}>")


def encrypt(text: str, key: bytes) -> str:
    """Return UTF-8 text XORed with a repeating ASCII key as base64."""
    payload = text.encode("utf-8")
    cipher = xor(payload, key)
    return base64.b64encode(cipher).decode("ascii")


def xor(data: bytes, key: bytes) -> bytes:
    """XOR data against the ASCII hexadecimal SHA-256 digest of a key."""
    key_hash = hashlib.sha256(key).hexdigest().encode("ascii")
    return bytes(byte ^ key_hash[index % len(key_hash)] for index, byte in enumerate(data))


def shuffled_indices(length: int, key: bytes) -> list[int]:
    """Return a key-seeded Fisher-Yates permutation of pixel positions."""
    mask = (1 << 32) - 1
    state = int.from_bytes(hashlib.sha256(key).digest()[:4], "big")
    indices = list(range(length))
    for index in range(length - 1, 0, -1):
        state ^= (state << 13) & mask
        state ^= state >> 17
        state ^= (state << 5) & mask
        state &= mask
        swap = state % (index + 1)
        indices[index], indices[swap] = indices[swap], indices[index]
    return indices


def scrambled_pixels(pixels: bytes, key: bytes) -> bytes:
    """Shuffle RGBA pixels and XOR their channels for a non-recognizable preview."""
    pixel_count = len(pixels) // 4
    output = bytearray(len(pixels))
    for destination, source in enumerate(shuffled_indices(pixel_count, key)):
        output[destination * 4:(destination + 1) * 4] = pixels[source * 4:(source + 1) * 4]
    key_hash = hashlib.sha256(key).hexdigest().encode("ascii")
    for offset in range(0, len(output), 4):
        output[offset] ^= key_hash[offset % len(key_hash)]
        output[offset + 1] ^= key_hash[(offset + 1) % len(key_hash)]
        output[offset + 2] ^= key_hash[(offset + 2) % len(key_hash)]
    return bytes(output)


def garbage(text: str, key: bytes) -> str:
    """Return printable garbage while retaining the text node's whitespace."""
    cipher = base64.b64decode(encrypt(text, key))
    key_hash = hashlib.sha256(key).hexdigest().encode("ascii")
    output = []
    offset = 0
    for character in text:
        width = len(character.encode("utf-8"))
        if character.isspace():
            output.append(character)
        else:
            byte = cipher[offset] ^ key_hash[offset % len(key_hash)]
            output.append(GARBAGE_GLYPHS[byte % len(GARBAGE_GLYPHS)])
        offset += width
    return "".join(output)


def encrypt_page(page: str, key: bytes, images: dict[str, tuple[str, str, str]]) -> str:
    """Preserve the document and replace visible body text with encrypted spans."""
    body_start = page.lower().find("<body")
    body_end = page.lower().rfind("</body>")
    if body_start < 0 or body_end < 0:
        raise ValueError("puzzle page needs <body> and </body> tags")
    body_open_end = page.find(">", body_start) + 1
    if body_open_end == 0:
        raise ValueError("puzzle page has an incomplete <body> tag")

    encryptor = TextEncryptor(key, images)
    encryptor.feed(page[body_open_end:body_end])
    encryptor.close()
    return page[:body_open_end] + RUNTIME + "".join(encryptor.parts) + page[body_end:]


def encrypt_images(source_dir: Path, output_dir: Path, key: bytes) -> dict[str, tuple[str, str, str]]:
    """Write noisy previews and encrypted originals, then remove public originals."""
    images = {}
    for source in source_dir.rglob("*"):
        if not source.is_file() or source.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        relative = source.relative_to(source_dir)
        output = output_dir / relative
        preview = output.with_name(f"{output.name}.az.png")
        encrypted = output.with_name(f"{output.name}.az")
        with Image.open(source) as image:
            rgba = image.convert("RGBA")
            scrambled = Image.frombytes("RGBA", rgba.size, scrambled_pixels(rgba.tobytes(), key))
            scrambled.save(preview)
        encrypted.write_bytes(xor(IMAGE_MAGIC + source.read_bytes(), key))
        output.unlink(missing_ok=True)
        mime_type = mimetypes.guess_type(source.name)[0] or "application/octet-stream"
        images[relative.as_posix()] = (
            preview.relative_to(output_dir).as_posix(),
            encrypted.relative_to(output_dir).as_posix(),
            mime_type,
        )
    return images


def build(source_dir: Path, output_dir: Path, site) -> None:
    """Encrypt every direct child puzzle directory that contains a secret file."""
    for puzzle_dir in sorted(source_dir.iterdir()):
        if not puzzle_dir.is_dir():
            continue
        secret_path = puzzle_dir / SECRET_FILE
        if not secret_path.exists():
            continue

        secret = json.loads(secret_path.read_text(encoding="utf-8"))
        key_text = secret["key"].strip().upper()
        if not key_text or not key_text.isascii() or not key_text.isprintable():
            raise ValueError(f"{secret_path} key must use printable ASCII characters")
        key = key_text.encode("ascii")

        page_path = output_dir / puzzle_dir.name / PAGE_FILE
        if not page_path.exists():
            raise FileNotFoundError(f"missing puzzle page {page_path}")
        images = encrypt_images(puzzle_dir, page_path.parent, key)
        page_path.write_text(
            encrypt_page(page_path.read_text(encoding="utf-8"), key, images),
            encoding="utf-8",
        )
        site.logger.info(f"Encrypted puzzle page {puzzle_dir.name}")
