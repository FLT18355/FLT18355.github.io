# AI 维护手册

给后续接手本仓库的 AI / 开发者的操作规则。改动前必读,尤其记住「**dist/ 是生成物**」和「**默认不加载大字体**」两条硬约束。

## 0. 第一原则

- 改页面内容/公共结构/样式/数据 → 改 `src/` → `npm run build` → 验证。
- **不要**直接编辑 `dist/`(下次 build 会清空重建,改动丢失)。
- 改 `public/` 静态资源(logo.svg / font.woff2)→ 重新 build 拷入 dist;font.woff2 按 3.2 流程重跑子集化。
- 仓库根没有手写 HTML 产物了(全在 dist),`legacy/` 是旧版归档,仅供对照,勿改。

## 1. 快速上手

```bash
npm install            # 首次
npm run dev            # 开发预览(热更新)
npm run build          # 产出 dist/
```

改动前先看 `doc/architecture.md`(机制)与 `doc/source-map.md`(文件职责),再动手。

## 2. 布局结构(四页一致,search 页除外)

```
[顶部导航]  Home | Projects | Palette | Following | Search   [主题拨钮]
[左栏]            [内容区 <main>]
  头像/名号         每页自己的 block(s)
  联系方式
[页脚]  © 2026 FLT18355 | Source on GitHub | 字体
```

- 骨架在 `src/layouts/Base.astro`,公共组件在 `src/components/`,改一处即所有页面生效。
- 左栏(rail)默认渲染;search 页**无左栏**(bare 模式):`src/pages/search.astro` 传 `rail={false}` 即可。新增无左栏页面:同样传参 + 确认 `.shell--bare` 样式满足需求(`src/styles/_layout.scss`)。
- search 页另有**专属背景光斑动效**:`src/pages/search.astro` 通过 `body-end` 插槽渲染 `.search-bg` 空容器(仅此页),静态柔光层在 `_search.scss`,漂浮动画在 `_motion.scss` 第 8 节(`html.motion-js` 门控 + reduce 熄火)。
- search 页交互(时钟 / 最近搜索 / 快捷键 / 快捷链接)在 `src/components/SearchPanel.vue`(Vue 岛,`client:load`),仅此页挂载。

## 3. 硬约束与易错点

### 3.1 dist 是生成物
- `npm run build` 清空重建 dist;验证时查 `dist/` 而非手写。
- 产物与 src 不一致时,优先怀疑有人手改了 dist 或没重新 build。

### 3.2 字体门控(site-font)
- `public/font.woff2` 是**子集**(`subset-font.py` 从 `public/font-full.woff2` 全量裁剪),`@font-face` 声明不触发下载,只有 `html[data-font="maple"]` 规则下的元素实际引用才下载。
- **改字体相关样式时,不要**把 "Maple Mono NF CN" 写进无条件生效的规则(如默认 `body` 或 `:root` 的 `--mono`,在 `_tokens.scss`)。必须挂在 `html[data-font="maple"]` 下,否则默认用户也会加载字体。
- 源码文案**新增字符**后必须重跑 `python3 subset-font.py`,否则子集缺字(显示豆腐块);全量字体保留在 `public/font-full.woff2`,子集化不会丢失字形。
- 子集化字符集来源 = `src/**/*.{astro,vue,ts}`(自动扫描全源码);若往 Vue 组件/数据里加可见中文(如 SearchPanel 的时钟中文、palette.ts 的 flavor 说明),无需手动登记,但**必须重跑脚本**。
- 新增字体族/字重:在 `src/styles/_tokens.scss` 顶部 `@font-face` 区声明,并按现有模式做条件化。
- 用户若反馈「字体不生效」:先查 `localStorage.site-font` 是否为 `'maple'`,以及 `data-font` 属性是否存在;再查 Network 是否有 woff2 请求。

