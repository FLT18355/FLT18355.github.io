// content.ts - 站点内容的构建时数据源:读取仓库根目录 content/site.toml 与 content/projects.toml
//
// 日常改动全部落在 content/ 下的 TOML 文件里,这里只负责解析、补默认值,
// 并把结果整理成组件真正用的形状。TOML 写错(字段拼错 / 色相名不存在)会在
// `npm run build` 时直接报错并指出文件,不会静默渲染出一张错卡。
//
// 只给 .astro 用。浏览器侧组件(client:load 的 Vue 岛)走 src/data/runtime.ts:
// 那边只读 music.toml 与 weather.toml,不把整份站点内容打进前端 bundle。
import { parse } from 'smol-toml';

/** content/ 下的站点文件,原样读入(Vite 在构建时内联) */
const raw = import.meta.glob('../../content/*.toml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function read(name: string): Record<string, unknown> {
  const key = Object.keys(raw).find((k) => k.endsWith(`/${name}.toml`));
  if (!key) throw new Error(`content/${name}.toml 不存在`);
  try {
    return parse(raw[key]) as Record<string, unknown>;
  } catch (err) {
    throw new Error(`content/${name}.toml 解析失败:${(err as Error).message}`);
  }
}

/** 最小 HTML 转义:图标回退与标题首字母用,避免把标题里的尖括号当标签渲染 */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}

/** 取字符串字段;缺省时返回 fallback,并阻止 undefined 混进页面 */
function str(src: Record<string, unknown>, key: string, where: string, fallback = ''): string {
  const v = src[key];
  if (v === undefined) return fallback;
  if (typeof v !== 'string') throw new Error(`${where}.${key} 应为字符串`);
  return v;
}

