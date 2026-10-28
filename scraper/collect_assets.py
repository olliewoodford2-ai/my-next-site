#!/usr/bin/env python3
"""Collect every publicly reachable original asset behind the Pear landing page.

Adapted from the original octopus-based scraper to use plain Playwright.
"""

import asyncio
import base64
import csv
import json
import re
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlsplit

from playwright.async_api import async_playwright, Page, TimeoutError as PWTimeoutError

# Configuration
ENTRY_URL = "https://pear.no/"
SITE_ORIGIN = "https://pear.no"
BROWSER_TIMEOUT_SECONDS = 30.0
BROWSER_LOCALE = "en-US"
PAGE_READY_TIMEOUT_SECONDS = 30.0
SCROLL_SETTLE_TIMEOUT_SECONDS = 20.0
STAGE_CANVAS_MINIMUM = 1
REFERENCE_SCAN_LIMIT = 200
MAX_ASSET_ATTEMPTS = 3
SCROLL_STALL_LIMIT = 3

# Pacing
ACTION_PAUSE_RANGE = (0.8, 1.8)
ACTION_PAUSE_MODE = 1.2
SCROLL_PAUSE_RANGE = (0.35, 0.9)
SCROLL_PAUSE_MODE = 0.55
SCROLL_STEP_RANGE = (700, 1400)

# XPaths
STAGE_XPATH = "xpath=//section[contains(concat(' ', normalize-space(@class), ' '), ' stage ')]"
BOOT_READY_XPATH = "xpath=//div[contains(concat(' ', normalize-space(@class), ' '), ' ov ')][contains(concat(' ', normalize-space(@class), ' '), ' go ')]"
STAGE_CANVAS_XPATH = "xpath=//canvas[contains(concat(' ', normalize-space(@class), ' '), ' gl ')]"
STAGE_VIDEO_XPATH = "xpath=//video[@src]"

# Asset locators
DOCUMENT_ASSET_LOCATORS = (
    ("xpath=//link[@rel='icon'][@href]", "href"),
    ("xpath=//link[@rel='apple-touch-icon'][@href]", "href"),
    ("xpath=//link[@rel='preload'][@href]", "href"),
    ("xpath=//link[@rel='stylesheet'][@href]", "href"),
    ("xpath=//script[@src]", "src"),
    ("xpath=//meta[@property='og:image']", "content"),
    ("xpath=//*[@style]", "style"),
)

SCENE_ASSET_LOCATORS = (
    ("xpath=//video[@src]", "src"),
    ("xpath=//video[@poster]", "poster"),
    ("xpath=//img[@src]", "src"),
    ("xpath=//img[@srcset]", "srcset"),
)

# Patterns
STYLE_URL_PATTERN = r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)"
ASSET_LITERAL_PATTERN = (
    r"[`'\"](/[^`'\"\s]*\.(?:webp|jpg|jpeg|png|avif|gif|svg|mp4|webm|woff2|woff"
    r"|ttf|otf|json|css|js))(?:\?[^`'\"\s]*)?[`'\"]"
)
SEQUENCE_DIRECTORY_PATTERN = r"[`'\"](/films/[A-Za-z0-9_-]+)[`'\"]\s*,\s*(\d+)"
MODEL_BRIDGE_PATTERN = r"bridge\s*:\s*[`'\"]([A-Za-z0-9_-]+)[`'\"]"
MODEL_EXTRA_PATTERN = r"name\s*:\s*`([A-Za-z0-9_-]+)`\s*,\s*count\s*:"

SEQUENCE_FRAME_TEMPLATE = "{directory}/f_{frame:03d}.webp?r=13"
MODEL_FRAME_TEMPLATE = "/films/model/{model}/{tier}/f_{frame:03d}.webp?r=13"
MODEL_MANIFEST_TEMPLATE = "/films/model/{model}/manifest.json?r=13"

