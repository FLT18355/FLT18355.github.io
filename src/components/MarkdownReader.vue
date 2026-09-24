<script setup lang="ts">
// MarkdownReader.vue - Markdown 阅读器主组件(reader.html,无左栏、占满 shell 宽度)。
//
// 职责:
// - 上传 / 拖放 ZIP,递归解析出目录树(只收 .md),自动打开首个文档。
// - 点击目录树 / 内链切换文档;渲染 marked + DOMPurify 消毒后的 Markdown,
//   包内图片解析成 Blob URL,切文档时统一释放。
// - 自定义字体:IndexedDB 持久化,刷新后从库读回注入 @font-face;私有模式降级。
// - 窄屏(≤920px)目录树转全高抽屉,带遮罩 / Esc / 焦点回送。
//
// 与站点约定一致:UI 文案英文为主,面向用户的提示用中文;不引第三方动效库。
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import ReaderTree from './ReaderTree.vue';
import ReaderIcon from './ReaderIcon.vue';
import ReaderFontPanel from './ReaderFontPanel.vue';
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

const archive = shallowRef<Archive | null>(null);
const currentPath = ref<string | null>(null);
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
const message = ref('');
const filter = ref('');
const collapsed = ref<Set<string>>(new Set());
const isNarrow = ref(false);
const drawerOpen = ref(false);
const fontOpen = ref(false);
const font = ref<{ name: string; size: number } | null>(null);
const fontNote = ref('Supports .woff2 / .ttf / .otf. Stored in this browser (IndexedDB), so it survives a reload.');
const fontNoteKind = ref<'error' | 'info'>('info');
const announce = ref('');
const docEl = ref<HTMLElement | null>(null);
const treeToggleEl = ref<HTMLElement | null>(null);
const zipInput = ref<HTMLInputElement | null>(null);
const rootEl = ref<HTMLElement | null>(null);

let objectUrls: string[] = [];
let injectedFont: InjectedFont | null = null;
let lastFocused: HTMLElement | null = null;
// 图片 Blob URL 缓存(按包内路径),切文档前清空并释放
let blobCache = new Map<string, string>();

const docCount = computed(() => archive.value?.mdFiles.length ?? 0);

const filteredCount = computed(() => {
  const q = filter.value.trim().toLowerCase();
  if (!q) return docCount.value;
  const count = (list: TreeNode[]): number => {
    let n = 0;
    for (const node of list) {
      if (node.kind === 'file') {
        if (node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q)) n++;
      } else {
        n += count(node.children);
      }
    }
    return n;
  };
  return archive.value ? count(archive.value.tree) : 0;
});

// 搜索框左侧图标内联样式(多处复用)
const searchIconStyle = {
  position: 'absolute',
  left: '9px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-muted)',
  width: '15px',
  height: '15px',
} as const;

// ---------- ZIP 加载 ----------
function pickZip() {
  if (zipInput.value) zipInput.value.value = '';
  zipInput.value?.click();
}

async function handleZip(file: File) {
  closeDrawer();
  fontOpen.value = false;
  status.value = 'loading';
  message.value = '';
  revokeUrls();
  blobCache = new Map();
  currentPath.value = null;
  try {
    const arch = await loadArchive(file);
    archive.value = arch;
    if (arch.mdFiles.length === 0) {
      status.value = 'ready';
      message.value = 'This archive has no .md files. Every folder is scanned recursively, so try another ZIP.';
      return;
    }
    status.value = 'ready';
    message.value = '';
    // 自动打开:优先根级 README,否则深度优先第一个
    const readme = arch.mdFiles.find(
      (f) => /^readme(\.md)?$/i.test(f.name) && !f.path.includes('/'),
    );
    await openDoc(readme ? readme.path : arch.mdFiles[0].path);
  } catch (err) {
    if (err instanceof ArchiveError) {
      message.value = err.message;
    } else {
      message.value = 'Could not read this archive. Try again or pick another file.';
    }
    status.value = 'error';
    archive.value = null;
  }
}

