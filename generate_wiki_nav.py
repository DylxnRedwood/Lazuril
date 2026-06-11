#!/usr/bin/env python3
"""Generate navigation data for the public Worldbuilding pages."""

from __future__ import annotations

import json
import os
from pathlib import Path
from urllib.parse import quote


DOCS_DIR = Path("docs")
WORLDBUILDING_DIR = DOCS_DIR / "Worldbuilding"
OUTPUT_PATH = Path("site/assets/javascripts/wiki-nav-data.json")
SKIP_DIRS = {".obsidian", "_Private"}


def page_title(path: Path) -> str:
    if path.name.lower() == "index.md":
        return path.parent.name
    return path.stem


def page_href(path: Path) -> str:
    rel = path.relative_to(DOCS_DIR).with_suffix("")
    parts = list(rel.parts)

    if parts[-1].lower() == "index":
        parts = parts[:-1]

    return "/".join(quote(part, safe="") for part in parts) + "/"


def iter_public_markdown(root: Path) -> list[Path]:
    files: list[Path] = []

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [name for name in dirnames if name not in SKIP_DIRS]
        for filename in filenames:
            if filename.endswith(".md") and filename.lower() != "readme.md":
                files.append(Path(dirpath) / filename)

    return sorted(files, key=lambda item: [part.casefold() for part in item.parts])


def build_navigation() -> list[dict[str, object]]:
    sections: list[dict[str, object]] = []

    if not WORLDBUILDING_DIR.exists():
        return sections

    section_dirs = [
        item
        for item in WORLDBUILDING_DIR.iterdir()
        if item.is_dir() and item.name not in SKIP_DIRS
    ]

    for section_dir in sorted(section_dirs, key=lambda item: item.name.casefold()):
        children = [
            {"title": page_title(page), "href": page_href(page)}
            for page in iter_public_markdown(section_dir)
        ]

        if children:
            sections.append({"title": section_dir.name, "children": children})

    return sections


def main() -> int:
    navigation = build_navigation()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(navigation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH} with {len(navigation)} section(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
