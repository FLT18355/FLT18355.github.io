// projects.ts - 重点项目(projects 页)与关注项目(following 页)卡片数据

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
  },
  {
    href: 'https://github.com/FLT18355/lxm',
    icon: 'M',
    title: 'LX Music',
    sub: 'FLT18355/lxm',
    desc: 'Local terminal music player driven by mpv, with a Bilibili video/audio downloader. Built on OpenTUI.',
    tags: ['mpv', 'bilibili', 'openTUI'],
  },
  {
    href: 'https://github.com/FLT18355/dotfiles',
    icon: 'D',
    title: 'Dotfiles',
    sub: 'FLT18355/dotfiles',
    desc: 'Configured dev environment with Catppuccin theming, deployed with GNU Stow.',
    tags: ['shell', 'stow', 'catppuccin'],
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
  },
  {
    href: 'https://github.com/can1357/oh-my-pi',
    icon: '&pi;',
    title: 'oh-my-pi',
    sub: 'can1357/oh-my-pi',
    desc: 'A coding agent with the IDE wired in. Multi-provider terminal assistant built on Bun and TypeScript.',
    tags: ['typescript', 'tui', 'coding-agent'],
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
  },
];
