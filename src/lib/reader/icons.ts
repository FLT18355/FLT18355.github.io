// icons.ts - 阅读器用到的描边图标内联 SVG 片段。
// 统一 24x24 viewBox、1.7 描边、currentColor、round cap/join,
// 与站点其它内联 SVG(联系方式、快捷链接)同一套画法,不引第三方图标库。

export type IconName =
  | 'archive'
  | 'upload'
  | 'font'
  | 'menu'
  | 'close'
  | 'search'
  | 'undo'
  | 'folder'
  | 'file'
  | 'chevron';

export const ICONS: Record<IconName, string> = {
  // 压缩包:带折角的文档 + 内部分隔线
  archive:
    '<path d="M4 7h16v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7Z"/><path d="M4 7l2.2-3h11.6L20 7"/><path d="M9 11h6M9 15h6"/>',
  // 上传:托盘 + 向上箭头
  upload:
    '<path d="M12 15V4"/><path d="M8 8l4-4 4 4"/><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>',
  // 字体:大写 A
  font:
    '<path d="M5 18l4.5-12h3L17 18"/><path d="M7.2 14h6.6"/>',
  // 目录(汉堡)
  menu:
    '<path d="M4 7h16M4 12h16M4 17h16"/>',
  // 关闭
  close:
    '<path d="M6 6l12 12M18 6L6 18"/>',
  // 搜索
  search:
    '<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5 20 20"/>',
  // 恢复默认(逆时针圆箭头)
  undo:
    '<path d="M9 7H6.5a6.5 6.5 0 1 0 1.4 10"/><path d="M6 4v3.5h3.5"/>',
  // 文件夹
  folder:
    '<path d="M3 8a1 1 0 0 1 1-1h4.6l2 2.2H20a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8Z"/>',
  // 文件(带折角)
  file:
    '<path d="M6 3h7l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M13 3v5h5"/>',
  // 折叠箭头(默认朝下,折叠时 CSS 旋转 -90deg)
  chevron:
    '<path d="M6 9.5l6 6 6-6"/>',
};
