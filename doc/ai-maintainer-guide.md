# AI 维护手册

给后续接手本仓库的 AI / 开发者的操作规则。改动前必读,尤其记住「**根目录三个 HTML 是生成物**」和「**默认不加载大字体**」两条硬约束。

## 0. 第一原则

- 改页面内容/公共结构 → 改 `src/` → `python3 build.py` → 验证。
- **不要**直接编辑根目录的生成产物(index / projects / catppuccin / following / search 五个 .html,下次 build 会覆盖丢改动)。
- 改 `assets/*.css、*.js` 或 `logo.svg`、`font.woff2` → 不需要 build,刷新即可。

## 1. 快速上手

```bash
python3 build.py            # 从 src/ 重新生成五页
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

公共片段全部在 `src/partials/`,改一处即所有页面生效。

- 左栏(rail)默认注入,来自 `src/partials/rail.html`(内含 profile + contacts 两个占位)。
- search 页**无左栏**(bare 模式):`src/pages.json` 里该页 `"rail": false` 即可。build.py 会跳过 rail 注入并给 `.shell` 加 ` shell--bare` 类(单列网格 + 内容限宽居中)。新增无左栏页面:复制该字段 + 确认 `.shell--bare` 样式满足需求。
- search 页另有**专属背景光斑动效**:`src/pages/search.html` 里的 `.search-bg` 空容器(仅此页存在),静态柔光层在 `assets/style.css`,漂浮动画在 `assets/motion.css` 第 8 节(`html.motion-js` 门控 + reduce 熄火)。它靠页面内容注入而不是 build 条件,所以其它页面天然不受影响。

## 3. 硬约束与易错点

### 3.1 根目录五页是生成物

- `grep -n '{{' *.html` 有输出 = build 失败/占位没填,先修 src。

- 产物与 src 不一致时,优先怀疑有人手改了产物。

### 3.2 字体门控(site-font)
- `font.woff2` 是**子集**(约 56KB,`subset-font.py` 从 `src/font-full.woff2` 全量裁剪),`@font-face` 声明不触发下载,只有 `html[data-font="maple"]` 规则下的元素实际引用才下载。
- **改字体相关 CSS 时,不要**把 "Maple Mono NF CN" 写进无条件生效的规则(如默认 `body` 或 `:root` 的 `--mono`)。必须挂在 `html[data-font="maple"]` 下,否则默认用户也会加载字体。
- 页面文案**新增字符**后必须重跑 `python3 subset-font.py`,否则子集缺字(显示豆腐块);全量字体保留在 `src/font-full.woff2`,子集化不会丢失字形。
- 子集化字符集来源 = 生成页面 HTML + `assets/palette.js`(`subset-font.py` 的 `JS_SOURCES`);若往 JS 里加可见中文,须同步把该文件加入 `JS_SOURCES`。
- 新增字体族/字重:在 `assets/style.css` 顶部 `@font-face` 区声明,并按现有模式做条件化。
- 用户若反馈「字体不生效」:先查 `localStorage.site-font` 是否为 `'maple'`,以及 `data-font` 属性是否存在;再查 Network 是否有 woff2 请求。

### 3.3 主题切换
- 拨钮行为是刻意还原的 demo 效果,场景动画(云朵/太阳/星星)**不随 `prefers-reduced-motion` 关闭**,README 有记录,勿「修」回去。
- 拖动由 `--p` 变量驱动交叉淡化,CSJS 只写变量,别把拖动逻辑改成 React/状态机(本项目无框架)。
- `data-theme` 由 head 内联脚本在渲染前恢复:`localStorage('theme')`,缺省按系统偏好。改主题时保持同样的无闪烁时序。

### 3.4 云朵动画
- `@keyframes drift`:`translateX(270px)` → `-90px`,右侧外飘入、穿出左外循环;静态回退 `translateX(270px)`(右外,不遮挡太阳);云朵 `z-index:4` 高于太阳(云遮日)。
- 四朵云用负 `animation-delay` 错峰(-2/-7/-12/-17s),相位分布保证任意时刻有一朵从右进入。**不要**把 delay 改成正值或 0(会同步成「几朵云挤一起」)。

### 3.5 无障碍 / reduced-motion
- 除拨钮场景动画外,所有动效都尊重 `prefers-reduced-motion`(style.css / motion.css 各有 reduce 块)。新增动效必须补 reduce 分支。

## 4. 页面内容约定

- 文案语言:页面 UI 以英文为主(About Me / Interests / Tech Stack / Featured Projects …),中文仅用于面向用户的提示(字体选择界面、联系方式里纯中文标签等)。新增文案按此惯例。
- 不要用 em-dash `—`(刻意禁用,替换为逗号/句号/冒号)。
- 渲染出的颜色强调统一用 `--primary`;多色只出现在有语义处(flavor 色板、tech 语言标签、联系方式品牌色)。新增区块不要各自换 accent 色。

## 5. 技能/规范提示(本仓库的开发风格)

- 纯静态、零第三方依赖:不要引入 CDN、字体、npm 包、框架。
- CSS 用 CSS 变量令牌 + `@property` 过渡;动效只动 transform / opacity;不用 `window.addEventListener('scroll')`(用 IntersectionObserver / rAF)。
- 修改公共结构后用 `doc/build.md` 的验证清单(self-check)。

## 6. 交接自检

改完提交前确认:

- [ ] `python3 build.py` 成功,产物无 `{{`
- [ ] 五页 title / aria-current 正确
- [ ] 公共改动在各页面都生效(抽查,含 rail 页面与 bare 页面)
- [ ] 字体选择流程未破坏(首启弹窗 / 选后刷新 / 页脚重开)
- [ ] 双主题未破坏
- [ ] 没往产物 HTML 里手写内容