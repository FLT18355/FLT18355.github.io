// site.ts - 站点元信息与导航配置

export type PageKey = 'home' | 'projects' | 'palette' | 'following' | 'search';

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

export const NAV: { key: PageKey; href: string; label: string }[] = [
  { key: 'home', href: '/index.html', label: 'Home' },
  { key: 'projects', href: '/projects.html', label: 'Projects' },
  { key: 'palette', href: '/catppuccin.html', label: 'Palette' },
  { key: 'following', href: '/following.html', label: 'Following' },
  { key: 'search', href: '/search.html', label: 'Search' },
];
