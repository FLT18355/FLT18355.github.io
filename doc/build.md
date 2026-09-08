# 构建流程与验证

站点由 Astro 构建:`npm run build` 从 `src/` 生成 `dist/` 静态站点,字体子集化由独立 `subset-font.py` 处理(需 fonttools/brotli)。

## 1. 什么时候需要 build / 子集化

对 `src/` 下任何文件做了修改后:

- 改了 `src/pages/*.astro` / `src/components/*` / `src/layouts/Base.astro` → **必须** `npm run build`
- 改了 `src/data/*.ts`(标题/描述/项目/色板数据)→ 必须 build
- 改了 `src/styles/*.scss` / `src/scripts/*.ts` → 必须 build(CSS/JS 打包进 `dist/_astro/`,改完刷新源码部署的 dist 即可看到)
- 改了页面/组件**文案**(新增字符)→ 重新 `python3 subset-font.py`,否则新字符缺字

`public/`(logo.svg / font.woff2 / images/ / .nojekyll)原样拷入 dist,改它们只需重新 build(会重新拷贝),不需要子集化(除非改的是 font.woff2 本身)。

## 2. 构建

在仓库根目录:

```bash
npm install              # 首次
npm run build            # 产出 dist/ 六个 HTML + 打包资源
python3 subset-font.py   # 按源码文本子集化字体(文案含新字符时必跑)
```

`npm run build` 预期输出:

```
  ├─ /404.html
  ├─ /catppuccin.html
  ├─ /following.html
  ├─ /projects.html
  ├─ /search.html
  ├─ /index.html
  ✓ 6 page(s) built in ...
  ✓ Complete!
```

无报错即为成功。若报错:多为 TS 类型错误(组件 props)、SCSS 编译错误(拼写/未定义变量),或组件文件缺失。

## 3. 构建后验证(必做清单)

```bash
# 1) 六页都在,无残留占位符
x ls dist/*.html                      # 应恰好 6 个 html
grep -rn '{{' dist/*.html             # 应无输出

# 2) 六页的 title / 导航高亮正确
grep -o '<title>[^<]*</title>' dist/index.html dist/projects.html dist/catppuccin.html dist/following.html dist/search.html
grep -o '<a class="nav-item"[^>]*aria-current="page"[^>]*>[A-Za-z]*' dist/*.html   # 每页恰一处,且指向当前页

# 3) 静态资源就位
x ls dist/font.woff2 dist/logo.svg dist/.nojekyll dist/images/QQ-cm.svg
```

手动抽查(用 `npm run dev` 或 `npm run preview`):

- index.html:导航高亮在 Home,右侧为 About/Interests/Tech
- projects.html:高亮在 Projects,三张项目卡
- following.html:高亮在 Following,四张卡(其中 Catppuccin 是紫色强调 + 猫图标)
- catppuccin.html:**无 JS 也可见** 104 个色块(SSR 直出);点击复制 Hex,有 "Copied!" 反馈
- search.html:无左栏(无 300px 列),上方实时时钟、下方 Bing 搜索表单;提交后新标签打开 Bing 结果
- search.html 快捷键:`/` 或 Ctrl/Cmd+K 聚焦搜索框并全选,Esc 清空;输入框内按 `/` 应正常输入不触发聚焦
- search.html 最近搜索:提交过非空搜索后出现 Recent 区(chips 最多 5 条,点击新标签重搜,Clear 清空);localStorage 键 `search-history`
- search.html 快捷链接:GitHub/Bilibili/YouTube/MDN 四卡,悬停微浮起
- search.html 背景光斑:内容下方有 `.search-bg`(其它页面 grep 应为 0 处);开启动效时两个光斑缓慢漂浮,系统开「减弱动效」后静止
- 页面隔离:`grep -c 'quicklink\|search-bg' dist/*.html` 在非 search 页应全为 0
- 首次访问(清 localStorage)出现字体选择界面;选完自动刷新不再弹出;页脚「字体」按钮可重开
- 双主题切换:拨钮拖拽/点击/键盘,主题持久化;切换瞬间新主题从拨钮中心圆形扩散,扩散全程不遮挡文字/卡片(若切换时出现整屏色块盖住内容即为回归)
- 手机窄屏(≤390px):导航链接区可左右滑动、无滚动条,主题拨钮固定右侧;当前页若在屏幕外加载时自动滚到中间,指示条跟随不错位
- 弱网/未选 Maple 时 Network 面板应**没有** font.woff2 请求;选 Maple 后才出现

## 4. 常见修改场景

| 目标 | 改哪里 | build? |
|---|---|---|
| 加一个联系方式 | `src/components/Contacts.astro`(长 SVG path 从 legacy 迁移时保留原样) | 是 |
| 改导航链接/标签 | `src/data/site.ts`(NAV 数组) | 是 |
| 改某页正文 | `src/pages/<name>.astro` | 是 |
| 改项目卡内容 | `src/data/projects.ts` | 是 |
| 改色板数据 | `src/data/palette.ts` | 是 |
| 加新页面 | 新增 `src/pages/x.astro`;若想加导航入口还要改 `data/site.ts` 的 NAV 与 `_nav.scss` 断点;无左栏页面传 `rail={false}` | 是 |
| 改主题色/间距 | `src/styles/_tokens.scss`(颜色)/ 对应模块 | 是 |
| 换站点图标 | `public/logo.svg` | 是(重新拷贝) |
| 换字体文件 | 替换 `public/font-full.woff2` 后重跑 `subset-font.py` | 字体 |

## 5. 产物覆盖安全

`astro build` 每次清空重建 `dist/`;`subset-font.py` 覆盖 `public/font.woff2`。不要手动编辑 dist,否则下次构建会被覆盖丢失。

## 6. 部署

产物就是 `dist/` 内容(GitHub Pages 的静态文件):把 `dist/` 里的文件推到 Pages 分支/目录即可,`.nojekyll` 已随 public/ 拷入。推送前先 `npm run build` 保证 dist 与 src 一致。
