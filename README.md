# FLT18355.github.io

个人主页，基于 [Catppuccin](https://catppuccin.com/) 配色（Mocha / Latte 双主题），零依赖纯静态。

## 页面

| 页面 | 内容 |
|------|------|
| [`index.html`](index.html) | 主页:关于我、兴趣、技术栈 |
| [`projects.html`](projects.html) | 重点项目:terminal / lxm / dotfiles |
| [`following.html`](following.html) | 关注项目:herdr / oh-my-pi / catppuccin（紫色重点卡 + 猫图标）/ neovim |

## 构建

页面由 `build.py` 从 `src/` 下的模板与片段渲染生成,公共部分(font-picker / nav / profile / contacts)只维护一份,避免三页重复。改完公共部分或某页内容后跑一次重新生成:

```bash
python3 build.py
```

## 文件结构

```
├── index.html            主页（build.py 生成，勿手改）
├── projects.html         重点项目（同上）
├── following.html        关注项目（同上）
├── logo.svg              站点 logo（头像）
├── font.woff2            Maple Mono NF CN（等宽 + Nerd Font + 中文，7.1MB，按需加载）
├── build.py              模板渲染脚本
└── assets/
    ├── style.css         设计令牌（双主题）+ 全部基础样式 + 主题拨钮
    ├── motion.css        增量动效层（html.motion-js 门控）
    ├── nav.css           顶部导航条 + 滑动指示条
    ├── font-picker.css   首启字体选择界面样式
    ├── app.js            主题拨钮（拖拽 / 点击 / 键盘切换）
    ├── app-motion.js     动效编排（滚动入场、光斑、倾斜、涟漪、进度线）
    ├── nav.js            导航指示条定位
    └── font-picker.js    字体选择交互（首启弹出 + 页脚重开）

源文件（编辑这些，再跑 build.py）：

└── src/
    ├── template.html        页面骨架（{{占位}} 由 build.py 填充）
    ├── pages.json            三页的 title / description / 当前页标记 / 内容页
    ├── partials/
    │   ├── font-picker.html  首启字体选择界面
    │   ├── nav.html          顶部导航（含主题拨钮）
    │   ├── profile.html       左栏头像 / 名号 / 标语
    │   └── contacts.html      联系方式列表
    └── pages/
        ├── index.html        主页内容
        ├── projects.html     重点项目内容
        └── following.html    关注项目内容
```

无框架、无外部 CDN 资源，跑 `build.py` 生成纯静态 HTML，直接部署到 GitHub Pages。

## 技术文档

- [`doc/architecture.md`](doc/architecture.md) 架构与关键机制（主题 / 字体门控 / 动效 / 无障碍）
- [`doc/source-map.md`](doc/source-map.md) 源文件职责清单（改哪里）
- [`doc/build.md`](doc/build.md) 构建流程与构建后验证清单
- [`doc/ai-maintainer-guide.md`](doc/ai-maintainer-guide.md) AI 维护手册（硬约束与易错点，改动前必读）

## 设计与技术细节

- **主题**：Mocha（深，黑夜）/ Latte（浅，白天）两套 Catppuccin 风味，通过 `@property` 注册的自定义属性实现主题间颜色平滑过渡；系统偏好自动适配，选择持久化在 `localStorage`
- **主题拨钮**：demo/button.html 一比一还原（200×90 原布局 + wrapper 统一缩放适配导航条，仅配色换 Catppuccin 色板）。Latte 下蓝天白云 + 太阳呼吸光，云朵从右侧外飘入、穿出左侧外循环；Mocha 下星空闪烁 + 月亮浮现；滑钮可拖拽（场景随 `--p` 交叉淡化），松手 overshoot 回弹；场景动画与 demo 一致永转，不随 `prefers-reduced-motion` 关闭
- **卡片**：毛玻璃质感（`backdrop-filter: blur + saturate`），不支持的浏览器自动退化为半透明纯色
- **导航**：sticky 毛玻璃导航条，当前页指示条在页面间滑动切换
- **字体选择**：首启弹出选择界面（始终用系统字体渲染），默认字体免下载秒开（国人推荐）；选 Maple Mono 才加载 7.1MB 的 `font.woff2`（`@font-face` 仅在被引用渲染时触发下载）。选择后立即刷新页面生效，存 `localStorage`（`site-font`），页脚「字体」按钮可随时重开
- **动效**（渐进增强）：
  - 区块滚动入场 + 筹码二级错峰（IntersectionObserver）
  - 卡片指针光斑跟随、项目卡 3D 微倾斜、背景光斑指针视差
  - 主题切换涟漪过渡、阅读进度线
  - 全部规则挂在 `html.motion-js` 门控下：JS 不运行页面完全正常；尊重 `prefers-reduced-motion`
- **社交分享**：每页含 Open Graph meta（标题 / 描述 / logo 图），分享到 IM / 社交平台时有预览卡片
- **无障碍**：语义化 landmark、`aria-current`、键盘可操作（Tab + Enter/空格切换主题）、可见焦点环

## 本地预览

```bash
# 任意静态服务器均可，例如
python3 -m http.server 8000
```

## 许可

本站点代码基于 [MIT License](LICENSE) 开源。
