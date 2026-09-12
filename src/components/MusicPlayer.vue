<script setup lang="ts">
// MusicPlayer.vue - 首页 Music Player - Test 播放器
// 多曲目(TRACKS):左侧/右侧键切换;preload=auto 自动下载;退出时 localStorage 保存当前曲目与进度
// 音源来自 src/data/music.ts(gh-proxy 直链,浏览器端下载,不落地到仓库)
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { TRACKS } from '../data/music';
import type { MusicTrack } from '../data/music';

const STORE_KEY = 'music-player-state';

const audioEl = ref<HTMLAudioElement | null>(null);
const index = ref(0);
const playing = ref(false);
const loading = ref(false);
const failed = ref(false);
const current = ref(0);
const duration = ref(0);

const track = computed<MusicTrack>(() => TRACKS[index.value]);
const hasCover = computed(() => !!track.value.cover);

function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

function play(): void {
  const a = audioEl.value;
  if (!a) return;
  a.play().catch(() => { failed.value = true; });
}
function pause(): void {
  const a = audioEl.value;
  if (a) a.pause();
}
function toggle(): void {
  const a = audioEl.value;
  if (!a) return;
  if (a.paused) play();
  else pause();
}

/** 切换曲目:前往 next/prev;保持播放状态(若正在播放则继续下一首) */
function step(delta: number): void {
  const n = TRACKS.length;
  if (n < 2) return;
  index.value = (index.value + delta + n) % n;
  current.value = 0;
  duration.value = 0;
  failed.value = false;
  loading.value = true;
  if (playing.value) {
    /* audio 元素随 :key 重挂载,须等 DOM 更新后再 play,否则会继续播旧歌 */
    nextTick(() => play());
  }
}
function next(): void {
  step(1);
}
function prev(): void {
  step(-1);
}

function onTime(): void {
  const a = audioEl.value;
  if (a) current.value = a.currentTime;
}
function onMeta(): void {
  const a = audioEl.value;
  if (a && Number.isFinite(a.duration)) duration.value = a.duration;
}
function onPlay(): void {
  playing.value = true;
  failed.value = false;
  loading.value = false;
  save();
}
function onPause(): void {
  playing.value = false;
  save();
}
function onWaiting(): void {
  loading.value = true;
}
function onError(): void {
  loading.value = false;
  playing.value = false;
  failed.value = true;
}
function onEnded(): void {
  playing.value = false;
  current.value = 0;
  next();
}
function onSeek(e: Event): void {
  const a = audioEl.value;
  if (!a || !Number.isFinite(a.duration)) return;
  const t = Number((e.target as HTMLInputElement).value);
  if (Number.isFinite(t)) a.currentTime = t;
}

function onKeydown(e: KeyboardEvent): void {
  const t = e.target as HTMLElement | null;
  const tag = t && t.tagName ? t.tagName : '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    next();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    prev();
  }
}

function save(): void {
  try {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ index: index.value, time: current.value, playing: playing.value })
    );
  } catch (e) {
    /* 存储不可用时静默 */
  }
}

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const st = JSON.parse(raw) as { index?: number; time?: number } | null;
      if (st && typeof st.index === 'number' && st.index >= 0 && st.index < TRACKS.length) {
        index.value = st.index;
      }
      if (st && typeof st.time === 'number' && st.time > 0) {
        current.value = st.time;
      }
    }
  } catch (e) {
    /* 解析失败用默认第一首 */
  }
  document.addEventListener('keydown', onKeydown);
  /* 退出/离开页面时保存(关闭标签页/刷新/跳走都会触发 pagehide) */
  window.addEventListener('pagehide', save);
  const a = audioEl.value;
  if (a) a.currentTime = current.value;
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
  window.removeEventListener('pagehide', save);
  save();
});
</script>

<template>
  <section class="block b-music">
    <div class="block-header">
      <h2>Music Player - Test</h2>
    </div>

    <div class="music-player" :class="{ 'is-playing': playing }">
      <button
        class="music-nav"
        type="button"
        aria-label="Previous track"
        :disabled="TRACKS.length < 2"
        @click="prev"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 6h2v12H6zM20 6v12L9 12z" />
        </svg>
      </button>

      <div class="music-cover-wrap">
        <img v-if="hasCover" class="music-cover" :src="track.cover" :alt="track.title" width="96" height="96" />
        <div v-else class="music-cover music-cover--placeholder" role="img" aria-label="No cover art">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z" />
          </svg>
        </div>
      </div>

      <div class="music-body">
        <div class="music-head">
          <div class="music-meta">
            <span class="music-title">{{ track.title }}</span>
            <span class="music-artist">{{ track.artist }}</span>
          </div>
          <button
            class="music-toggle"
            type="button"
            :aria-label="playing ? 'Pause' : 'Play'"
            :aria-pressed="playing"
            @click="toggle"
          >
            <svg v-if="playing" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>

        <div class="music-bar">
          <input
            class="music-seek"
            type="range"
            min="0"
            :max="duration || 0"
            step="0.1"
            :value="current"
            :disabled="!duration"
            :aria-label="'Seek'"
            @input="onSeek"
          />
          <div class="music-time">
            <span>{{ fmt(current) }}</span>
            <span class="music-status" role="status">
              {{ failed ? 'Load failed' : loading ? 'Buffering...' : playing ? 'Playing' : 'Paused' }}
            </span>
            <span>{{ fmt(duration) }}</span>
          </div>
        </div>
      </div>

      <button
        class="music-nav"
        type="button"
        aria-label="Next track"
        :disabled="TRACKS.length < 2"
        @click="next"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16 6h2v12h-2zM4 6v12l11-6z" />
        </svg>
      </button>
    </div>

    <audio
      ref="audioEl"
      :src="track.src"
      :key="track.src"
      preload="auto"
      @timeupdate="onTime"
      @loadedmetadata="onMeta"
      @durationchange="onMeta"
      @play="onPlay"
      @pause="onPause"
      @waiting="onWaiting"
      @error="onError"
      @ended="onEnded"
    ></audio>
  </section>
</template>