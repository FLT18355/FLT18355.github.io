#!/usr/bin/env bash
# deploy.sh - 构建并把产物同步到仓库根(GitHub Pages 默认从根目录服务)
# 这是不用 GitHub Actions 的替代方案:沿用旧工作流,把产物放到根目录后推送。
# 用法:
#   bash scripts/deploy.sh
# 然后按脚本末尾的提示 git add / commit / push 即可。
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build

# 同步 dist -> 根:先删根目录同名旧产物(避免已删除页面的残留),再拷贝。
# font-full.woff2 是子集化输入源(6.7MB),部署不需要,跳过。
for item in dist/*; do
  name=$(basename "$item")
  [ "$name" = "font-full.woff2" ] && continue
  rm -rf "./$name"
  cp -r "$item" .
done

echo
echo "产物已同步到仓库根目录(index.html / projects.html / _astro/ 等)。"
echo "提交并推送即可部署:"
echo "  git add -A && git commit -m 'deploy' && git push"
echo
echo "或改用自动部署:见 .github/workflows/deploy.yml(需在 Pages 设置选 GitHub Actions)。"
