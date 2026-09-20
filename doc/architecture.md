# 架构与技术说明

站点:FLT18355.github.io —— 个人主页(GitHub Pages),五页纯静态,由 Astro 构建。

目标读者:后续维护此仓库的 AI / 开发者。

## 1. 总览

```
src/pages/*.astro         页面(每页一个组件树)
src/layouts/Base.astro    骨架(head 元信息 + 主题/字体恢复内联脚本)
src/components/           .astro 组件 + 六个 .vue 交互岛
src/data/                 站点/项目/色板数据(TS 模块)
src/scripts/              motion.ts / nav.ts(打包进页面)
src/styles/               SCSS 模块(global.scss 汇总)
   │
   │  npm run build (astro build)
   ▼
dist/                    产物:经 GitHub Actions 自动部署,或用 scripts/deploy.sh 同步到仓库根
  index.html / projects.html / catppuccin.html / following.html / search.html / 404.html
  _astro/(打包后的 CSS/JS) + public/ 原样拷入的资源
```

- 构建配置 `astro.config.mjs`:`build.format: 'preserve'` 直接输出 `/projects.html` 等,**与旧站 URL 完全一致**(非 `/projects/index.html`)。
- 五页(index/projects/catppuccin/following)共享 `Base.astro`:顶部导航(含主题拨钮)、左侧身份栏(头像/名号/标语/联系方式)、右侧内容区、页脚。
- search 页是无左栏页面(bare 模式):页面传 `rail={false}`,`Base.astro` 不渲染 `<Rail />` 并给 `.shell` 加 `shell--bare` 类(单列网格 + 内容限宽居中,见 `src/styles/_layout.scss`)。
- 页级差异只有 4 个点:`title`、`description`、导航 `aria-current`、`<main>` 内容,由各页面文件与 `src/data/site.ts` 定义。
- 交互逻辑收敛为六个 Vue 岛(`client:load`):主题拨钮、首启字体选择、色板复制、搜索页、首页 Test 音乐播放器、首页天气卡。**除天气卡外全部 SSR 直出静态内容,JS 不加载页面仍完整可用**(旧版色板页是 JS 渲染,无 JS 空白);天气卡的内容取决于访客位置,只能在浏览器侧请求(见 3.10),无 JS 时显示一行提示。

## 2. 构建管线

```bash
npm install        # 首次
npm run dev        # 开发预览(热更新,默认 http://localhost:4321)
npm run build      # 产出 dist/
npm run preview    # 预览构建产物
python3 subset-font.py   # 字体子集化(独立步骤,见 3.2)
```

- `astro build`:SSR 渲染 6 个页面(含 404)、SCSS 编译打包进 `dist/_astro/site.*.css`、Vue 岛产出独立 chunk、`public/` 内容原样拷入 dist 根、页级小脚本自动内联进 HTML。
- **约束:dist/ 是产物,勿手改;改内容一律改 `src/` 后重新 build。**

## 3. 关键机制

### 3.1 双主题(Mocha / Latte)
- 令牌在 `src/styles/_tokens.scss`:一个 SCSS map 定义全部颜色令牌,`:root`(Mocha 默认)+ `:root[data-theme="latte"]` 覆盖;`@property` 注册颜色变量实现平滑过渡。**改颜色只改这一个文件**。
- 首屏无闪烁:`Base.astro` 的 head 内联脚本读 `localStorage('theme')`(缺省按 `prefers-color-scheme`),在 body 解析前设 `data-theme`。
- 切换 UI:导航右侧拨钮,`src/components/ThemeToggle.vue` 处理拖拽 / 点击 / 键盘(Enter/空格),切换瞬间用原生 View Transition API 做圆形揭示:新主题快照从拨钮中心向外扩散,无遮罩层、不遮挡任何内容(组件内 `commitTheme`)。
- `ThemeToggle.vue` 维护 `meta[name="theme-color"]` 随主题切换。

### 3.2 字体选择(首启门控)
- 目的:默认不下载 Maple Mono 字体,弱网也能秒开。`public/font.woff2` 是**子集**(由 `subset-font.py` 按 `src/**/*.{astro,vue,ts}` 文本裁剪自 `public/font-full.woff2` 全量 7.1MB),仅选 Maple 的用户按需加载。
- **`@font-face` 声明本身不触发下载**,只有实际被渲染引用才下载。`src/styles/_tokens.scss` 中 Maple Mono 只挂在 `html[data-font="maple"]` 规则下,默认模式零请求。
- 子集化注意:源字体是 ExtraBold 单轮廓,且 preferred family 只在 nameID 16;`subset-font.py` 会修正子集 name 表(补回 `Maple Mono NF CN`),否则 CSS 匹配失败。源码文案新增字符后需重跑,否则新字缺失。
- 选择存 `localStorage('site-font')`,`'default' | 'maple'`。head 内联脚本在渲染前恢复 `data-font` 属性。
- 首启界面 `src/components/FontPicker.vue`:挂载后判断——未存选择则显示,已存则保持隐藏;点击选项 → 写 `localStorage` → 先即时设 `data-font`,再 `location.reload()`。页脚「字体」按钮(`#fontPickerReopen`)随时重开。