function num(src: Record<string, unknown>, key: string, where: string, fallback: number): number {
  const v = src[key];
  if (v === undefined) return fallback;
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${where}.${key} 应为数字`);
  return v;
}

function strList(src: Record<string, unknown>, key: string, where: string): string[] {
  const v = src[key];
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
    throw new Error(`${where}.${key} 应为字符串数组`);
  }
  return v as string[];
}

function table<T>(src: Record<string, unknown>, key: string): T {
  const v = src[key];
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error(`${key} 段缺失`);
  return v as T;
}

function list<T>(src: Record<string, unknown>, key: string): T[] {
  const v = src[key];
  if (v === undefined) return [];
  if (!Array.isArray(v)) throw new Error(`${key} 应为 [[${key}]] 表数组`);
  return v as T[];
}

/* ---------- 色相、页面键与图标 ---------- */

/** 页面键(导航的 current 高亮用);新加页面时在这里补一个 */
export const PAGE_KEYS = ['home', 'projects', 'palette', 'following', 'search', 'reader'] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

/**
 * TOML 里可写的色相名。除 Catppuccin 的 13 个强调色外,`blue` 是 `primary` 的别名
 * (Catppuccin 的 Blue,在样式里由 --primary 承载),写哪个都行。
 */
export const HUES = [
  'rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon', 'peach',
  'yellow', 'green', 'teal', 'sky', 'sapphire', 'lavender', 'blue',
] as const;
export type Hue = (typeof HUES)[number];

/**
 * 卡片图标:TOML 里写 "svg:名字" 引用这里的一枚,或直接写文字(如 "M")。
 * 图标是装饰,统一 aria-hidden,可读名称由卡片标题承担。
 */
const ICONS: Record<string, string> = {
  git: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6.5" cy="6" r="2.4"/><circle cx="6.5" cy="18" r="2.4"/><circle cx="17.5" cy="9" r="2.4"/><path d="M6.5 8.4v7.2M17.5 11.4c0 3.1-2.6 4.2-5.2 4.6"/></svg>',
  sun: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.4"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6"/></svg>',
  note: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5.6l10-2v12.4"/><circle cx="6.4" cy="18" r="2.6"/><circle cx="16.4" cy="16" r="2.6"/></svg>',
  cat: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.6 9.4 4.8 3.2l6 2.6"/><path d="M17.4 9.4l1.8-6.2-6 2.6"/><path d="M12 3.4c-4.6 0-7.8 3-7.8 7 0 4.4 3.3 7.2 7.8 7.2s7.8-2.8 7.8-7.2c0-4-3.2-7-7.8-7Z"/><circle cx="9.3" cy="11.2" r="1.1"/><circle cx="14.7" cy="11.2" r="1.1"/><path d="M12 13.4v2.2"/></svg>',
};

/** 联系方式图标(品牌标记,颜色跟随所在条目) */
const CONTACT_ICONS: Record<string, string> = {
  github:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.69 1.25 3.34.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>',
  qq: '<img src="/images/QQ-cm.svg" alt="" />',
  wechat:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.406-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/></svg>',
  bilibili:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.736 0 1.333.598 1.333 1.333s-.597 1.333-1.333 1.333-1.333-.597-1.333-1.333S7.264 11.107 8 11.107zm8 0c.736 0 1.333.598 1.333 1.333s-.597 1.333-1.333 1.333-1.333-.597-1.333-1.333.597-1.333 1.333-1.333zm-2.133 3.306c.56 0 1.013.453 1.013 1.013 0 .374-.268.72-.636.854a6.04 6.04 0 0 1-4.494.014 1.013 1.013 0 1 1 .674-1.899 4.02 4.02 0 0 0 2.986-.01 1.013 1.013 0 0 1 .457-.972z"/></svg>',
};

/* ---------- site.toml ---------- */

const SITE_RAW = read('site');
const siteT = SITE_RAW.site as Record<string, unknown>;
if (!siteT) throw new Error('site.toml 缺少 [site] 段');
const profileT = table(SITE_RAW, 'profile');

export const SITE = {
  name: str(siteT, 'name', 'site', 'FLT18355'),
  handle: str(siteT, 'handle', 'site', '@FLT18355'),
  tagline: str(siteT, 'tagline', 'site'),
  url: str(siteT, 'url', 'site'),
  ogImage: str(siteT, 'og_image', 'site'),
  description: str(siteT, 'description', 'site'),
  themeColorMocha: str(siteT, 'theme_color_mocha', 'site', '#1c1b26'),
  themeColorLatte: str(siteT, 'theme_color_latte', 'site', '#f1ece6'),
};

export const PROFILE = {
  avatar: str(profileT, 'avatar', 'profile', '/images/avatar.webp'),
  /* **...** 是 TOML 里唯一支持的标记:转成 <strong>,其余内容按原样渲染(可写 HTML 实体) */
  about: str(profileT, 'about', 'profile').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
  flavors: strList(profileT, 'flavors', 'profile'),
  builtWith: strList(profileT, 'built_with', 'profile'),
};

export interface Tech {
  name: string;
  hue: Hue;
  /** /images/svg/<icon>.svg 与 <icon>_l.svg;省略则只渲染文字 */
  icon?: string;
}

export interface Interest {
  name: string;
}

export interface Contact {
  label: string;
  value: string;
  href: string;
  hue: Hue;
  /** 图标名;未知名字时卡片只显示标签首字母 */
  icon: string;
  iconHtml: string;
}

function hue(src: Record<string, unknown>, key: string, where: string, fallback: Hue = 'teal'): Hue {
  const v = str(src, key, where, fallback);
  if (!(HUES as readonly string[]).includes(v)) {
    throw new Error(`${where}.${key} = "${v}" 不是合法色相,可选:${HUES.join(' / ')}`);
  }
  return v as Hue;
}

export const TECH: Tech[] = list<Record<string, unknown>>(SITE_RAW, 'tech').map((t, i) => {
  const where = `tech[${i}]`;
  const icon = str(t, 'icon', where);
  return { name: str(t, 'name', where), hue: hue(t, 'hue', where), icon: icon || undefined };
});

export const INTERESTS: Interest[] = list<Record<string, unknown>>(SITE_RAW, 'interest').map((t, i) => ({
  name: str(t, 'name', `interest[${i}]`),
}));

export interface Stat {
  value: number;
  label: string;
}

export const STATS: Stat[] = list<Record<string, unknown>>(SITE_RAW, 'stats').map((s, i) => ({
  value: num(s, 'value', `stats[${i}]`, 0),
  label: str(s, 'label', `stats[${i}]`),
}));

export interface NavItem {
  key: PageKey;
  href: string;
  label: string;
}

export const NAV: NavItem[] = list<Record<string, unknown>>(SITE_RAW, 'nav').map((n, i) => {
  const where = `nav[${i}]`;
  const key = str(n, 'key', where);
  if (!(PAGE_KEYS as readonly string[]).includes(key)) {
    throw new Error(`${where}.key = "${key}" 不是页面键,可选:${PAGE_KEYS.join(' / ')}`);
  }
  return { key: key as PageKey, href: str(n, 'href', where), label: str(n, 'label', where) };
});

export const CONTACTS: Contact[] = list<Record<string, unknown>>(SITE_RAW, 'contact').map((c, i) => {
  const where = `contact[${i}]`;
  const icon = str(c, 'icon', where);
  return {
    label: str(c, 'label', where),
    value: str(c, 'value', where),
    href: str(c, 'href', where),
    hue: hue(c, 'hue', where),
    icon,
    iconHtml: CONTACT_ICONS[icon] ?? `<span class="contact-initial">${escapeHtml(str(c, 'label', where)).slice(0, 1)}</span>`,
  };
});

/* ---------- projects.toml ---------- */

const PROJ_RAW = read('projects');

export interface Project {
  href: string;
  /** 图标:文本,或 iconSvg 为 true 时的行内 SVG */
  icon: string;
  iconSvg?: boolean;
  title: string;
  sub: string;
  desc: string;
  tags: string[];
  hue?: Hue;
  /** 附加卡片类(f-catppuccin 触发紫色强调) */
  cls?: string;
}

export interface SiteLink {
  href: string;
  icon: string;
  title: string;
  sub: string;
  desc: string;
  tags: string[];
  hue?: Hue;
}

function icon(src: Record<string, unknown>, where: string, title: string): { icon: string; iconSvg?: boolean } {
  const v = str(src, 'icon', where);
  if (!v) return { icon: escapeHtml(title.slice(0, 1)).toUpperCase() };
  if (v.startsWith('svg:')) {
    const name = v.slice(4);
    const html = ICONS[name];
    if (!html) throw new Error(`${where}.icon = "svg:${name}" 未登记,可选:${Object.keys(ICONS).join(' / ')}`);
    return { icon: html, iconSvg: true };
  }
  return { icon: v };
}

function project(src: Record<string, unknown>, where: string): Project {
  const title = str(src, 'title', where);
  const accent = str(src, 'accent', where);
  const out: Project = {
    href: str(src, 'href', where),
    ...icon(src, where, title),
    title,
    sub: str(src, 'sub', where),
    desc: str(src, 'desc', where),
    tags: strList(src, 'tags', where),
    ...(accent ? { cls: `f-${accent}` } : { hue: hue(src, 'hue', where) }),
  };
  return out;
}

export const featuredProjects: Project[] = list<Record<string, unknown>>(PROJ_RAW, 'featured').map(
  (p, i) => project(p, `featured[${i}]`)
);

export const followingProjects: Project[] = list<Record<string, unknown>>(PROJ_RAW, 'following').map(
  (p, i) => project(p, `following[${i}]`)
);

export const otherSites: SiteLink[] = list<Record<string, unknown>>(PROJ_RAW, 'sites').map((s, i) => {
  const where = `sites[${i}]`;
  const title = str(s, 'title', where);
  return {
    href: str(s, 'href', where),
    ...icon(s, where, title),
    title,
    sub: str(s, 'sub', where),
    desc: str(s, 'desc', where),
    tags: strList(s, 'tags', where),
    hue: hue(s, 'hue', where),
  };
});

const downloadT = table<Record<string, unknown>>(PROJ_RAW, 'download');

export const DOWNLOAD = {
  title: str(downloadT, 'title', 'download'),
  sub: str(downloadT, 'sub', 'download'),
  href: str(downloadT, 'href', 'download'),
};

const githubT = table<Record<string, unknown>>(PROJ_RAW, 'github');
export const GITHUB_LOGIN = str(githubT, 'login', 'github', 'FLT18355');