### 3.3 主题切换
- 拨钮行为是刻意还原的 demo 效果,场景动画(云朵/太阳/星星)**不随 `prefers-reduced-motion` 关闭**,README 有记录,勿「修」回去。
- 切换过渡在 `src/components/ThemeToggle.vue` 的 `commitTheme`:View Transition 圆形揭示,新主题快照从拨钮中心 clip-path 扩散。**不要退回全屏遮罩层方案**(旧 `.theme-ripple` veil 会遮住页面内容,已删)。`_motion.scss` 的 `::view-transition-old/new(root) { animation: none }` 是关掉 VT 默认交叉淡化,必需。
- 拖动由 `--p` 变量驱动交叉淡化(`#themeToggle.dragging` 规则在 `_toggle.scss`),组件 JS 只写变量,别把拖动逻辑改成状态机。
- `data-theme` 由 `Base.astro` 的 head 内联脚本在渲染前恢复:`localStorage('theme')`,缺省按系统偏好。改主题时保持同样的无闪烁时序(内联脚本在 head,不能用模块脚本替代,模块脚本会延迟执行造成闪烁)。

### 3.4 云朵动画
- `@keyframes drift`(`_toggle.scss`):`translateX(270px)` → `-90px`,右侧外飘入、穿出左外循环;静态回退 `translateX(270px)`(右外,不遮挡太阳);云朵 `z-index:4` 高于太阳(云遮日)。
- 四朵云用负 `animation-delay` 错峰(-2/-7/-12/-17s),相位分布保证任意时刻有一朵从右进入。**不要**把 delay 改成正值或 0(会同步成「几朵云挤一起」)。

### 3.5 低配设备与老浏览器(html.lite / _compat.scss)
- **低配判定**(`Base.astro` 与 `404.astro` 的 head 内联脚本,两处必须同步改):省流量 / `deviceMemory ≤ 4` / 触屏且核心数 ≤ 4 → 给 `<html>` 加 `lite`。**必须在 head 内同步跑**,模块脚本晚一帧,玻璃模糊会先渲染再关掉、肉眼可见闪烁。`?lite=1` / `?lite=0` 手动覆盖(存 `localStorage('site-lite')`)。
- `_lite.scss` 里关掉的都是刻意的,别再打开:玻璃模糊、主题切换 transition、`body::before` 氛围层与 `.glow` 视差、拨钮云朵/太阳脉冲、搜索页光斑、指针光斑、卡片 `will-change`。**新增重效果(模糊 / 固定层大渐变 / 常驻动画)时,同步在 `_lite.scss` 补一条关闭,`motion.ts` 侧也要用已有的 `lite` 判断跳过**。
- `_lite.scss` 末尾还有一块 `@media (prefers-reduced-transparency: reduce)`(系统辅助功能里的「减弱透明度」):同样去模糊 + 换不透明玻璃。**新增玻璃层时两处清单都要补**(`html.lite` 与 `prefers-reduced-transparency`)。
- **颜色兜底统一写在 `_compat.scss`**(整块 `@supports not (color: … color-mix …)`),不要就地写两行同属性声明:构建的 CSS 压缩器会把「后一条不含渐变」的重复声明当成必然被覆盖而删掉(`color` 会被删,`background` 渐变对能保留),就地兜底会静默失效。新增 color-mix 用法时,若丢掉这条声明会让页面变透明或失去色相,就去补一条等价纯色。
- 头像:`public/images/avatar.webp` 由 `public/logo.webp` 缩放而来(256×256 无损,约 32KB)。换 logo 时重新生成,别把 2757px 原图挂到页面上。

### 3.6 无障碍 / reduced-motion
- 除拨钮场景动画外,所有动效都尊重 `prefers-reduced-motion`(`_responsive.scss` 与 `_motion.scss` 各有 reduce 块)。新增动效必须补 reduce 分支。
- 动效只用 transform / opacity;不用 `window.addEventListener('scroll')`(用 IntersectionObserver / rAF,见 `src/scripts/motion.ts`)。