### 3.3 动效(渐进增强层)
- `src/scripts/motion.ts` 仅在支持 IntersectionObserver 且用户未开启 reduced-motion 时给 `<html>` 加 `.motion-js`,`src/styles/_motion.scss` 全部动效规则挂在该类下;JS 不跑或不支持时页面完全正常。
- 功能:区块滚动入场 + 筹码错峰、指针光斑、项目卡 3D 微倾斜、阅读进度线、页脚浮现、Search 页背景光斑(仅 search 页有 `.search-bg`,两个伪元素光斑缓慢漂浮 + 呼吸,26s/34s 错峰,挂 `html.motion-js` 门控,reduced-motion 熄火)、Search 页快捷链接悬停微浮起 + 最近搜索 chips 错峰入场。主题切换圆形揭示在 `ThemeToggle.vue` 内(View Transition API,非 `.motion-js` 门控,自带 reduced-motion 判断)。
- **主题拨钮场景动画(云朵/太阳/星星)刻意不随 reduced-motion 关闭**(产品决策,README 有记录),其余动效遵守 reduced-motion。
- 云朵动画 `@keyframes drift`(`src/styles/_toggle.scss`):`translateX(270px)` → `-90px`,即右侧外飘入、穿出左侧外循环;云朵静态回退在右侧外(不遮挡太阳),`z-index` 高于太阳(云遮日)。四朵云用负 `animation-delay` 错峰,相位分布保证任意时刻有一朵正从右侧进入。

### 3.4 导航指示条与窄屏滑动
- `src/scripts/nav.ts`:加载时把指示条定位到当前页链接下方(`aria-current="page"`),resize / 字体加载完成后重算;点击其它链接先滑过去再跳转。
- 指示条定位用 `offsetLeft` / `offsetWidth`(相对 `.nav-list` padding box),**不用 `getBoundingClientRect()` 差值**:窄屏下 `.nav-list` 是横向滚动容器,rect 差值不含 `scrollLeft`,一滑动就错位。
- 手机适配(`src/styles/_nav.scss`):`.nav-list` 为 `flex:1; min-width:0; overflow-x:auto`,链接 `flex-shrink:0` 保持原宽,总宽超出屏幕即整体左右滑动;滚动条隐藏,`overscroll-behavior-x:none` 阻断安卓边缘返回手势。主题拨钮 `.toggle-scale` 在滚动容器外固定右侧。
- `nav.ts` 的 `bringIntoView()`:当前页落在视口外时(如手机上 Search 在最右)把它滚到中间,避免用户进页面看不到自己在哪。

### 3.5 数据驱动
- `src/data/site.ts`:导航五条与页面元信息;`projects.ts`:项目卡数据(projects 页 4 卡 + following 页 4 卡共用,`hue` 字段决定卡片色相);`palette.ts`:色板数据(4 风味 × 26 色);`github.ts`:GitHub 资料卡数据源(见 3.9)。
- 项目卡组件 `ProjectCard.astro` 只消费数据;加项目 = 改 `projects.ts`,不动模板。GitHub 资料卡同理,组件 `GithubCard.astro` 只消费 `github.ts` 归一化后的对象。
- 色板页 `PaletteGrid.vue` SSR 直出全部色块 + 水合后绑定点击复制 Hex;数据在 `palette.ts` 维护。

### 3.6 多色强调(色相系统)
- 站点刻意用满 Catppuccin 的色相环,不是一个蓝色打天下;所有色相都来自 `_tokens.scss` 的令牌(双主题各一套值),不写死色值。
- 三层落色:**区块**(`.b-*` 上的 `--acc` / `--acc-dim`,表在 `_layout.scss` 的 `$block-hues`)、**导航**(`_nav.scss` 的 `$nav-hues` 按索引给 `--nc`,指示条由 `nav.ts` 写 `--ni`)、**卡片/筹码/数字**(数据或索引驱动的 `.h-<hue>` / `--hc` / `--sc`)。页面背景的多色氛围层与两枚 `.glow` 光斑同样由色相令牌合成(`_reset.scss` / `_layout.scss`)。
- 角色分工:色相负责区块身份与装饰;**动作与可达性**永远用 `--primary`(按钮、输入框聚焦、`:focus-visible` 焦点环)。
- 色相文字统一走 `color-mix(in srgb, var(--hue), var(--text) var(--hue-fg-mix))`:Mocha 下 `--hue-fg-mix: 0%`(纯色相,深底上 4.5:1 起步),Latte 下 `72%`(色相作为文字色的着色调)。浅色主题的纯 pastel 文字对比度只有 2-3:1,所以浅色主题的彩色靠淡色底 + 彩边 + 彩色图标承担,文字只带色调。
- 渐变令牌 `--grad-brand`(rail 标题 / search 时钟 / 404 标题的裁字渐变)与 `--grad-spectrum`(阅读进度线、指示条回退)定义在 `_tokens.scss`,由色相令牌拼成,双主题自动跟随。

