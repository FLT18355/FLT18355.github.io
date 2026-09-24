#!/usr/bin/env bash
# deploy.sh - 构建并把产物同步到仓库根目录(GitHub Pages 从根目录服务 HTML)
#
# 这是本仓库**唯一**的部署方式:不使用 GitHub Actions。
# 每次改完 src/ 都要跑一遍,否则根目录还是旧产物:
#   bash scripts/deploy.sh
#
# 脚本做三件事:
#   1) npm run build            -> 产出 dist/(Astro 会清空重建)
#   2) 清掉根目录同名旧产物     -> 避免已删除页面的残留文件继续被服务
#   3) 把 dist/* 拷到仓库根     -> 跳过 6.7MB 的 font-full.woff2(只是子集化输入源)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[deploy] 构建 src/ -> dist/"
npm run build

echo "[deploy] 同步 dist/ -> 仓库根(跳过 font-full.woff2)"
for item in dist/*; do
  name=$(basename "$item")
  [ "$name" = "font-full.woff2" ] && continue
  rm -rf "./$name"
  cp -r "$item" .
done

echo
echo "[deploy] 完成。根目录下的产物(与 dist/ 一致):"
ls -1 *.html
echo
echo "若仓库以后接回 git:提交并推送根目录产物即可上线。"