### 3.7 玻璃材质(--edge)
- 玻璃卡片的「厚度」= `--edge`(顶部 1px 内高光)+ 投影,两者**必须写在同一条 `box-shadow`**里:`box-shadow: var(--edge), var(--shadow)`。写成独立属性会在不支持 `color-mix` 的浏览器里整条失效(自定义属性为无效值时整条声明作废),卡片会连投影一起丢。
- `--edge` 定义在 `_tokens.scss`(`:root` 与 `:root[data-theme="latte"]` 各一份),`_compat.scss` 里补了纯色等价版本。**新增玻璃面时**:先在 `--acc` 语言下加 `box-shadow: var(--edge), var(--shadow)`,再确认 hover 态也是「`var(--edge)` + 同数量投影」,否则过渡会在两套投影列表之间跳变。
- hover 态的投影列表条数要与静止态一致(mocha 是 1 + 2),不一致时浏览器按「不可插值」处理,过渡变成硬切。

### 3.8 GitHub 资料卡(projects 页)
- 数据是**构建时**拉的(`src/data/github.ts` 的 `getGithubUser()`,`projects.astro` frontmatter await),不是客户端请求:访客零请求、无 JS 可见,数据随每次部署刷新。**不要改成 `client:load` 的浏览器侧 fetch**(会闪空窗、且访客侧要吃限流)。
- 拉取失败会退回 `src/data/github-user.snapshot.json` 并打 `[github] ...` 警告;两条路都不通才不渲染这一块。快照用 `npm run snapshot:github` 刷新,改完记得一起提交。
- `GITHUB_TOKEN` 由 `deploy.yml` 的 build 步骤透传(实名 5000 次/小时,匿名只有 60 次/小时且 Actions 出口 IP 共享)。`github.ts` 只在服务端被引用,`GITHUB_TOKEN` 是普通变量(非 `PUBLIC_`),不进客户端产物:别把它改成从页面脚本里读。
- 端点字段(`*_url`)会带上 RFC 6570 模板段(`{/other_user}`),渲染时 href 去掉模板段、文本保留原值。
- 新增字段的落点:`normalize()` 补一行 → `GithubCard.astro` 的 `details` 数组补一行 → 空值用 `or()`,保证显示 `not set` 而不是空白。

### 3.9 天气卡(首页,客户端定位)
- **这里是刻意的浏览器侧请求,别「修」成构建时拉取**:天气取决于访客所在位置,构建时拿不到。与 3.8 的 GitHub 卡片方向相反,不要互相「统一」。
- 定位链路三级,顺序不要动:`navigator.geolocation` → IP 定位端点(`ipwho.is` → `get.geojs.io`,只取经纬度字段,加端点就往 `src/data/weather.ts` 的 `IP_ENDPOINTS` 里加)→ 默认坐标(北京 39.9, 116.4)。**卡片必须在三级都失败时仍有内容**,不允许出现空卡片或错误占位当正文。
- 天气请求必须带 `timezone=auto`(否则 `current_weather.time` 是 UTC,「观测时间」会显示成别处的时间,且前端不做时区换算,只切字符串)。
- 单位写死在文案里(请求不传 `temperature_unit` / `windspeed_unit`,默认就是 °C / km/h):改单位要同时改请求参数与 `_weather.scss` 里的 `°C` / `km/h`。
- 缓存键 `localStorage['weather-cache']`,TTL 30 分钟(`CACHE_TTL`);改缓存结构不用管老数据,`restoreCache()` 会逐字段校验并丢弃不合法的旧值。
- 新增可见文案后照样要重跑 `python3 subset-font.py`(这次就为 `°` 跑过一次)。
- 新增常驻动画 / 模糊层要同步 `_lite.scss`(当前天气卡没有,所以没登记);新增 color-mix 的等价兜底在 `_compat.scss` 第 11 节。