### 3.7 低配设备与老浏览器适配
- **判定在 head 内联脚本里同步执行**(`Base.astro` / `404.astro`,加 `html.lite`):省流量模式、`deviceMemory ≤ 4GB`、触屏且 `hardwareConcurrency ≤ 4` 之一成立即精简(必须早于首帧,否则玻璃模糊会先渲染一帧再关掉)。`?lite=1` / `?lite=0` 手动覆盖并写入 `localStorage('site-lite')`,同一台手机上可直接对比。
- **精简内容**(`_lite.scss`):`backdrop-filter` 全部去掉并把 `--glass` 换成不透明玻璃(玻璃层逐帧重采样是弱 GPU 上最贵的一笔);主题切换 transition 关掉(几十个颜色令牌插值会让整页重绘);`body::before` 多色网格与两枚 `.glow` 视差层换成 body 上一张静态渐变;拨钮云朵、太阳脉冲、搜索页光斑停住(静态画面不变);跳过指针光斑与卡片 3D 倾斜(`motion.ts` 侧也跳过)。区块色相与滚动入场保留。
- **老浏览器兜底**(`_compat.scss`):本站颜色大量依赖 `color-mix()`,不支持的浏览器(旧版 WebView / 老 Chrome)会把整条声明丢掉,底纹变透明。该文件整块包在 `@supports not (color: … color-mix …)` 内给出等价纯色。**兜底不能就地写两行声明**:CSS 压缩器会把「同属性、后一条不含渐变」的重复声明当必被覆盖而删掉(实测 `color` 会被删,`background` 渐变对会保留),所以统一写在 `_compat.scss`。
- 头像用 `public/images/avatar.webp`(256×256 无损,32KB),源图 `public/logo.webp` 只作为资产保留,页面不引用(2757×2757 / 320KB 不该进首屏)。

### 3.8 无障碍
- 语义化 landmark、`aria-current`、可见焦点环、按钮可键盘操作。
- 字体选择界面:role=dialog / aria-modal / aria-labelledby。
- `_reset.scss` 里有一条全局 `:focus-visible` 兜底(2px `--primary` 焦点环):组件里更具体的 `:focus-visible` 规则依旧覆盖它,新增交互元素即使忘了写焦点样式也不会裸奔。
- 标题统一 `text-wrap: balance`,正文 `text-wrap: pretty`,多行标题不会甩出孤字尾行。

### 3.9 GitHub 资料卡(projects 页,构建时拉取)
- 数据源 `src/data/github.ts`:`projects.astro` 的 frontmatter `await getGithubUser()`,构建时请求 `https://api.github.com/users/FLT18355` 一次,归一化成驼峰结构交给 `GithubCard.astro`。**访客侧零请求、无 JS 也完整可见**,数据随每次部署刷新,和「全部 SSR 直出」的取向一致。
- **失败不空窗**:拉取失败(限流 / 断网)时打一条构建警告,退回 `src/data/github-user.snapshot.json`(committed 的 API 响应快照);两条路都不通才不渲染这一块。快照用 `npm run snapshot:github`(=`scripts/snapshot-github.mjs`)刷新。
- **token**:实名请求 5000 次/小时,匿名只有 60 次/小时且 Actions 出口 IP 共享,因此 `deploy.yml` 的 build 步骤透传 `GITHUB_TOKEN`(非 `PUBLIC_` 变量不会进客户端产物,`github.ts` 只在服务端侧被引用)。
- 字段覆盖:除 `*_url`(10 个 API 端点,折叠在 `<details>` 里)之外的字段全部上卡片,空值显示 `not set`;端点 href 去掉 RFC 6570 模板段(`{/other_user}` 之类)再输出。
- 新字段(例如 GitHub 以后再加一个 `pronouns`):在 `normalize()` 里补一行,再在 `GithubCard.astro` 的 `details` 数组里补一行,不用动样式。