function onZipChange() {
  const f = zipInput.value?.files?.[0];
  if (f) handleZip(f);
}

// 拖放:落到阅读器任意位置都能接收(zip 或字体)
function onDragOver(e: DragEvent) {
  if (!e.dataTransfer) return;
  e.dataTransfer.dropEffect = 'copy';
  e.preventDefault();
}

async function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  e.preventDefault();
  if (/\.(woff2|woff|ttf|otf)$/i.test(file.name)) {
    await uploadFont(file);
  } else {
    await handleZip(file);
  }
}

// ---------- 图片 Blob 预读 ----------
// renderDocument 同步消费 makeUrl,所以这里得先把当前文档引用的图片
// 全部预读成 Blob URL 存进缓存,渲染时一次性替换好 src,避免首屏破图闪烁。
async function preloadImages(md: string, docPath: string, arch: Archive) {
  const paths = collectImagePaths(md, docPath, arch);
  for (const p of paths) {
    if (blobCache.has(p)) continue;
    const entry = arch.entries.get(p);
    if (!entry) continue;
    const buf = await entry.async('arraybuffer');
    const ext = p.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '';
    const mime = IMG_MIME[ext] ?? 'application/octet-stream';
    const url = URL.createObjectURL(new Blob([buf], { type: mime }));
    blobCache.set(p, url);
    objectUrls.push(url);
  }
}

// 从 markdown 文本里收集指向包内资源的图片路径(只收本地相对引用)
function collectImagePaths(md: string, docPath: string, arch: Archive): string[] {
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
}

// ---------- 文档打开 ----------
/** @param anchor 目标标题的 id(跨文档锚点跳转用,可省略) */
async function openDoc(path: string, anchor?: string) {
  const arch = archive.value;
  if (!arch) return;
  const entry = arch.entries.get(path);
  if (!entry) return;

  // 切文档:释放上一份的图片 Blob URL,清缓存
  revokeUrls();
  blobCache = new Map();

  currentPath.value = path;
  announce.value = `Opening ${path}`;
  filter.value = '';

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
      makeUrl: (p) => blobCache.get(p) ?? null,
    });
  } catch {
    fragment = document.createDocumentFragment();
    const p = document.createElement('p');
    p.textContent = 'Could not render this document.';
    fragment.appendChild(p);
  }

  const host = docEl.value;
  if (host) {
    host.replaceChildren(fragment);
    host.onclick = onDocClick;
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

  announce.value = `Opened ${path}`;
  if (isNarrow.value) closeDrawer();
}

function onDocClick(e: MouseEvent) {
  const a = (e.target as HTMLElement)?.closest('a[data-doc]') as HTMLAnchorElement | null;
  if (!a) return;
  e.preventDefault();
  const target = a.getAttribute('data-doc') || '';
  const hashIdx = target.indexOf('#');
  const docPath = hashIdx >= 0 ? target.slice(0, hashIdx) : target;
  const anchor = hashIdx >= 0 ? decodeURIComponent(target.slice(hashIdx + 1)) : undefined;
  openDoc(docPath, anchor);
}

function scrollDocTop() {
  const host = docEl.value;
  if (!host) return;
  const top = host.getBoundingClientRect().top + window.scrollY - 70;
  if (window.scrollY > top) window.scrollTo({ top, behavior: 'auto' });
}

function revokeUrls() {
  for (const u of objectUrls) URL.revokeObjectURL(u);
  objectUrls = [];
}

// ---------- 目录树交互 ----------
function toggleDir(path: string) {
  const next = new Set(collapsed.value);
  if (next.has(path)) next.delete(path);
  else next.add(path);
  collapsed.value = next;
}

// ---------- 窄屏抽屉 ----------
function openDrawer() {
  drawerOpen.value = true;
  // 回送目标显式取 Contents 按钮:某些浏览器(Safari)点击按钮不会聚焦,
  // 只看 activeElement 会把焦点还到 body 上
  lastFocused = treeToggleEl.value ?? (document.activeElement as HTMLElement);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    rootEl.value?.querySelector<HTMLElement>('.reader-drawer-close')?.focus();
  });
}