## 4. 页面内容约定

- 文案语言:页面 UI 以英文为主(About Me / Interests / Tech Stack / Featured Projects …),中文仅用于面向用户的提示(字体选择界面、联系方式里纯中文标签等)。新增文案按此惯例。
- 不要用 em-dash `—`(刻意禁用,替换为逗号/句号/冒号)。
- 多色强调是**刻意设计**(「Catppuccin 光谱」),但要按既有位置落色,不要在页面里随手写死颜色:
  - 色相令牌在 `src/styles/_tokens.scss`(`--mauve` / `--pink` / `--red` / `--maroon` / `--peach` / `--yellow` / `--green` / `--teal` / `--sky` / `--sapphire` / `--lavender` / `--rosewater` / `--flamingo`,各带 `-dim`);渐变令牌 `--grad-brand` / `--grad-spectrum` 也在该文件。
  - 区块色相:每个 `.b-*` 类在自己的选择器上设 `--acc` / `--acc-dim`(`_layout.scss` 的 `$block-hues` 表),区块描边、标题菱形、指针光斑、入场强调线自动跟随。新增区块 → 在 `$block-hues` 补一行,不要另起一套。
  - 导航色相:`_nav.scss` 的 `$nav-hues` 按 NAV 数组顺序给每条链接 `--nc`;`nav.ts` 把当前页色相写进指示条的 `--ni`。
  - 卡片色相:数据驱动(`src/data/projects.ts` 的 `hue` 字段 → `.h-<hue>` 类,见 `_cards.scss`)。特殊卡 `.f-catppuccin` 固定 mauve。
  - 动作类控件与键盘焦点环**固定用 `--primary`**(蓝):按钮、输入框聚焦、所有 `:focus-visible`。新增交互元素沿用 `--primary`,不要换成区块色相。
  - 彩色文字一律用 `color-mix(in srgb, var(--hue) N%, var(--text))`,深浅主题各自动向背景方向收敛,避免浅色主题下黄/桃色对比度不足。
- 项目/色板/导航等数据集中在 `src/data/*.ts`,不要散落在页面里。

## 5. 技术栈约束

- 框架:Astro 7 + Vue 3(仅六个交互岛,`client:load`)+ SCSS。交互逻辑优先放 Vue 岛;纯 DOM 增强(指示条/动效编排)用 `src/scripts/*.ts` 由 Base.astro 打包。
- 不要引入外部 CDN / 运行时框架依赖;动效零第三方库。
- 修改公共结构后用 `doc/build.md` 的验证清单(self-check)。

## 6. 交接自检

改完提交前确认:

- [ ] `npm run build` 成功,dist 六页齐全,无 `{{`
- [ ] 六页 title / aria-current 正确(每页恰一处,指向当前页)
- [ ] 公共改动在各页面都生效(抽查,含 rail 页面与 bare 页面)
- [ ] 字体选择流程未破坏(首启弹窗 / 选后刷新 / 页脚重开)
- [ ] 双主题未破坏
- [ ] 没往 dist 里手写内容
- [ ] 新增 color-mix 用法:丢掉那条声明会透明/失色相时,已在 `_compat.scss` 补等价纯色
- [ ] 新增重效果(模糊 / 固定层大渐变 / 常驻动画):已在 `_lite.scss` 补关闭,并在 `?lite=1` 下自查
- [ ] 新增玻璃面:`box-shadow` 是 `var(--edge)` + 同数量投影,且 `_lite.scss` 的模糊关闭清单里有它
- [ ] 动了 GitHub 卡片:构建日志无 `[github] ... 失败`(有的话说明走了快照,确认是否符合预期)
- [ ] 动了天气卡:首页底部卡片在「允许定位 / 拒绝定位 / 断网」三种情况下都有内容(拒绝与断网时坐标必须回落到 IP 或默认北京),定位方式与坐标如实显示,Refresh 能重新取数
