#!/usr/bin/env python3
"""
Repair internal Markdown links after docs files are moved or renamed.

This is intentionally conservative: it only rewrites links when a target can be
matched to exactly one Markdown page by filename/title. Ambiguous or unknown
links are reported and left untouched.
"""

from __future__ import annotations

import argparse
import os
import re
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote, unquote


DOCS_DIR = Path("docs")
SKIP_DIRS = {".obsidian", "_Private"}
MARKDOWN_LINK_RE = re.compile(r"(?<!!)\[([^\]]+)\]\(([^)]+)\)")
WIKI_LINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
IGNORED_SCHEMES = (
    "http://",
    "https://",
    "mailto:",
    "tel:",
    "ftp://",
)
ASSET_EXTENSIONS = {
    ".avif",
    ".bmp",
    ".css",
    ".gif",
    ".ico",
    ".jpeg",
    ".jpg",
    ".js",
    ".json",
    ".pdf",
    ".png",
    ".svg",
    ".webp",
    ".xml",
    ".zip",
}


@dataclass(frozen=True)
class LinkTarget:
    path: Path
    title: str


def iter_markdown_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [name for name in dirnames if name not in SKIP_DIRS]
        for filename in filenames:
            if filename.endswith(".md"):
                files.append(Path(dirpath) / filename)
    return sorted(files)


def page_title(path: Path) -> str:
    if path.name.lower() == "index.md":
        return path.parent.name
    return path.stem


def normalize_key(value: str) -> str:
    value = unquote(value).strip()
    value = value.removesuffix(".md")
    value = value.replace("\\", "/")
    value = value.split("/")[-1]
    return re.sub(r"\s+", " ", value).casefold()


def build_page_index(files: list[Path]) -> dict[str, list[LinkTarget]]:
    index: dict[str, list[LinkTarget]] = {}
    for path in files:
        target = LinkTarget(path=path, title=page_title(path))
        keys = {normalize_key(path.stem), normalize_key(target.title)}
        if path.name.lower() == "index.md":
            keys.add(normalize_key(path.parent.name))
        for key in keys:
            index.setdefault(key, []).append(target)
    return index


def split_target(target: str) -> tuple[str, str]:
    if "#" not in target:
        return target, ""
    path, anchor = target.split("#", 1)
    return path, f"#{anchor}"


def is_ignored_target(target: str) -> bool:
    lower = target.strip().casefold()
    if not lower or lower.startswith("#"):
        return True
    if lower.startswith(IGNORED_SCHEMES):
        return True
    path_part, _ = split_target(lower)
    return Path(path_part).suffix in ASSET_EXTENSIONS


def resolve_markdown_path(source: Path, target: str) -> Path | None:
    path_part, _ = split_target(target)
    if not path_part:
        return None

    decoded = unquote(path_part)
    candidate = (source.parent / decoded).resolve()
    docs_root = DOCS_DIR.resolve()

    try:
        candidate.relative_to(docs_root)
    except ValueError:
        return None

    candidates = [candidate]
    if candidate.suffix == "":
        candidates.extend([candidate.with_suffix(".md"), candidate / "index.md"])

    for item in candidates:
        if item.exists() and item.suffix == ".md":
            return item
    return None


def make_relative_markdown_link(source: Path, target: Path, anchor: str = "") -> str:
    rel = os.path.relpath(target, start=source.parent).replace("\\", "/")
    rel = quote(rel, safe="/#._-~")
    return f"{rel}{anchor}"


def find_unique_target(
    page_index: dict[str, list[LinkTarget]],
    target: str,
    label: str,
) -> LinkTarget | None:
    path_part, _ = split_target(target)
    keys = [
        normalize_key(path_part),
        normalize_key(Path(unquote(path_part)).stem),
        normalize_key(label),
    ]

    seen: dict[Path, LinkTarget] = {}
    for key in keys:
        for match in page_index.get(key, []):
            seen[match.path] = match

    if len(seen) == 1:
        return next(iter(seen.values()))
    return None


def repair_markdown_links(source: Path, content: str, page_index: dict[str, list[LinkTarget]]) -> tuple[str, list[str]]:
    unresolved: list[str] = []

    def replace(match: re.Match[str]) -> str:
        label = match.group(1)
        original_target = match.group(2).strip()

        if is_ignored_target(original_target):
            return match.group(0)

        path_part, anchor = split_target(original_target)
        if resolve_markdown_path(source, original_target):
            return match.group(0)

        target = find_unique_target(page_index, path_part, label)
        if not target:
            unresolved.append(f"{source}: [{label}]({original_target})")
            return match.group(0)

        repaired = make_relative_markdown_link(source, target.path, anchor)
        return f"[{label}]({repaired})"

    return MARKDOWN_LINK_RE.sub(replace, content), unresolved


def check_wiki_links(source: Path, content: str, page_index: dict[str, list[LinkTarget]]) -> list[str]:
    unresolved: list[str] = []
    for match in WIKI_LINK_RE.finditer(content):
        body = match.group(1)
        target = body.split("|", 1)[0].strip()
        if target.startswith("#"):
            continue
        if len(page_index.get(normalize_key(target), [])) != 1:
            unresolved.append(f"{source}: [[{body}]]")
    return unresolved


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="report changes without writing files")
    args = parser.parse_args()

    if not DOCS_DIR.exists():
        print(f"{DOCS_DIR} does not exist")
        return 1

    files = iter_markdown_files(DOCS_DIR)
    page_index = build_page_index(files)
    changed: list[Path] = []
    unresolved: list[str] = []

    for path in files:
        content = path.read_text(encoding="utf-8")
        repaired, broken_markdown = repair_markdown_links(path, content, page_index)
        broken_wiki = check_wiki_links(path, repaired, page_index)
        unresolved.extend(broken_markdown)
        unresolved.extend(broken_wiki)

        if repaired != content:
            changed.append(path)
            if not args.check:
                path.write_text(repaired, encoding="utf-8")

    if changed:
        action = "Would repair" if args.check else "Repaired"
        print(f"{action} {len(changed)} Markdown file(s):")
        for path in changed:
            print(f"  - {path}")
    else:
        print("No repairable internal Markdown links found.")

    if unresolved:
        print("\nUnresolved or ambiguous internal links:")
        for item in unresolved:
            print(f"  - {item}")

    return 1 if args.check and changed else 0


if __name__ == "__main__":
    raise SystemExit(main())
