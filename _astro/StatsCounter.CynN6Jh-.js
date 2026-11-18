import{t as e}from"./react.CHeCnK-8.js";import{t}from"./jsx-runtime.DUNKksn9.js";import{n,r,t as i}from"./dist.BRLUqVYg.js";var a=e(),o=Object.assign({"../../content/music.toml":r,"../../content/projects.toml":`# projects.toml - 项目卡 / 站点卡 / 关注列表 / 下载卡
#
# 加一个项目 = 复制一段 [[featured]] 改字段;删掉一段 = 页面上少一张卡。
# 字段:
#   href   目标地址            title 标题          sub  次级标识(仓库名 / 域名)
#   desc   一句话说明          tags  标签数组       hue  强调色(Catppuccin 色相名)
#   icon   卡片左上角的图标,三选一:
#            · 省略        -> 用标题首字母
#            · 文本        -> 原样显示(如 "&gt;_")
#            · "svg:名字"  -> 用 /images/svg/icons.toml 里登记的行内 SVG
#   accent = "catppuccin" 时这张卡用紫色强调(only Catppuccin 那张用)

[github]
login = "FLT18355"

[[featured]]
href = "https://github.com/FLT18355/terminal"
icon = "&gt;_"
title = "Terminal"
sub = "FLT18355/terminal"
desc = "Terminal & desktop configs, v2.0: alacritty, fish, fastfetch and more, all themed Catppuccin."
tags = ["alacritty", "fish", "catppuccin"]
hue = "teal"

[[featured]]
href = "https://github.com/FLT18355/lxm"
icon = "M"
title = "LX Music"
sub = "FLT18355/lxm"
desc = "Local terminal music player driven by mpv, with a Bilibili video/audio downloader. Built on OpenTUI."
tags = ["mpv", "bilibili", "openTUI"]
hue = "peach"

[[featured]]
href = "https://github.com/FLT18355/dotfiles"
icon = "D"
title = "Dotfiles"
sub = "FLT18355/dotfiles"
desc = "Configured dev environment with Catppuccin theming, deployed with GNU Stow."
tags = ["shell", "stow", "catppuccin"]
hue = "lavender"

[[featured]]
href = "https://github.com/FLT18355/dsh-pet-inAndroid"
icon = "P"
title = "dsh-pet"
sub = "FLT18355/dsh-pet-inAndroid"
desc = "dsh-pet desktop pet, native Android port. Kotlin + Compose MD3 with Catppuccin Mocha theming."
tags = ["android", "kotlin", "catppuccin"]
hue = "sky"

[[featured]]
href = "https://github.com/FLT18355/gitx"
icon = "svg:git"
title = "gitx"
sub = "FLT18355/gitx"
desc = "A GitHub accelerator and sync CLI for Chinese users. Clone, download, push, pull, branch, stash, tag and commit through fast mirrors, all in one command."
tags = ["python", "cli", "github"]
hue = "green"

# ---------------- 本站之外、自己维护的站点 ----------------
[[sites]]
href = "https://flt18355.github.io/Lumen/"
icon = "svg:sun"
title = "Lumen"
sub = "flt18355.github.io/Lumen"
desc = "A minimalist SVG renderer. Import, transform, optimize and export SVG right in the browser, with Catppuccin variables resolved on export."
tags = ["svg", "renderer", "catppuccin"]
hue = "peach"

[[sites]]
href = "https://flt18355.github.io/Lumen/music.html"
icon = "svg:note"
title = "Lumen Player"
sub = "flt18355.github.io/Lumen/music"
desc = "A music player. Local playlists with LRC lyrics, a 5-band equalizer, playback speed, sleep timer and a fullscreen visualizer, all running in the browser."
tags = ["music", "player", "lrc"]
hue = "mauve"

# ---------------- 关注列表 ----------------
[[following]]
href = "https://github.com/herdrdev/herdr"
icon = "H"
title = "herdr"
sub = "herdrdev/herdr"
desc = "The runtime your coding agents live on. A Rust terminal multiplexer and workspace manager for AI coding agents."
tags = ["rust", "tui", "agents"]
hue = "green"

[[following]]
href = "https://github.com/can1357/oh-my-pi"
icon = "&pi;"
title = "oh-my-pi"
sub = "can1357/oh-my-pi"
desc = "A coding agent with the IDE wired in. Multi-provider terminal assistant built on Bun and TypeScript."
tags = ["typescript", "tui", "coding-agent"]
hue = "pink"

[[following]]
href = "https://github.com/catppuccin/catppuccin"
icon = "svg:cat"
title = "Catppuccin"
sub = "catppuccin/catppuccin"
desc = "Soothing pastel theme for the high-spirited. 4 flavors, 26 colors each, ported everywhere."
tags = ["palette", "theme", "pastel"]
accent = "catppuccin"

[[following]]
href = "https://github.com/neovim/neovim"
icon = "N"
title = "Neovim"
sub = "neovim/neovim"
desc = "Vim-fork focused on extensibility and usability."
tags = ["editor", "vim", "lua"]
hue = "yellow"

# ---------------- Download 卡 ----------------
[download]
title = "app-release.apk"
sub = "dsh-pet-inAndroid · v1.0.1"
href = "https://v4.gh-proxy.org/https://github.com/FLT18355/dsh-pet-inAndroid/releases/download/1.0.1/app-release.apk"`,"../../content/site.toml":`# site.toml - 站点身份、首页文案、导航、统计、联系方式
#
# 这些是日常最常改的东西;改完跑 \`bash scripts/deploy.sh\` 即可上线。
# 规则:
#   · 引号里的文字就是页面上显示的文字,支持 **粗体** 与 HTML 实体;
#   · hue 只能取 Catppuccin 色相名:
#     rosewater flamingo pink mauve red maroon peach yellow green teal sky sapphire lavender;
#   · 删掉某个 [[contact]] 条目 = 页面上少一条联系方式;stat 同理。

[site]
name = "FLT18355"
handle = "@FLT18355"
tagline = "Python. Arch. Catppuccin."
url = "https://flt18355.github.io/"
og_image = "https://flt18355.github.io/logo.svg"
description = "FLT18355 的个人主页。Catppuccin 爱好者,Python、Arch、终端与 TUI 工具。"
theme_color_mocha = "#1c1b26"
theme_color_latte = "#eff1f5"

[profile]
avatar = "/images/avatar.webp"
# 首页 About Me 的导语
about = "A **Catppuccin** enjoyer. Python user tinkering with dotfiles and TUI tools on Arch Linux."
# 四种风味的展示顺序
flavors = ["Mocha", "Latte", "Frappé", "Macchiato"]
# 身份卡底部的技术规格行
built_with = ["Astro", "Vue", "SCSS"]

[[stats]]
value = 5
label = "Featured Projects"

[[stats]]
value = 104
label = "Palette Swatches"

[[stats]]
value = 3
label = "Music Tracks"

[[stats]]
value = 7
label = "Pages"

# icon 指向 /images/svg/ 下的同名文件;有 _l 后缀的是浅色主题版本。
# 没有 icon 的条目只渲染文字筹码。
[[tech]]
name = "Python"
hue = "blue"
icon = "python"

[[tech]]
name = "TypeScript"
hue = "teal"
icon = "typescript"

[[tech]]
name = "Node.js"
hue = "green"

[[tech]]
name = "Shell"
hue = "pink"

[[tech]]
name = "HTML"
hue = "peach"

[[tech]]
name = "Lua"
hue = "mauve"

[[interest]]
name = "Terminal &amp; dotfiles"

[[interest]]
name = "Catppuccin theming"

[[interest]]
name = "Music"

[[interest]]
name = "Open source"

[[interest]]
name = "TUI tools"

[[interest]]
name = "Vibe coding"

# key 必须与页面文件名一致:home projects palette following search reader
[[nav]]
key = "home"
href = "/index.html"
label = "Home"

[[nav]]
key = "projects"
href = "/projects.html"
label = "Projects"

[[nav]]
key = "palette"
href = "/catppuccin.html"
label = "Palette"

[[nav]]
key = "following"
href = "/following.html"
label = "Following"

[[nav]]
key = "search"
href = "/search.html"
label = "Search"

[[nav]]
key = "reader"
href = "/reader.html"
label = "Reader"

# icon 可选:github / qq / wechat / bilibili(图标在 ContactIcon.astro 里)
[[contact]]
label = "GitHub"
value = "FLT18355"
href = "https://github.com/FLT18355"
hue = "blue"
icon = "github"

[[contact]]
label = "QQ"
value = "1583951454"
href = "https://wpa.qq.com/msgrd?v=3&uin=1583951454&site=qq&menu=yes"
hue = "teal"
icon = "qq"

[[contact]]
label = "微信"
value = "cnFLT18355"
href = "https://weixin.qq.com"
hue = "green"
icon = "wechat"

[[contact]]
label = "Bilibili 大号"
value = "FLT18355"
href = "https://space.bilibili.com/517296410"
hue = "pink"
icon = "bilibili"

[[contact]]
label = "Bilibili 小号"
value = "FLT18356"
href = "https://space.bilibili.com/3707030153988562"
hue = "mauve"
icon = "bilibili"`,"../../content/weather.toml":n});function s(e){let t=Object.keys(o).find(t=>t.endsWith(`/${e}.toml`));if(!t)throw Error(`content/${e}.toml 不存在`);try{return i(o[t])}catch(t){throw Error(`content/${e}.toml 解析失败:${t.message}`)}}function c(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function l(e,t,n,r=``){let i=e[t];if(i===void 0)return r;if(typeof i!=`string`)throw Error(`${n}.${t} 应为字符串`);return i}function u(e,t,n,r){let i=e[t];if(i===void 0)return r;if(typeof i!=`number`||!Number.isFinite(i))throw Error(`${n}.${t} 应为数字`);return i}function d(e,t,n){let r=e[t];if(r===void 0)return[];if(!Array.isArray(r)||r.some(e=>typeof e!=`string`))throw Error(`${n}.${t} 应为字符串数组`);return r}function f(e,t){let n=e[t];if(!n||typeof n!=`object`||Array.isArray(n))throw Error(`${t} 段缺失`);return n}function p(e,t){let n=e[t];if(n===void 0)return[];if(!Array.isArray(n))throw Error(`${t} 应为 [[${t}]] 表数组`);return n}var m=[`home`,`projects`,`palette`,`following`,`search`,`reader`],h=[`rosewater`,`flamingo`,`pink`,`mauve`,`red`,`maroon`,`peach`,`yellow`,`green`,`teal`,`sky`,`sapphire`,`lavender`,`blue`],g={git:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6.5" cy="6" r="2.4"/><circle cx="6.5" cy="18" r="2.4"/><circle cx="17.5" cy="9" r="2.4"/><path d="M6.5 8.4v7.2M17.5 11.4c0 3.1-2.6 4.2-5.2 4.6"/></svg>`,sun:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.4"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6"/></svg>`,note:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5.6l10-2v12.4"/><circle cx="6.4" cy="18" r="2.6"/><circle cx="16.4" cy="16" r="2.6"/></svg>`,cat:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.6 9.4 4.8 3.2l6 2.6"/><path d="M17.4 9.4l1.8-6.2-6 2.6"/><path d="M12 3.4c-4.6 0-7.8 3-7.8 7 0 4.4 3.3 7.2 7.8 7.2s7.8-2.8 7.8-7.2c0-4-3.2-7-7.8-7Z"/><circle cx="9.3" cy="11.2" r="1.1"/><circle cx="14.7" cy="11.2" r="1.1"/><path d="M12 13.4v2.2"/></svg>`},_={github:`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.69 1.25 3.34.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>`,qq:`<img src="/images/QQ-cm.svg" alt="" />`,wechat:`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.406-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/></svg>`,bilibili:`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.736 0 1.333.598 1.333 1.333s-.597 1.333-1.333 1.333-1.333-.597-1.333-1.333S7.264 11.107 8 11.107zm8 0c.736 0 1.333.598 1.333 1.333s-.597 1.333-1.333 1.333-1.333-.597-1.333-1.333.597-1.333 1.333-1.333zm-2.133 3.306c.56 0 1.013.453 1.013 1.013 0 .374-.268.72-.636.854a6.04 6.04 0 0 1-4.494.014 1.013 1.013 0 1 1 .674-1.899 4.02 4.02 0 0 0 2.986-.01 1.013 1.013 0 0 1 .457-.972z"/></svg>`},v=s(`site`),y=v.site;if(!y)throw Error(`site.toml 缺少 [site] 段`);var b=f(v,`profile`);l(y,`name`,`site`,`FLT18355`),l(y,`handle`,`site`,`@FLT18355`),l(y,`tagline`,`site`),l(y,`url`,`site`),l(y,`og_image`,`site`),l(y,`description`,`site`),l(y,`theme_color_mocha`,`site`,`#1c1b26`),l(y,`theme_color_latte`,`site`,`#eff1f5`),l(b,`avatar`,`profile`,`/images/avatar.webp`),l(b,`about`,`profile`).replace(/\*\*(.+?)\*\*/g,`<strong>$1</strong>`),d(b,`flavors`,`profile`),d(b,`built_with`,`profile`);function x(e,t,n,r=`teal`){let i=l(e,t,n,r);if(!h.includes(i))throw Error(`${n}.${t} = "${i}" 不是合法色相,可选:${h.join(` / `)}`);return i}p(v,`tech`).map((e,t)=>{let n=`tech[${t}]`,r=l(e,`icon`,n);return{name:l(e,`name`,n),hue:x(e,`hue`,n),icon:r||void 0}}),p(v,`interest`).map((e,t)=>({name:l(e,`name`,`interest[${t}]`)}));var S=p(v,`stats`).map((e,t)=>({value:u(e,`value`,`stats[${t}]`,0),label:l(e,`label`,`stats[${t}]`)}));p(v,`nav`).map((e,t)=>{let n=`nav[${t}]`,r=l(e,`key`,n);if(!m.includes(r))throw Error(`${n}.key = "${r}" 不是页面键,可选:${m.join(` / `)}`);return{key:r,href:l(e,`href`,n),label:l(e,`label`,n)}}),p(v,`contact`).map((e,t)=>{let n=`contact[${t}]`,r=l(e,`icon`,n);return{label:l(e,`label`,n),value:l(e,`value`,n),href:l(e,`href`,n),hue:x(e,`hue`,n),icon:r,iconHtml:_[r]??`<span class="contact-initial">${c(l(e,`label`,n)).slice(0,1)}</span>`}});var C=s(`projects`);function w(e,t,n){let r=l(e,`icon`,t);if(!r)return{icon:c(n.slice(0,1)).toUpperCase()};if(r.startsWith(`svg:`)){let e=r.slice(4),n=g[e];if(!n)throw Error(`${t}.icon = "svg:${e}" 未登记,可选:${Object.keys(g).join(` / `)}`);return{icon:n,iconSvg:!0}}return{icon:r}}function T(e,t){let n=l(e,`title`,t),r=l(e,`accent`,t);return{href:l(e,`href`,t),...w(e,t,n),title:n,sub:l(e,`sub`,t),desc:l(e,`desc`,t),tags:d(e,`tags`,t),...r?{cls:`f-${r}`}:{hue:x(e,`hue`,t)}}}p(C,`featured`).map((e,t)=>T(e,`featured[${t}]`)),p(C,`following`).map((e,t)=>T(e,`following[${t}]`)),p(C,`sites`).map((e,t)=>{let n=`sites[${t}]`,r=l(e,`title`,n);return{href:l(e,`href`,n),...w(e,n,r),title:r,sub:l(e,`sub`,n),desc:l(e,`desc`,n),tags:d(e,`tags`,n),hue:x(e,`hue`,n)}});var E=f(C,`download`);l(E,`title`,`download`),l(E,`sub`,`download`),l(E,`href`,`download`),l(f(C,`github`),`login`,`github`,`FLT18355`);var D=t(),O=900,k=S.map(e=>e.value);function A(){let[e,t]=(0,a.useState)(k),n=(0,a.useRef)(!1);return(0,a.useEffect)(()=>{let e=document.getElementById(`statsBlock`);if(!e)return;let r=()=>{if(n.current||(n.current=!0,window.matchMedia(`(prefers-reduced-motion: reduce)`).matches||!(`IntersectionObserver`in window)))return;let e=performance.now(),r=e=>1-(1-e)**3,i=n=>{let a=Math.min(1,(n-e)/O);t(k.map(e=>Math.round(e*r(a)))),a<1?requestAnimationFrame(i):t(k)};requestAnimationFrame(i)},i=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(r(),i.unobserve(e.target))})},{threshold:.3});return i.observe(e),()=>i.disconnect()},[]),(0,D.jsx)(`div`,{className:`stats-grid`,id:`statsBlock`,children:S.map((t,n)=>(0,D.jsxs)(`div`,{className:`stat-card`,children:[(0,D.jsx)(`span`,{className:`stat-value`,children:e[n]}),(0,D.jsx)(`span`,{className:`stat-label`,children:t.label})]},t.label))})}export{A as default};