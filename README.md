# FLT18355.github.io

个人主页，基于 [Catppuccin](https://catppuccin.com/) 配色（Mocha / Latte 双主题），零依赖纯静态。

## 页面

| 页面 | 内容 |
|------|------|
| [`index.html`](index.html) | 主页:关于我、兴趣、技术栈 |
| [`projects.html`](projects.html) | 重点项目:terminal / lxm / dotfiles |
| [`following.html`](following.html) | 关注项目:herdr / oh-my-pi |

## 文件结构

```
├── index.html            主页
├── projects.html         重点项目
├── following.html        关注项目
├── logo.svg              站点 logo（头像）
└── assets/
    ├── style.css         设计令牌（双主题）+ 全部基础样式 + 主题拨钮
    ├── motion.css        增量动效层（html.motion-js 门控）
    ├── nav.css           顶部导航条 + 滑动指示条
    ├── app.js            主题拨钮（拖拽 / 点击 / 键盘切换）
    ├── app-motion.js     动效编排（滚动入场、光斑、倾斜、涟漪、进度线）
    └── nav.js            导航指示条定位
```

无构建、无框架、无外部 CDN 资源，直接部署到 GitHub Pages 即可。

## 设计与技术细节

- **主题**：Mocha（深，黑夜）/ Latte（浅，白天）两套 Catppuccin 风味，通过 `@property` 注册的自定义属性实现主题间颜色平滑过渡；系统偏好自动适配，选择持久化在 `localStorage`
- **主题拨钮**：demo/button.html 一比一还原（200×90 原布局 + wrapper 统一缩放适配导航条，仅配色换 Catppuccin 色板）。Latte 下蓝天白云 + 太阳呼吸光，云朵从右侧外飘入、穿出左侧外循环；Mocha 下星空闪烁 + 月亮浮现；滑钮可拖拽（场景随 `--p` 交叉淡化），松手 overshoot 回弹；场景动画与 demo 一致永转，不随 `prefers-reduced-motion` 关闭
- **卡片**：毛玻璃质感（`backdrop-filter: blur + saturate`），不支持的浏览器自动退化为半透明纯色
- **导航**：sticky 毛玻璃导航条，当前页指示条在页面间滑动切换
- **动效**（渐进增强）：
  - 区块滚动入场 + 筹码二级错峰（IntersectionObserver）
  - 卡片指针光斑跟随、项目卡 3D 微倾斜
  - 主题切换涟漪过渡、阅读进度线
  - 全部规则挂在 `html.motion-js` 门控下：JS 不运行页面完全正常；尊重 `prefers-reduced-motion`
- **无障碍**：语义化 landmark、`aria-current`、键盘可操作（Tab + Enter/空格切换主题）、可见焦点环

## 本地预览

```bash
# 任意静态服务器均可，例如
python3 -m http.server 8000
```

## 许可

本站点代码基于 [MIT License](LICENSE) 开源。
