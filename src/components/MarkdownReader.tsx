// MarkdownReader.tsx - Markdown 阅读器主组件(reader.html,无左栏、占满 shell 宽度)。
//
// 职责:
// - 上传 / 拖放 ZIP,递归解析出目录树(只收 .md),自动打开首个文档。
// - 点击目录树 / 内链切换文档;渲染 marked + DOMPurify 消毒后的 Markdown,
//   包内图片解析成 Blob URL,切文档时统一释放。
// - 自定义字体:IndexedDB 持久化,刷新后从库读回注入 @font-face;私有模式降级。
// - 窄屏(≤920px)目录树转全高抽屉,带遮罩 / Esc / 焦点回送。
//
// 与站点约定一致:UI 文案英文为主,面向用户的提示用中文;不引第三方动效库。
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import ReaderTree from './ReaderTree';
import ReaderIcon from './ReaderIcon';
import ReaderFontPanel from './ReaderFontPanel';
import {
  ArchiveError,
  loadArchive,
  readEntryText,
  resolveArchivePath,
  type Archive,
  type TreeNode,
} from '../lib/reader/archive';
import { IMG_MIME, renderDocument } from '../lib/reader/markdown';
import {
  clearReadingFont,
  injectFontFace,
  loadReadingFont,
  readFontFile,
  removeFontFace,
  saveReadingFont,
  type InjectedFont,
  type ReadingFont,
} from '../lib/reader/custom-font';

const NARROW_Q = '(max-width: 920px)';

const searchIconStyle: CSSProperties = {
  position: 'absolute',
  left: '9px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-muted)',
  width: '15px',
  height: '15px',
};

function countMatches(list: TreeNode[], q: string): number {
  let n = 0;
  for (const node of list) {
    if (node.kind === 'file') {
      if (node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q)) n++;
    } else {
      n += countMatches(node.children, q);
    }
  }
  return n;
}

