#!/usr/bin/env python3
"""
Structural HTML & SEO sanity checks for the Pixel Parlour site (standard library only).

Not a full W3C validator (use https://validator.w3.org for that), but it catches the
mistakes that most often creep in when editing by hand:
  - unbalanced / mis-nested tags          - duplicate ids
  - exactly one <h1>, no skipped heading levels inside <main>
  - aria-labelledby / aria-describedby / aria-controls / label[for] point at real ids
  - form controls have a label, buttons and links have an accessible name
  - <img> has alt, width and height
  - unique <title> (≤ 60 chars) and meta description (≤ 160 chars) per page
  - canonical, Open Graph and Twitter tags present; JSON-LD blocks are valid JSON

USAGE:  python3 scripts/check-html.py         (exit code 1 if anything fails)
"""
import json
import pathlib
import re
import sys
from collections import Counter
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
SVG_CHILDREN = {"path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "stop", "g", "defs",
                "lineargradient", "tspan", "text", "filter", "fegaussianblur"}


class Page(HTMLParser):
    def __init__(self, name):
        super().__init__(convert_charrefs=True)
        self.name, self.errors = name, []
        self.stack, self.ids, self.refs = [], [], []
        self.headings, self.in_main = [], False
        self.controls, self.labels_for, self.label_depth = [], set(), 0
        self.named = []          # [tag, line, attrs, collected_text]
        self.jsonld, self._jsonld_buf = [], None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        line = self.getpos()[0]
        if a.get("id"):
            self.ids.append(a["id"])
        for attr in ("aria-labelledby", "aria-describedby", "aria-controls"):
            for ref in (a.get(attr) or "").split():
                self.refs.append((line, attr, ref))
        if tag == "label":
            self.label_depth += 1
            if a.get("for"):
                self.labels_for.add(a["for"])
                self.refs.append((line, "label for", a["for"]))
        if tag == "main":
            self.in_main = True
        if re.fullmatch(r"h[1-6]", tag):
            self.headings.append((line, int(tag[1]), self.in_main))
        if tag in ("input", "select", "textarea") and a.get("type") not in ("hidden", "submit", "button"):
            self.controls.append((line, a.get("id"), self.label_depth > 0, a.get("aria-label")))
        if tag == "img":
            for req in ("alt", "width", "height"):
                if req not in a:
                    self.errors.append(f"line {line}: <img> missing {req}")
        if tag in ("a", "button"):
            self.named.append([tag, line, a, ""])
        if tag == "script" and a.get("type") == "application/ld+json":
            self._jsonld_buf = [line, ""]
        if tag not in VOID:
            self.stack.append((tag, line))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID and self.stack and self.stack[-1][0] == tag:
            self.stack.pop()

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if tag == "label":
            self.label_depth -= 1
        if tag == "main":
            self.in_main = False
        if tag == "script" and self._jsonld_buf:
            try:
                json.loads(self._jsonld_buf[1])
                self.jsonld.append(self._jsonld_buf[0])
            except ValueError as exc:
                self.errors.append(f"line {self._jsonld_buf[0]}: invalid JSON-LD ({exc})")
            self._jsonld_buf = None
        if tag in ("a", "button"):
            for item in reversed(self.named):
                if item[0] == tag and len(item) == 4:
                    _, line, a, text = item
                    if not (text.strip() or a.get("aria-label") or a.get("aria-labelledby") or a.get("title")):
                        self.errors.append(f"line {line}: <{tag}> has no accessible name")
                    item.append(True)
                    break
        if not self.stack:
            self.errors.append(f"line {self.getpos()[0]}: stray </{tag}>")
            return
        if self.stack[-1][0] == tag:
            self.stack.pop()
        elif tag in SVG_CHILDREN or self.stack[-1][0] in SVG_CHILDREN:
            while self.stack and self.stack[-1][0] != tag:
                self.stack.pop()
            if self.stack:
                self.stack.pop()
        else:
            open_tag, open_line = self.stack[-1]
            self.errors.append(f"line {self.getpos()[0]}: </{tag}> closes <{open_tag}> opened on line {open_line}")

    def handle_data(self, data):
        if self._jsonld_buf is not None:
            self._jsonld_buf[1] += data
        for item in self.named:
            if len(item) == 4:
                item[3] += data


def main():
    failures, titles, descs = 0, {}, {}
    for path in sorted(ROOT.glob("*.html")):
        src = path.read_text(encoding="utf-8")
        page = Page(path.name)
        page.feed(src)
        errs = page.errors

        if page.stack:
            errs.append(f"unclosed tags: {page.stack[-5:]}")
        for i, count in Counter(page.ids).items():
            if count > 1:
                errs.append(f"duplicate id '{i}' ({count}×)")
        ids = set(page.ids)
        for line, attr, ref in page.refs:
            if ref not in ids:
                errs.append(f"line {line}: {attr} → missing id '{ref}'")

        h1s = [h for h in page.headings if h[1] == 1]
        if len(h1s) != 1:
            errs.append(f"{len(h1s)} <h1> elements (expected exactly 1)")
        last = 0
        for line, level, in_main in page.headings:
            if not in_main:
                continue
            if last and level > last + 1:
                errs.append(f"line {line}: heading jumps from h{last} to h{level}")
            last = level

        for line, cid, wrapped, aria in page.controls:
            if not (wrapped or aria or (cid and cid in page.labels_for)):
                errs.append(f"line {line}: form control '{cid}' has no label")

        title = re.search(r"<title>(.*?)</title>", src, re.S)
        desc = re.search(r'<meta name="description" content="([^"]*)"', src)
        title_txt = title.group(1).replace("&amp;", "&") if title else ""
        desc_txt = desc.group(1).replace("&amp;", "&").replace("&#x27;", "'") if desc else ""
        if not title_txt:
            errs.append("missing <title>")
        elif len(title_txt) > 60:
            errs.append(f"title is {len(title_txt)} chars (aim for ≤ 60)")
        if not desc_txt:
            errs.append("missing meta description")
        elif len(desc_txt) > 160:
            errs.append(f"meta description is {len(desc_txt)} chars (aim for ≤ 160)")
        titles[path.name], descs[path.name] = title_txt, desc_txt

        required = ["og:title", "og:description", "og:image", "twitter:card", '<html lang="en"']
        if path.name != "404.html":
            required += ['rel="canonical"', "og:url"]
        for needle in required:
            if needle not in src:
                errs.append(f"missing {needle}")

        status = "OK  " if not errs else "FAIL"
        print(f"{status} {path.name:14} title {len(title_txt):>2}c · desc {len(desc_txt):>3}c · "
              f"{len(page.ids)} ids · JSON-LD blocks: {len(page.jsonld)}")
        for e in errs:
            print(f"       - {e}")
        failures += len(errs)

    for label, values in (("title", titles), ("description", descs)):
        for value, count in Counter(values.values()).items():
            if count > 1:
                print(f"FAIL duplicate {label} on {count} pages: {value!r}")
                failures += 1

    print("\nAll structural checks passed." if not failures else f"\n{failures} issue(s) found.")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
