// runtime.ts - 浏览器侧组件(client:load)读的 TOML:曲目表与天气设置
//
// 与 content.ts 分开,是因为 Vue 岛会把数据打进前端 bundle:
// 音乐播放器只需要 music.toml,天气卡只需要 weather.toml,
// 站点文案与项目列表只在构建时用,不该被拖进访客下载的 JS 里。
//
// 两份文件在构建时由 Vite 内联读取,运行时零请求;写错字段会在构建时报错。
import { parse } from 'smol-toml';

const raw = import.meta.glob(['../../content/music.toml', '../../content/weather.toml'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function read(name: string): Record<string, unknown> {
  const key = Object.keys(raw).find((k) => k.endsWith(`/${name}.toml`));
  if (!key) throw new Error(`content/${name}.toml 不存在`);
  try {
    return parse(raw[key]) as Record<string, unknown>;
  } catch (err) {
    throw new Error(`content/${name}.toml 解析失败:${(err as Error).message}`);
  }
}

function str(src: Record<string, unknown>, key: string, where: string, fallback = ''): string {
  const v = src[key];
  if (v === undefined) return fallback;
  if (typeof v !== 'string') throw new Error(`${where}.${key} 应为字符串`);
  return v;
}

function num(src: Record<string, unknown>, key: string, where: string, fallback: number): number {
  const v = src[key];
  if (v === undefined) return fallback;
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${where}.${key} 应为数字`);
  return v;
}

function list<T>(src: Record<string, unknown>, key: string): T[] {
  const v = src[key];
  if (v === undefined) return [];
  if (!Array.isArray(v)) throw new Error(`${key} 应为 [[${key}]] 表数组`);
  return v as T[];
}

/* ---------- music.toml ---------- */

const MUSIC_RAW = read('music');

export interface MusicTrack {
  title: string;
  artist: string;
  /** 封面图路径;缺省则显示音符占位图标 */
  cover?: string;
  src: string;
}

export const TRACKS: MusicTrack[] = list<Record<string, unknown>>(MUSIC_RAW, 'track').map((t, i) => {
  const where = `track[${i}]`;
  const cover = str(t, 'cover', where);
  const src = str(t, 'src', where);
  if (!src) throw new Error(`${where}.src 不能为空`);
  return { title: str(t, 'title', where), artist: str(t, 'artist', where), ...(cover ? { cover } : {}), src };
});

/* ---------- weather.toml ---------- */

const WEATHER_RAW = read('weather');
const weatherT = (WEATHER_RAW.weather ?? {}) as Record<string, unknown>;

export const DEFAULT_PLACE = str(weatherT, 'default_place', 'weather', 'Beijing');
export const DEFAULT_COORDS = {
  lat: num(weatherT, 'default_lat', 'weather', 39.9),
  lon: num(weatherT, 'default_lon', 'weather', 116.4),
};
export const CACHE_TTL = num(weatherT, 'cache_minutes', 'weather', 30) * 60 * 1000;

export const IP_ENDPOINTS = list<Record<string, unknown>>(WEATHER_RAW, 'weather.ip_endpoints').map((e, i) => {
  const where = `weather.ip_endpoints[${i}]`;
  return { url: str(e, 'url', where), lat: str(e, 'lat', where), lon: str(e, 'lon', where) };
});