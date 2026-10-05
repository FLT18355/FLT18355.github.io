# FLT18355.github.io

个人主页，基于 [Catppuccin](https://catppuccin.com/) 配色（Mocha / Latte 双主题），Astro + Vue + SCSS 构建的纯静态站。

## 页面

| 页面 | 内容 |
|------|------|
| [`index.html`](index.html) | 主页:关于我、统计、技术栈、兴趣(bento 网格,≥1120px)+ Test 音乐播放器 + 实时天气卡(浏览器定位 + Open-Meteo) |
| [`projects.html`](projects.html) | 重点项目:terminal / lxm / dotfiles / dsh-pet / gitx + 其他站点(Lumen)+ GitHub 资料卡(构建时从 api.github.com 拉取) |
| [`catppuccin.html`](catppuccin.html) | Catppuccin 色板:4 风味 × 26 色,点击复制 Hex(SSR 直出,无 JS 也可见) |
| [`following.html`](following.html) | 关注项目:herdr / oh-my-pi / catppuccin(紫色重点卡 + 猫图标)/ neovim |
| [`search.html`](search.html) | Bing 搜索页:实时时钟 / 快捷链接 / 最近搜索(无左栏单列布局) |
| [`reader.html`](reader.html) | Markdown 阅读器:上传 ZIP 递归解析目录、只收 .md、渲染 GFM、包内图片与内链、自定义字体持久化(无左栏、占满宽度) |
| [`404.html`](404.html) | 品牌化 404 页(猫 + 返回首页) |

> 页面上每张区块卡都可折叠,**默认全部展开**;右下角折叠坞可一键收起 / 展开,详见「设计机制 · 卡片折叠」。阅读器页是单一工具面板、404 页是单张错误卡,不参与折叠。

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
    │   ├── _bento.scss   首页 12 栏 bento 网格 / 版面尺度 / 项目首卡整行
    │   ├── _paper.scss   纸质浮雕材质层(背景纸层 / 浮雕瓦片 / 虚线细节)
    │   ├── _fold.scss    卡片折叠(标题行即摘要行)+ 右下角全站折叠坞
    │   ├── _toggle.scss  主题拨钮(拖拽 / 键盘 / 圆形揭示)
    │   ├── _search.scss  search 页样式
    │   ├── _music.scss   音乐播放器样式
    │   ├── _weather.scss 首页天气卡样式
    │   ├── _motion.scss  动效层(html.motion-js 门控)
    │   ├── _reader.scss  reader 页样式(工具条 / 目录树 / 文档排版 / 窄屏抽屉)
    │   ├── _nav.scss / _font-picker.scss / _boot.scss / _responsive.scss
    ├── layouts/Base.astro   页面骨架(head 元信息 + 主题/字体恢复内联脚本;`rail={false}` 无左栏,再加 `wide` 即占满宽度)
    ├── components/
    │   ├── CardFold.astro    可折叠卡片壳(原生 `<details>` + `<summary>`,默认展开;区块卡统一用它)
    │   ├── BootScreen.astro  启动界面标记(首启加载 / 回访过渡;显隐由 `<html>` 上的类决定,逻辑在 scripts/boot.ts)
    │   ├── Nav.astro / Rail.astro / Contacts.astro / Footline.astro / ProjectCard.astro / SiteCard.astro
    │   ├── GithubCard.astro  GitHub 资料卡(消费 data/github.ts,在 projects 页被 CardFold 包住)
    │   ├── MarkdownReader.vue 阅读器主组件 + ReaderTree / ReaderFontPanel / ReaderIcon(递归树 / 字体面板 / 描边图标)
    │   └── ThemeToggle.vue / FontPicker.vue / PaletteGrid.vue / SearchPanel.vue / MusicPlayer.vue / WeatherWidget.vue / StatsCounter.vue / Leaderboard.vue
    ├── lib/reader/       阅读器的纯逻辑(与 Vue 解耦,可在 node 里单测)
    │   ├── archive.ts     JSZip 递归解析 / 目录树构建(只收 .md)/ GBK 回退解码 / 资源路径解析
    │   ├── markdown.ts    marked 渲染 + DOMPurify 消毒 + DOM 后处理(标题 id / 图片 / 内链 / 表格)
    │   ├── custom-font.ts IndexedDB 字体持久化 + @font-face 注入
    │   └── icons.ts       阅读器图标 SVG 片段表
    ├── data/
    │   ├── site.ts       站点元信息 + 导航配置
    │   ├── projects.ts   项目卡数据(projects / following 共用,含 projects 页其他站点 otherSites)
    │   ├── palette.ts    Catppuccin 色板数据(4 风味 × 26 色)
    │   ├── music.ts      音乐播放器曲目(gh-proxy 直链 + 标题)
    │   ├── weather.ts    首页天气卡:定位链路 + Open-Meteo 端点 + WMO 天气码/图标
    │   ├── github.ts     GitHub 资料卡数据源(构建时拉 api.github.com,失败退回快照)
    │   └── github-user.snapshot.json  api.github.com 响应快照(兜底,`npm run snapshot:github` 刷新)
    ├── scripts/
    │   ├── motion.ts     动效编排(滚动入场、光斑、倾斜、进度线)
    │   ├── nav.ts        导航指示条定位
    │   ├── fold.ts       卡片折叠增强(状态记忆 / 折叠坞 / 快捷键 / 深链)
    │   └── boot.ts       启动界面编排(真实门控进度 / 跳过 / 会话记忆 / 6s 安全兜底;收尾派发 boot:done)
    └── pages/            index / projects / catppuccin / following / search / reader / 404
```

`legacy/` 是迁移前的旧版(模板渲染 + 手写 JS/CSS),仅供对照,不再参与构建。

## 设计机制

- **主题**：Mocha(深)/ Latte(浅)双 Catppuccin 风味,`@property` 注册实现颜色平滑过渡。**没手动选过时按本机时间给默认值**:白天(07:00 至 18:59)用 Latte,其余时间用 Mocha;拨钮一拨就把选择写进 `localStorage` 的 `theme`,之后一律以用户的选择为准,不再看时间(自动档在**每次页面加载**时判定:同一个页面开着不动不会自己换,刷新或翻页会按新时间档重判;想锁死就拨一下拨钮)。`?theme=latte` / `?theme=mocha` 可临时覆盖本次加载(不写 `localStorage`),用来对比两支。head 内联脚本同时把 `<meta name="theme-color">` 对齐到当前主题(`data-color-mocha` / `data-color-latte` 取自 `data/site.ts`),否则白天默认 Latte 而地址栏 / 状态栏还是深色,手机上手最显眼的就是这一条。切换用 View Transition 圆形揭示(ThemeToggle.vue)
- **多色强调**：Catppuccin 全色相令牌(`_tokens.scss`),每个区块、每条导航、每张项目卡各占一色(区块 `--acc` / 导航 `--nc` / 卡片数据 `hue` → `.h-<hue>`);每个 `.block` 上沿还有一道 `--acc` 渐隐细线(静止收在两角内、悬停向两侧展开);页面底色是四色氛围网格 + 双光斑,身份卡顶部多色光晕 + 头像外一圈全色相色环,标题/时钟用品牌渐变裁字;动作控件与焦点环仍固定 `--primary`,保证注意力落点唯一
- **布局**：shell 上限 1240px(左栏 320px + 间距 48px,导航同步);首页在 ≥1120px 切成 12 栏 bento 网格(关于 7 / 统计 5、技术栈 5 / 兴趣 7、音乐 6 / 天气 6),行内卡片由 `align-items:stretch` 拉成等高、短卡片的筹码组垂直居中;projects 页首张项目卡占满整行(featuredProjects 共 5 条,其余 4 条正好铺满 2x2),卡片标签行贴底对齐。更窄屏回落单列堆叠。规则集中在 `_bento.scss`
- **材质(半透明浮雕)**：整套卡面按「上沿受光、下沿暗边、单一光源」组织。`--edge` 改成 `inset 0 1px 0 var(--emboss-light), inset 0 -1px 0 var(--emboss-dark)`,投影换成暖灰(浅色)/纯黑(深色)的大扩散双层阴影(`--shadow` / `--shadow-lift`),纸面更厚、边界更软;卡面刻意做**半透明**(`--glass` alpha 深色 0.42 / 浅色 0.40,内层 `--glass-item` 0.32 / 0.36)并保留 16px 背景模糊,隔着卡面能看见下面的纸层与等高线,读起来是「磨砂纸」而不是「实心板」。`--edge` 不再引用 `color-mix`,老浏览器不会把整条 box-shadow 带下去;系统开「减弱透明度」时与低配层同样去模糊、换不透明底
- **背景纸层**：`Base.astro` 新增固定装饰层 `.bg-art`(纯 CSS 渐变 + 内联 SVG,不引图片与依赖):右下角三层由深到浅的巨弧纸面(色差刻意给足,卡片半透明时才有层次可透)、左上角同心等高线、左下角点阵、两枚虚线 / 实底瓦片、一条节点连线;氛围色晕压淡并叠一层顶部受光(`--art-light`)。统计卡加虚线内框。线稿靠 `mask-image` 渐隐,不支持 mask 的浏览器整块不画;纸层视差复用 `motion.ts` 写在根元素上的 `--mx` / `--my`,不新增 JS;低配层在 `_lite.scss` 里整块 `display: none`
- **卡片折叠**(全站)：每张区块卡都是原生 `<details>`(默认展开),标题行即 `<summary>`,右侧折角随状态旋转,无 JS 也能点标题收起。Astro 页统一走 `CardFold.astro`,Vue 岛内是同一套 `<details class="block … fold card-fold">` 标记。`src/scripts/fold.ts` 在此之上做渐进增强:按「页面 + 卡片键」把折叠状态存进 `localStorage`(`site-fold`),右下角折叠坞显示「已展开 / 总数」并提供 Fold all / Unfold all,快捷键 `[` 收起全部 / `]` 展开全部(光标在输入框内不抢键),URL hash 命中卡片时强制展开并滚动到它;展开动画由 `html.fold-anim` 门控,只在用户操作后播,首屏不与区块入场(`blockIn`)叠成两层。`.block-note` / `.fold-stat` 放在摘要行右侧,收起时仍保留数量信息
- **GitHub 资料卡**(projects 页)：构建时调 `https://api.github.com/users/FLT18355`,把返回的字段尽量铺满卡片(统计块 + 明细表 + 折叠的 API 端点);拉不到(限流 / 断网)自动退回 `src/data/github-user.snapshot.json`,访客侧零请求、无 JS 也完整可见。整块走全站统一的 `CardFold`(**默认展开**),摘要行保留 `@login` / repos / followers 与折角;展开后资料卡撤掉自己的玻璃层与描边(`.fold .gh-card`),避免 `.block` 之内出现「卡中卡」的双层模糊。卡内的 API 端点列表仍是独立的原生 `<details>`,默认收起
- **其他站点**(projects 页 Other Websites)：`src/data/projects.ts` 的 `otherSites`(当前两条:Lumen,一个简约 SVG 渲染器;Lumen Player,一个浏览器内的音乐播放器),由 `SiteCard.astro` 渲染成整行卡片,左图标 / 域名 / 描述 / 标签 / 右侧 Open 出站按钮;色相由数据里的 `hue` 驱动(`.h-<hue>`),扫光方向与项目卡相反(由右向左)用来提示「离开本站」。加站点只需往数组里追加一条
- **低配适配**：head 内联脚本按省流量 / 内存 / 核心数判定 `html.lite`,精简层去掉玻璃模糊、固定渐变层与常驻动画(滚动与首屏优先);`?lite=1` / `?lite=0` 可手动对比
- **老浏览器兜底**：颜色依赖的 `color-mix()` 缺失时由 `_compat.scss`(整块 `@supports not (...)`)给出等价纯色,颜色身份不丢、只是层次降一档
- **Vue 岛**(client:load,共九个)：主题拨钮、首启字体选择、色板复制、搜索页(时钟/历史)、首页 Test 音乐播放器、首页统计数字、following 排行榜、首页天气卡、阅读器。除天气卡(内容取决于访客位置,只能在浏览器侧取)与阅读器(内容来自用户上传的压缩包)外,其余全部 SSR 直出静态内容,JS 不运行页面仍完整可用
- **Markdown 阅读器**(reader 页)：上传 ZIP 后 `JSZip` 递归遍历,目录树**只收 `.md`**(纯图片目录会被剪掉,`__MACOSX/._*` 垃圾剔除),文本先按 UTF-8 严格解码、失败回退 GB18030(照顾 GBK 文档);渲染走 `marked`(GFM) + `DOMPurify` 消毒,再在 detach 的 template 里做四趟 DOM 后处理:标题加 id、图片相对路径解析成 Blob URL(命不到就换成 `Image not in archive` 说明条)、内链(`.md` 转站内跳转并带锚点 / 非 md 转下载 / 外部链接新标签)、表格套横向滚动容器;字体支持上传 `.woff2/.woff/.ttf/.otf`,二进制存 **IndexedDB**(库 `flt18355-reader`,键 `reading-font`),刷新后读回并注入 `@font-face`,可一键恢复默认(私有模式下降级为仅本次会话生效);**阅读页字体基准固定为系统字体栈 `--sys-font`**,不跟随站点字体选择(选 Maple Mono 只影响其它页),上传的字体只补在这一层栈首;正文配色另有一套固定分工(标题逐级走 `mauve→peach` 谱系,链接用页面色相 `sky`,代码 `pink`,强调 `yellow`,增删红/绿),改样式时按这套分工走,别就地发明颜色;窄屏(≤920px)目录树变全高抽屉,带遮罩 / Esc / 焦点回送。**页面文案全英文**(不引入新的中文可见文案,因此无需重跑 `subset-font.py`)
- **音乐播放器**：首页 Test 区,3 首曲目(GitHub Release 直链,经 gh-proxy 加速),`preload="auto"` 打开页面即自动下载;播放/暂停/进度跳转,左右键切歌,`localStorage` 保存上次播放的曲目与进度;音频文件不落地仓库
- **字体选择**：首启弹出(默认字体免下载秒开),选 Maple Mono 才触发 `font.woff2` 下载;`localStorage`(`site-font`)持久化,页脚「字体」按钮重开
- **启动界面**(全站,`BootScreen.astro` + `_boot.scss` + `scripts/boot.ts`)：`Base.astro` 的 head 内联脚本按「`localStorage` 里有没有 `site-font`」同步给 `<html>` 写 `.boot-first` / `.boot-transition`(与主题 / 字体 / 低配同一个防闪烁原则),所以首帧就是启动层,不会先闪一帧正文。两个变体共用同一套语言:同一张封面纸(氛围底 + 一圈压深的晕影,晕影让封面比正文页「更深一层」,揭幕那一下才看得出来)+ 同一叠纸(卡片下面垫两张错开并轻微旋转的纸)+ 同一张封面卡(品牌渐变头像环 / 渐变裁字的 `FLT18355` / 标题 / 一条进度轨 / 状态行),所以它们长得像一对,只是内容与进度来源不同。**首启**是「加载中」:进度不是装饰,门控是 DOM 内容、`document.fonts.ready`、整页资源(`load`,最长 1800ms,硬等会把音乐播放器的 `preload="auto"` 也算进去)、以及 `FontPicker.vue` 派发的 `fontpicker:state`(最长 2200ms);门控里程碑(`MILES`)与轨上那三根刻度是**同一组数字**(由 `boot.ts` 写进 `--boot-tick-*`),所以「进度停住的地方」永远和刻度对得上。到齐后整层淡出露出已经就位的字体向导,正常情况下约 1.7s。**回访**是「欢迎回来 + `Skip`」:轨由 rAF 按停留时长线性走满,每个会话只走一次(`sessionStorage` 的 `boot-seen`),点 / 触 / 滚 / 按键都能立刻跳过,不操作约 2.2s 自己走完;选完字体会顺手写下 `boot-seen`,避免「加载层 → 向导 → 回访层」连着闪两次。两条轨各有一个 `<i>`,且**必须按 id 取**(`#bootRailFill` / `#bootCoverFill`):用 `querySelector('.boot__rail-fill')` 只会拿到 DOM 里靠前那个,回访的进度条会静默不动(这个坑踩过一次,桩测试里留了回归断言)。启动层**一律用 `--sys-font` 渲染**(与字体向导同一取舍):这一层永远不引用 `Maple Mono NF CN`,既不触发 7.1MB 的 woff2,**也不需要为它重跑 `subset-font.py`**,可见文案按「UI 以英文为主」全走英文。启动层在时给正文挂 `inert`(导航 / 内容 / 折叠坞),收尾再摘,并留 **6s 安全出口**,任何环节卡住都不会把页面永久锁住。离场**一开始**就派发 `boot:done`(而不是揭幕完才派发),`motion.ts` 收到才开始滚动入场,正文的入场正好从封面后面接上来。手动覆盖:`?boot=0` 关掉 / `?boot=1` 强制回访 / `?boot=first` 强制首启
- **天气卡**(首页最底部)：`navigator.geolocation` 拿浏览器定位,失败(拒绝授权 / 老浏览器)则退到无 Key 的 IP 定位端点(`ipwho.is` → `get.geojs.io`,只取经纬度),两条都不通就用默认坐标(北京 39.9, 116.4),**保证卡片永远有内容**;天气来自 Open-Meteo `current_weather`(免费、无需 API Key),请求带 `timezone=auto` 所以观测时间是该地当地时间;结果缓存 30 分钟(`localStorage`),避免每次进首页都弹定位授权;卡片上标出定位方式(GPS / IP location / Default)与坐标,不用「猜」
- **动效**(渐进增强)：区块滚动入场 + 筹码二级错峰、卡片指针光斑、3D 微倾斜、背景视差、阅读进度线;全部挂 `html.motion-js` 门控,尊重 `prefers-reduced-motion`
- **无障碍**：语义化 landmark、`aria-current`、键盘可操作(Enter/空格切换主题)、可见焦点环

## 维护要点

**必守约束**

- **`dist/` 与根目录产物都是生成物**,不要手改;改内容一律改 `src/`,然后 `npm run build` + `bash scripts/deploy.sh`。
- **字体门控**:`Maple Mono NF CN` 只允许出现在 `html[data-font="maple"]` 的覆盖里(默认用户不能触发 `font.woff2` 下载)。新增可见文案后必须重跑 `python3 subset-font.py`,否则新字符缺字(豆腐块);全量字体在 `public/font-full.woff2`,不会丢字形。
- **新增玻璃面**必须用 `box-shadow: var(--edge), var(--shadow)`(写在同一条里,否则老浏览器整条阴影失效),并同步登记到 `_lite.scss` 的模糊关闭清单与 `prefers-reduced-transparency` 段。
- **新增区块卡**一律用 `CardFold.astro`(Vue 岛用同款 `<details class="block … fold card-fold">`):标题放进 `<summary class="block-header fold-head">`,正文包进 `.fold-body`,并给 `id` / `data-fold` 一个页内唯一键(折叠状态按它持久化);默认带 `open`,保证「默认未折叠」。
- **新增 `color-mix()`** 时,若丢掉该声明会让元素变透明 / 失色相,要去 `_compat.scss` 的 `@supports not (...)` 块里补一条等价纯色(不能就地写两行,压缩器会删掉后一条)。
- **新增动效**必须补 `prefers-reduced-motion` 分支;除拨钮场景动画外全部尊重该偏好。
- **色相落位**只改 `_tokens.scss` 里的令牌:区块 `--acc`(`_layout.scss` 的 `$block-hues`)、导航 `--nc`(`_nav.scss` 的 `$nav-hues`,顺序即 `data/site.ts` 的 NAV 数组)、卡片数据 `hue`。**动作控件与焦点环固定用 `--primary`**,不要换成区块色相。彩色文字用 `color-mix(in srgb, var(--hue), var(--text) var(--hue-fg-mix))`。
- **文案**:UI 以英文为主,面向用户的提示用中文;**禁用 em dash `—`**(用逗号 / 句号 / 冒号)。中文注释与文案用半角 `:` 与 `,`,与现有文件保持一致。
- **不引 CDN / 运行时框架依赖**;交互逻辑优先放 Vue 岛,纯 DOM 增强放 `src/scripts/*.ts`(由 `Base.astro` 打包)。
- 主题 / 字体的**无闪烁恢复**必须在 `Base.astro` 的 head 内联脚本里同步执行(`localStorage` 的 `theme` / `site-font`),不能换成模块脚本。启动界面同理:`.boot-first` / `.boot-transition` 也必须在这个 head 里同步写,换成模块脚本会先闪一帧正文。
- **启动界面**新增可见文案时按「UI 以英文为主」写英文;它固定走 `--sys-font`,所以确实不需要重跑 `subset-font.py`(中文只出现在源码注释里)。

**改完自检**

```bash
npm run build                                  # 应输出 7 page(s) built,无报错
ls dist/*.html                                 # 恰好 7 个
grep -rn '{{' dist/*.html                      # 应无输出(残留占位符)
grep -c 'card-fold' dist/*.html                # 每页区块卡数(index 6 / projects 4 / following 2 / catppuccin 1 / search 1;404 与 reader 为 0)
grep -o 'aria-current="page"' dist/reader.html # 每页恰一处,指向当前页(脚本里的选择器字符串会再出现一次)
bash scripts/deploy.sh                         # 同步到根目录,Pages 才生效
```

- 启动界面三条分支各过一眼:`?boot=first`(首启加载,进度走满后淡出接字体向导)、`?boot=1`(回访封面卡,进度轨要真的在走,点任意处能立刻跳过)、`?boot=0`(完全不出现);再不带参数开一个新标签页,确认默认走回访层且同一标签页内翻页不再出现。深浅两套都要看:纸叠与晕影在 Latte 下最容易糊成一片。
- 逻辑层(`src/lib/reader/*.ts`)可脱离浏览器验证:用 esbuild 把测试脚本打成 ESM、在 Node + jsdom 里跑(`npm i jsdom fake-indexeddb` 作临时依赖),能覆盖 ZIP 解析 / 路径解析 / 编码回退 / 消毒 / 字体持久化。`src/scripts/boot.ts` 同样是纯 DOM、无依赖,也可以用它配一个极简 DOM 桩验证收尾路径。
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
