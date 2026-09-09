# 架构与技术说明

站点:FLT18355.github.io —— 个人主页(GitHub Pages),五页纯静态,由 Astro 构建。

目标读者:后续维护此仓库的 AI / 开发者。

## 1. 总览

```
src/pages/*.astro         页面(每页一个组件树)
src/layouts/Base.astro    骨架(head 元信息 + 主题/字体恢复内联脚本)
src/components/           .astro 组件 + 五个 .vue 交互岛
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
- 交互逻辑收敛为五个 Vue 岛(`client:load`):主题拨钮、首启字体选择、色板复制、搜索页、首页 Test 音乐播放器。**全部 SSR 直出静态内容,JS 不加载页面仍完整可用**(旧版色板页是 JS 渲染,无 JS 空白)。

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
- `src/data/site.ts`:导航五条与页面元信息;`projects.ts`:项目卡数据(projects 页 3 卡 + following 页 4 卡共用);`palette.ts`:色板数据(4 风味 × 26 色)。
- 项目卡组件 `ProjectCard.astro` 只消费数据;加项目 = 改 `projects.ts`,不动模板。
- 色板页 `PaletteGrid.vue` SSR 直出全部色块 + 水合后绑定点击复制 Hex;数据在 `palette.ts` 维护。

### 3.6 无障碍
- 语义化 landmark、`aria-current`、可见焦点环、按钮可键盘操作。
- 字体选择界面:role=dialog / aria-modal / aria-labelledby。

## 4. 当前页面与数据

| 页 | `src/pages/` | 内容 |
|---|---|---|
| index | `index.astro` | About Me / Interests / Tech Stack |
| projects | `projects.astro` | terminal / lxm / dotfiles 三卡(`data/projects.ts`) |
| catppuccin | `catppuccin.astro` | 色板页:4 风味 × 26 色(`PaletteGrid.vue` + `data/palette.ts`,含中文文案需进字体字符集) |
| following | `following.astro` | herdr / oh-my-pi / catppuccin(`f-catppuccin` 单色紫强调卡,线性猫 SVG 图标)/ neovim |
| search | `search.astro` | bare 模式(无左栏):实时时钟 + Bing 搜索表单(新标签打开结果) + 快捷站点链接(GitHub/Bilibili/YouTube/MDN) + 最近搜索历史(localStorage 5 条);交互逻辑在 `SearchPanel.vue`(`/` 或 Ctrl+K 聚焦,Esc 清空);背景光斑 `.search-bg` 经 `body-end` 插槽渲染(静态层在 `_search.scss`,动画在 `_motion.scss` 第 8 节) |
| 404 | `404.astro` | 独立错误页(不挂导航壳,自带内联主题/字体恢复 + 页内 scoped 样式) |

联系方式(`components/Contacts.astro`):GitHub、QQ(wpa.qq.com 临时会话,w/ `/images/QQ-cm.svg` 图标)、微信(weixin.qq.com)、B 站大号 / 小号。

`legacy/` 是迁移前的旧版(模板渲染 + 手写 JS/CSS),仅供对照,不参与构建。
