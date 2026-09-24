// archive.ts - ZIP 压缩包解析:递归遍历、目录树构建、文本解码、资源路径解析。
//
// 约束:
// - 只把 .md 文件收进目录树;图片等其他文件不入树,但全部进资源索引供 markdown 图片解析。
// - 跳过 macOS 的 __MACOSX/ 与 AppleDouble 的 ._ 垃圾(后者伪装成 .md 会混进树)。
// - 路径统一成正斜杠;大小写回退查找,照顾 markdown 里写错大小写的图片引用。

import JSZip from 'jszip';

/** 目录树节点 */
export interface DirNode {
  kind: 'dir';
  name: string;
  path: string;
  children: TreeNode[];
}
export interface FileNode {
  kind: 'file';
  name: string;
  path: string;
}
export type TreeNode = DirNode | FileNode;

/** 解析后的压缩包 */
export interface Archive {
  /** 上传的文件名,工具条显示用 */
  fileName: string;
  /** 全部条目:键为规范化路径(原始大小写),值为 JSZip 条目对象 */
  entries: Map<string, JSZip.JSZipObject>;
  /** 小写路径 -> 原始路径,图片引用大小写回退用 */
  lower: Map<string, string>;
  /** 目录树根 */
  tree: TreeNode[];
  /** 拍平的 .md 文件列表(深度优先、同级已排序),自动打开与计数用 */
  mdFiles: FileNode[];
}

export class ArchiveError extends Error {}

const MD_EXT = /\.md$/i;

/** 判断是否为 .md 文件(只认 .md,不收 .markdown);导出供 markdown 模块复用 */
export function isMarkdown(path: string): boolean {
  return MD_EXT.test(path);
}

/** 规范化路径:反斜杠 -> 正斜杠,去掉开头的 ./ 与多余斜杠 */
function normalizePath(p: string): string {
  let s = p.replace(/\\/g, '/').replace(/^\.\/+/, '');
  // 去掉开头多余的斜杠(绝对路径式写法按相对处理)
  s = s.replace(/^\/+/, '');
  // 去掉结尾斜杠(目录条目会带)
  s = s.replace(/\/+$/, '');
  return s;
}

/** AppleDouble / macOS 元数据垃圾:__MACOSX 段或以 ._ 开头的文件名 */
function isJunk(path: string): boolean {
  const segs = path.split('/');
  return segs.some((s) => s === '__MACOSX' || s.startsWith('._'));
}

/** 解码压缩包内单个条目的文本:先按 UTF-8 严格解码,失败回退 GB18030(照顾 GBK 文档) */
export async function readEntryText(
  entry: JSZip.JSZipObject
): Promise<string> {
  const buf = await entry.async('arraybuffer');
  try {
    // 严格模式:遇到非法 UTF-8 字节就抛,据此判定不是 UTF-8
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    // GB18030 兼容 GBK / GB2312,中文 Windows 文档常见
    return new TextDecoder('gb18030').decode(buf);
  }
}

interface TreeBuilder {
  dirs: Map<string, TreeBuilder>;
  files: FileNode[];
}

/** builder -> TreeNode,同级排序:目录在前、文件在后,均按 locale 数字序 */
function buildTree(b: TreeBuilder, name: string, path: string): DirNode {
  const dirChildren: TreeNode[] = [];
  for (const [seg, child] of b.dirs) {
    dirChildren.push(buildTree(child, seg, path ? `${path}/${seg}` : seg));
  }
  const sortName = (a: string, c: string) =>
    a.localeCompare(c, undefined, { numeric: true, sensitivity: 'base' });
  const fileChildren: TreeNode[] = b.files.slice().sort((x, y) => sortName(x.name, y.name));
  const children = dirChildren
    .concat(fileChildren)
    .sort((a, b2) => {
      if (a.kind !== b2.kind) return a.kind === 'dir' ? -1 : 1;
      return sortName(a.name, b2.name);
    });
  return { kind: 'dir', name, path, children };
}

