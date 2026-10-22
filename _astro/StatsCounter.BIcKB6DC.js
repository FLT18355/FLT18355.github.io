import{T as e,U as t,a as n,b as r,c as i,m as a,t as o,v as s,x as c}from"./runtime-core.esm-bundler.CDfX9t4O.js";import{t as l}from"./_plugin-vue_export-helper.BDNMzG2s.js";import{n as u,r as d,t as f}from"./dist.BRLUqVYg.js";var p=Object.assign({"../../content/music.toml":d,"../../content/projects.toml":`# projects.toml - 项目卡 / 站点卡 / 关注列表 / 下载卡
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
theme_color_latte = "#f1ece6"

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
icon = "bilibili"`,"../../content/weather.toml":u});function m(e){let t=Object.keys(p).find(t=>t.endsWith(`/${e}.toml`));if(!t)throw Error(`content/${e}.toml 不存在`);try{return f(p[t])}catch(t){throw Error(`content/${e}.toml 解析失败:${t.message}`)}}function h(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function g(e,t,n,r=``){let i=e[t];if(i===void 0)return r;if(typeof i!=`string`)throw Error(`${n}.${t} 应为字符串`);return i}function _(e,t,n,r){let i=e[t];if(i===void 0)return r;if(typeof i!=`number`||!Number.isFinite(i))throw Error(`${n}.${t} 应为数字`);return i}function v(e,t,n){let r=e[t];if(r===void 0)return[];if(!Array.isArray(r)||r.some(e=>typeof e!=`string`))throw Error(`${n}.${t} 应为字符串数组`);return r}function y(e,t){let n=e[t];if(!n||typeof n!=`object`||Array.isArray(n))throw Error(`${t} 段缺失`);return n}function b(e,t){let n=e[t];if(n===void 0)return[];if(!Array.isArray(n))throw Error(`${t} 应为 [[${t}]] 表数组`);return n}var x=[`home`,`projects`,`palette`,`following`,`search`,`reader`],S=[`rosewater`,`flamingo`,`pink`,`mauve`,`red`,`maroon`,`peach`,`yellow`,`green`,`teal`,`sky`,`sapphire`,`lavender`,`blue`],C={git:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6.5" cy="6" r="2.4"/><circle cx="6.5" cy="18" r="2.4"/><circle cx="17.5" cy="9" r="2.4"/><path d="M6.5 8.4v7.2M17.5 11.4c0 3.1-2.6 4.2-5.2 4.6"/></svg>`,sun:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.4"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6"/></svg>`,note:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5.6l10-2v12.4"/><circle cx="6.4" cy="18" r="2.6"/><circle cx="16.4" cy="16" r="2.6"/></svg>`,cat:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.6 9.4 4.8 3.2l6 2.6"/><path d="M17.4 9.4l1.8-6.2-6 2.6"/><path d="M12 3.4c-4.6 0-7.8 3-7.8 7 0 4.4 3.3 7.2 7.8 7.2s7.8-2.8 7.8-7.2c0-4-3.2-7-7.8-7Z"/><circle cx="9.3" cy="11.2" r="1.1"/><circle cx="14.7" cy="11.2" r="1.1"/><path d="M12 13.4v2.2"/></svg>`},w={github:`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.69 1.25 3.34.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>`,qq:`<img src="/images/QQ-cm.svg" alt="" />`,wechat:`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.406-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/></svg>`,bilibili:`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.736 0 1.333.598 1.333 1.333s-.597 1.333-1.333 1.333-1.333-.597-1.333-1.333S7.264 11.107 8 11.107zm8 0c.736 0 1.333.598 1.333 1.333s-.597 1.333-1.333 1.333-1.333-.597-1.333-1.333.597-1.333 1.333-1.333zm-2.133 3.306c.56 0 1.013.453 1.013 1.013 0 .374-.268.72-.636.854a6.04 6.04 0 0 1-4.494.014 1.013 1.013 0 1 1 .674-1.899 4.02 4.02 0 0 0 2.986-.01 1.013 1.013 0 0 1 .457-.972z"/></svg>`},T=m(`site`),E=T.site;if(!E)throw Error(`site.toml 缺少 [site] 段`);var D=y(T,`profile`);g(E,`name`,`site`,`FLT18355`),g(E,`handle`,`site`,`@FLT18355`),g(E,`tagline`,`site`),g(E,`url`,`site`),g(E,`og_image`,`site`),g(E,`description`,`site`),g(E,`theme_color_mocha`,`site`,`#1c1b26`),g(E,`theme_color_latte`,`site`,`#f1ece6`),g(D,`avatar`,`profile`,`/images/avatar.webp`),g(D,`about`,`profile`).replace(/\*\*(.+?)\*\*/g,`<strong>$1</strong>`),v(D,`flavors`,`profile`),v(D,`built_with`,`profile`);function O(e,t,n,r=`teal`){let i=g(e,t,n,r);if(!S.includes(i))throw Error(`${n}.${t} = "${i}" 不是合法色相,可选:${S.join(` / `)}`);return i}b(T,`tech`).map((e,t)=>{let n=`tech[${t}]`,r=g(e,`icon`,n);return{name:g(e,`name`,n),hue:O(e,`hue`,n),icon:r||void 0}}),b(T,`interest`).map((e,t)=>({name:g(e,`name`,`interest[${t}]`)}));var k=b(T,`stats`).map((e,t)=>({value:_(e,`value`,`stats[${t}]`,0),label:g(e,`label`,`stats[${t}]`)}));b(T,`nav`).map((e,t)=>{let n=`nav[${t}]`,r=g(e,`key`,n);if(!x.includes(r))throw Error(`${n}.key = "${r}" 不是页面键,可选:${x.join(` / `)}`);return{key:r,href:g(e,`href`,n),label:g(e,`label`,n)}}),b(T,`contact`).map((e,t)=>{let n=`contact[${t}]`,r=g(e,`icon`,n);return{label:g(e,`label`,n),value:g(e,`value`,n),href:g(e,`href`,n),hue:O(e,`hue`,n),icon:r,iconHtml:w[r]??`<span class="contact-initial">${h(g(e,`label`,n)).slice(0,1)}</span>`}});var A=m(`projects`);function j(e,t,n){let r=g(e,`icon`,t);if(!r)return{icon:h(n.slice(0,1)).toUpperCase()};if(r.startsWith(`svg:`)){let e=r.slice(4),n=C[e];if(!n)throw Error(`${t}.icon = "svg:${e}" 未登记,可选:${Object.keys(C).join(` / `)}`);return{icon:n,iconSvg:!0}}return{icon:r}}function M(e,t){let n=g(e,`title`,t),r=g(e,`accent`,t);return{href:g(e,`href`,t),...j(e,t,n),title:n,sub:g(e,`sub`,t),desc:g(e,`desc`,t),tags:v(e,`tags`,t),...r?{cls:`f-${r}`}:{hue:O(e,`hue`,t)}}}b(A,`featured`).map((e,t)=>M(e,`featured[${t}]`)),b(A,`following`).map((e,t)=>M(e,`following[${t}]`)),b(A,`sites`).map((e,t)=>{let n=`sites[${t}]`,r=g(e,`title`,n);return{href:g(e,`href`,n),...j(e,n,r),title:r,sub:g(e,`sub`,n),desc:g(e,`desc`,n),tags:v(e,`tags`,n),hue:O(e,`hue`,n)}});var N=y(A,`download`);g(N,`title`,`download`),g(N,`sub`,`download`),g(N,`href`,`download`),g(y(A,`github`),`login`,`github`,`FLT18355`);var P=900,F=a({__name:`StatsCounter`,setup(t,{expose:n}){n();let r=e(k.map(e=>e.value)),i=e(!1);function a(){if(i.value||(i.value=!0,window.matchMedia(`(prefers-reduced-motion: reduce)`).matches||!(`IntersectionObserver`in window)))return;let e=k.map(e=>e.value),t=performance.now(),n=e=>1-(1-e)**3,a=i=>{let o=Math.min(1,(i-t)/P);r.value=e.map(e=>Math.round(e*n(o))),o<1?requestAnimationFrame(a):r.value=e};requestAnimationFrame(a)}s(()=>{let e=document.getElementById(`statsBlock`);if(!e)return;let t=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(a(),t.unobserve(e.target))})},{threshold:.3});t.observe(e)});let o={counts:r,started:i,DURATION:P,animate:a,get STATS(){return k}};return Object.defineProperty(o,"__isScriptSetup",{enumerable:!1,value:!0}),o}}),I={class:`stats-grid`,id:`statsBlock`},L={class:`stat-value`},R={class:`stat-label`};function z(e,a,s,l,u,d){return r(),i(`div`,I,[(r(!0),i(o,null,c(l.STATS,(e,a)=>(r(),i(`div`,{key:e.label,class:`stat-card`},[n(`span`,L,t(l.counts[a]),1),n(`span`,R,t(e.label),1)]))),128))])}var B=l(F,[[`render`,z]]);export{B as default};