SCENE_BY_DIRECTORY = (
    ("/films/model/", "reel"),
    ("/films/flysky/", "flysky"),
    ("/films/trans/", "trans"),
    ("/films/plan/", "plan"),
    ("/films/coda/", "coda"),
    ("/films/tree/", "tree"),
)
SCENE_BY_PATH = {
    "/films/signal.mp4": "signal",
    "/films/signal-poster.jpg": "signal",
    "/films/colossus.mp4": "colossus",
    "/films/colossus-poster.jpg": "colossus",
    "/films/reveal.mp4": "reveal",
    "/films/reveal-poster.jpg": "reveal",
    "/films/footer-loop.mp4": "foot",
    "/art/scaffold_expand.jpg": "scaffold",
}
DOCUMENT_SCENE = "page"

DOWNLOADED_STATUS = "downloaded"
COLLECTION_DIRECTORY_NAME = "collected_assets"
MANIFEST_FILENAME = "asset-manifest.csv"
MISSING_MANIFEST_FILENAME = "missing-assets.csv"
ASSET_COLUMNS = (
    "asset_url",
    "filename",
    "asset_type",
    "size_bytes",
    "scene",
    "download_status",
    "local_path",
)

EXTENSION_MEDIA_TYPES = {
    ".avif": "image/avif",
    ".bmp": "image/bmp",
    ".css": "text/css",
    ".gif": "image/gif",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".ico": "image/x-icon",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript",
    ".json": "application/json",
    ".mjs": "text/javascript",
    ".mov": "video/quicktime",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".ogg": "audio/ogg",
    ".otf": "font/otf",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ttf": "font/ttf",
    ".vtt": "text/vtt",
    ".wav": "audio/wav",
    ".webm": "video/webm",
    ".webmanifest": "application/manifest+json",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
}
ASSET_SUFFIXES = tuple(EXTENSION_MEDIA_TYPES)
STYLESHEET_SUFFIX = ".css"
SCRIPT_SUFFIX = ".js"

# JavaScript snippets
FETCH_ASSET_JS = """
async (url) => {
  try {
    const response = await fetch(url, { credentials: 'include', cache: 'no-store' });
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + chunk));
    }
    return {
      ok: true,
      status: response.status,
      contentType: (response.headers.get('content-type') || '').split(';')[0].trim(),
      byteLength: bytes.length,
      bodyBase64: btoa(binary)
    };
  } catch (error) {
    return { ok: false, status: 0, contentType: '', byteLength: 0, bodyBase64: '' };
  }
}
"""

FETCH_TEXT_JS = """
async (urls) => {
  const results = [];
  for (const url of urls) {
    try {
      const response = await fetch(url, { credentials: 'include' });
      results.push({ url: url, ok: response.ok, text: response.ok ? await response.text() : '' });
    } catch (error) {
      results.push({ url: url, ok: false, text: '' });
    }
  }
  return results;
}
"""

READ_PAGE_STATE_JS = """
() => ({
  scrollY: Math.round(window.scrollY),
  scrollHeight: document.documentElement.scrollHeight,
  viewportHeight: window.innerHeight,
  inlineStyles: Array.from(document.querySelectorAll('style')).map((element) => element.textContent || ''),
  loaded: performance.getEntriesByType('resource').map((entry) => entry.name)
})
"""

def expand_reference(raw: str) -> list[str]:
    """Every asset reference one discovered attribute value carries."""
    references: list[str] = []
    if "url(" in raw:
        references.extend(re.findall(STYLE_URL_PATTERN, raw))
    elif "," in raw and " " in raw:
        for candidate in raw.split(","):
            references.append(candidate.strip().split(" ")[0])
    else:
        references.append(raw.strip())
    return [reference for reference in references if reference]

def is_asset_url(url: str) -> bool:
    """Whether a URL is a first-party file the page references as an asset."""
    parsed = urlsplit(url)
    if f"{parsed.scheme}://{parsed.netloc}" != SITE_ORIGIN:
        return False
    if not parsed.path or parsed.path == "/":
        return False
    lowered = parsed.path.lower()
    return any(lowered.endswith(suffix) for suffix in ASSET_SUFFIXES)

def asset_filename(url: str) -> str:
    return urlsplit(url).path.rsplit("/", 1)[-1]

def asset_local_path(url: str) -> str:
    return "/".join(
        segment
        for segment in urlsplit(url).path.split("/")
        if segment and segment not in {".", ".."}
    )

