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
| [`reader.html`](reader.html) | Markdown 阅读器:上传 ZIP 递归解析目录、只收 .md、渲染 GFM、包内图片与内链、自定义字体持久化(无左栏、占满宽度) |
| [`404.html`](404.html) | 品牌化 404 页(猫 + 返回首页) |

## 构建

```bash
npm install        # 首次:安装 astro / vue / sass,以及阅读器用的 jszip / marked / dompurify
npm run dev        # 开发预览 http://localhost:4321
npm run build      # 产出 dist/ 七个 HTML + 资源
npm run preview    # 预览构建产物
npm run snapshot:github  # 刷新 GitHub 资料卡的兜底快照(构建时优先用实时 API)
python3 subset-font.py   # 按源码文本子集化字体(文案改动后重跑,约 3.5 分钟)
```

构建产物在 `dist/`。**GitHub Pages 从仓库根目录服务 HTML,所以改完要跑 `bash scripts/deploy.sh` 把 `dist/` 同步到根目录**(public/ 里的 `.nojekyll` 会自动拷入),否则线上还是旧产物。

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
    │   ├── _reader.scss  reader 页样式(工具条 / 目录树 / 文档排版 / 窄屏抽屉)
    │   ├── _nav.scss / _font-picker.scss / _responsive.scss
    ├── layouts/Base.astro   页面骨架(head 元信息 + 主题/字体恢复内联脚本;`rail={false}` 无左栏,再加 `wide` 即占满宽度)
    ├── components/
    │   ├── Nav.astro / Rail.astro / Contacts.astro / Footline.astro / ProjectCard.astro
    │   ├── GithubCard.astro  GitHub 资料卡(消费 data/github.ts)
    │   ├── MarkdownReader.vue 阅读器主组件 + ReaderTree / ReaderFontPanel / ReaderIcon(递归树 / 字体面板 / 描边图标)
    │   └── ThemeToggle.vue / FontPicker.vue / PaletteGrid.vue / SearchPanel.vue / MusicPlayer.vue / WeatherWidget.vue / StatsCounter.vue / Leaderboard.vue
    ├── lib/reader/       阅读器的纯逻辑(与 Vue 解耦,可在 node 里单测)
    │   ├── archive.ts     JSZip 递归解析 / 目录树构建(只收 .md)/ GBK 回退解码 / 资源路径解析
    │   ├── markdown.ts    marked 渲染 + DOMPurify 消毒 + DOM 后处理(标题 id / 图片 / 内链 / 表格)
    │   ├── custom-font.ts IndexedDB 字体持久化 + @font-face 注入
    │   └── icons.ts       阅读器图标 SVG 片段表
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
    └── pages/            index / projects / catppuccin / following / search / reader / 404
