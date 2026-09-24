<script setup lang="ts">
// WeatherWidget.vue - 首页最底部的 Local Weather 卡(仅首页挂载)
// 定位:navigator.geolocation -> 无 Key 的 IP 定位端点 -> 默认坐标(北京);
// 天气:Open-Meteo current_weather(免费、无需 Key)。
// 数据依赖访客位置,只能在浏览器侧请求(与 GitHub 卡片的构建时拉取正好相反,见 AGENTS.md)。
import { computed, onMounted, ref } from 'vue';
import {
  CACHE_KEY,
  CACHE_TTL,
  DEFAULT_COORDS,
  DEFAULT_PLACE,
  IP_ENDPOINTS,
  SOURCE_LABELS,
  WEATHER_ICONS,
  buildForecastUrl,
  compassPoint,
  formatCoords,
  isCoords,
  num,
  weatherInfo,
} from '../data/weather';
import type {
  CachedWeather,
  Coords,
  CurrentWeather,
  Forecast,
  PositionSource,
} from '../data/weather';

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

const phase = ref<Phase>('idle');
const coords = ref<Coords | null>(null);
const source = ref<PositionSource | null>(null);
const current = ref<CurrentWeather | null>(null);
const timezone = ref('');
const timezoneAbbr = ref('');

const busy = computed(() => phase.value === 'locating' || phase.value === 'loading');

const info = computed(() =>
  current.value ? weatherInfo(current.value.weathercode, current.value.is_day === 1) : null
);
const iconPaths = computed<string[]>(() => WEATHER_ICONS[info.value?.icon ?? 'cloud']);
const iconLabel = computed(() => info.value?.label ?? 'Weather');
const condText = computed(() => info.value?.label ?? STATUS_TEXT[phase.value]);

const tempText = computed(() => (current.value ? num(current.value.temperature) : '--'));
const windText = computed(() =>
  current.value ? num(current.value.windspeed) + ' km/h' : '--'
);
const windFrom = computed(() =>
  current.value ? 'from ' + compassPoint(current.value.winddirection) : ''
);
/** 观测时间:`timezone=auto` 下 API 返回的就是该地当地时间,直接切字符串,不经过本地时区换算 */
const observedTime = computed(() => {
  const t = current.value?.time ?? '';
  return t.length >= 16 ? t.slice(11, 16) : '--';
});
const observedDate = computed(() => {
  const t = current.value?.time ?? '';
  return t.length >= 10 ? t.slice(0, 10) : '';
});
const coordsText = computed(() => (coords.value ? formatCoords(coords.value) : '--'));
const sourceLabel = computed(() => (source.value ? SOURCE_LABELS[source.value] : ''));

const hint = computed(() => {
  if (phase.value !== 'ready') return '';
  if (source.value === 'default') {
    return `Geolocation and IP lookup both failed, showing ${DEFAULT_PLACE} (${formatCoords(
      DEFAULT_COORDS
    )}).`;
  }
  if (source.value === 'ip') {
    return 'Geolocation unavailable, position estimated from your IP address.';
  }
  return '';
});

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

async function fetchWeather(target: Coords): Promise<void> {
  const payload = await getJson<Forecast>(buildForecastUrl(target), API_TIMEOUT);
  const raw = payload.current_weather;
  if (!raw) throw new Error('no current_weather');
  const data = normalizeWeather(raw);
  if (!Number.isFinite(data.temperature)) throw new Error('bad temperature');
  current.value = data;
  timezone.value = payload.timezone ?? '';
  timezoneAbbr.value = payload.timezone_abbreviation ?? '';
}

function saveCache(): void {
  const c = coords.value;
  const d = current.value;
  const s = source.value;
  if (!c || !d || !s) return;
  const payload: CachedWeather = {
    coords: c,
    source: s,
    data: d,
    timezone: timezone.value,
    timezoneAbbreviation: timezoneAbbr.value,
    at: Date.now(),
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (e) {
    /* 存储不可用(隐私模式)时跳过缓存,不影响本次显示 */
  }
}

/** 30 分钟内的缓存直接复用:避免每次进首页都重新弹定位授权 */
function restoreCache(): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const cached = JSON.parse(raw) as CachedWeather;
    if (!cached || !cached.data || !cached.coords) return false;
    if (!isCoords(cached.coords.lat, cached.coords.lon)) return false;
    if (!SOURCES.includes(cached.source)) return false;
    if (!Number.isFinite(cached.at) || Date.now() - cached.at > CACHE_TTL) return false;
    coords.value = cached.coords;
    source.value = cached.source;
    current.value = normalizeWeather(cached.data);
    timezone.value = cached.timezone ?? '';
    timezoneAbbr.value = cached.timezoneAbbreviation ?? '';
    phase.value = 'ready';
    return true;
  } catch (e) {
    return false;
  }
}

async function load(): Promise<void> {
  phase.value = 'locating';
  const resolved = await resolveCoords();
  coords.value = resolved.coords;
  source.value = resolved.source;
  phase.value = 'loading';
  try {
    await fetchWeather(resolved.coords);
    phase.value = 'ready';
    saveCache();
  } catch (e) {
    phase.value = 'error';
  }
}

function refresh(): void {
  void load();
}

onMounted(() => {
  if (!restoreCache()) void load();
});
</script>

<template>
  <section class="block b-weather">
    <div class="block-header">
      <h2>Local Weather</h2>
    </div>

    <div class="weather-now" :aria-busy="busy">
      <div class="weather-icon" role="img" :aria-label="iconLabel">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path v-for="(d, i) in iconPaths" :key="i" :d="d" />
        </svg>
      </div>

      <div class="weather-main">
        <p class="weather-temp">
          <span>{{ tempText }}</span>
          <span class="weather-unit">°C</span>
        </p>
        <p class="weather-cond" role="status">{{ condText }}</p>
      </div>

      <button class="weather-refresh" type="button" :disabled="busy" @click="refresh">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
          <path d="M20.6 3.4v4.4h-4.4" />
        </svg>
        Refresh
      </button>
    </div>

    <dl class="weather-facts">
      <div class="weather-tile">
        <dt>Wind</dt>
        <dd>
          <span class="weather-value">{{ windText }}</span>
          <span v-if="windFrom" class="weather-sub">{{ windFrom }}</span>
        </dd>
      </div>
      <div class="weather-tile">
        <dt>Observed</dt>
        <dd>
          <span class="weather-value">{{ observedTime }}</span>
          <span v-if="observedDate" class="weather-sub">{{ observedDate }} local</span>
        </dd>
      </div>
      <div class="weather-tile">
        <dt>Timezone</dt>
        <dd>
          <span class="weather-value">{{ timezone || '--' }}</span>
          <span v-if="timezoneAbbr" class="weather-sub">{{ timezoneAbbr }}</span>
        </dd>
      </div>
      <div class="weather-tile">
        <dt>Position</dt>
        <dd>
          <span class="weather-value">{{ coordsText }}</span>
          <span v-if="sourceLabel" class="weather-sub">{{ sourceLabel }}</span>
        </dd>
      </div>
    </dl>

    <p v-if="hint" class="weather-hint">{{ hint }}</p>
    <p class="weather-note">
      Position from your browser or an IP lookup, weather from Open-Meteo (no API key). The result
      stays in your browser and is cached locally for 30 minutes.
    </p>
  </section>
</template>
