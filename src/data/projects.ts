// projects.ts - 重点项目(projects 页)与关注项目(following 页)卡片数据

/** 卡片强调色:对应 _cards.scss 的 .h-<hue> 类(Catppuccin 色相名) */
export type Hue =
  | 'rosewater'
  | 'flamingo'
  | 'pink'
  | 'mauve'
  | 'red'
  | 'maroon'
  | 'peach'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'sky'
  | 'sapphire'
  | 'lavender';

export interface Project {
  href: string;
  /** 图标:文本字母(如 "M")或行内 SVG HTML(f-catppuccin 的猫脸) */
  icon: string;
  /** 是否为 SVG 图标(true 时 icon 原样渲染为 HTML) */
  iconSvg?: boolean;
  title: string;
  sub: string;
  desc: string;
  tags: string[];
  /** 卡片强调色;省略时用默认蓝(或 cls 指定的特殊卡色相) */
  hue?: Hue;
  /** 附加卡片类:f-catppuccin 触发紫色强调 */
  cls?: string;
}

export const featuredProjects: Project[] = [
  {
    href: 'https://github.com/FLT18355/terminal',
    icon: '&gt;_',
    title: 'Terminal',
    sub: 'FLT18355/terminal',
    desc: 'Terminal & desktop configs, v2.0: alacritty, fish, fastfetch and more, all themed Catppuccin.',
    tags: ['alacritty', 'fish', 'catppuccin'],
    hue: 'teal',
  },
  {
    href: 'https://github.com/FLT18355/lxm',
    icon: 'M',
    title: 'LX Music',
    sub: 'FLT18355/lxm',
    desc: 'Local terminal music player driven by mpv, with a Bilibili video/audio downloader. Built on OpenTUI.',
    tags: ['mpv', 'bilibili', 'openTUI'],
    hue: 'peach',
  },
  {
    href: 'https://github.com/FLT18355/dotfiles',
    icon: 'D',
    title: 'Dotfiles',
    sub: 'FLT18355/dotfiles',
    desc: 'Configured dev environment with Catppuccin theming, deployed with GNU Stow.',
    tags: ['shell', 'stow', 'catppuccin'],
    hue: 'lavender',
  },
  {
    href: 'https://github.com/FLT18355/dsh-pet-inAndroid',
    icon: 'P',
    title: 'dsh-pet',
    sub: 'FLT18355/dsh-pet-inAndroid',
    desc: 'dsh-pet desktop pet, native Android port. Kotlin + Compose MD3 with Catppuccin Mocha theming.',
    tags: ['android', 'kotlin', 'catppuccin'],
    hue: 'sky',
  },
];

/** 其他站点卡(projects 页 Other Websites 区):本站之外、自己维护的独立站点 */
export interface SiteLink {
  href: string;
  /** 图标:行内 SVG HTML(站外站点用图形图标,与 GitHub 项目卡的字母图标区分) */
  icon: string;
  title: string;
  /** 域名,作为卡片的次级标识 */
  sub: string;
  desc: string;
  tags: string[];
  hue?: Hue;
}

export const otherSites: SiteLink[] = [
  {
    href: 'https://flt18355.github.io/Lumen/',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.4"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6"/></svg>',
    title: 'Lumen',
    sub: 'flt18355.github.io/Lumen',
    desc: 'A minimalist SVG renderer. Import, transform, optimize and export SVG right in the browser, with Catppuccin variables resolved on export.',
    tags: ['svg', 'renderer', 'catppuccin'],
    hue: 'peach',
  },
  {
    href: 'https://flt18355.github.io/Lumen/music.html',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5.6l10-2v12.4"/><circle cx="6.4" cy="18" r="2.6"/><circle cx="16.4" cy="16" r="2.6"/></svg>',
    title: 'Lumen Player',
    sub: 'flt18355.github.io/Lumen/music',
    desc: 'A music player. Local playlists with LRC lyrics, a 5-band equalizer, playback speed, sleep timer and a fullscreen visualizer, all running in the browser.',
    tags: ['music', 'player', 'lrc'],
    hue: 'mauve',
  },
];

export const followingProjects: Project[] = [
  {
    href: 'https://github.com/herdrdev/herdr',
    icon: 'H',
    title: 'herdr',
    sub: 'herdrdev/herdr',
    desc: 'The runtime your coding agents live on. A Rust terminal multiplexer and workspace manager for AI coding agents.',
    tags: ['rust', 'tui', 'agents'],
    hue: 'green',
  },
  {
    href: 'https://github.com/can1357/oh-my-pi',
    icon: '&pi;',
    title: 'oh-my-pi',
    sub: 'can1357/oh-my-pi',
    desc: 'A coding agent with the IDE wired in. Multi-provider terminal assistant built on Bun and TypeScript.',
    tags: ['typescript', 'tui', 'coding-agent'],
    hue: 'pink',
  },
  {
    href: 'https://github.com/catppuccin/catppuccin',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.6 9.4 4.8 3.2l6 2.6"/><path d="M17.4 9.4l1.8-6.2-6 2.6"/><path d="M12 3.4c-4.6 0-7.8 3-7.8 7 0 4.4 3.3 7.2 7.8 7.2s7.8-2.8 7.8-7.2c0-4-3.2-7-7.8-7Z"/><circle cx="9.3" cy="11.2" r="1.1"/><circle cx="14.7" cy="11.2" r="1.1"/><path d="M12 13.4v2.2"/></svg>',
    iconSvg: true,
    title: 'Catppuccin',
    sub: 'catppuccin/catppuccin',
    desc: 'Soothing pastel theme for the high-spirited. 4 flavors, 26 colors each, ported everywhere.',
    tags: ['palette', 'theme', 'pastel'],
    cls: 'f-catppuccin',
  },
  {
    href: 'https://github.com/neovim/neovim',
    icon: 'N',
    title: 'Neovim',
    sub: 'neovim/neovim',
    desc: 'Vim-fork focused on extensibility and usability.',
    tags: ['editor', 'vim', 'lua'],
    hue: 'yellow',
  },
];