def scene_for(url: str) -> str:
    """The site's own name for the scene that carries this asset."""
    path = urlsplit(url).path
    if path in SCENE_BY_PATH:
        return SCENE_BY_PATH[path]
    for prefix, scene in SCENE_BY_DIRECTORY:
        if path.startswith(prefix):
            return scene
    return DOCUMENT_SCENE

def media_type_from_url(url: str) -> str:
    path = urlsplit(url).path.lower()
    for suffix, media_type in EXTENSION_MEDIA_TYPES.items():
        if path.endswith(suffix):
            return media_type
    return "application/octet-stream"

def detected_media_type(payload: bytes) -> str:
    """The media type the retrieved bytes themselves prove, or "" when unknown."""
    if payload.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if payload.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if payload.startswith(b"GIF8"):
        return "image/gif"
    if payload[:4] == b"RIFF" and payload[8:12] == b"WEBP":
        return "image/webp"
    if payload[4:8] == b"ftyp":
        return "video/mp4"
    if payload.startswith(b"wOF2"):
        return "font/woff2"
    if payload.startswith(b"wOFF"):
        return "font/woff"
    leading = payload.lstrip()[:64].lower()
    if leading.startswith(b"<!doctype html") or leading.startswith(b"<html"):
        return "text/html"
    if leading.startswith(b"<svg") or leading.startswith(b"<?xml"):
        return "image/svg+xml"
    if leading[:1] in {b"{", b"["}:
        return "application/json"
    return ""

def manifest_tier(text: str) -> tuple[int, str]:
    """The frame count and highest tier directory a reel manifest declares."""
    try:
        payload = json.loads(text)
    except (TypeError, ValueError):
        return 0, ""
    tiers = payload.get("tiers") if isinstance(payload, dict) else None
    if not isinstance(tiers, dict) or not tiers:
        return 0, ""
    selected = max(
        tiers,
        key=lambda key: int(key) if str(key).isdigit() else 0,
    )
    count = tiers[selected]
    if isinstance(count, dict):
        count = count.get("count")
    if isinstance(count, bool) or not isinstance(count, int) or count < 1:
        return 0, ""
    return count, selected

def failure_label(exc: BaseException) -> str:
    """A sanitized item-failure reason; it carries no exception message."""
    if isinstance(exc, PWTimeoutError):
        return "readiness_timeout"
    return "retrieval_error"

class AssetManifest:
    """Writes the CSV export, the missing-resource manifest, and the originals."""

    def __init__(self, directory: Path) -> None:
        self.directory = directory
        self.available = False
        self._manifest_f = None
        self._missing_f = None
        self._manifest_writer = None
        self._missing_writer = None

    def open(self) -> bool:
        try:
            self.directory.mkdir(parents=True, exist_ok=True)
            self._manifest_f = (self.directory / MANIFEST_FILENAME).open(
                "w", newline="", encoding="utf-8"
            )
            self._missing_f = (self.directory / MISSING_MANIFEST_FILENAME).open(
                "w", newline="", encoding="utf-8"
            )
            self._manifest_writer = csv.writer(self._manifest_f)
            self._missing_writer = csv.writer(self._missing_f)
            self._manifest_writer.writerow(ASSET_COLUMNS)
            self._missing_writer.writerow(ASSET_COLUMNS)
            self._manifest_f.flush()
            self._missing_f.flush()
        except OSError:
            self.close()
            return False
        self.available = True
        return True

    def save(self, local_path: str, payload: bytes) -> bool:
        if not self.available:
            return False
        target = self.directory / local_path
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(payload)
        except OSError:
            return False
        return True

    def write(self, record: dict[str, Any]) -> None:
        if not self.available:
            return
        row = [record.get(column) for column in ASSET_COLUMNS]
        try:
            self._manifest_writer.writerow(row)
            self._manifest_f.flush()
            if record.get("download_status") != DOWNLOADED_STATUS:
                self._missing_writer.writerow(row)
                self._missing_f.flush()
        except OSError:
            self.available = False

    def close(self) -> None:
        self.available = False
        for handle in (self._manifest_f, self._missing_f):
            if handle is None:
                continue
            try:
                handle.close()
            except OSError:
                continue
        self._manifest_f = None
        self._missing_f = None

