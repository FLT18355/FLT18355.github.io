# FLT18355.github.io

个人主页，基于 [Catppuccin](https://catppuccin.com/) 配色（Mocha / Latte 双主题），Astro + Vue + SCSS 构建的纯静态站。

## 页面

| 页面 | 内容 |
|------|------|
| [`index.html`](index.html) | 主页:关于我、兴趣、技术栈 + Test 音乐播放器 + 实时天气卡(浏览器定位 + Open-Meteo) |
| [`projects.html`](projects.html) | 重点项目:terminal / lxm / dotfiles + GitHub 资料卡(构建时从 api.github.com 拉取) |
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
npm run snapshot:github  # 刷新 GitHub 资料卡的兜底快照(构建时优先用实时 API)
python3 subset-font.py   # 按源码文本子集化字体(文案改动后重跑,约 3.5 分钟)
```

构建产物在 `dist/`,把 `dist/` 内容部署到 GitHub Pages 即可(public/ 里的 `.nojekyll` 会自动拷入)。

## 文件结构

```
├── package.json / astro.config.mjs / tsconfig.json
├── subset-font.py        字体子集化脚本
├── scripts/snapshot-github.mjs  刷新 GitHub 资料卡的兜底快照
├── public/               静态资源(原样拷入 dist 根)
│   ├── font.woff2        Maple Mono NF CN 子集(按源码文本裁剪,按需加载)
│   ├── logo.webp        logo 原图(头像源文件,页面不直接引用)
│   ├── font-full.woff2   Maple Mono 全量字体(7.1MB,子集化输入源)
│   ├── logo.svg / images/ / bug/   (images/avatar.webp 为左栏头像)
│   └── .nojekyll
└── src/
    ├── styles/           SCSS 模块(global.scss 为汇总入口)
    │   ├── _tokens.scss  双主题令牌(map 驱动,含 @property 注册)
    │   ├── _compat.scss  无 color-mix 浏览器的等价纯色兜底
    │   ├── _lite.scss    低配精简层(html.lite 门控)
    │   ├── _layout.scss  两栏壳 / 左栏身份卡 / 联系方式 / 页脚
    │   ├── _cards.scss   标签筹码 / 色板 / 项目卡
    │   ├── _toggle.scss  主题拨钮(拖拽 / 键盘 / 圆形揭示)
    │   ├── _search.scss  search 页样式
    │   ├── _music.scss   音乐播放器样式
    │   ├── _weather.scss 首页天气卡样式
    │   ├── _motion.scss  动效层(html.motion-js 门控)
    │   ├── _nav.scss / _font-picker.scss / _responsive.scss
    ├── layouts/Base.astro   页面骨架(head 元信息 + 主题/字体恢复内联脚本)
    ├── components/
    │   ├── Nav.astro / Rail.astro / Contacts.astro / Footline.astro / ProjectCard.astro
    │   ├── GithubCard.astro  GitHub 资料卡(消费 data/github.ts)
    │   └── ThemeToggle.vue / FontPicker.vue / PaletteGrid.vue / SearchPanel.vue / MusicPlayer.vue / WeatherWidget.vue
    ├── data/
    │   ├── site.ts       站点元信息 + 导航配置
    │   ├── projects.ts   项目卡数据(projects / following 共用)
    │   ├── palette.ts    Catppuccin 色板数据(4 风味 × 26 色)
    │   ├── music.ts      音乐播放器曲目(gh-proxy 直链 + 标题)
    │   ├── weather.ts    首页天气卡:定位链路 + Open-Meteo 端点 + WMO 天气码/图标
    │   ├── github.ts     GitHub 资料卡数据源(构建时拉 api.github.com,失败退回快照)
    │   └── github-user.snapshot.json  api.github.com 响应快照(兜底,`npm run snapshot:github` 刷新)
    ├── scripts/
    │   ├── motion.ts     动效编排(滚动入场、光斑、倾斜、进度线)
    │   └── nav.ts        导航指示条定位
    └── pages/            index / projects / catppuccin / following / search / 404
```

`legacy/` 是迁移前的旧版(模板渲染 + 手写 JS/CSS),仅供对照,不再参与构建。

## 设计机制

- **主题**：Mocha(深)/ Latte(浅)双 Catppuccin 风味,`@property` 注册实现颜色平滑过渡;系统偏好自动适配,`localStorage` 持久化;切换用 View Transition 圆形揭示(ThemeToggle.vue)
- **多色强调**：Catppuccin 全色相令牌(`_tokens.scss`),每个区块、每条导航、每张项目卡各占一色(区块 `--acc` / 导航 `--nc` / 卡片数据 `hue` → `.h-<hue>`);页面底色是四色氛围网格 + 双光斑,身份卡顶部多色光晕 + 头像外一圈全色相色环,标题/时钟用品牌渐变裁字;动作控件与焦点环仍固定 `--primary`,保证注意力落点唯一
- **材质**：玻璃卡片统一 `--edge`(顶部 1px 内高光,浅色主题换成白色内描边) + 双层投影,静止时也有「浮起来」的厚度;系统开「减弱透明度」时与低配层同样去模糊、换不透明底
- **GitHub 资料卡**(projects 页)：构建时调 `https://api.github.com/users/FLT18355`,把返回的字段尽量铺满卡片(统计块 + 明细表 + 折叠的 API 端点);拉不到(限流 / 断网)自动退回 `src/data/github-user.snapshot.json`,访客侧零请求、无 JS 也完整可见
- **低配适配**：head 内联脚本按省流量 / 内存 / 核心数判定 `html.lite`,精简层去掉玻璃模糊、固定渐变层与常驻动画(滚动与首屏优先);`?lite=1` / `?lite=0` 可手动对比
- **老浏览器兜底**：颜色依赖的 `color-mix()` 缺失时由 `_compat.scss`(整块 `@supports not (...)`)给出等价纯色,颜色身份不丢、只是层次降一档
- **Vue 岛**(client:load)：主题拨钮、首启字体选择、色板复制、搜索页(时钟/历史)、首页 Test 音乐播放器、首页天气卡。除天气卡(内容取决于访客位置,只能在浏览器侧取)外全部 SSR 直出静态内容,JS 不运行页面仍完整可用
- **音乐播放器**：首页 Test 区,3 首曲目(GitHub Release 直链,经 gh-proxy 加速),`preload="auto"` 打开页面即自动下载;播放/暂停/进度跳转,左右键切歌,`localStorage` 保存上次播放的曲目与进度;音频文件不落地仓库
- **字体选择**：首启弹出(默认字体免下载秒开),选 Maple Mono 才触发 `font.woff2` 下载;`localStorage`(`site-font`)持久化,页脚「字体」按钮重开
- **天气卡**(首页最底部)：`navigator.geolocation` 拿浏览器定位,失败(拒绝授权 / 老浏览器)则退到无 Key 的 IP 定位端点(`ipwho.is` → `get.geojs.io`,只取经纬度),两条都不通就用默认坐标(北京 39.9, 116.4),**保证卡片永远有内容**;天气来自 Open-Meteo `current_weather`(免费、无需 API Key),请求带 `timezone=auto` 所以观测时间是该地当地时间;结果缓存 30 分钟(`localStorage`),避免每次进首页都弹定位授权;卡片上标出定位方式(GPS / IP location / Default)与坐标,不用「猜」
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
