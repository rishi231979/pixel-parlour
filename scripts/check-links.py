#!/usr/bin/env python3
"""
Link & asset checker for the Pixel Parlour static site (standard library only).

Checks every internal reference against the filesystem:
  - HTML: href, src, srcset, poster, og:image / twitter:image (when relative),
    plus asset paths written by inline scripts (e.g. the 404 page's <base> loader)
  - CSS:  url(...) in every css/*.css file
  - site.webmanifest icon paths
  - "#fragment" links point at an id that exists on the target page

It also FLAGS root-absolute paths ("/css/..." etc.) because they break GitHub
Pages *project* sites (https://user.github.io/repo/), where "/" is the user's
domain root, not your repo.

USAGE:  python3 scripts/check-links.py        (exit code 1 if anything is broken)
"""
import json
import pathlib
import re
import sys
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP_SCHEMES = ("http:", "https:", "mailto:", "tel:", "data:", "javascript:", "sms:")


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs = []      # (line, attribute, value)
        self.ids = set()
        self._in_script = False
        self._script_line = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        line = self.getpos()[0]
        if a.get("id"):
            self.ids.add(a["id"])
        for attr in ("href", "src", "poster"):
            if a.get(attr) is not None:
                self.refs.append((line, attr, a[attr]))
        if a.get("srcset"):
            for candidate in a["srcset"].split(","):
                self.refs.append((line, "srcset", candidate.strip().split(" ")[0]))
        if tag == "meta" and a.get("content") and (
            a.get("property") == "og:image" or a.get("name") == "twitter:image"
        ):
            self.refs.append((line, "meta content", a["content"]))
        if tag == "script" and "src" not in a and a.get("type") in (None, "", "text/javascript", "module"):
            self._in_script, self._script_line = True, line

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag == "script":
            self._in_script = False

    def handle_data(self, data):
        # asset paths inside inline scripts (document.write / createElement)
        if self._in_script:
            for m in re.finditer(r'(?:href|src)=\\?"([^"\\]+)\\?"', data):
                self.refs.append((self._script_line, "inline-script", m.group(1)))


def is_external(value):
    return value.lower().startswith(SKIP_SCHEMES) or value.startswith("//")


def main():
    problems, checked = [], 0
    pages = {}
    for path in sorted(ROOT.glob("*.html")):
        parser = PageParser()
        parser.feed(path.read_text(encoding="utf-8"))
        pages[path.name] = parser

    def check(source, line, kind, value, base_dir=ROOT, page_name=None):
        nonlocal checked
        value = value.strip()
        if not value or is_external(value):
            return
        checked += 1
        if value.startswith("/"):
            problems.append(f"{source}:{line}  ROOT-ABSOLUTE {kind} '{value}' breaks GitHub Pages project sites; use a relative path")
            return
        parts = urlsplit(value)
        target_path = unquote(parts.path)
        if target_path == "":
            target_name = page_name  # "#id" or "?x" on the same page
            target_file = ROOT / page_name if page_name else None
        else:
            target_file = (base_dir / target_path).resolve()
            target_name = target_file.name
            if not target_file.exists():
                problems.append(f"{source}:{line}  MISSING {kind} '{value}'")
                return
        if parts.fragment and target_file is not None and target_file.suffix == ".html":
            target = pages.get(target_name)
            if target is not None and parts.fragment not in target.ids:
                problems.append(f"{source}:{line}  MISSING ANCHOR '{value}' (no id=\"{parts.fragment}\" in {target_name})")

    for name, parser in pages.items():
        for line, kind, value in parser.refs:
            check(name, line, kind, value, page_name=name)

    for css in sorted((ROOT / "css").glob("*.css")):
        text = css.read_text(encoding="utf-8")
        for m in re.finditer(r"url\(\s*(['\"]?)(.*?)\1\s*\)", text):
            line = text.count("\n", 0, m.start()) + 1
            check(f"css/{css.name}", line, "url()", m.group(2), base_dir=css.parent)

    manifest = ROOT / "site.webmanifest"
    if manifest.exists():
        for icon in json.loads(manifest.read_text(encoding="utf-8")).get("icons", []):
            check("site.webmanifest", 0, "icon", icon["src"])

    print(f"Checked {checked} internal references in {len(pages)} HTML pages, CSS and the web manifest.")
    if problems:
        print(f"\n{len(problems)} problem(s) found:")
        print("\n".join("  " + p for p in problems))
        sys.exit(1)
    print("All internal links and asset paths resolve. No root-absolute paths found.")


if __name__ == "__main__":
    main()