### 3.10 首页天气卡(客户端定位 + Open-Meteo)
- **与 3.9 相反,这里是刻意的浏览器侧请求**:天气取决于访客所在位置,构建时拿不到,所以 `WeatherWidget.vue`(`client:load`,只挂首页)在挂载后才定位并请求。JS 不跑时卡片显示占位(`--`)与一行提示,不做假数据。
- **定位链路**(降级逐级兜底,`src/data/weather.ts`):`navigator.geolocation`(8s 超时、`enableHighAccuracy: false`、`maximumAge` 10 分钟)→ 无 Key 的 IP 定位端点顺序尝试(`ipwho.is` → `get.geojs.io`,6s 超时,只取经纬度两个字段,其余响应字段一律不用)→ 默认坐标(北京 39.9, 116.4)。三级都记在卡片上(`GPS` / `IP location` / `Default (Beijing)`),坐标同时展示,不靠猜。已经明确拒绝授权时(`navigator.permissions` 为 `denied`)直接跳过定位调用,省掉一次无谓报错。
- **天气请求**:`https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&current_weather=true&timezone=auto`,免费且无需 API Key。**`timezone=auto` 是必需的**:否则返回的 `time` 是 UTC,「观测时间」会显示成别的地方的时间;带上它以后 API 返回的就是该地当地时间,前端只切字符串,不做时区换算。
- **单位**:请求不传 `temperature_unit` / `windspeed_unit`,即用默认 °C 与 km/h,所以卡片文案里的 `°C` / `km/h` 是写死的;要换单位得同时改请求参数与 `_weather.scss` 里的文案。
- **缓存**:结果(坐标 + 定位方式 + 天气 + 时区)写 `localStorage('weather-cache')`,30 分钟内直接复用,避免每次进首页都弹定位授权;手动点 Refresh 会重新走一遍完整链路。
- **超时与失败**:所有请求都用 `AbortController` 收口(不用 `AbortSignal.timeout`,照顾老浏览器),任一环节失败都不阻塞渲染;Open-Meteo 失败时卡片进入错误态并给 Refresh 按钮,不清空已有坐标。
- **天气码**:WMO code → 文案 + 图标的表在 `src/data/weather.ts` 的 `WMO_WEATHER`(`iconNight` 用于夜间换成月亮);图标是 24x24 描边 path,存在同一文件的 `WEATHER_ICONS`(云 / 月亮拆成常量复用),`stroke` 由 CSS 给,不引第三方图标库。
- **色相与动效**:区块色相 `b-weather` = sky(`_layout.scss` 的 `$block-hues`);观测信息四块 `.weather-tile` 走 `_motion.scss` 的筹码二级错峰;刷新按钮是动作控件,固定用 `--primary`;没有新增常驻动画与模糊层,所以 `_lite.scss` 无需新增条目(新增 color-mix 的等价兜底在 `_compat.scss` 第 11 节)。

## 4. 当前页面与数据

| 页 | `src/pages/` | 内容 |
|---|---|---|
| index | `index.astro` | About Me / Interests / Tech Stack + By the Numbers + Test 音乐播放器 + Local Weather 天气卡(`WeatherWidget.vue` + `data/weather.ts`,客户端定位与请求,见 3.10) |
| projects | `projects.astro` | terminal / lxm / dotfiles 三卡(`data/projects.ts`)+ GitHub 资料卡(`data/github.ts`,构建时拉 api.github.com) |
| catppuccin | `catppuccin.astro` | 色板页:4 风味 × 26 色(`PaletteGrid.vue` + `data/palette.ts`,含中文文案需进字体字符集) |
| following | `following.astro` | herdr / oh-my-pi / catppuccin(`f-catppuccin` 单色紫强调卡,线性猫 SVG 图标)/ neovim |
| search | `search.astro` | bare 模式(无左栏):实时时钟 + Bing 搜索表单(新标签打开结果) + 快捷站点链接(GitHub/Bilibili/YouTube/MDN) + 最近搜索历史(localStorage 5 条);交互逻辑在 `SearchPanel.vue`(`/` 或 Ctrl+K 聚焦,Esc 清空);背景光斑 `.search-bg` 经 `body-end` 插槽渲染(静态层在 `_search.scss`,动画在 `_motion.scss` 第 8 节) |
| 404 | `404.astro` | 独立错误页(不挂导航壳,自带内联主题/字体恢复 + 页内 scoped 样式) |

联系方式(`components/Contacts.astro`):GitHub、QQ(wpa.qq.com 临时会话,w/ `/images/QQ-cm.svg` 图标)、微信(weixin.qq.com)、B 站大号 / 小号。

`legacy/` 是迁移前的旧版(模板渲染 + 手写 JS/CSS),仅供对照,不参与构建。