async def wait_for_stable_state(observe, condition, label: str, timeout_seconds: float):
    """Wait until condition(observe()) becomes true or timeout."""
    start = asyncio.get_event_loop().time()
    while True:
        state = await observe()
        if condition(state):
            return
        if asyncio.get_event_loop().time() - start > timeout_seconds:
            raise PWTimeoutError(f"{label} did not stabilize within {timeout_seconds}s")
        await asyncio.sleep(0.2)

async def paced_scroll(scroll_fn, direction: int):
    """Perform a paced scroll step."""
    import random
    import math

    # Sample step size and pause using triangular distribution (mode-weighted)
    def triangular(min_v, max_v, mode):
        u = random.random()
        if u < (mode - min_v) / (max_v - min_v):
            return min_v + math.sqrt(u * (max_v - min_v) * (mode - min_v))
        else:
            return max_v - math.sqrt((1 - u) * (max_v - min_v) * (max_v - mode))

    step = int(triangular(*SCROLL_STEP_RANGE, ACTION_PAUSE_MODE))
    await scroll_fn(step * direction)
    pause = triangular(*SCROLL_PAUSE_RANGE, SCROLL_PAUSE_MODE)
    await asyncio.sleep(pause)

async def stage_ready(page: Page) -> None:
    """The pinned stage is mounted and the bundle has taken it over."""

    async def observe():
        return (
            await page.locator(BOOT_READY_XPATH).count(),
            await page.locator(STAGE_CANVAS_XPATH).count(),
            await page.locator(STAGE_VIDEO_XPATH).count(),
        )

    await wait_for_stable_state(
        observe,
        lambda state: state[0] > 0
        and state[1] >= STAGE_CANVAS_MINIMUM
        and state[2] > 0,
        "stage page",
        timeout_seconds=PAGE_READY_TIMEOUT_SECONDS,
    )

async def page_state(page: Page) -> dict[str, Any]:
    return await page.evaluate(READ_PAGE_STATE_JS)

async def scroll_through_page(page: Page) -> None:
    """Scroll the whole document so every lazily requested scene asset is asked for."""
    previous_height = -1
    stalled = 0

    async def scroll_by(delta):
        # The page uses window scrolling (pinned stage), not element scrolling
        await page.evaluate(f"() => {{ window.scrollBy(0, {delta}); }}")

    while True:
        state = await page_state(page)
        height = int(state["scrollHeight"])
        position = int(state["scrollY"])
        viewport = int(state["viewportHeight"])
        print(f"  Scroll state: pos={position}, height={height}, viewport={viewport}, progress={(position+viewport)/height*100:.1f}%")
        if position + viewport >= height - 2:
            print("  Reached bottom of page")
            break
        await paced_scroll(lambda d: scroll_by(d), direction=1)
        state = await page_state(page)
        if int(state["scrollHeight"]) <= previous_height and int(state["scrollY"]) <= position:
            stalled += 1
            if stalled >= SCROLL_STALL_LIMIT:
                print(f"  Stalled {stalled} times, stopping scroll")
                break
        else:
            stalled = 0
        previous_height = int(state["scrollHeight"])

    async def observe():
        latest = await page_state(page)
        return (
            int(latest["scrollY"]),
            int(latest["scrollHeight"]),
            int(latest["viewportHeight"]),
            len(latest["loaded"]),
        )

    await wait_for_stable_state(
        observe,
        lambda state: state[0] + state[2] >= state[1] - 2,
        "scrolled document",
        timeout_seconds=SCROLL_SETTLE_TIMEOUT_SECONDS,
    )

