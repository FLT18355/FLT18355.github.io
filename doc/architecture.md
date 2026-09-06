# 架构与技术说明

站点:FLT18355.github.io —— 个人主页(GitHub Pages),三页纯静态,零第三方依赖。

目标读者:后续维护此仓库的 AI / 开发者。

## 1. 总览

```
src/                   模板 + 片段(pages.json 清单)
  │
  │  python3 build.py
  ▼
index.html             产物:GitHub Pages 直接部署
projects.html
following.html
  │
  └── assets/           共用样式与脚本(编译产物,勿改)
```

- 三页共享同一套布局:顶部导航(含主题拨钮)、左侧身份栏(头像/名号/标语/联系方式)、右侧内容区、页脚。
- 所有公共结构在 `src/partials/` 只维护一份,由 `build.py` 渲染进三页。
- 页级差异只有 4 个点:`title`、`description`、导航 `aria-current`、`<main>` 内容,全部在 `src/pages.json` 与 `src/pages/` 定义。

## 2. 构建管线

`build.py`(标准库 `json` + `pathlib`,零第三方依赖):

1. 读 `src/template.html`(整页骨架,含 `{{占位}}`)。
2. 按 `src/pages.json`(页清单:三页的 title / description / current 标记 / 内容页名)逐页:
   - 读对应 `src/pages/<name>.html` 作为 `<main>` 内容;
   - 读四个 partial(font-picker / nav / profile / contacts);
   - 按 `current` 给 nav 三个链接注入 ` aria-current="page"`(当前页),其余留空;
   - 用字符串替换填充 `{{...}}`,写出到仓库根。
3. 产物是完整静态 HTML,无任何运行时模板依赖。

**约束:根目录的三个 .html 是生成物,勿手改;改内容一律改 `src/` 后重新 build。**

## 3. 关键机制

### 3.1 双主题(Mocha / Latte)
- 令牌在 `assets/style.css`:`:root`(Mocha 默认)+ `:root[data-theme="latte"]` 覆盖;`@property` 注册颜色变量实现平滑过渡。
- 首屏无闪烁:head 内联脚本读 `localStorage('theme')`(缺省按 `prefers-color-scheme`),在 body 解析前设 `data-theme`。
- 切换 UI:导航右侧拨钮,`assets/app.js` 处理拖拽 / 点击 / 键盘(Enter/空格),`themechange` 事件触发涟漪(app-motion.js)。
- `assets/app.js` 维护 `meta[name="theme-color"]` 随主题切换。

### 3.2 字体选择(首启门控)
- 目的:默认不下载 7.1MB 的 `font.woff2`(Maple Mono NF CN),弱网也能秒开。
- **`@font-face` 声明本身不触发下载**,只有实际被渲染引用才下载。因此默认模式下 body 与 `--mono` 都不引用 Maple Mono,woff2 零请求。
- 选择存 `localStorage('site-font')`,`'default' | 'maple'`。head 内联脚本在渲染前恢复 `data-font` 属性:CSS 中 `html[data-font="maple"]` 才启用 Maple(正文 + `--mono`)。
- 首启界面 `#fontPicker`(默认 `hidden`),`assets/font-picker.js` 在 DOM 就绪后判断:未存选择则显示,已存则保持隐藏;点击选项 → 写 `localStorage` → 先即时设 `data-font`,再 `location.reload()`。
- 页脚「字体」按钮(`#fontPickerReopen`)随时重开选择界面。选择界面自身强制系统字体渲染。
- 提示:若用户浏览器拦截了自动刷新,选择界面内有「请手动刷新网页」提示行。

### 3.3 动效(渐进增强层)
- `assets/app-motion.js` 仅在支持 IntersectionObserver 且用户未开启 reduced-motion 时给 `<html>` 加 `.motion-js`,`assets/motion.css` 全部动效规则挂在该类下;JS 不跑或不支持时页面完全正常。
- 功能:区块滚动入场 + 筹码错峰、指针光斑、项目卡 3D 微倾斜、主题涟漪、阅读进度线、页脚浮现。
- **主题拨钮场景动画(云朵/太阳/星星)刻意不随 reduced-motion 关闭**(产品决策,README 有记录),其余动效遵守 reduced-motion。
- 云朵动画 `@keyframes drift`(style.css):`translateX(270px)` → `-90px`,即右侧外飘入、穿出左侧外循环;云朵静态回退在右侧外(不遮挡太阳),`z-index` 高于太阳(云遮日)。四朵云用负 `animation-delay` 错峰,相位分布保证任意时刻有一朵正从右侧进入。
- 现有动效均为 CSS + IntersectionObserver / rAF,无 GSAP 依赖、无 scroll 监听。

### 3.4 导航指示条
- `assets/nav.js`:加载时把指示条定位到当前页链接下方(`aria-current="page"`),resize / 字体加载完成后重算;点击其它链接先滑过去再跳转。
- 依赖 partial 中的 nav 结构不变(`.nav-list` / `.nav-item[aria-current]` / `.nav-indicator`)。

### 3.5 无障碍
- 语义化 landmark、`aria-current`、可见焦点环、按钮可键盘操作。
- 字体选择界面:role=dialog / aria-modal / aria-labelledby。

## 4. 当前页面与数据

| 页 | `src/pages/` | 内容 |
|---|---|---|
| index | `index.html` | About Me / Interests / Tech Stack |
| projects | `projects.html` | terminal / lxm / dotfiles 三卡 |
| following | `following.html` | herdr / oh-my-pi / catppuccin（`f-catppuccin` 单色紫强调卡,线性猫 SVG 图标）/ neovim |

联系方式(partials/contacts.html):GitHub、QQ(wpa.qq.com 临时会话,w/ QQ-cm.svg 图标)、微信(weixin.qq.com)、B 站大号 / 小号。