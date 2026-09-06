# 源文件清单

所有可编辑的页面源码都在 `src/`,改完跑 `python3 build.py` 生成根目录三个 HTML。仓库根目录的 `index.html` / `projects.html` / `following.html` 是**生成物**,不要手改。

## 根目录

| 路径 | 类型 | 说明 |
|---|---|---|
| `build.py` | 构建脚本 | Python3 标准库,零依赖。模板渲染 + 页清单 |
| `subset-font.py` | 子集化脚本 | 按页面文本裁剪 `src/font-full.woff2` → 根 `font.woff2`(需 fonttools/brotli) |
| `index.html` | 产物 | 主页(勿手改,由 src/ 生成) |
| `projects.html` | 产物 | 重点项目(勿手改) |
| `following.html` | 产物 | 关注项目(勿手改) |
| `404.html` | 静态页 | 品牌化 404(猫 SVG + 返回首页,引用站点样式) |
| `logo.svg` | 静态资源 | 站点 logo / 头像 |
| `font.woff2` | 产物 | Maple Mono 子集(约 56KB,按页面文本裁剪,按需下载;由 subset-font.py 覆盖) |
| `images/QQ-cm.svg` | 静态资源 | QQ 品牌图标(contact 区使用,fill 固定色) |

## `assets/`(共用样式与脚本,已编译)

| 文件 | 职责 |
|---|---|
| `style.css` | 设计令牌(Mocha/Latte 双主题)+ 全部基础样式 + 主题拨钮 + 云朵动画 |
| `motion.css` | 增量动效层,全部规则挂 `html.motion-js` 门控 |
| `nav.css` | 顶部导航条 + 滑动指示条 |
| `font-picker.css` | 首启字体选择界面 + 页脚「字体」按钮 |
| `app.js` | 主题拨钮(拖拽/点击/键盘切换)+ theme-color 同步 |
| `app-motion.js` | 动效编排:滚动入场、光斑、倾斜、涟漪、进度线 |
| `nav.js` | 导航指示条定位 |
| `font-picker.js` | 字体选择:首启显隐、选项绑定、页脚重开 |

## `src/`(唯一编辑入口)

| 路径 | 说明 |
|---|---|
| `template.html` | 整页骨架:`{{title}}` `{{description}}` `{{font-picker}}` `{{nav}}` `{{profile}}` `{{contacts}}` `{{content}}` `{{home/projects/following}}`(nav aria-current 标记);含 OG / twitter / JSON-LD Person meta |
| `font-full.woff2` | Maple Mono 全量字体(7.1MB,subset-font.py 子集化输入源,勿删) |
| `pages.json` | 页清单:每页 title / description / current(导航高亮页)/ page(内容页文件名) |
| `partials/font-picker.html` | 字体选择 overlay(默认 hidden,JS 控制显隐) |
| `partials/nav.html` | 顶部导航,三个链接带 `{{home}}` `{{projects}}` `{{following}}` 占位(当前页注入 ` aria-current="page"`) |
| `partials/profile.html` | 左栏身份:头像 / h1 / @handle / tagline |
| `partials/contacts.html` | 左栏联系方式列表(GitHub / QQ / 微信 / B 站大号 / B 站小号) |
| `pages/index.html` | 主页 `<main>` 内容(About / Interests / Tech Stack) |
| `pages/projects.html` | 项目页 `<main>` 内容(terminal / lxm / dotfiles) |
| `pages/following.html` | 关注页 `<main>` 内容(herdr / oh-my-pi / catppuccin 彩色卡 / neovim) |

## 页面差异速查

改这三个地方只影响单个页面,build.py 会同步:

- 页标题/描述/导航高亮:`src/pages.json`
- 某页内容:`src/pages/<name>.html`

改任一 `partials/` 或 `template.html` 影响**全部三页**。