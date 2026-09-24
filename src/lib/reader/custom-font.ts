// custom-font.ts - 阅读器自定义字体:IndexedDB 持久化 + @font-face 注入。
//
// 存 ArrayBuffer 而非 Blob:旧版 Safari(14 以下)存 Blob 进 IndexedDB 有已知问题,
// ArrayBuffer 在所有引擎都稳定可结构化克隆。注入时按格式给 @font-face 的 format 提示。
//
// 持久化链路:上传 -> 读 ArrayBuffer -> 存 IDB -> 注入 @font-face(用 Blob URL)。
// 刷新页面 -> onMounted 读 IDB -> 注入。字体名固定为 "ReadingFont"(单槽位)。
//
// 私有模式 / IDB 不可用时:存库会抛,组件捕获后降级为「仅本次会话生效」,
// 不静默吞掉错误。Promise 包装用 withResolvers,线性控制流。

export type FontFormat = 'woff2' | 'woff' | 'truetype' | 'opentype';

export interface ReadingFont {
  /** 显示用的文件名 */
  name: string;
  format: FontFormat;
  /** 字体二进制(ArrayBuffer,便于 IDB 存取) */
  data: ArrayBuffer;
  size: number;
  addedAt: number;
}

const DB_NAME = 'flt18355-reader';
const DB_VERSION = 1;
const STORE = 'fonts';
const KEY = 'reading-font';

const EXT_FORMAT: Record<string, FontFormat> = {
  woff2: 'woff2',
  // woff 必须报自己的格式:写成 woff2 时浏览器按提示去解 WOFF1 数据会失败,
  // 而且失败是静默的(字体照样「上传成功」,只是始终回落到下一个字体)
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
};

const FORMAT_MIME: Record<FontFormat, string> = {
  woff2: 'font/woff2',
  woff: 'font/woff',
  truetype: 'font/ttf',
  opentype: 'font/otf',
};

/** 从文件名推断字体格式;不支持返回 null */
export function formatFromFileName(name: string): FontFormat | null {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!m) return null;
  return EXT_FORMAT[m[1]] ?? null;
}

/** 打开 / 升级 IndexedDB;IDB 不可用时抛,由调用方降级 */
function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  const { promise, resolve, reject } = Promise.withResolvers<IDBDatabase>();
  const req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE);
    }
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  return promise;
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  const { promise, resolve, reject } = Promise.withResolvers<T | undefined>();
  const tx = db.transaction(STORE, 'readonly');
  const req = tx.objectStore(STORE).get(key);
  req.onsuccess = () => resolve(req.result as T | undefined);
  req.onerror = () => reject(req.error);
  return promise;
}

function idbPut(db: IDBDatabase, key: string, value: ReadingFont): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(value, key);
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  return promise;
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(key);
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  return promise;
}

/** 读已存的自定义字体;没有返回 null */
export async function loadReadingFont(): Promise<ReadingFont | null> {
  const db = await openDb();
  const rec = await idbGet<ReadingFont>(db, KEY);
  db.close();
  return rec ?? null;
}

/** 读文件成 ReadingFont(不落库);格式不支持时抛 */
export async function readFontFile(file: File): Promise<ReadingFont> {
  const format = formatFromFileName(file.name);
  if (!format) {
    throw new Error('Unsupported font format. Pick a .woff2, .woff, .ttf or .otf file.');
  }
  const data = await file.arrayBuffer();
  return {
    name: file.name,
    format,
    data,
    size: file.size,
    addedAt: Date.now(),
  };
}

/** 存字体;IDB 不可用时返回 false(调用方据此提示「仅本次会话生效」) */
export async function saveReadingFont(font: ReadingFont): Promise<boolean> {
  try {
    const db = await openDb();
    await idbPut(db, KEY, font);
    db.close();
    return true;
  } catch {
    return false;
  }
}

/** 清掉已存字体 */
export async function clearReadingFont(): Promise<void> {
  try {
    const db = await openDb();
    await idbDelete(db, KEY);
    db.close();
  } catch {
    /* IDB 不可用时本来就没存,清无可清 */
  }
}

export interface InjectedFont {
  /** 注入用到的 Blob URL,重置 / 替换时由调用方 revoke */
  url: string;
  /** 注入的 <style> 元素 */
  style: HTMLStyleElement;
}

/** 注入 @font-face 并返回句柄(调用方负责在替换 / 重置时清理) */
export function injectFontFace(font: ReadingFont): InjectedFont {
  const blob = new Blob([font.data], { type: FORMAT_MIME[font.format] });
  const url = URL.createObjectURL(blob);
  const style = document.createElement('style');
  style.id = 'reading-font-face';
  style.textContent =
    `@font-face{font-family:"ReadingFont";` +
    `src:url("${url}") format("${font.format}");` +
    `font-display:swap;font-weight:100 900;}`;
  document.head.appendChild(style);
  return { url, style };
}

/** 摘掉注入的字体(撤销 style 与 Blob URL) */
export function removeFontFace(handle: InjectedFont): void {
  handle.style.remove();
  URL.revokeObjectURL(handle.url);
}