```

`legacy/` 是迁移前的旧版(模板渲染 + 手写 JS/CSS),仅供对照,不再参与构建。

## 设计机制

- **主题**：Mocha(深)/ Latte(浅)双 Catppuccin 风味,`@property` 注册实现颜色平滑过渡;系统偏好自动适配,`localStorage` 持久化;切换用 View Transition 圆形揭示(ThemeToggle.vue)
- **多色强调**：Catppuccin 全色相令牌(`_tokens.scss`),每个区块、每条导航、每张项目卡各占一色(区块 `--acc` / 导航 `--nc` / 卡片数据 `hue` → `.h-<hue>`);页面底色是四色氛围网格 + 双光斑,身份卡顶部多色光晕 + 头像外一圈全色相色环,标题/时钟用品牌渐变裁字;动作控件与焦点环仍固定 `--primary`,保证注意力落点唯一
- **材质**：玻璃卡片统一 `--edge`(顶部 1px 内高光,浅色主题换成白色内描边) + 双层投影,静止时也有「浮起来」的厚度;系统开「减弱透明度」时与低配层同样去模糊、换不透明底
- **GitHub 资料卡**(projects 页)：构建时调 `https://api.github.com/users/FLT18355`,把返回的字段尽量铺满卡片(统计块 + 明细表 + 折叠的 API 端点);拉不到(限流 / 断网)自动退回 `src/data/github-user.snapshot.json`,访客侧零请求、无 JS 也完整可见
- **低配适配**：head 内联脚本按省流量 / 内存 / 核心数判定 `html.lite`,精简层去掉玻璃模糊、固定渐变层与常驻动画(滚动与首屏优先);`?lite=1` / `?lite=0` 可手动对比
- **老浏览器兜底**：颜色依赖的 `color-mix()` 缺失时由 `_compat.scss`(整块 `@supports not (...)`)给出等价纯色,颜色身份不丢、只是层次降一档
- **Vue 岛**(client:load,共九个)：主题拨钮、首启字体选择、色板复制、搜索页(时钟/历史)、首页 Test 音乐播放器、首页统计数字、following 排行榜、首页天气卡、阅读器。除天气卡(内容取决于访客位置,只能在浏览器侧取)与阅读器(内容来自用户上传的压缩包)外,其余全部 SSR 直出静态内容,JS 不运行页面仍完整可用
- **Markdown 阅读器**(reader 页)：上传 ZIP 后 `JSZip` 递归遍历,目录树**只收 `.md`**(纯图片目录会被剪掉,`__MACOSX/._*` 垃圾剔除),文本先按 UTF-8 严格解码、失败回退 GB18030(照顾 GBK 文档);渲染走 `marked`(GFM) + `DOMPurify` 消毒,再在 detach 的 template 里做四趟 DOM 后处理:标题加 id、图片相对路径解析成 Blob URL(命不到就换成 `Image not in archive` 说明条)、内链(`.md` 转站内跳转并带锚点 / 非 md 转下载 / 外部链接新标签)、表格套横向滚动容器;字体支持上传 `.woff2/.woff/.ttf/.otf`,二进制存 **IndexedDB**(库 `flt18355-reader`,键 `reading-font`),刷新后读回并注入 `@font-face`,可一键恢复默认(私有模式下降级为仅本次会话生效);**阅读页字体基准固定为系统字体栈 `--sys-font`**,不跟随站点字体选择(选 Maple Mono 只影响其它页),上传的字体只补在这一层栈首;正文配色另有一套固定分工(标题逐级走 `mauve→peach` 谱系,链接用页面色相 `sky`,代码 `pink`,强调 `yellow`,增删红/绿),改样式时按这套分工走,别就地发明颜色;窄屏(≤920px)目录树变全高抽屉,带遮罩 / Esc / 焦点回送。**页面文案全英文**(不引入新的中文可见文案,因此无需重跑 `subset-font.py`)
- **音乐播放器**：首页 Test 区,3 首曲目(GitHub Release 直链,经 gh-proxy 加速),`preload="auto"` 打开页面即自动下载;播放/暂停/进度跳转,左右键切歌,`localStorage` 保存上次播放的曲目与进度;音频文件不落地仓库
- **字体选择**：首启弹出(默认字体免下载秒开),选 Maple Mono 才触发 `font.woff2` 下载;`localStorage`(`site-font`)持久化,页脚「字体」按钮重开
- **天气卡**(首页最底部)：`navigator.geolocation` 拿浏览器定位,失败(拒绝授权 / 老浏览器)则退到无 Key 的 IP 定位端点(`ipwho.is` → `get.geojs.io`,只取经纬度),两条都不通就用默认坐标(北京 39.9, 116.4),**保证卡片永远有内容**;天气来自 Open-Meteo `current_weather`(免费、无需 API Key),请求带 `timezone=auto` 所以观测时间是该地当地时间;结果缓存 30 分钟(`localStorage`),避免每次进首页都弹定位授权;卡片上标出定位方式(GPS / IP location / Default)与坐标,不用「猜」
- **动效**(渐进增强)：区块滚动入场 + 筹码二级错峰、卡片指针光斑、3D 微倾斜、背景视差、阅读进度线;全部挂 `html.motion-js` 门控,尊重 `prefers-reduced-motion`
- **无障碍**：语义化 landmark、`aria-current`、键盘可操作(Enter/空格切换主题)、可见焦点环

## 维护要点

**必守约束**

