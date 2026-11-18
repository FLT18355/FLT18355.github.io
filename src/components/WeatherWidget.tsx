// WeatherWidget.tsx - 首页最底部的 Local Weather 卡(仅首页挂载)
// 定位:navigator.geolocation -> 无 Key 的 IP 定位端点 -> 默认坐标(北京);
// 天气:Open-Meteo current_weather(免费、无需 Key)。
// 数据依赖访客位置,只能在浏览器侧请求(与 GitHub 卡片的构建时拉取正好相反,见 README「天气卡」)。
import { useEffect, useState } from 'react';
import { CACHE_KEY, buildForecastUrl, compassPoint, formatCoords, isCoords, num, weatherInfo, SOURCE_LABELS, WEATHER_ICONS } from '../data/weather';
import { CACHE_TTL, DEFAULT_COORDS, DEFAULT_PLACE, IP_ENDPOINTS } from '../data/runtime';
import type {
  CachedWeather,
  Coords,
  CurrentWeather,
  Forecast,
  PositionSource,
} from '../data/weather';
import GlassCard from './GlassCard';

/** 定位 / 请求的超时(ms):弱网下宁可退回粗定位,也不让卡片长时间空着 */
const GPS_TIMEOUT = 8000;
const GPS_MAX_AGE = 10 * 60 * 1000;
const IP_TIMEOUT = 6000;
const API_TIMEOUT = 8000;

type Phase = 'idle' | 'locating' | 'loading' | 'ready' | 'error';

const STATUS_TEXT: Record<Phase, string> = {
  idle: 'Weather needs JavaScript',
  locating: 'Locating your position...',
  loading: 'Fetching weather...',
  ready: '',
  error: 'Weather unavailable, refresh to retry',
};

const SOURCES = Object.keys(SOURCE_LABELS) as PositionSource[];

/** 带超时的 GET:浏览器不支持 AbortSignal.timeout 的老版本也能用 */
async function getJson<T>(url: string, ms: number): Promise<T> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  try {
    const res = await fetch(url, { signal: ac.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** 浏览器原生定位:拒绝 / 超时 / 不支持都返回 null,交给下一步兜底 */
function browserCoords(): Promise<Coords | null> {
  const geo = navigator.geolocation;
  if (!geo) return Promise.resolve(null);
  return new Promise((resolve) => {
    geo.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        resolve(isCoords(lat, lon) ? { lat, lon } : null);
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: GPS_TIMEOUT, maximumAge: GPS_MAX_AGE }
    );
  });
}

/** 已经明确被拒绝时直接跳过定位调用,省掉一次无谓的报错 */
async function geolocationBlocked(): Promise<boolean> {
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state === 'denied';
  } catch (e) {
    return false;
  }
}

/** IP 定位:端点按顺序试,只取经纬度;全部失败返回 null */
async function ipCoords(): Promise<Coords | null> {
  for (const endpoint of IP_ENDPOINTS) {
    try {
      const payload = await getJson<Record<string, unknown>>(endpoint.url, IP_TIMEOUT);
      const lat = Number(payload[endpoint.lat]);
      const lon = Number(payload[endpoint.lon]);
      if (isCoords(lat, lon)) return { lat, lon };
    } catch (e) {
      /* 换下一个端点 */
    }
  }
  return null;
}

async function resolveCoords(): Promise<{ coords: Coords; source: PositionSource }> {
  if (!(await geolocationBlocked())) {
    const gps = await browserCoords();
    if (gps) return { coords: gps, source: 'gps' };
  }
  const ip = await ipCoords();
  if (ip) return { coords: ip, source: 'ip' };
  return { coords: DEFAULT_COORDS, source: 'default' };
}

/** 字段统一转数字 / 字符串:API 返回异常值时不往界面上灌垃圾 */
function normalizeWeather(raw: CurrentWeather): CurrentWeather {
  return {
    time: typeof raw.time === 'string' ? raw.time : '',
    temperature: Number(raw.temperature),
    windspeed: Number(raw.windspeed),
    winddirection: Number(raw.winddirection),
    weathercode: Number(raw.weathercode),
    is_day: Number(raw.is_day),
  };
}

async function fetchWeather(target: Coords): Promise<{ data: CurrentWeather; timezone: string; abbr: string }> {
  const payload = await getJson<Forecast>(buildForecastUrl(target), API_TIMEOUT);
  const raw = payload.current_weather;
  if (!raw) throw new Error('no current_weather');
  const data = normalizeWeather(raw);
  if (!Number.isFinite(data.temperature)) throw new Error('bad temperature');
  return {
    data,
    timezone: payload.timezone ?? '',
    abbr: payload.timezone_abbreviation ?? '',
  };
}

