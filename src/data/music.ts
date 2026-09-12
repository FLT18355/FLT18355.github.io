// music.ts - 音乐播放器曲目列表(GitHub Release 直链,经 gh-proxy 加速;浏览器端自动下载,不入仓库)
// Track 1 含内嵌封面(images/music-cover.jpg,自 APIC 提取);Track 2/3 无封面
export interface MusicTrack {
  title: string;
  artist: string;
  /** 封面图路径;缺省则显示音符占位图标(无封面曲目) */
  cover?: string;
  src: string;
}

export const TRACKS: MusicTrack[] = [
  {
    title: '反乌托邦',
    artist: '栖云 · 星尘 · 海伊',
    cover: '/images/music-cover.jpg',
    src: 'https://v4.gh-proxy.org/https://github.com/FLT18355/FLT18355.github.io/releases/download/music/1.mp3',
  },
  {
    title: 'Hai Yu Ni',
    artist: 'Luo Tianyi',
    src: 'https://v4.gh-proxy.org/https://github.com/FLT18355/FLT18355.github.io/releases/download/music/2.m4a',
  },
  {
    title: 'Humans are cats',
    artist: 'Luo Tianyi',
    src: 'https://v4.gh-proxy.org/https://github.com/FLT18355/FLT18355.github.io/releases/download/music/3.m4a',
  },
];