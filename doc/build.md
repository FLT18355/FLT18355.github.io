# 构建流程与验证

站点通过 `build.py` 从 `src/` 生成静态 HTML,字体子集化由独立 `subset-font.py` 处理。均纯 Python 标准库 + fonttools/brotli(仅字体步骤需要)。

## 1. 什么时候需要 build / 子集化

对 `src/` 下任何文件做了修改后:

- 改了 `template.html` / 任一 `partials/` → 影响三页,**必须**重新 build
- 改了 `pages.json`(title/description/current 标记) → 必须重新 build
- 改了 `pages/<name>.html`(某页内容) → 必须重新 build
- 改了 `404.html` 或任何页面**文案**(新增字符)→ 重新 `subset-font.py`,否则新字符会缺字

只改 `assets/`(CSS/JS)或 `logo.svg` 等静态资源 → **不需要** build,产物直接引用这些资源,刷新即可。

## 2. 构建

在仓库根目录:

```bash
python3 build.py          # 渲染三个页面
python3 subset-font.py    # 按页面文本子集化字体(文案含新字符时必跑)
```

`build.py` 预期输出:

```
  built  index.html
  built  projects.html
  built  following.html
done.
```

无输出错误 / 无 `missing partial/page:` 报错即为成功。若报错:说明 `src/partials/` 或 `src/pages/` 缺文件,或 `pages.json` 里的名字与文件名对不上。

## 3. 构建后验证(必做清单)

```bash
# 1) 无残留占位符(任何 {{ }} 都不应该出现在产物里)
grep -n '{{' index.html projects.html following.html   # 应无输出

# 2) 三页的 title / description / 导航高亮正确
grep -o '<title>[^<]*</title>' index.html projects.html following.html
grep -o 'aria-current="page"[^>]*>[A-Za-z]*' index.html projects.html following.html
```

手动抽查:

- 打开 index.html:导航高亮在 Home,右侧为 About/Interests/Tech
- projects.html:高亮在 Projects,三张项目卡
- following.html:高亮在 Following,两张卡
- 首次访问(清 localStorage)出现字体选择界面;选完自动刷新不再弹出;页脚「字体」按钮可重开
- 双主题切换:拨钮拖拽/点击/键盘,主题持久化
- 弱网/未选 Maple 时 Network 面板应**没有** font.woff2 请求;选 Maple 后才出现

## 4. 常见修改场景

| 目标 | 改哪里 | build? |
|---|---|---|
| 加一个联系方式 | `src/partials/contacts.html` | 是 |
| 改导航链接/标签 | `src/partials/nav.html` | 是 |
| 改某页正文 | `src/pages/<name>.html` | 是 |
| 加新页面 | 新增 `src/pages/x.html` + `pages.json` 加一项;若想加导航入口还要改 `nav.html` 与 `nav.css` | 是 |
| 改主题色/间距 | `assets/style.css` | 否 |
| 换站点图标 | `logo.svg` | 否 |
| 换字体文件 | 替换 `src/font-full.woff2` 后重跑 `subset-font.py` | 字体 |

## 5. 产物覆盖安全

`build.py` 每次全量重写三个产物;`subset-font.py` 覆盖 `font.woff2`,保证产物与 `src/` 严格一致。不要手动编辑产物,否则下次构建会被覆盖丢失。

## 6. 部署

产物就是 GitHub Pages 的静态文件,推送仓库即可,无需在 Pages 侧配置构建(GitHub Pages 直接用仓库文件)。