function closeDrawer() {
  if (!drawerOpen.value) return;
  drawerOpen.value = false;
  document.body.style.overflow = '';
  lastFocused?.focus?.();
  lastFocused = null;
}

// ---------- 字体面板 ----------
function toggleFont() {
  fontOpen.value = !fontOpen.value;
}

function closeFont() {
  fontOpen.value = false;
}

async function uploadFont(file: File) {
  try {
    const f = await readFontFile(file);
    const persisted = await saveReadingFont(f);
    applyFont(f);
    font.value = { name: f.name, size: f.size };
    fontNoteKind.value = 'info';
    fontNote.value = persisted
      ? 'Saved to this browser (IndexedDB). It survives a reload.'
      : 'This browser blocked local storage, so the font lasts for this session only.';
  } catch (err) {
    fontNoteKind.value = 'error';
    fontNote.value = err instanceof Error ? err.message : 'Font upload failed.';
  }
}

function applyFont(f: ReadingFont) {
  if (injectedFont) removeFontFace(injectedFont);
  injectedFont = injectFontFace(f);
}

async function resetFont() {
  if (injectedFont) {
    removeFontFace(injectedFont);
    injectedFont = null;
  }
  await clearReadingFont();
  font.value = null;
  fontNoteKind.value = 'info';
  fontNote.value = 'Site default restored. Pick a .woff2, .ttf or .otf to use your own font.';
}

// ---------- 生命周期 ----------
function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape') return;
  if (fontOpen.value) {
    closeFont();
  } else if (drawerOpen.value) {
    closeDrawer();
  }
}

// 点击字体面板外部关闭(capture 阶段,确保先于其它处理器)
function onPointerDown(e: PointerEvent) {
  if (!fontOpen.value) return;
  const root = rootEl.value;
  if (!root) return;
  const panel = root.querySelector('.reader-font-panel');
  const btn = root.querySelector('.reader-btn[aria-haspopup="dialog"]');
  const t = e.target as Node;
  if (panel && !panel.contains(t) && !(btn?.contains(t))) {
    closeFont();
  }
}

let mq: MediaQueryList | null = null;

onMounted(async () => {
  mq = window.matchMedia(NARROW_Q);
  isNarrow.value = mq.matches;
  mq.addEventListener('change', (e) => {
    isNarrow.value = e.matches;
    if (!e.matches) closeDrawer();
  });

  document.addEventListener('keydown', onKey);
  document.addEventListener('pointerdown', onPointerDown, true);

  // 恢复已存字体
  try {
    const saved = await loadReadingFont();
    if (saved) {
      applyFont(saved);
      font.value = { name: saved.name, size: saved.size };
      fontNote.value = 'Restored your saved font from this browser.';
    }
  } catch {
    fontNote.value = 'Local storage is unavailable, so an uploaded font lasts for this session only.';
    fontNoteKind.value = 'error';
  }
});

onBeforeUnmount(() => {
  revokeUrls();
  if (injectedFont) removeFontFace(injectedFont);
  document.removeEventListener('keydown', onKey);
  document.removeEventListener('pointerdown', onPointerDown, true);
  document.body.style.overflow = '';
  if (mq) mq.removeEventListener('change', () => {});
});

watch(isNarrow, (v) => {
  if (!v) document.body.style.overflow = '';
});
</script>

