# 源文件清单

所有可编辑源码都在 `src/` 与 `public/`,改完跑 `npm run build` 生成 `dist/`。**dist/ 是生成物,不要手改。**

## 根目录

| 路径 | 类型 | 说明 |
|---|---|---|
| `package.json` | 工程配置 | Astro 7 + Vue 3 + sass;`dev` / `build` / `preview` 脚本 |
| `astro.config.mjs` | 构建配置 | `site` 指向 GitHub Pages;`build.format: 'preserve'` 保持 `.html` 扩展名;Vue 集成 |
| `tsconfig.json` | TS 配置 | 继承 `astro/tsconfigs/strict`,排除 dist / legacy / node_modules |
| `subset-font.py` | 子集化脚本 | 按 `src/**/*.{astro,vue,ts}` 文本裁剪 `public/font-full.woff2` → `public/font.woff2`(需 fonttools/brotli) |
| `.gitignore` | 忽略清单 | dist / node_modules / .astro / .cache / bug / .omp |
| `.github/workflows/deploy.yml` | 部署工作流 | push 到 main 后自动构建并上传 dist/ 到 GitHub Pages(需在 Pages 设置选 GitHub Actions 源) |
| `scripts/deploy.sh` | 部署脚本 | 不用 Actions 时:构建 + 同步产物到仓库根,推根目录即可部署 |
| `README.md` | 站点说明 | 页面表 + 构建用法 + 设计机制 |
| `doc/` | 文档 | architecture(机制)/ build(构建验证)/ ai-maintainer-guide(硬约束)/ source-map(本清单) |
| `legacy/` | 旧版归档 | 迁移前的模板渲染 + 手写 JS/CSS 全量快照,仅供对照,不参与构建 |

## `public/`(静态资源,原样拷入 dist 根)

| 文件 | 说明 |
|---|---|
| `font.woff2` | Maple Mono 子集(约 56KB,按源码文本裁剪,按需下载;subset-font.py 覆盖) |
| `font-full.woff2` | Maple Mono 全量字体(7.1MB,子集化输入源,勿删) |
| `logo.svg` | 站点 logo / 头像 |
| `.nojekyll` | GitHub Pages 免 Jekyll 处理标记 |
| `images/QQ-cm.svg` | QQ 品牌图标(contact 区使用,fill 固定色) |
| `bug/` | 截图存档,不入站 |

## `src/`(唯一编辑入口)

### 页面 `src/pages/`

| 文件 | 内容 |
|---|---|
| `index.astro` | 主页:About / Interests / Tech Stack 三 block + Test 音乐播放器 |
| `projects.astro` | 重点项目:terminal / lxm / dotfiles 三卡(`data/projects.ts`) |
| `catppuccin.astro` | 色板页:渲染容器 + `PaletteGrid.vue` |
| `following.astro` | 关注项目:herdr / oh-my-pi / catppuccin / neovim 四卡 |
| `search.astro` | 搜索页(bare 模式,无左栏):`SearchPanel.vue` + `body-end` 插槽里的 `.search-bg` |
| `404.astro` | 独立错误页:不挂导航壳,自带内联主题/字体恢复 + 页内 scoped 样式 |

### 布局与组件

| 路径 | 职责 |
|---|---|
| `layouts/Base.astro` | 骨架:head 元信息(OG / twitter / JSON-LD)+ 主题/字体恢复内联脚本 + 导航 + 两栏壳 + `body-end` 插槽;打包 `scripts/motion.ts` 与 `scripts/nav.ts` |
| `components/Nav.astro` | 顶部导航(五条链接 + 滑动指示条 + 主题拨钮岛) |
| `components/ThemeToggle.vue` | 主题拨钮:拖拽/点击/键盘切换 + View Transition 圆形揭示 + theme-color 同步 |
| `components/Rail.astro` | 左栏:身份卡 + 联系方式 |
| `components/Contacts.astro` | 联系方式列表(GitHub / QQ / 微信 / B 站大号 / B 站小号,长 SVG path 原样保留) |
| `components/Footline.astro` | 页脚:版权 / Source on GitHub / 字体重开按钮 |
| `components/ProjectCard.astro` | 项目卡(projects / following 共用,消费 `data/projects.ts`) |
| `components/FontPicker.vue` | 首启字体选择:显隐判断、选项绑定、页脚重开 |
| `components/PaletteGrid.vue` | 色板:SSR 直出 104 色块 + 水合后点击复制 Hex |
| `components/SearchPanel.vue` | 搜索页:实时时钟 / Bing 表单 / 快捷链接 / 最近搜索历史 |
| `components/MusicPlayer.vue` | 首页 Test 播放器:3 曲目(gh-proxy 直链)/ 播放暂停 / 左右键切歌 / 进度跳转 / localStorage 保存上次播放 |

### 数据 `src/data/`

| 文件 | 说明 |
|---|---|
| `site.ts` | 站点元信息 + NAV 导航数组(改导航/标题/描述在这里) |
| `projects.ts` | 项目卡数据(改项目在这里) |
| `palette.ts` | Catppuccin 色板数据(4 风味 × 26 色,含中文说明文案) |
| `music.ts` | 音乐播放器曲目列表(3 首,gh-proxy 直链 + 标题/作者;仅首曲含封面) |

### 脚本 `src/scripts/`

| 文件 | 说明 |
|---|---|
| `motion.ts` | 动效编排:滚动入场、指针光斑、3D 微倾斜、进度线;挂 `html.motion-js` 门控 |
| `nav.ts` | 导航指示条定位(offsetLeft 系,滚动安全)+ 窄屏当前页滚入视野 |

### 样式 `src/styles/`

| 文件 | 说明 |
|---|---|
| `global.scss` | 汇总入口(`@use` 顺序即级联顺序) |
| `_tokens.scss` | 双主题令牌(SCSS map 驱动)+ `@property` 注册 + `@font-face` |
| `_reset.scss` | 重置 / body / `data-font` 字体门控规则 |
| `_layout.scss` | 两栏壳、左栏身份卡、联系方式、区块、页脚 + 入场关键帧 |
| `_cards.scss` | flavor 筹码 / 兴趣 / 技术标签 / 色板 / 项目卡 |
| `_toggle.scss` | 主题拨钮(太阳/云/月亮/星星/滑钮 + 拖动态) |
| `_search.scss` | search 页:背景光斑 / 时钟 / 表单 / 快捷链接 / 历史 chips |
| `_music.scss` | 首页音乐播放器:按钮 / 均衡条 / 进度条 |
| `_motion.scss` | 增量动效层(`html.motion-js` 门控) |
| `_nav.scss` | 顶部导航 + 滑动指示条 + 窄屏横向滚动 |
| `_font-picker.scss` | 首启字体选择界面 + 页脚按钮 |
| `_responsive.scss` | 减弱动效块 + 920px / 560px 断点 |

## 页面差异速查

- 页标题/描述/导航高亮:页面文件头部 `<Base title= description= current=>` props
- 某页内容:`src/pages/<name>.astro`
- 导航条目:`src/data/site.ts` 的 `NAV`
- 改任一 `components/` / `layouts/` 影响**全部页面**;改 `styles/` 影响全部页面样式
