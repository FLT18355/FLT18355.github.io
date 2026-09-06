#!/usr/bin/env python3
"""subset-font.py - 按站点实际文本子集化字体

从根目录生成页面(index/projects/following.html)与 404.html 收集所有字符,
对 src/font-full.woff2(全量 7.1MB)子集化并修正 name 表,覆盖输出 font.woff2。

用法:
    python3 subset-font.py                 # 默认从页面收集字符
    python3 subset-font.py --text "新增字" # 额外保留指定字符
    python3 subset-font.py --keep-cache    # 不清理中间产物

字符集变化后重新运行即可;全量字体保留在 src/,子集化不会丢失字形。
依赖:fonttools + brotli(pip install fonttools brotli)。
"""
import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
CACHE = ROOT / ".cache"
FULL_FONT = SRC / "font-full.woff2"
OUT_FONT = ROOT / "font.woff2"

# 页面字符收集来源(生成产物 + 独立 404 页;新增页面需同步加入)
PAGE_SOURCES = ["index.html", "projects.html", "catppuccin.html", "following.html", "search.html", "404.html"]
# JS 内可见文案(如 palette.js 的 flavor 说明、Copied!、search.js 的时钟中文)也需进字符集
JS_SOURCES = ["assets/palette.js", "assets/search.js"]


def collect_charset(extra: str) -> str:
    chars = set(" \n")
    for name in PAGE_SOURCES + JS_SOURCES:
        p = ROOT / name
        if p.is_file():
            chars.update(p.read_text(encoding="utf-8"))
    if extra:
        chars.update(extra)
    chars.discard("\r")
    return "".join(sorted(chars))


def fix_font_name(path: Path) -> None:
    """全量字体的 family 带 'ExtraBold' 后缀且 preferred family 只在 nameID 16;
    子集化后 nameID 16 丢失会导致 CSS 的 'Maple Mono NF CN' 失配,必须补回。"""
    from fontTools.ttLib import TTFont
    f = TTFont(path)
    name = f["name"]
    for nid, val in [(1, "Maple Mono NF CN"), (4, "Maple Mono NF CN"),
                     (6, "MapleMono-NF-CN"), (16, "Maple Mono NF CN"), (17, "Regular")]:
        name.setName(val, nid, 3, 1, 0x409)  # Windows, Unicode BMP, en-US
        name.setName(val, nid, 1, 0, 0)      # Macintosh, Roman, English
    f.save(path)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--text", default="", help="额外保留的字符")
    ap.add_argument("--keep-cache", action="store_true", help="保留 .cache 中间产物")
    args = ap.parse_args()

    if not FULL_FONT.is_file():
        raise SystemExit(f"missing full font: {FULL_FONT}")

    charset = collect_charset(args.text)
    CACHE.mkdir(exist_ok=True)
    (CACHE / "chars.txt").write_text(charset, encoding="utf-8")

    tmp = CACHE / "font-subset.woff2"
    subprocess.run(
        [sys.executable, "-m", "fontTools.subset",
         str(FULL_FONT), f"--text-file={CACHE / 'chars.txt'}",
         f"--output-file={tmp}", "--flavor=woff2", "--layout-features=*"],
        check=True, capture_output=True)
    fix_font_name(tmp)
    tmp.replace(OUT_FONT)

    size_kb = OUT_FONT.stat().st_size / 1024
    print(f"subset done: font.woff2 ({size_kb:.0f} KB, {len(charset)} unique chars)")
    if not args.keep_cache:
        (CACHE / "chars.txt").unlink(missing_ok=True)
        tmp.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
