// weather.ts - 首页 Local Weather 卡的数据源:定位链路、Open-Meteo 请求、WMO 天气码与图标
// 与 GitHub 资料卡(github.ts,构建时拉取)方向相反:天气依赖访客所在位置,
// 只能在浏览器侧请求,所以这里的一切都是给 client:load 的 Vue 岛(WeatherWidget.vue)用的。
// 定位链路:navigator.geolocation -> 无 Key 的 IP 定位端点 -> 默认坐标(北京)。

export interface Coords {
  lat: number;
  lon: number;
}

/** 定位方式:浏览器定位 / IP 定位 / 兜底默认值 */
export type PositionSource = 'gps' | 'ip' | 'default';

/** 定位全部失败时的兜底坐标(北京),保证卡片永远有内容 */
export const DEFAULT_COORDS: Coords = { lat: 39.9, lon: 116.4 };

/** 兜底坐标对应的地名:卡片文案与定位方式标签都取自这里,换默认地点只改一处 */
export const DEFAULT_PLACE = 'Beijing';

/** Open-Meteo 当前天气(免费,无需 API Key)。
 *  不传 temperature_unit / windspeed_unit,即用默认单位:°C 与 km/h。 */
export const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

/** 无 Key 的 IP 定位端点:按顺序尝试,全部失败才退回 DEFAULT_COORDS。
 *  只取经纬度两个字段,响应里其余字段一律不用(隐私最小化)。 */
export const IP_ENDPOINTS: { url: string; lat: string; lon: string }[] = [
  { url: 'https://ipwho.is/', lat: 'latitude', lon: 'longitude' },
  { url: 'https://get.geojs.io/v1/ip/geo.json', lat: 'latitude', lon: 'longitude' },
];

export const SOURCE_LABELS: Record<PositionSource, string> = {
  gps: 'GPS',
  ip: 'IP location',
  default: `Default (${DEFAULT_PLACE})`,
};

/** 结果缓存:同一坐标 30 分钟内直接复用,避免每次进首页都弹一次定位授权 */
export const CACHE_KEY = 'weather-cache';
export const CACHE_TTL = 30 * 60 * 1000;

/** Open-Meteo 响应里真正用到的部分(字段名与 API 一致,保持 snake_case) */
export interface CurrentWeather {
  /** 当地时间 ISO(请求带 timezone=auto),如 2026-09-20T20:45 */
  time: string;
  temperature: number;
  windspeed: number;
  /** 风的来向,度 */
  winddirection: number;
  /** WMO 天气码 */
  weathercode: number;
  /** 1 = 白天,0 = 夜晚 */
  is_day: number;
}

export interface Forecast {
  timezone?: string;
  timezone_abbreviation?: string;
  current_weather?: CurrentWeather;
}

export interface CachedWeather {
  coords: Coords;
  source: PositionSource;
  data: CurrentWeather;
  timezone: string;
  timezoneAbbreviation: string;
  /** 写入时间戳(ms) */
  at: number;
}

/** 天气请求 URL。timezone=auto:返回的 time 即该地当地时间 */
export function buildForecastUrl(coords: Coords): string {
  return `${FORECAST_ENDPOINT}?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&timezone=auto`;
}

/** 坐标合法性:IP 定位端点返回的字段可能是字符串或垃圾值,统一在这里挡掉 */
export function isCoords(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
  );
}

const COMPASS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];

/** 16 方位文字(传风的来向角度) */
export function compassPoint(deg: number): string {
  if (!Number.isFinite(deg)) return '';
  const i = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return COMPASS[i];
}

/** 保留一位小数,整数不带 .0(24.0 -> 24) */
export function num(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '--';
  const s = value.toFixed(digits);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}

/** 经纬度展示:两位小数,便于和地图对上 */
export function formatCoords(coords: Coords): string {
  return `${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}`;
}

export type WeatherIcon =
  | 'sun'
  | 'moon'
  | 'sun-cloud'
  | 'moon-cloud'
  | 'cloud'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder';

export interface WeatherEntry {
  label: string;
  icon: WeatherIcon;
  /** 夜间替换图标(只有晴 / 少云需要) */
  iconNight?: WeatherIcon;
}

