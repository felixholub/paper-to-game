#!/usr/bin/env python3
"""Rebuild the games table in README.md from the per-game row files.

Each game folder may hold a `row.md`: one line, the Markdown table row for that
game, exactly as it should appear in the README (| **Title** | Paper … | links |).
Builds write that file instead of editing the README, so two builds running at
the same time never touch the same file and their pull requests never conflict.

This script, run on every push to main, replaces the table rows:
- a row for a folder that has `row.md` comes from that file (so a rebuild that
  rewrites `row.md` updates the table);
- a row already in the table whose folder has no `row.md` is kept as it is
  (games built before this convention, and builds still running on the old one);
- rows for folders new to the table are appended, oldest first by the date their
  `row.md` entered the repository (alphabetically if git history is unavailable).

Usage:  build_readme.py            rewrite README.md if anything changed
        build_readme.py --check    exit 1 if README.md is out of date
        build_readme.py --extract  write a row.md for every row that lacks one
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
README = ROOT / "README.md"
HEADER = "| Game | Paper | Play |"
MEMO_LINK = re.compile(r"\]\(([^/()\s]+)/memo\.md\)")


def slug_of(row: str):
    m = MEMO_LINK.search(row)
    return m.group(1) if m else None


def added_at(path: pathlib.Path) -> int:
    try:
        out = subprocess.run(
            ["git", "log", "--diff-filter=A", "--follow", "--format=%at", "--",
             str(path.relative_to(ROOT))],
            cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()
        return int(out[-1]) if out else 0
    except Exception:
        return 0


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else "write"
    lines = README.read_text(encoding="utf-8").split("\n")
    try:
        start = lines.index(HEADER)
    except ValueError:
        print("README.md: games table header not found", file=sys.stderr)
        return 2
    end = start + 2
    while end < len(lines) and lines[end].startswith("|"):
        end += 1
    rows = lines[start + 2:end]

    row_files = {p.parent.name: p for p in ROOT.glob("*/row.md")}

    if mode == "--extract":
        for row in rows:
            slug = slug_of(row)
            if slug and slug not in row_files and (ROOT / slug).is_dir():
                (ROOT / slug / "row.md").write_text(row + "\n", encoding="utf-8")
                print("wrote", slug + "/row.md")
        return 0

    seen = set()
    new_rows = []
    for row in rows:
        slug = slug_of(row)
        if slug in row_files:
            new_rows.append(row_files[slug].read_text(encoding="utf-8").strip())
            seen.add(slug)
        else:
            new_rows.append(row)
    extra = sorted((s for s in row_files if s not in seen),
                   key=lambda s: (added_at(row_files[s]), s))
    for slug in extra:
        new_rows.append(row_files[slug].read_text(encoding="utf-8").strip())

    new_lines = lines[:start + 2] + new_rows + lines[end:]
    changed = new_lines != lines
    if mode == "--check":
        print("README.md is", "out of date" if changed else "up to date")
        return 1 if changed else 0
    if changed:
        README.write_text("\n".join(new_lines), encoding="utf-8")
        print("README.md rebuilt:", len(new_rows), "rows,", len(extra), "new")
    else:
        print("README.md unchanged")
    return 0


if __name__ == "__main__":
    sys.exit(main())