- **`dist/` 与根目录产物都是生成物**,不要手改;改内容一律改 `src/`,然后 `npm run build` + `bash scripts/deploy.sh`。
- **字体门控**:`Maple Mono NF CN` 只允许出现在 `html[data-font="maple"]` 的覆盖里(默认用户不能触发 `font.woff2` 下载)。新增可见文案后必须重跑 `python3 subset-font.py`,否则新字符缺字(豆腐块);全量字体在 `public/font-full.woff2`,不会丢字形。
- **新增玻璃面**必须用 `box-shadow: var(--edge), var(--shadow)`(写在同一条里,否则老浏览器整条阴影失效),并同步登记到 `_lite.scss` 的模糊关闭清单与 `prefers-reduced-transparency` 段。
- **新增 `color-mix()`** 时,若丢掉该声明会让元素变透明 / 失色相,要去 `_compat.scss` 的 `@supports not (...)` 块里补一条等价纯色(不能就地写两行,压缩器会删掉后一条)。
- **新增动效**必须补 `prefers-reduced-motion` 分支;除拨钮场景动画外全部尊重该偏好。
- **色相落位**只改 `_tokens.scss` 里的令牌:区块 `--acc`(`_layout.scss` 的 `$block-hues`)、导航 `--nc`(`_nav.scss` 的 `$nav-hues`,顺序即 `data/site.ts` 的 NAV 数组)、卡片数据 `hue`。**动作控件与焦点环固定用 `--primary`**,不要换成区块色相。彩色文字用 `color-mix(in srgb, var(--hue), var(--text) var(--hue-fg-mix))`。
- **文案**:UI 以英文为主,面向用户的提示用中文;**禁用 em dash `—`**(用逗号 / 句号 / 冒号)。中文注释与文案用半角 `:` 与 `,`,与现有文件保持一致。
- **不引 CDN / 运行时框架依赖**;交互逻辑优先放 Vue 岛,纯 DOM 增强放 `src/scripts/*.ts`(由 `Base.astro` 打包)。
- 主题 / 字体的**无闪烁恢复**必须在 `Base.astro` 的 head 内联脚本里同步执行(`localStorage` 的 `theme` / `site-font`),不能换成模块脚本。

**改完自检**

```bash
npm run build                                  # 应输出 7 page(s) built,无报错
ls dist/*.html                                 # 恰好 7 个
grep -rn '{{' dist/*.html                      # 应无输出(残留占位符)
grep -o 'aria-current="page"' dist/reader.html # 每页恰一处,指向当前页(脚本里的选择器字符串会再出现一次)
bash scripts/deploy.sh                         # 同步到根目录,Pages 才生效
```

- 逻辑层(`src/lib/reader/*.ts`)可脱离浏览器验证:用 esbuild 把测试脚本打成 ESM、在 Node + jsdom 里跑(`npm i jsdom fake-indexeddb` 作临时依赖),能覆盖 ZIP 解析 / 路径解析 / 编码回退 / 消毒 / 字体持久化。
- 视觉与窄屏布局目前没有浏览器自动化,改样式后要人工过一眼深色 / 浅色与手机宽度。
- 改 GitHub 资料卡后确认构建日志没有 `[github] ... 失败`(出现即说明走了快照);改天气卡后确认「允许定位 / 拒绝定位 / 断网」三种情况卡片都有内容。

## 本地预览

```bash
npm run dev        # 开发模式(热更新)
npm run preview    # 预览 dist 构建产物
```

## 部署

GitHub Pages 从仓库根目录服务 HTML,而 Astro 产物在 `dist/`,所以部署就是把产物同步到根目录。**本仓库只用下面这一种方式,不使用 GitHub Actions:**

```bash
bash scripts/deploy.sh    # 构建 + 把 dist/ 同步到仓库根
```

脚本做三件事:① `npm run build` 产出 `dist/`;② 清掉根目录同名旧产物(避免已删页面残留);③ 把 `dist/*` 拷到仓库根。会自动跳过 6.7MB 的 `font-full.woff2`(它只是子集化输入源),同步后根目录应有 7 个 HTML 加 `_astro/`、`font.woff2`、`logo.svg`、`images/`、`.nojekyll`。

**每次改完 `src/` 都要重新跑一次,否则线上仍是旧产物。** 当前目录不是 git 仓库,Pages 直接读根目录的文件;若以后接回 git,提交并推送根目录产物即可上线。

## 许可

本站点代码基于 [MIT License](LICENSE) 开源。