export default function MarkdownReader() {
  const [archive, setArchive] = useState<Archive | null>(null);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [isNarrow, setIsNarrow] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const [font, setFont] = useState<{ name: string; size: number } | null>(null);
  const [fontNote, setFontNote] = useState('Supports .woff2 / .woff / .ttf / .otf. Stored in this browser (IndexedDB), so it survives a reload.');
  const [fontNoteKind, setFontNoteKind] = useState<'error' | 'info'>('info');
  const [announce, setAnnounce] = useState('');

  const archiveRef = useRef<Archive | null>(null);
  const docEl = useRef<HTMLElement | null>(null);
  const treeToggleEl = useRef<HTMLButtonElement | null>(null);
  const zipInput = useRef<HTMLInputElement | null>(null);
  const rootEl = useRef<HTMLDivElement | null>(null);

  const objectUrls = useRef<string[]>([]);
  const injectedFont = useRef<InjectedFont | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  /* 图片 Blob URL 缓存(按包内路径),切文档前清空并释放 */
  const blobCache = useRef(new Map<string, string>());
  /* 代码块复制按钮的文案回退计时器:切文档 / 卸载时要清掉,别让旧计时器改到新节点 */
  const copyTimer = useRef<number | null>(null);
  const fontOpenRef = useRef(false);
  const drawerOpenRef = useRef(false);

  useEffect(() => { fontOpenRef.current = fontOpen; }, [fontOpen]);
  useEffect(() => { drawerOpenRef.current = drawerOpen; }, [drawerOpen]);

  const docCount = archive?.mdFiles.length ?? 0;
  const filteredCount = (() => {
    const q = filter.trim().toLowerCase();
    if (!q) return docCount;
    return archive ? countMatches(archive.tree, q) : 0;
  })();

  // ---------- ZIP 加载 ----------
  const pickZip = () => {
    if (zipInput.current) zipInput.current.value = '';
    zipInput.current?.click();
  };

  const handleZip = async (file: File) => {
    closeDrawer();
    setFontOpen(false);
    setStatus('loading');
    setMessage('');
    revokeUrls();
    blobCache.current = new Map();
    setCurrentPath(null);
    try {
      const arch = await loadArchive(file);
      setArchive(arch);
      archiveRef.current = arch;
      if (arch.mdFiles.length === 0) {
        setStatus('ready');
        setMessage('This archive has no .md files. Every folder is scanned recursively, so try another ZIP.');
        return;
      }
      setStatus('ready');
      setMessage('');
      // 自动打开:优先根级 README,否则深度优先第一个
      const readme = arch.mdFiles.find(
        (f) => /^readme(\.md)?$/i.test(f.name) && !f.path.includes('/'),
      );
      await openDoc(readme ? readme.path : arch.mdFiles[0].path);
    } catch (err) {
      if (err instanceof ArchiveError) {
        setMessage(err.message);
      } else {
        setMessage('Could not read this archive. Try again or pick another file.');
      }
      setStatus('error');
      setArchive(null);
      archiveRef.current = null;
    }
  };

  const onZipChange = () => {
    const f = zipInput.current?.files?.[0];
    if (f) void handleZip(f);
  };

  // 拖放:落到阅读器任意位置都能接收(zip 或字体)
  const onDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer) return;
    e.dataTransfer.dropEffect = 'copy';
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    e.preventDefault();
    if (/\.(woff2|woff|ttf|otf)$/i.test(file.name)) {
      void uploadFont(file);
    } else {
      void handleZip(file);
    }
  };

  // ---------- 图片 Blob 预读 ----------
  // renderDocument 同步消费 makeUrl,所以这里得先把当前文档引用的图片
  // 全部预读成 Blob URL 存进缓存,渲染时一次性替换好 src,避免首屏破图闪烁。
  const preloadImages = async (md: string, docPath: string, arch: Archive) => {
    const paths = collectImagePaths(md, docPath, arch);
    for (const p of paths) {
      if (blobCache.current.has(p)) continue;
      const entry = arch.entries.get(p);
      if (!entry) continue;
      const buf = await entry.async('arraybuffer');
      const ext = p.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '';
      const mime = IMG_MIME[ext] ?? 'application/octet-stream';
      const url = URL.createObjectURL(new Blob([buf], { type: mime }));
      blobCache.current.set(p, url);
      objectUrls.current.push(url);
    }
  };

  // 从 markdown 文本里收集指向包内资源的图片路径(只收本地相对引用)
  const collectImagePaths = (md: string, docPath: string, arch: Archive): string[] => {
    const paths = new Set<string>();
    // markdown 图片 ![alt](src) 与 HTML <img src="...">
    const re = /(?:!\[[^\]]*\]\(([^)\s]+)\)|<img[^>]+src="([^"]+)")/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(md))) {
      const raw = m[1] || m[2];
      if (!raw) continue;
      const resolved = resolveArchivePath(arch, docPath, raw);
      if (resolved) paths.add(resolved);
    }
    return [...paths];
  };

  // ---------- 文档打开 ----------
  /** @param anchor 目标标题的 id(跨文档锚点跳转用,可省略) */
  const openDoc = async (path: string, anchor?: string) => {
    const arch = archiveRef.current;
    if (!arch) return;
    const entry = arch.entries.get(path);
    if (!entry) return;

    // 切文档:释放上一份的图片 Blob URL,清缓存
    revokeUrls();
    blobCache.current = new Map();

    setCurrentPath(path);
    setAnnounce(`Opening ${path}`);
    setFilter('');

    let md: string;
    try {
      md = await readEntryText(entry);
    } catch {
      md = 'Could not read this file.';
    }

    await preloadImages(md, path, arch);

    let fragment: DocumentFragment;
    try {
      fragment = await renderDocument({
        markdown: md,
        docPath: path,
        archive: arch,
        makeUrl: (p) => blobCache.current.get(p) ?? null,
      });
    } catch {
      fragment = document.createDocumentFragment();
      const p = document.createElement('p');
      p.textContent = 'Could not render this document.';
      fragment.appendChild(p);
    }

    const host = docEl.current;
    if (host) {
      host.replaceChildren(fragment);
      host.onclick = onDocClick;
      // 重放内容入场:先摘类并读一次布局,再挂回去,否则浏览器会把它当成同一次动画而不重放
      host.classList.remove('is-fresh');
      void host.offsetWidth;
      host.classList.add('is-fresh');
      if (anchor) {
        // 跨文档锚点:等一帧让布局算完再滚,避免滚到旧位置
        requestAnimationFrame(() => {
          const target = host.querySelector<HTMLElement>(`#${CSS.escape(anchor)}`);
          if (target) target.scrollIntoView({ block: 'start' });
          else scrollDocTop();
        });
      } else {
        scrollDocTop();
      }
    }

    setAnnounce(`Opened ${path}`);
    if (isNarrow) closeDrawer();
  };

  const onDocClick = async (e: MouseEvent) => {
    const el = e.target as HTMLElement | null;

    // 代码块的复制按钮:先于链接分支处理,避免被当成普通点击吞掉
    const copyBtn = el?.closest<HTMLButtonElement>('button[data-code-copy]');
    if (copyBtn) {
      e.preventDefault();
      const code = copyBtn.closest('.md-code')?.querySelector('code');
      const text = code?.textContent ?? '';
      let ok = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          ok = true;
        }
      } catch {
        ok = false;
      }
      copyBtn.textContent = ok ? 'Copied' : 'Copy failed';
      copyBtn.classList.toggle('is-done', ok);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.classList.remove('is-done');
        copyTimer.current = null;
      }, 1400);
      return;
    }

    const a = el?.closest('a[data-doc]') as HTMLAnchorElement | null;
    if (!a) return;
    e.preventDefault();
    const target = a.getAttribute('data-doc') || '';
    const hashIdx = target.indexOf('#');
    const docPath = hashIdx >= 0 ? target.slice(0, hashIdx) : target;
    const anchor = hashIdx >= 0 ? decodeURIComponent(target.slice(hashIdx + 1)) : undefined;
    void openDoc(docPath, anchor);
  };

  const scrollDocTop = () => {
    const host = docEl.current;
    if (!host) return;
    const top = host.getBoundingClientRect().top + window.scrollY - 70;
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'auto' });
  };

  const revokeUrls = () => {
    for (const u of objectUrls.current) URL.revokeObjectURL(u);
    objectUrls.current = [];
  };

  // ---------- 目录树交互 ----------
  const toggleDir = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // ---------- 窄屏抽屉 ----------
  const openDrawer = () => {
    setDrawerOpen(true);
    // 回送目标显式取 Contents 按钮:某些浏览器(Safari)点击按钮不会聚焦,
    // 只看 activeElement 会把焦点还到 body 上
    lastFocused.current = treeToggleEl.current ?? (document.activeElement as HTMLElement);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      rootEl.current?.querySelector<HTMLElement>('.reader-drawer-close')?.focus();
    });
  };

  const closeDrawer = () => {
    if (!drawerOpenRef.current) return;
    setDrawerOpen(false);
    document.body.style.overflow = '';
    lastFocused.current?.focus?.();
    lastFocused.current = null;
  };

  // ---------- 字体面板 ----------
  const toggleFont = () => setFontOpen((v) => !v);
  const closeFont = () => setFontOpen(false);

  const uploadFont = async (file: File) => {
    try {
      const f = await readFontFile(file);
      const persisted = await saveReadingFont(f);
      applyFont(f);
      setFont({ name: f.name, size: f.size });
      setFontNoteKind('info');
      setFontNote(
        persisted
          ? 'Saved to this browser (IndexedDB). It survives a reload.'
          : 'This browser blocked local storage, so the font lasts for this session only.'
      );
    } catch (err) {
      setFontNoteKind('error');
      setFontNote(err instanceof Error ? err.message : 'Font upload failed.');
    }
  };

  const applyFont = (f: ReadingFont) => {
    if (injectedFont.current) removeFontFace(injectedFont.current);
    injectedFont.current = injectFontFace(f);
  };

  const resetFont = async () => {
    if (injectedFont.current) {
      removeFontFace(injectedFont.current);
      injectedFont.current = null;
    }
    await clearReadingFont();
    setFont(null);
    setFontNoteKind('info');
    setFontNote('System default restored. Pick a .woff2, .woff, .ttf or .otf to use your own font.');
  };

  // ---------- 生命周期 ----------
  useEffect(() => {
    const mq = window.matchMedia(NARROW_Q);
    setIsNarrow(mq.matches);
    const onMq = (e: MediaQueryListEvent) => {
      setIsNarrow(e.matches);
      if (!e.matches) {
        setDrawerOpen(false);
        document.body.style.overflow = '';
      }
    };
    mq.addEventListener('change', onMq);

    // 恢复已存字体
    void (async () => {
      try {
        const saved = await loadReadingFont();
        if (saved) {
          applyFont(saved);
          setFont({ name: saved.name, size: saved.size });
          setFontNote('Restored your saved font from this browser.');
        }
      } catch {
        setFontNote('Local storage is unavailable, so an uploaded font lasts for this session only.');
        setFontNoteKind('error');
      }
    })();

    return () => {
      mq.removeEventListener('change', onMq);
      revokeUrls();
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      if (injectedFont.current) removeFontFace(injectedFont.current);
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (fontOpenRef.current) {
        setFontOpen(false);
      } else if (drawerOpenRef.current) {
        closeDrawer();
      }
    };
    // 点击字体面板外部关闭(capture 阶段,确保先于其它处理器)
    const onPointerDown = (e: PointerEvent) => {
      if (!fontOpenRef.current) return;
      const root = rootEl.current;
      if (!root) return;
      const panel = root.querySelector('.reader-font-panel');
      const btn = root.querySelector('.reader-btn[aria-haspopup="dialog"]');
      const t = e.target as Node;
      if (panel && !panel.contains(t) && !(btn?.contains(t))) {
        setFontOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, []);

  return (
    <div
      ref={rootEl}
      className={`reader${font ? ' has-reading-font' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* 工具条 */}
      <div className="reader-bar">
        <div className="reader-bar-title">
          <ReaderIcon name="archive" />
          <span className="reader-zip">{archive ? archive.fileName : 'Markdown Reader'}</span>
          {docCount ? <span className="reader-count">{docCount} files</span> : null}
        </div>
        <div className="reader-bar-actions">
          {isNarrow && archive ? (
            <button
              ref={treeToggleEl}
              type="button"
              className="reader-btn"
              aria-expanded={drawerOpen}
              aria-controls="reader-tree"
              onClick={() => (drawerOpen ? closeDrawer() : openDrawer())}
            >
              <ReaderIcon name="menu" />
              <span>Contents</span>
            </button>
          ) : null}
          <button type="button" className="reader-btn reader-btn--primary" onClick={pickZip}>
            <ReaderIcon name="upload" />
            <span>Open ZIP</span>
          </button>
          <button
            type="button"
            className={`reader-btn${fontOpen ? ' is-active' : ''}`}
            aria-haspopup="dialog"
            aria-expanded={fontOpen}
            onClick={toggleFont}
          >
            <ReaderIcon name="font" />
            <span>Font</span>
          </button>
        </div>
      </div>

      {/* 读取进度 / 提示条 */}
      {status === 'loading' ? (
        <p className="reader-progress" role="status" aria-label="Reading archive">Reading archive…</p>
      ) : message ? (
        <p className={`reader-alert${status !== 'error' ? ' is-info' : ''}`} role="alert">{message}</p>
      ) : null}

      {/* 字体面板 */}
      {fontOpen ? (
        <ReaderFontPanel
          current={font}
          note={fontNote}
          noteKind={fontNoteKind}
          onUpload={(f) => void uploadFont(f)}
          onReset={() => void resetFont()}
          onClose={closeFont}
        />
      ) : null}

      {/* 主体 */}
      <div className={`reader-body${archive ? '' : ' reader-body--solo'}`}>
        {!isNarrow && archive ? (
          <aside className="reader-tree" id="reader-tree">
            <p className="reader-tree-label">Contents</p>
            <div className="reader-tree-head">
              <div className="reader-search">
                <ReaderIcon name="search" style={searchIconStyle} />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  type="search"
                  className="reader-filter"
                  placeholder="Filter .md files"
                />
              </div>
              <span className="reader-tree-count">{filteredCount}</span>
            </div>
            {archive.tree.length ? (
              <ReaderTree
                nodes={archive.tree}
                active={currentPath}
                collapsed={collapsed}
                filter={filter}
                onOpen={(p) => void openDoc(p)}
                onToggle={toggleDir}
              />
            ) : (
              <p className="reader-tree-empty">{message || 'No .md files'}</p>
            )}
          </aside>
        ) : null}

        <main className="reader-main">
          <article ref={docEl} className="reader-doc" />
          {status === 'idle' || (status === 'ready' && !currentPath) ? (
            <p className="reader-hint">
              {status === 'idle' ? (
                <>
                  <ReaderIcon name="upload" className="reader-hint-ico" />
                  <strong>Open a ZIP to start reading.</strong>
                  <small>Markdown files are listed as a tree, images are read straight from the archive, everything else is ignored. You can also drop a file here.</small>
                </>
              ) : (
                <>
                  <ReaderIcon name="file" className="reader-hint-ico" />
                  <strong>Select a file from the contents.</strong>
                  <small>Pick any .md in the contents tree to start reading.</small>
                </>
              )}
            </p>
          ) : null}
        </main>
      </div>

      {/* 窄屏抽屉 */}
      {isNarrow && drawerOpen && archive ? (
        <div className="reader-drawer">
          <div className="reader-scrim" onClick={closeDrawer} />
          <div className="reader-drawer-panel">
            <div className="reader-drawer-head">
              <span className="reader-drawer-title">{archive.fileName}</span>
              <button
                type="button"
                className="reader-drawer-close"
                aria-label="Close contents"
                onClick={closeDrawer}
              >
                <ReaderIcon name="close" />
              </button>
            </div>
            <div className="reader-tree-head reader-tree-head--drawer">
              <div className="reader-search">
                <ReaderIcon name="search" style={searchIconStyle} />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  type="search"
                  className="reader-filter"
                  placeholder="Filter .md files"
                />
              </div>
              <span className="reader-tree-count">{filteredCount}</span>
            </div>
            <ReaderTree
              nodes={archive.tree}
              active={currentPath}
              collapsed={collapsed}
              filter={filter}
              onOpen={(p) => void openDoc(p)}
              onToggle={toggleDir}
            />
          </div>
        </div>
      ) : null}

      {/* 隐藏的文件输入 */}
      <input
        ref={zipInput}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        className="reader-sr"
        onChange={onZipChange}
      />
      {/* 屏幕阅读器播报 */}
      <span className="reader-sr" role="status" aria-live="polite">{announce}</span>
    </div>
  );
}
