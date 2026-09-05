#!/usr/bin/env python3
"""build.py - 模板渲染:src/ + pages.json -> 仓库根的三个静态 HTML 页面。

公共片段(font-picker / nav / profile / contacts)放 src/partials/,
每页唯一内容放 src/pages/<name>.html,页面清单在 src/pages.json。
跑 `python3 build.py` 重新生成 index.html / projects.html / following.html。
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
PARTIALS = SRC / "partials"
PAGES = SRC / "pages"

PARTIAL_NAMES = ["font-picker", "nav", "profile", "contacts"]
NAV_MARKERS = {"home": "home", "projects": "projects", "following": "following"}


def read(name: str, sub: Path) -> str:
    p = sub / f"{name}.html"
    if not p.is_file():
        raise SystemExit(f"missing partial/page: {p}")
    return p.read_text(encoding="utf-8")


def build_one(out_name: str, meta: dict) -> str:
    template = read("template", SRC)

    # 渲染 nav 的 aria-current 标记:当前页加 ' aria-current="page"',其余留空
    cur = meta["current"]
    cur_attr = f' aria-current="page"'
    nav_subs = {f"{{{{{m}}}}}": (cur_attr if m == cur else "") for m in NAV_MARKERS}

    # 按 {{name}} 填充 partial(单遍替换;partial 内不含 {{}} 占位,安全)
    subs = {
        "{{font-picker}}": read("font-picker", PARTIALS).rstrip("\n"),
        "{{nav}}": read("nav", PARTIALS).rstrip("\n"),
        "{{profile}}": read("profile", PARTIALS).rstrip("\n"),
        "{{contacts}}": read("contacts", PARTIALS).rstrip("\n"),
        "{{content}}": read(meta["page"].split(".")[0], PAGES).rstrip("\n"),
        "{{title}}": meta["title"],
        "{{description}}": meta["description"],
    }
    subs.update(nav_subs)

    out = template
    for k, v in subs.items():
        out = out.replace(k, v)
    return out


def main() -> None:
    manifest = json.loads((PAGES.with_name("pages.json")).read_text(encoding="utf-8"))
    for out_name, meta in manifest.items():
        html = build_one(out_name, meta)
        (ROOT / out_name).write_text(html, encoding="utf-8")
        print(f"  built  {out_name}")
    print("done.")


if __name__ == "__main__":
    main()
