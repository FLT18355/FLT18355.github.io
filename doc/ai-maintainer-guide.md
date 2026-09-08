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

### 3.5 无障碍 / reduced-motion
- 除拨钮场景动画外,所有动效都尊重 `prefers-reduced-motion`(`_responsive.scss` 与 `_motion.scss` 各有 reduce 块)。新增动效必须补 reduce 分支。
- 动效只用 transform / opacity;不用 `window.addEventListener('scroll')`(用 IntersectionObserver / rAF,见 `src/scripts/motion.ts`)。

## 4. 页面内容约定

- 文案语言:页面 UI 以英文为主(About Me / Interests / Tech Stack / Featured Projects …),中文仅用于面向用户的提示(字体选择界面、联系方式里纯中文标签等)。新增文案按此惯例。
- 不要用 em-dash `—`(刻意禁用,替换为逗号/句号/冒号)。
- 渲染出的颜色强调统一用 `--primary`;多色只出现在有语义处(flavor 色板、tech 语言标签、联系方式品牌色)。新增区块不要各自换 accent 色。
- 项目/色板/导航等数据集中在 `src/data/*.ts`,不要散落在页面里。

## 5. 技术栈约束

- 框架:Astro 7 + Vue 3(仅四个交互岛,`client:load`)+ SCSS。交互逻辑优先放 Vue 岛;纯 DOM 增强(指示条/动效编排)用 `src/scripts/*.ts` 由 Base.astro 打包。
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