function saveCache(
  coords: Coords,
  source: PositionSource,
  data: CurrentWeather,
  timezone: string,
  timezoneAbbreviation: string
): void {
  const payload: CachedWeather = {
    coords,
    source,
    data,
    timezone,
    timezoneAbbreviation,
    at: Date.now(),
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (e) {
    /* 存储不可用(隐私模式)时跳过缓存,不影响本次显示 */
  }
}

export default function WeatherWidget() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [source, setSource] = useState<PositionSource | null>(null);
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [timezone, setTimezone] = useState('');
  const [timezoneAbbr, setTimezoneAbbr] = useState('');

  const busy = phase === 'locating' || phase === 'loading';
  const info = current ? weatherInfo(current.weathercode, current.is_day === 1) : null;
  const iconPaths = WEATHER_ICONS[info?.icon ?? 'cloud'];
  const iconLabel = info?.label ?? 'Weather';
  const condText = info?.label ?? STATUS_TEXT[phase];
  const tempText = current ? num(current.temperature) : '--';
  const windText = current ? num(current.windspeed) + ' km/h' : '--';
  const windFrom = current ? 'from ' + compassPoint(current.winddirection) : '';
  /** 观测时间:`timezone=auto` 下 API 返回的就是该地当地时间,直接切字符串,不经过本地时区换算 */
  const observedTime = (() => {
    const t = current?.time ?? '';
    return t.length >= 16 ? t.slice(11, 16) : '--';
  })();
  const observedDate = (() => {
    const t = current?.time ?? '';
    return t.length >= 10 ? t.slice(0, 10) : '';
  })();
  const coordsText = coords ? formatCoords(coords) : '--';
  const sourceLabel = source ? SOURCE_LABELS[source] : '';
  const hint = (() => {
    if (phase !== 'ready') return '';
    if (source === 'default') {
      return `Geolocation and IP lookup both failed, showing ${DEFAULT_PLACE} (${formatCoords(
        DEFAULT_COORDS
      )}).`;
    }
    if (source === 'ip') {
      return 'Geolocation unavailable, position estimated from your IP address.';
    }
    return '';
  })();

  const load = async (): Promise<void> => {
    setPhase('locating');
    const resolved = await resolveCoords();
    setCoords(resolved.coords);
    setSource(resolved.source);
    setPhase('loading');
    try {
      const result = await fetchWeather(resolved.coords);
      setCurrent(result.data);
      setTimezone(result.timezone);
      setTimezoneAbbr(result.abbr);
      setPhase('ready');
      saveCache(resolved.coords, resolved.source, result.data, result.timezone, result.abbr);
    } catch (e) {
      setPhase('error');
    }
  };

  /** 30 分钟内的缓存直接复用:避免每次进首页都重新弹定位授权 */
  const restoreCache = (): boolean => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const cached = JSON.parse(raw) as CachedWeather;
      if (!cached || !cached.data || !cached.coords) return false;
      if (!isCoords(cached.coords.lat, cached.coords.lon)) return false;
      if (!SOURCES.includes(cached.source)) return false;
      if (!Number.isFinite(cached.at) || Date.now() - cached.at > CACHE_TTL) return false;
      setCoords(cached.coords);
      setSource(cached.source);
      setCurrent(normalizeWeather(cached.data));
      setTimezone(cached.timezone ?? '');
      setTimezoneAbbr(cached.timezoneAbbreviation ?? '');
      setPhase('ready');
      return true;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    if (!restoreCache()) void load();
  }, []);

  return (
    <GlassCard className="b-weather">
      <details className="block fold card-fold" data-fold="b-weather" open>
        <summary className="block-header fold-head">
          <h2>Local Weather</h2>
          <span className="fold-tail"><span className="fold-caret" aria-hidden="true" /></span>
        </summary>

        <div className="fold-body">
          <div className="weather-now" aria-busy={busy}>
            <div className="weather-icon" role="img" aria-label={iconLabel}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {iconPaths.map((d, i) => <path key={i} d={d} />)}
              </svg>
            </div>

            <div className="weather-main">
              <p className="weather-temp">
                <span>{tempText}</span>
                <span className="weather-unit">°C</span>
              </p>
              <p className="weather-cond" role="status">{condText}</p>
            </div>

            <button className="weather-refresh" type="button" disabled={busy} onClick={() => void load()}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
                <path d="M20.6 3.4v4.4h-4.4" />
              </svg>
              Refresh
            </button>
          </div>

          <dl className="weather-facts">
            <div className="weather-tile">
              <dt>Wind</dt>
              <dd>
                <span className="weather-value">{windText}</span>
                {windFrom ? <span className="weather-sub">{windFrom}</span> : null}
              </dd>
            </div>
            <div className="weather-tile">
              <dt>Observed</dt>
              <dd>
                <span className="weather-value">{observedTime}</span>
                {observedDate ? <span className="weather-sub">{observedDate} local</span> : null}
              </dd>
            </div>
            <div className="weather-tile">
              <dt>Timezone</dt>
              <dd>
                <span className="weather-value">{timezone || '--'}</span>
                {timezoneAbbr ? <span className="weather-sub">{timezoneAbbr}</span> : null}
              </dd>
            </div>
            <div className="weather-tile">
              <dt>Position</dt>
              <dd>
                <span className="weather-value">{coordsText}</span>
                {sourceLabel ? <span className="weather-sub">{sourceLabel}</span> : null}
              </dd>
            </div>
          </dl>

          {hint ? <p className="weather-hint">{hint}</p> : null}
          <p className="weather-note">
            Position from your browser or an IP lookup, weather from Open-Meteo (no API key). The result
            stays in your browser and is cached locally for 30 minutes.
          </p>
        </div>
      </details>
    </GlassCard>
  );
}
