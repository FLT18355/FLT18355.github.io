// ReaderIcon.tsx - 阅读器描边图标:统一 viewBox / 描边 / currentColor。
// 内联 SVG 片段来自 src/lib/reader/icons.ts,用 dangerouslySetInnerHTML 注入到 svg 内,
// 外层是 SVG 命名空间元素,browser 把 innerHTML 按 SVG 解析。
// aria-hidden:装饰性图标,名称由外部按钮 / 链接提供。
import type { CSSProperties } from 'react';
import { ICONS, type IconName } from '../lib/reader/icons';

interface Props {
  name: IconName;
  className?: string;
  style?: CSSProperties;
}

export default function ReaderIcon({ name, className, style }: Props) {
  return (
    <svg
      className={className ? `reader-ico ${className}` : 'reader-ico'}
      style={style}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