<template>
  <div
    ref="rootEl"
    class="reader"
    :class="{ 'has-reading-font': !!font }"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <!-- 工具条 -->
    <div class="reader-bar">
      <div class="reader-bar-title">
        <ReaderIcon name="archive" />
        <span class="reader-zip">{{ archive ? archive.fileName : 'Markdown Reader' }}</span>
        <span v-if="docCount" class="reader-count">{{ docCount }} files</span>
      </div>
      <div class="reader-bar-actions">
        <button
          v-if="isNarrow && archive"
          ref="treeToggleEl"
          type="button"
          class="reader-btn"
          :aria-expanded="drawerOpen"
          aria-controls="reader-tree"
          @click="drawerOpen ? closeDrawer() : openDrawer()"
        >
          <ReaderIcon name="menu" />
          <span>Contents</span>
        </button>
        <button type="button" class="reader-btn" @click="pickZip">
          <ReaderIcon name="upload" />
          <span>Open ZIP</span>
        </button>
        <button
          type="button"
          class="reader-btn"
          :class="{ 'is-active': fontOpen }"
          aria-haspopup="dialog"
          :aria-expanded="fontOpen"
          @click="toggleFont"
        >
          <ReaderIcon name="font" />
          <span>Font</span>
        </button>
      </div>
    </div>

    <!-- 读取进度 / 提示条 -->
    <p
      v-if="status === 'loading'"
      class="reader-progress"
      role="status"
      aria-label="Reading archive"
    >Reading archive…</p>
    <p
      v-else-if="message"
      class="reader-alert"
      :class="{ 'is-info': status !== 'error' }"
      role="alert"
    >{{ message }}</p>

    <!-- 字体面板 -->
    <ReaderFontPanel
      v-if="fontOpen"
      :current="font"
      :note="fontNote"
      :note-kind="fontNoteKind"
      @upload="uploadFont"
      @reset="resetFont"
      @close="closeFont"
    />

    <!-- 主体 -->
    <div class="reader-body">
      <aside v-if="!isNarrow && archive" class="reader-tree" id="reader-tree">
        <div class="reader-tree-head">
          <div class="reader-search">
            <ReaderIcon name="search" :style="searchIconStyle" />
            <input
              v-model="filter"
              type="search"
              class="reader-filter"
              placeholder="Filter .md files"
            />
          </div>
          <span class="reader-tree-count">{{ filteredCount }}</span>
        </div>
        <ReaderTree
          v-if="archive.tree.length"
          :nodes="archive.tree"
          :active="currentPath"
          :collapsed="collapsed"
          :filter="filter"
          @open="openDoc"
          @toggle="toggleDir"
        />
        <p v-else class="reader-tree-empty">{{ message || 'No .md files' }}</p>
      </aside>

      <main class="reader-main">
        <article ref="docEl" class="reader-doc"></article>
        <p
          v-if="status === 'idle' || (status === 'ready' && !currentPath)"
          class="reader-hint"
        >
          <template v-if="status === 'idle'">
            Open a ZIP to start reading.<br />
            <small>Markdown files are listed as a tree, images are read straight from the archive, everything else is ignored. You can also drop a file here.</small>
          </template>
          <template v-else>
            Select a file from the contents.<br />
            <small>Pick any .md in the contents tree to start reading.</small>
          </template>
        </p>
      </main>
    </div>

    <!-- 窄屏抽屉 -->
    <div v-if="isNarrow && drawerOpen && archive" class="reader-drawer">
      <div class="reader-scrim" @click="closeDrawer"></div>
      <div class="reader-drawer-panel">
        <div class="reader-drawer-head">
          <span class="reader-drawer-title">{{ archive.fileName }}</span>
          <button
            type="button"
            class="reader-drawer-close"
            aria-label="Close contents"
            @click="closeDrawer"
          >
            <ReaderIcon name="close" />
          </button>
        </div>
        <div class="reader-tree-head reader-tree-head--drawer">
          <div class="reader-search">
            <ReaderIcon name="search" :style="searchIconStyle" />
            <input
              v-model="filter"
              type="search"
              class="reader-filter"
              placeholder="Filter .md files"
            />
          </div>
          <span class="reader-tree-count">{{ filteredCount }}</span>
        </div>
        <ReaderTree
          :nodes="archive.tree"
          :active="currentPath"
          :collapsed="collapsed"
          :filter="filter"
          @open="openDoc"
          @toggle="toggleDir"
        />
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="zipInput"
      type="file"
      accept=".zip,application/zip,application/x-zip-compressed"
      class="reader-sr"
      @change="onZipChange"
    />
    <!-- 屏幕阅读器播报 -->
    <span class="reader-sr" role="status" aria-live="polite">{{ announce }}</span>
  </div>
</template>
