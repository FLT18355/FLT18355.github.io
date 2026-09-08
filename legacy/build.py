#!/usr/bin/env python3
"""build.py - 模板渲染:src/ + pages.json -> 仓库根五个静态 HTML。

公共片段(font-picker / nav / profile / contacts / rail)放 src/partials/,
每页唯一内容放 src/pages/<name>.html,页面清单在 src/pages.json。
跑 `python3 build.py` 重新生成 index.html / projects.html / catppuccin.html / following.html / search.html。

字体子集化是独立步骤,见 subset-font.py(页面文案改动后重跑一次)。
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
PARTIALS = SRC / "partials"
PAGES = SRC / "pages"

PARTIAL_NAMES = ["font-picker", "nav", "profile", "contacts", "rail"]
NAV_MARKERS = ["home", "projects", "palette", "following", "search"]


def read(name: str, sub: Path) -> str:
    p = sub / f"{name}.html"
    if not p.is_file():
        raise SystemExit(f"missing partial/page: {p}")
    return p.read_text(encoding="utf-8")


def main() -> None:
    manifest = json.loads((SRC / "pages.json").read_text(encoding="utf-8"))
    template = read("template", SRC)
    parts = {n: read(n, PARTIALS).rstrip("\n") for n in PARTIAL_NAMES}

    for out_name, meta in manifest.items():
        cur_attr = ' aria-current="page"'
        nav = parts["nav"]
        for m in NAV_MARKERS:
            nav = nav.replace("{{" + m + "}}", cur_attr if m == meta["current"] else "")
        has_rail = meta.get("rail", True)
        html = (
            template
            .replace("{{title}}", meta["title"])
            .replace("{{description}}", meta["description"])
            .replace("{{font-picker}}", parts["font-picker"])
            .replace("{{nav}}", nav)
            .replace("{{shellClass}}", "" if has_rail else " shell--bare")
            .replace("{{rail}}", parts["rail"] if has_rail else "")
            .replace("{{profile}}", parts["profile"])
            .replace("{{contacts}}", parts["contacts"])
            .replace("{{content}}", read(meta["page"].split(".")[0], PAGES).rstrip("\n"))
        )
        (ROOT / out_name).write_text(html, encoding="utf-8")
        print(f"  built  {out_name}")
    print("done. (字体如需更新:python3 subset-font.py)")


if __name__ == "__main__":
    main()
