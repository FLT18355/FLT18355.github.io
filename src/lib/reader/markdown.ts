// markdown.ts - 把压缩包内的 .md 渲染成可插入的 DocumentFragment。
// marked 负责 GFM 语法,DOMPurify 消毒(随机压缩包可能带脚本/事件处理器/javascript: 链接),
// 之后在 detach 的 <template> 里做四趟 DOM 后处理:
//   1. 给标题加 id(标题锚点链接才能跳)
//   2. 图片:把包内相对引用换成 Blob URL;命不到的换成「图片未在包内」说明条
//   3. 链接:包内 .md 内链转点击导航,外部链接新标签打开,命不到的标的为失效
//   4. 表格外套一层横向滚动容器;GFM 任务列表 li 打标去项目符号
//
// marked / dompurify 走静态 import:这是阅读器的核心功能,首屏就需要,无需延迟加载。

import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  isArchiveDoc,
  isMarkdown,
  resolveArchivePath,
  type Archive,
} from './archive';

marked.setOptions({ gfm: true, breaks: false });

/** 压缩包内图片扩展名 -> MIME(Blob URL 需要正确类型才渲染,SVG 尤其要 svg+xml);
    主组件预读图片时也要用同一张表,故导出 */
export const IMG_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

/** 标题文本 -> 锚点 id:保留中日韩字母与数字,空格转连字符 */
function slugify(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]+/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return base || 'section';
}

export interface RenderOptions {
  /** markdown 原文 */
  markdown: string;
  /** 当前 .md 在压缩包内的路径(相对资源引用的基准) */
  docPath: string;
  archive: Archive;
  /** 把压缩包内资源路径变成 Blob URL;命不到返回 null。调用方负责释放这些 URL。 */
  makeUrl: (path: string) => string | null;
}

/**
 * 渲染单个文档。返回可插入的 fragment。
 * makeUrl 创建的 Blob URL 由调用方持有并负责释放(切文档时统一 revoke)。
 */
export async function renderDocument(opts: RenderOptions): Promise<DocumentFragment> {
  const raw = marked.parse(opts.markdown) as string;
  // 消毒:禁掉脚本/表单/嵌入,srcset 永远去掉(只能指向无法解析的包内路径或远程追踪器)
  const clean = DOMPurify.sanitize(raw, {
    FORBID_TAGS: ['style', 'form', 'button', 'textarea', 'select', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'script', 'noscript'],
    FORBID_ATTR: ['srcset', 'onload', 'onerror', 'onclick', 'style'],
  });

  const tpl = document.createElement('template');
  tpl.innerHTML = clean;
  const root = tpl.content;

  // 1. 标题 id(去重)
  const usedIds = new Set<string>();
  for (const h of root.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    let id = slugify(h.textContent || '');
    let n = 1;
    while (usedIds.has(id)) {
      id = `${slugify(h.textContent || '')}-${n++}`;
    }
    usedIds.add(id);
    h.id = id;
  }

  // 2. 图片
  for (const img of Array.from(root.querySelectorAll('img'))) {
    const original = img.getAttribute('src') || '';
    const resolved = resolveArchivePath(opts.archive, opts.docPath, original);
    if (resolved) {
      const url = opts.makeUrl(resolved);
      if (url) {
        img.src = url;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        continue;
      }
    }
    // 命不到(包外远程链接也走这里):远程图保留 src 让浏览器自己加载,包内缺失换说明条
    if (/^[a-z][a-z0-9+.-]*:/i.test(original)) {
      img.referrerPolicy = 'no-referrer';
      img.loading = 'lazy';
      img.decoding = 'async';
      continue;
    }
    const span = document.createElement('span');
    span.className = 'md-img-missing';
    span.textContent = `Image not in archive: ${original || img.alt || '(empty)'}`;
    img.replaceWith(span);
  }

  // 3. 链接
  for (const a of Array.from(root.querySelectorAll('a[href]'))) {
    const href = a.getAttribute('href') || '';
    // 纯锚点(#section):交给浏览器原生跳转,无需处理
    if (href.startsWith('#')) continue;

    const resolved = resolveArchivePath(opts.archive, opts.docPath, href);
    // 包内 .md 内链:转点击导航(href 置 # 防误跳,data-doc 记目标含锚点)
    if (isArchiveDoc(opts.archive, resolved)) {
      const hashIdx = href.indexOf('#');
      const hash = hashIdx >= 0 ? href.slice(hashIdx) : '';
      a.setAttribute('data-doc', resolved + hash);
      a.setAttribute('href', '#');
      continue;
    }
    // 外部链接:新标签打开
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      continue;
    }
    // 包内非 md 文件:挂下载(blob URL + download 属性);命不到标失效
    if (resolved) {
      const url = opts.makeUrl(resolved);
      if (url) {
        a.setAttribute('href', url);
        a.setAttribute('download', '');
        continue;
      }
    }
    a.removeAttribute('href');
    a.classList.add('is-missing');
    a.title = 'Not found in this archive';
  }

  // 4. 表格外套滚动容器
  for (const table of Array.from(root.querySelectorAll('table'))) {
    if (table.parentElement?.classList.contains('md-table')) continue;
    const wrap = document.createElement('div');
    wrap.className = 'md-table';
    table.replaceWith(wrap);
    wrap.appendChild(table);
  }

  // GFM 任务列表:li 内首个子节点是 checkbox 的,打标去项目符号
  for (const li of root.querySelectorAll('li')) {
    const first = li.firstElementChild;
    if (first && first.tagName === 'INPUT' && first.getAttribute('type') === 'checkbox') {
      li.classList.add('md-task');
    }
  }

  return root;
}

/** 预览 markdown 的纯函数版(无 DOM 后处理),markdown 实时预览等场景用 */
export function renderMarkdownPreview(md: string): string {
  return DOMPurify.sanitize(marked.parse(md) as string, {
    FORBID_TAGS: ['style', 'form', 'button', 'textarea', 'select', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'script', 'noscript'],
    FORBID_ATTR: ['srcset', 'onload', 'onerror', 'onclick', 'style'],
  });
}

// isMarkdown 导出透传,方便组件层只 import 一个 markdown 模块
export { isMarkdown };