async def discover_assets(page: Page) -> list[dict[str, str]]:
    """Build the ordered inventory of every asset the page references."""
    found: list[dict[str, str]] = []
    seen: set[str] = set()
    stylesheets: list[str] = []
    scripts: list[str] = []

    def add(raw: str) -> None:
        for reference in expand_reference(raw):
            candidate = urljoin(f"{SITE_ORIGIN}/", reference.strip())
            if not is_asset_url(candidate) or candidate in seen:
                continue
            seen.add(candidate)
            found.append(
                {
                    "url": candidate,
                    "filename": asset_filename(candidate),
                    "local_path": asset_local_path(candidate),
                    "scene": scene_for(candidate),
                }
            )

    for xpath, attribute in DOCUMENT_ASSET_LOCATORS:
        elements = await page.locator(xpath).all()
        for element in elements[:REFERENCE_SCAN_LIMIT]:
            value = await element.get_attribute(attribute)
            if not value:
                continue
            for candidate in expand_reference(value):
                absolute = urljoin(f"{SITE_ORIGIN}/", candidate.strip())
                if not is_asset_url(absolute):
                    continue
                if absolute.endswith(STYLESHEET_SUFFIX) and absolute not in stylesheets:
                    stylesheets.append(absolute)
                elif absolute.endswith(SCRIPT_SUFFIX) and absolute not in scripts:
                    scripts.append(absolute)
            add(value)

    state = await page_state(page)
    for style_text in state["inlineStyles"]:
        for reference in re.findall(STYLE_URL_PATTERN, style_text):
            add(reference)

    fetched = await page.evaluate(FETCH_TEXT_JS, stylesheets + scripts)
    stylesheet_texts = [
        item["text"]
        for item in fetched[: len(stylesheets)]
        if item.get("ok") and item.get("text")
    ]
    script_texts = [
        item["text"]
        for item in fetched[len(stylesheets) :]
        if item.get("ok") and item.get("text")
    ]

    for stylesheet_text in stylesheet_texts:
        for reference in re.findall(STYLE_URL_PATTERN, stylesheet_text):
            add(reference)

    literals: list[str] = []
    sequence_directories: list[tuple[str, int]] = []
    model_names: list[str] = []
    for script_text in script_texts:
        for literal in re.findall(ASSET_LITERAL_PATTERN, script_text):
            if literal not in literals:
                literals.append(literal)
        for directory, count in re.findall(SEQUENCE_DIRECTORY_PATTERN, script_text):
            entry = (directory, int(count))
            if entry not in sequence_directories:
                sequence_directories.append(entry)
        for name in re.findall(MODEL_BRIDGE_PATTERN, script_text):
            if name not in model_names:
                model_names.append(name)
        for name in re.findall(MODEL_EXTRA_PATTERN, script_text):
            if name not in model_names:
                model_names.append(name)

    for literal in literals:
        if "{" in literal or "$" in literal:
            continue
        add(literal)

    manifest_urls = [
        SITE_ORIGIN + MODEL_MANIFEST_TEMPLATE.format(model=name)
        for name in model_names
    ]
    payloads = (
        await page.evaluate(FETCH_TEXT_JS, manifest_urls) if manifest_urls else []
    )
    model_tiers: list[tuple[str, str, int]] = []
    for name, payload in zip(model_names, payloads):
        count, tier = manifest_tier(payload.get("text", ""))
        if count and tier:
            model_tiers.append((name, tier, count))
    for name, _tier, _count in model_tiers:
        add(MODEL_MANIFEST_TEMPLATE.format(model=name))
    for name, tier, count in model_tiers:
        for frame in range(1, count + 1):
            add(MODEL_FRAME_TEMPLATE.format(model=name, tier=tier, frame=frame))

    for directory, count in sequence_directories:
        for frame in range(1, count + 1):
            add(SEQUENCE_FRAME_TEMPLATE.format(directory=directory, frame=frame))

    for xpath, attribute in SCENE_ASSET_LOCATORS:
        elements = await page.locator(xpath).all()
        for element in elements[:REFERENCE_SCAN_LIMIT]:
            value = await element.get_attribute(attribute)
            if value:
                add(value)

    for loaded in sorted(state["loaded"]):
        add(loaded)

    return found

