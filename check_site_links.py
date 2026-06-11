#!/usr/bin/env python3
"""Check generated site files for broken local links."""

from __future__ import annotations

import argparse
import json
import os
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse


IGNORED_SCHEMES = {"http", "https", "mailto", "tel", "ftp", "javascript"}


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_map = dict(attrs)
        for attr in ("href", "src"):
            value = attrs_map.get(attr)
            if value:
                self.links.append((attr, value))


def local_target(site_dir: Path, source: Path, link: str) -> Path | None:
    parsed = urlparse(link)
    if parsed.scheme in IGNORED_SCHEMES:
        return None
    if parsed.netloc and parsed.netloc not in {"www.lazuril.com", "lazuril.com", "dylxnredwood.github.io"}:
        return None

    path = unquote(parsed.path)
    if not path:
        return None

    if path.startswith("/"):
        candidate = site_dir / path.lstrip("/")
    else:
        candidate = source.parent / path

    candidate = candidate.resolve()
    try:
        candidate.relative_to(site_dir.resolve())
    except ValueError:
        return None

    if candidate.is_dir():
        return candidate / "index.html"
    if candidate.suffix == "":
        return candidate / "index.html"
    return candidate


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("site_dir", nargs="?", default="site")
    args = parser.parse_args()

    site_dir = Path(args.site_dir)
    broken: list[str] = []

    for html_path in sorted(site_dir.rglob("*.html")):
        parser = LinkParser()
        parser.feed(html_path.read_text(encoding="utf-8"))

        for attr, link in parser.links:
            if link.startswith("#"):
                continue
            target = local_target(site_dir, html_path, link)
            if target and not target.exists():
                rel_source = os.path.relpath(html_path, site_dir)
                rel_target = os.path.relpath(target, site_dir)
                broken.append(f"{rel_source}: {attr}={link} -> missing {rel_target}")

    nav_data_path = site_dir / "assets" / "javascripts" / "wiki-nav-data.json"
    if nav_data_path.exists():
        navigation = json.loads(nav_data_path.read_text(encoding="utf-8"))
        for section in navigation:
            for child in section.get("children", []):
                link = child.get("href", "")
                target = local_target(site_dir, site_dir / "index.html", link)
                if target and not target.exists():
                    broken.append(f"{nav_data_path.relative_to(site_dir)}: href={link} -> missing {target.relative_to(site_dir)}")

    if broken:
        print("Broken generated-site links:")
        for item in broken:
            print(f"  - {item}")
        return 1

    print("Generated-site link check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
