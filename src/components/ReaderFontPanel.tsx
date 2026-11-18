// ReaderFontPanel.tsx - 字体面板:当前字体信息 + 上传 / 恢复默认。
// 面板是工具条下方的弹出层(窄屏贴底);Esc 关闭、点面板外关闭由父组件统一管,
// 这里只负责文件选择与事件上报。文件 input 隐藏,用按钮触发。
import { useRef } from 'react';
import ReaderIcon from './ReaderIcon';

interface Props {
  /** 当前字体显示名(已上传),null 表示用站点默认 */
  current: { name: string; size: number } | null;
  /** 错误 / 降级说明 */
  note: string;
  noteKind: 'error' | 'info';
  onUpload: (file: File) => void;
  onReset: () => void;
  onClose: () => void;
}

// 选同一文件也能再次触发 change:点击前先清空 value
function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReaderFontPanel({ current, note, noteKind, onUpload, onReset, onClose }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  const pick = () => {
    if (fileInput.current) fileInput.current.value = '';
    fileInput.current?.click();
  };

  const onChange = () => {
    const f = fileInput.current?.files?.[0];
    if (f) onUpload(f);
  };

  return (
    <div
      className="reader-font-panel"
      role="dialog"
      aria-label="Reading font"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="reader-font-head">
        <h2 className="reader-font-title">Reading font</h2>
        <button type="button" className="reader-font-close" aria-label="Close" onClick={onClose}>
          <ReaderIcon name="close" />
        </button>
      </div>

      {/* 实时样张:直接用当前阅读字体渲染,上传后立刻看到效果(纯装饰,读屏跳过) */}
      <p className="reader-font-preview" aria-hidden="true">
        <span className="reader-font-sample">Aa</span>
        <span className="reader-font-sample">汉字 123 · The quick brown fox</span>
      </p>

      <div className="reader-font-row">
        <span className="reader-font-label">Current</span>
        {current ? (
          <span className="reader-font-name">{current.name} · {fmtSize(current.size)}</span>
        ) : (
          <span className="reader-font-name is-default">Default (system font)</span>
        )}
      </div>

      <div className="reader-font-actions">
        <button type="button" className="reader-btn" onClick={pick}>
          <ReaderIcon name="upload" />
          <span>Upload font</span>
        </button>
        <button type="button" className="reader-btn" disabled={!current} onClick={onReset}>
          <ReaderIcon name="circle" />
          <span>Reset</span>
        </button>
      </div>

      <p className={`reader-font-note${noteKind === 'error' ? ' is-error' : ''}`}>{note}</p>

      <input
        ref={fileInput}
        type="file"
        accept=".woff2,.woff,.ttf,.otf"
        className="reader-sr"
        onChange={onChange}
      />
    </div>
  );
}