async def retrieve_asset(
    page: Page,
    manifest: AssetManifest,
    asset: dict[str, str],
) -> dict[str, Any]:
    """Retrieve one original, verify it, save it, and report the outcome."""
    url = asset["url"]
    fetched = await page.evaluate(FETCH_ASSET_JS, url)
    fallback_type = media_type_from_url(url)
    if not fetched.get("ok"):
        return {
            "asset_type": fallback_type,
            "size_bytes": None,
            "download_status": "unreachable",
            "local_path": None,
        }

    status = int(fetched.get("status") or 0)
    encoded = fetched.get("bodyBase64") or ""
    payload = base64.b64decode(encoded) if encoded else b""
    served_type = str(fetched.get("contentType") or "")
    proven_type = detected_media_type(payload)
    asset_type = proven_type or served_type or fallback_type

    if status in {401, 403}:
        return {
            "asset_type": asset_type,
            "size_bytes": len(payload) if payload else None,
            "download_status": "forbidden",
            "local_path": None,
        }
    if status == 404 or status == 410 or 400 <= status < 500:
        return {
            "asset_type": asset_type,
            "size_bytes": len(payload) if payload else None,
            "download_status": "missing",
            "local_path": None,
        }
    if not 200 <= status < 300:
        return {
            "asset_type": asset_type,
            "size_bytes": None,
            "download_status": "unreachable",
            "local_path": None,
        }
    if proven_type == "text/html" or served_type.startswith("text/html"):
        return {
            "asset_type": asset_type,
            "size_bytes": len(payload) if payload else None,
            "download_status": "unexpected_content",
            "local_path": None,
        }
    if not manifest.save(asset["local_path"], payload):
        return {
            "asset_type": asset_type,
            "size_bytes": len(payload) if payload else None,
            "download_status": "save_failed",
            "local_path": None,
        }
    return {
        "asset_type": asset_type,
        "size_bytes": len(payload),
        "download_status": DOWNLOADED_STATUS,
        "local_path": asset["local_path"],
    }

async def main():
    print("Starting asset collection...")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        context = await browser.new_context(
            locale=BROWSER_LOCALE,
            viewport={'width': 1920, 'height': 1080},
            device_scale_factor=1,
        )
        page = await context.new_page()
        page.set_default_timeout(int(BROWSER_TIMEOUT_SECONDS * 1000))

        manifest = AssetManifest(
            Path(__file__).resolve().parent.parent / COLLECTION_DIRECTORY_NAME
        )
        if manifest.open():
            print(f"Asset output directory ready: {COLLECTION_DIRECTORY_NAME}")
        else:
            print("Warning: asset output directory unavailable; records continue without saved files")

        try:
            print(f"Navigating to {ENTRY_URL}...")
            await page.goto(ENTRY_URL, wait_until="networkidle", timeout=int(BROWSER_TIMEOUT_SECONDS * 1000))

            await stage_ready(page)
            print("Entry page ready")

            await scroll_through_page(page)
            print("Document scrolled to its end")

            assets = await discover_assets(page)
            print(f"Asset inventory built: discovered={len(assets)}")

            completed = 0
            for asset in assets:
                outcome = None
                for attempt in range(1, MAX_ASSET_ATTEMPTS + 1):
                    try:
                        outcome = await retrieve_asset(page, manifest, asset)
                        break
                    except Exception as exc:
                        if attempt == MAX_ASSET_ATTEMPTS:
                            print(f"Skipping asset after exhausted attempts: scene={asset['scene']} asset={asset['url']} error={failure_label(exc)}")
                            break
                        print(f"Retrying asset after failed attempt: scene={asset['scene']} asset={asset['url']} attempt={attempt}")
                if outcome is None:
                    continue

                record = {
                    "asset_url": asset["url"],
                    "filename": asset["filename"],
                    "asset_type": outcome["asset_type"],
                    "size_bytes": outcome["size_bytes"],
                    "scene": asset["scene"],
                    "download_status": outcome["download_status"],
                    "local_path": outcome["local_path"],
                }

                # Write to manifest
                manifest.write(record)

                # Also print progress
                completed += 1
                print(f"Asset {completed}/{len(assets)}: scene={asset['scene']} asset={asset['url']} status={outcome['download_status']}")

        finally:
            manifest.close()
            await browser.close()

    print("Asset collection finished.")

if __name__ == "__main__":
    asyncio.run(main())