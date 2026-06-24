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
PINNED_TOP_NAV = ["Session Notes", "NPCs & Locations"]
TOP_NAV_SEPARATOR = {"title": "|", "separator": True}


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


def sort_key(path: Path) -> list[str]:
    return [part.casefold() for part in path.parts]


def direct_markdown_files(directory: Path) -> list[Path]:
    return sorted(
        [
            item
            for item in directory.iterdir()
            if item.is_file()
            and item.suffix.lower() == ".md"
            and item.name.lower() not in {"readme.md", "index.md"}
        ],
        key=sort_key,
    )


def public_subdirs(directory: Path) -> list[Path]:
    return sorted(
        [item for item in directory.iterdir() if item.is_dir() and item.name not in SKIP_DIRS],
        key=sort_key,
    )


def page_entry(path: Path) -> dict[str, object]:
    return {"title": page_title(path), "href": page_href(path)}


def build_children(directory: Path) -> list[dict[str, object]]:
    children: list[dict[str, object]] = []
    subdirs_by_name = {subdir.name.casefold(): subdir for subdir in public_subdirs(directory)}
    used_subdirs: set[str] = set()

    for page in direct_markdown_files(directory):
        entry = page_entry(page)
        sibling_dir = subdirs_by_name.get(page.stem.casefold())

        if sibling_dir is not None:
            nested_children = build_children(sibling_dir)
            if nested_children:
                entry["children"] = nested_children
            used_subdirs.add(sibling_dir.name.casefold())

        children.append(entry)

    for subdir in public_subdirs(directory):
        if subdir.name.casefold() in used_subdirs:
            continue

        nested_children = build_children(subdir)
        index_page = subdir / "index.md"

        if index_page.exists():
            entry = page_entry(index_page)
        else:
            entry = {"title": subdir.name}

        if nested_children:
            entry["children"] = nested_children

        if "href" in entry or "children" in entry:
            children.append(entry)

    return children


def build_navigation() -> list[dict[str, object]]:
    if not WORLDBUILDING_DIR.exists():
        return []

    section_entries: list[tuple[str, dict[str, object]]] = []
    section_dirs = [
        item
        for item in WORLDBUILDING_DIR.iterdir()
        if item.is_dir() and item.name not in SKIP_DIRS
    ]

    for section_dir in sorted(section_dirs, key=lambda item: item.name.casefold()):
        children = build_children(section_dir)
        if children:
            section_entries.append((section_dir.name, {"title": section_dir.name, "children": children}))

    entries_by_name = {name.casefold(): entry for name, entry in section_entries}
    pinned_entries = [
        entries_by_name[name.casefold()]
        for name in PINNED_TOP_NAV
        if name.casefold() in entries_by_name
    ]
    pinned_names = {name.casefold() for name in PINNED_TOP_NAV}
    remaining_entries = [
        entry
        for name, entry in section_entries
        if name.casefold() not in pinned_names
    ]

    if pinned_entries and remaining_entries:
        return [*pinned_entries, TOP_NAV_SEPARATOR, *remaining_entries]

    return [*pinned_entries, *remaining_entries]


def main() -> int:
    navigation = build_navigation()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(navigation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH} with {len(navigation)} top-level item(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