/** WMO 天气码 -> 文案与图标(Open-Meteo 文档的 code 表) */
export const WMO_WEATHER: Record<number, WeatherEntry> = {
  0: { label: 'Clear sky', icon: 'sun', iconNight: 'moon' },
  1: { label: 'Mainly clear', icon: 'sun', iconNight: 'moon' },
  2: { label: 'Partly cloudy', icon: 'sun-cloud', iconNight: 'moon-cloud' },
  3: { label: 'Overcast', icon: 'cloud' },
  45: { label: 'Fog', icon: 'fog' },
  48: { label: 'Depositing rime fog', icon: 'fog' },
  51: { label: 'Light drizzle', icon: 'drizzle' },
  53: { label: 'Drizzle', icon: 'drizzle' },
  55: { label: 'Dense drizzle', icon: 'drizzle' },
  56: { label: 'Light freezing drizzle', icon: 'drizzle' },
  57: { label: 'Dense freezing drizzle', icon: 'drizzle' },
  61: { label: 'Slight rain', icon: 'rain' },
  63: { label: 'Rain', icon: 'rain' },
  65: { label: 'Heavy rain', icon: 'rain' },
  66: { label: 'Light freezing rain', icon: 'rain' },
  67: { label: 'Heavy freezing rain', icon: 'rain' },
  71: { label: 'Slight snow', icon: 'snow' },
  73: { label: 'Snow', icon: 'snow' },
  75: { label: 'Heavy snow', icon: 'snow' },
  77: { label: 'Snow grains', icon: 'snow' },
  80: { label: 'Slight rain showers', icon: 'rain' },
  81: { label: 'Rain showers', icon: 'rain' },
  82: { label: 'Violent rain showers', icon: 'rain' },
  85: { label: 'Slight snow showers', icon: 'snow' },
  86: { label: 'Heavy snow showers', icon: 'snow' },
  95: { label: 'Thunderstorm', icon: 'thunder' },
  96: { label: 'Thunderstorm with slight hail', icon: 'thunder' },
  99: { label: 'Thunderstorm with heavy hail', icon: 'thunder' },
};

const UNKNOWN_WEATHER: WeatherEntry = { label: 'Unknown', icon: 'cloud' };

/** 天气码 -> 文案 + 图标(夜间换月相图标) */
export function weatherInfo(code: number, isDay: boolean): { label: string; icon: WeatherIcon } {
  const entry = WMO_WEATHER[code] ?? UNKNOWN_WEATHER;
  const icon = !isDay && entry.iconNight ? entry.iconNight : entry.icon;
  return { label: entry.label, icon };
}

/** 图标 path(24x24 描边,stroke 由 CSS 给)。云、月亮拆出来复用,避免多处重复长 path。 */
const CLOUD = [
  'M7 17.6 H15.4 A3.9 3.9 0 0 0 16.3 9.9 A5.6 5.6 0 0 0 5.7 8.8 A4.2 4.2 0 0 0 7 17.6 Z',
];
const MOON = ['M20.4 14.7 A8.6 8.6 0 0 1 9.3 3.6 A8.6 8.6 0 1 0 20.4 14.7 Z'];
/** 组合图标里的云:略小,落在右下;降水类则是云体上移,给下方留位置 */
const CLOUD_SMALL = [
  'M9.1 20.24 H16.66 A3.51 3.51 0 0 0 17.47 13.31 A5.04 5.04 0 0 0 7.93 12.32 A3.78 3.78 0 0 0 9.1 20.24 Z',
];
const CLOUD_UP = [
  'M7 15.4 H15.4 A3.9 3.9 0 0 0 16.3 7.7 A5.6 5.6 0 0 0 5.7 6.6 A4.2 4.2 0 0 0 7 15.4 Z',
];

export const WEATHER_ICONS: Record<WeatherIcon, string[]> = {
  sun: [
    'M16.2 12a4.2 4.2 0 1 1-8.4 0 4.2 4.2 0 1 1 8.4 0',
    'M12 3.2v2.2',
    'M12 18.6v2.2',
    'M3.2 12h2.2',
    'M18.6 12h2.2',
    'M5.9 5.9l1.6 1.6',
    'M16.5 16.5l1.6 1.6',
    'M18.1 5.9l-1.6 1.6',
    'M7.5 16.5l-1.6 1.6',
  ],
  moon: MOON,
  'sun-cloud': [
    'M9.8 6.9a2.9 2.9 0 1 1-5.8 0 2.9 2.9 0 1 1 5.8 0',
    'M6.9 1.5v1.9',
    'M1.5 6.9h1.9',
    'M3.1 3.1l1.3 1.3',
    ...CLOUD_SMALL,
  ],
  'moon-cloud': [
    'M13.14 8.97 A5.16 5.16 0 0 1 6.48 2.31 A5.16 5.16 0 1 0 13.14 8.97 Z',
    ...CLOUD_SMALL,
  ],
  cloud: CLOUD,
  fog: [...CLOUD_UP, 'M4.4 18.6h15.2', 'M6.6 21.6h10.8'],
  drizzle: [...CLOUD_UP, 'M9.6 18.2l-1 2.4', 'M14.4 18.2l-1 2.4'],
  rain: [...CLOUD_UP, 'M8.6 18l-1.2 2.8', 'M12.6 18l-1.2 2.8', 'M16.6 18l-1.2 2.8'],
  snow: [...CLOUD_UP, 'M8.8 19.4h.01', 'M12.4 21.2h.01', 'M15.8 19.4h.01'],
  thunder: [...CLOUD_UP, 'M13.2 17.4l-3 5h2.6l-.7 3 3.3-4.6h-2.6z'],
};