/** 加载并解析 ZIP 文件 */
export async function loadArchive(file: File): Promise<Archive> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new ArchiveError('Not a valid ZIP, or the file is damaged / password-protected.');
  }

  const entries = new Map<string, JSZip.JSZipObject>();
  const lower = new Map<string, string>();
  const root: TreeBuilder = { dirs: new Map(), files: [] };

  zip.forEach((relativePath, entry) => {
    if (entry.dir) return; // 目录条目本身不入树(空目录会被剪掉)
    const path = normalizePath(relativePath);
    if (!path || isJunk(path)) return;

    entries.set(path, entry);
    lower.set(path.toLowerCase(), path);

    if (!isMarkdown(path)) return;

    // 按路径分段插入树,缺的目录节点即时建出
    const segs = path.split('/');
    const fileNode: FileNode = {
      kind: 'file',
      name: segs[segs.length - 1],
      path,
    };
    let cur = root;
    for (let i = 0; i < segs.length - 1; i++) {
      const seg = segs[i];
      let next = cur.dirs.get(seg);
      if (!next) {
        next = { dirs: new Map(), files: [] };
        cur.dirs.set(seg, next);
      }
      cur = next;
    }
    cur.files.push(fileNode);
  });

  const tree: TreeNode[] = [];
  for (const [seg, child] of root.dirs) {
    tree.push(buildTree(child, seg, seg));
  }
  // 根级散落的文件(没有目录包裹)也按文件序并入
  const sortName = (a: string, b: string) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  const rootFiles: TreeNode[] = root.files.slice().sort((x, y) => sortName(x.name, y.name));
  tree.push(...rootFiles);
  tree.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
    return sortName(a.name, b.name);
  });

  // mdFiles 由**排序后**的树拍平:顺序与目录树严格一致(不依赖 zip 条目写入次序),
  // 自动打开首个文档、计数都基于它
  const mdFiles: FileNode[] = [];
  const flatten = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      if (n.kind === 'file') mdFiles.push(n);
      else flatten(n.children);
    }
  };
  flatten(tree);

  return { fileName: file.name, entries, lower, tree, mdFiles };
}

/**
 * 把 markdown 里的相对资源引用解析成压缩包内的真实路径。
 * @returns 命中条目的路径;指向外部(http/data/blob/mailto)或不命中返回 null
 */
export function resolveArchivePath(
  archive: Archive,
  fromDocPath: string,
  rawSrc: string
): string | null {
  // 去掉查询串与锚点(? 与 # 在文件名里极罕见,标准做法是先剥)
  const hashIdx = rawSrc.indexOf('#');
  const qIdx = rawSrc.indexOf('?');
  let end = rawSrc.length;
  if (hashIdx >= 0 && hashIdx < end) end = hashIdx;
  if (qIdx >= 0 && qIdx < end) end = qIdx;
  let src = rawSrc.slice(0, end);
  if (!src) return null;

  // 协议(http/https/data/blob/mailto 等)一律不处理
  if (/^[a-z][a-z0-9+.-]*:/i.test(src)) return null;

  // 解码百分号编码(空格 %20 之类),非法序列则按原样
  try {
    src = decodeURIComponent(src);
  } catch {
    /* 保持 src 不变 */
  }

  // 取 fromDocPath 所在目录作为基准(绝对路径式 / 开头则从包根算)
  const dirPart = fromDocPath.lastIndexOf('/');
  const base = src.startsWith('/')
    ? []
    : (dirPart < 0 ? '' : fromDocPath.slice(0, dirPart)).split('/').filter(Boolean);
  const parts: string[] = [];
  for (const seg of base) parts.push(seg);
  for (const seg of src.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      parts.pop();
      continue;
    }
    parts.push(seg);
  }
  const path = parts.join('/');
  if (!path) return null;

  if (archive.entries.has(path)) return path;
  // 大小写回退:markdown 里写 README.PNG 而包里是 readme.png 也能命中
  return archive.lower.get(path.toLowerCase()) ?? null;
}

/** 该路径是否为压缩包内的 .md 文档(供内链判定,类型守卫保留窄化) */
export function isArchiveDoc(archive: Archive, path: string | null): path is string {
  if (!path) return false;
  return archive.entries.has(path) && isMarkdown(path);
}
