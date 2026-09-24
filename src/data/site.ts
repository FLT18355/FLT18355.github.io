// site.ts - 站点元信息与导航配置

export type PageKey = 'home' | 'projects' | 'palette' | 'following' | 'search' | 'reader';

export const SITE = {
  url: 'https://flt18355.github.io/',
  name: 'FLT18355',
  handle: '@FLT18355',
  tagline: 'Python. Arch. Catppuccin.',
  ogImage: 'https://flt18355.github.io/logo.svg',
  themeColorMocha: '#1e1e2e',
  themeColorLatte: '#eff1f5',
};

export interface PageMeta {
  title: string;
  description: string;
  current: PageKey;
  rail?: boolean;
}

export interface Stat {
  value: number;
  label: string;
}

/** 首页 By the Numbers 统计(真实数据,来自各数据源) */
export const STATS: Stat[] = [
  { value: 4, label: 'Featured Projects' },
  { value: 104, label: 'Palette Swatches' },
  { value: 3, label: 'Music Tracks' },
  { value: 7, label: 'Pages' },
];

export const NAV: { key: PageKey; href: string; label: string }[] = [
  { key: 'home', href: '/index.html', label: 'Home' },
  { key: 'projects', href: '/projects.html', label: 'Projects' },
  { key: 'palette', href: '/catppuccin.html', label: 'Palette' },
  { key: 'following', href: '/following.html', label: 'Following' },
  { key: 'search', href: '/search.html', label: 'Search' },
  { key: 'reader', href: '/reader.html', label: 'Reader' },
];
