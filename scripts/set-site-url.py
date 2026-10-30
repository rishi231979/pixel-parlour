#!/usr/bin/env python3
"""
Set the live site URL across the Pixel Parlour website, in one go.

WHY: canonical links, og:url, og:image/twitter:image, JSON-LD, robots.txt and
sitemap.xml must contain ABSOLUTE URLs (search engines and social platforms
ignore relative ones). Everything else on the site stays relative so it keeps
working on GitHub Pages project sites.

USAGE (run from anywhere):
    python3 scripts/set-site-url.py https://your-username.github.io/pixel-parlour/
    python3 scripts/set-site-url.py https://www.your-domain.com/ --dry-run

It is safe to run again later (e.g. when you move to a custom domain): it reads
the URL currently in index.html's canonical link and replaces that everywhere.
No third-party packages needed.
"""
import argparse
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PLACEHOLDER = "https://YOUR-USERNAME.github.io/pixel-parlour/"
FILES = sorted(ROOT.glob("*.html")) + [ROOT / "robots.txt", ROOT / "sitemap.xml"]
# Social image tags start out relative; they get prefixed with the site URL.
RELATIVE_IMAGE_META = re.compile(
    r'(<meta (?:property="og:image"|name="twitter:image") content=")(?!https?://)([^"]+)(")'
)


def current_base() -> str:
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    match = re.search(r'<link rel="canonical" href="([^"]+)"', index)
    return match.group(1) if match else PLACEHOLDER


def normalise(url: str) -> str:
    if not re.match(r"^https?://[^\s/]+", url):
        sys.exit(f"Error: '{url}' doesn't look like a full URL (it must start with https://).")
    return url if url.endswith("/") else url + "/"


def main() -> None:
    parser = argparse.ArgumentParser(description="Replace the site base URL in all pages, robots.txt and sitemap.xml.")
    parser.add_argument("url", help="Your live site URL, e.g. https://username.github.io/pixel-parlour/")
    parser.add_argument("--dry-run", action="store_true", help="Show what would change without writing files.")
    args = parser.parse_args()

    new = normalise(args.url.strip())
    old = current_base()
    print(f"Current base URL: {old}\nNew base URL:     {new}\n")

    total = 0
    for path in FILES:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        updated = text.replace(old, new)
        if old != PLACEHOLDER:  # also catch any leftover placeholder (e.g. a page added later)
            updated = updated.replace(PLACEHOLDER, new)
        updated = RELATIVE_IMAGE_META.sub(lambda m: m.group(1) + new + m.group(2) + m.group(3), updated)
        if updated != text:
            changes = sum(1 for a, b in zip(text.splitlines(), updated.splitlines()) if a != b)
            total += changes
            print(f"  {'would update' if args.dry_run else 'updated'} {path.name}: {changes} line(s)")
            if not args.dry_run:
                path.write_text(updated, encoding="utf-8")

    if total == 0:
        print("Nothing to change. The site already uses this URL.")
    elif args.dry_run:
        print("\nDry run only. Re-run without --dry-run to apply.")
    else:
        print("\nDone. Commit and push to publish the change.")


if __name__ == "__main__":
    main()
