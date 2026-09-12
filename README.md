# FLT18355.github.io

个人主页，基于 [Catppuccin](https://catppuccin.com/) 配色（Mocha / Latte 双主题），Astro + Vue + SCSS 构建的纯静态站。

## 页面

| 页面 | 内容 |
|------|------|
| [`index.html`](index.html) | 主页:关于我、兴趣、技术栈 + Test 音乐播放器 |
| [`projects.html`](projects.html) | 重点项目:terminal / lxm / dotfiles |
| [`catppuccin.html`](catppuccin.html) | Catppuccin 色板:4 风味 × 26 色,点击复制 Hex(SSR 直出,无 JS 也可见) |
| [`following.html`](following.html) | 关注项目:herdr / oh-my-pi / catppuccin(紫色重点卡 + 猫图标)/ neovim |
| [`search.html`](search.html) | Bing 搜索页:实时时钟 / 快捷链接 / 最近搜索(无左栏单列布局) |
| [`404.html`](404.html) | 品牌化 404 页(猫 + 返回首页) |

## 构建

```bash
npm install        # 首次:安装 astro / vue / sass
npm run dev        # 开发预览 http://localhost:4321
npm run build      # 产出 dist/ 六个 HTML + 资源
npm run preview    # 预览构建产物
python3 subset-font.py   # 按源码文本子集化字体(文案改动后重跑,约 3.5 分钟)
```

构建产物在 `dist/`,把 `dist/` 内容部署到 GitHub Pages 即可(public/ 里的 `.nojekyll` 会自动拷入)。

## 文件结构

```
├── package.json / astro.config.mjs / tsconfig.json
├── subset-font.py        字体子集化脚本
├── public/               静态资源(原样拷入 dist 根)
│   ├── font.woff2        Maple Mono NF CN 子集(按源码文本裁剪,按需加载)
│   ├── font-full.woff2   Maple Mono 全量字体(7.1MB,子集化输入源)
│   ├── logo.svg / images/ / bug/
│   └── .nojekyll
└── src/
    ├── styles/           SCSS 模块(global.scss 为汇总入口)
    │   ├── _tokens.scss  双主题令牌(map 驱动,含 @property 注册)
    │   ├── _layout.scss  两栏壳 / 左栏身份卡 / 联系方式 / 页脚
    │   ├── _cards.scss   标签筹码 / 色板 / 项目卡
    │   ├── _toggle.scss  主题拨钮(拖拽 / 键盘 / 圆形揭示)
    │   ├── _search.scss  search 页样式
    │   ├── _music.scss   音乐播放器样式
    │   ├── _motion.scss  动效层(html.motion-js 门控)
    │   ├── _nav.scss / _font-picker.scss / _responsive.scss
    ├── layouts/Base.astro   页面骨架(head 元信息 + 主题/字体恢复内联脚本)
    ├── components/
    │   ├── Nav.astro / Rail.astro / Contacts.astro / Footline.astro / ProjectCard.astro
    │   └── ThemeToggle.vue / FontPicker.vue / PaletteGrid.vue / SearchPanel.vue / MusicPlayer.vue
    ├── data/
    │   ├── site.ts       站点元信息 + 导航配置
    │   ├── projects.ts   项目卡数据(projects / following 共用)
    │   ├── palette.ts    Catppuccin 色板数据(4 风味 × 26 色)
    │   └── music.ts      音乐播放器曲目(gh-proxy 直链 + 标题)
    ├── scripts/
    │   ├── motion.ts     动效编排(滚动入场、光斑、倾斜、进度线)
    │   └── nav.ts        导航指示条定位
    └── pages/            index / projects / catppuccin / following / search / 404
```

`legacy/` 是迁移前的旧版(模板渲染 + 手写 JS/CSS),仅供对照,不再参与构建。

## 设计机制

- **主题**：Mocha(深)/ Latte(浅)双 Catppuccin 风味,`@property` 注册实现颜色平滑过渡;系统偏好自动适配,`localStorage` 持久化;切换用 View Transition 圆形揭示(ThemeToggle.vue)
- **Vue 岛**(client:load)：主题拨钮、首启字体选择、色板复制、搜索页(时钟/历史)、首页 Test 音乐播放器——SSR 直出全部静态内容,JS 不运行页面仍完整可用
- **音乐播放器**：首页 Test 区,3 首曲目(GitHub Release 直链,经 gh-proxy 加速),`preload="auto"` 打开页面即自动下载;播放/暂停/进度跳转,左右键切歌,`localStorage` 保存上次播放的曲目与进度;音频文件不落地仓库
- **字体选择**：首启弹出(默认字体免下载秒开),选 Maple Mono 才触发 `font.woff2` 下载;`localStorage`(`site-font`)持久化,页脚「字体」按钮重开
- **动效**(渐进增强)：区块滚动入场 + 筹码二级错峰、卡片指针光斑、3D 微倾斜、背景视差、阅读进度线;全部挂 `html.motion-js` 门控,尊重 `prefers-reduced-motion`
- **无障碍**：语义化 landmark、`aria-current`、键盘可操作(Enter/空格切换主题)、可见焦点环

## 技术文档

- [`doc/architecture.md`](doc/architecture.md) 架构与关键机制(主题 / 字体门控 / 动效 / 无障碍)
- [`doc/source-map.md`](doc/source-map.md) 源文件职责清单(改哪里)
- [`doc/build.md`](doc/build.md) 构建流程与构建后验证清单
- [`doc/ai-maintainer-guide.md`](doc/ai-maintainer-guide.md) AI 维护手册(硬约束与易错点,改动前必读)

## 本地预览

```bash
npm run dev        # 开发模式(热更新)
npm run preview    # 预览 dist 构建产物
```

## 部署

GitHub Pages 从仓库根目录服务 HTML,而 Astro 产物在 `dist/`。二选一:

**方式 A:自动部署(推荐,配一次一劳永逸)**
`.github/workflows/deploy.yml` 已就位:push 到 main 后自动 `npm ci && npm run build` 并上传 `dist/`。
首次需在 仓库 Settings → Pages → Build and deployment → Source 选 **GitHub Actions**。若默认分支是 `master`,把工作流里的 `main` 改掉。

**方式 B:同步到根目录(沿用旧工作流,零配置)**
```bash
bash scripts/deploy.sh    # 构建 + 把产物同步到仓库根
git add -A && git commit -m 'deploy' && git push
```
`deploy.sh` 会同步 6 个 HTML、`_astro/`、`font.woff2`、`logo.svg`、`images/`、`.nojekyll` 到根目录(自动跳过 6.7MB 的 `font-full.woff2`),并清理已删除页面的旧文件。

## 许可

本站点代码基于 [MIT License](LICENSE) 开源。
