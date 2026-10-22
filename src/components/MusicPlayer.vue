<script setup lang="ts">
// MusicPlayer.vue - 首页 Music Player
// 三个部分:封面 + 曲目信息 + 播放控制,下面是曲目列表(点一行即切歌)。
// 曲目来自 content/music.toml(gh-proxy 直链,浏览器端下载,不落地到仓库)。
// 播放中会把曲目与进度写进 localStorage,下次进站接着放;键盘 ← → 切歌。
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { TRACKS } from '../data/runtime';
import type { MusicTrack } from '../data/runtime';

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
  a.play().catch(() => {
    failed.value = true;
  });
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

/** 切到第 i 首;keepPlaying = true 时接着播(列表点击 / 上一首下一首) */
function select(i: number, keepPlaying = true): void {
  const n = TRACKS.length;
  if (n === 0) return;
  index.value = ((i % n) + n) % n;
  current.value = 0;
  duration.value = 0;
  failed.value = false;
  loading.value = true;
  /* audio 元素随 :key 重挂载,须等 DOM 更新后再 play,否则会继续播旧歌 */
  if (keepPlaying) nextTick(() => play());
}

function next(): void {
  select(index.value + 1, playing.value);
}
function prev(): void {
  select(index.value - 1, playing.value);
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
  select(index.value + 1);
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
  /* 关闭标签页 / 刷新 / 跳走都会触发 pagehide */
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
  <!-- 外层 <liquid-glass> 是玻璃面,内层 <details> 仍是折叠本体;色相类挂在外壳上,
       --acc 继承进卡片(见 src/styles/_glass.scss 与 scripts/glass.ts) -->
  <liquid-glass class="glass-card b-music" radius="14" strength="6" blur="7" chroma="0.4">
    <div class="ps-glass__content">
      <details class="block fold card-fold" data-fold="b-music" open>
        <summary class="block-header fold-head">
          <h2>Music</h2>
          <span class="fold-tail">
            <span class="block-note">{{ TRACKS.length }} tracks</span>
            <span class="fold-caret" aria-hidden="true" />
          </span>
        </summary>

        <div class="fold-body">
          <div class="music-player" :class="{ 'is-playing': playing }">
            <div class="music-stage">
              <div class="music-cover-wrap">
                <img
                  v-if="hasCover"
                  class="music-cover"
                  :src="track.cover"
                  :alt="`${track.title} cover art`"
                  width="132"
                  height="132"
                />
                <div v-else class="music-cover music-cover--placeholder" role="img" aria-label="No cover art">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z" />
                  </svg>
                </div>
                <span class="music-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
              </div>

              <div class="music-body">
                <p class="music-title">{{ track.title }}</p>
                <p class="music-artist">{{ track.artist }}</p>

                <div class="music-controls">
                  <button class="music-nav" type="button" aria-label="Previous track" :disabled="TRACKS.length < 2" @click="prev">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M6 6h2v12H6zM20 6v12L9 12z" />
                    </svg>
                  </button>
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
                  <button class="music-nav" type="button" aria-label="Next track" :disabled="TRACKS.length < 2" @click="next">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M16 6h2v12h-2zM4 6v12l11-6z" />
                    </svg>
                  </button>
                </div>
              </div>
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
                aria-label="Seek"
                @input="onSeek"
              />
              <div class="music-time">
                <span>{{ fmt(current) }}</span>
                <span class="music-status" role="status">
                  {{ failed ? 'Load failed' : loading ? 'Buffering…' : playing ? 'Playing' : 'Paused' }}
                </span>
                <span>{{ fmt(duration) }}</span>
              </div>
            </div>
          </div>

          <ol class="music-list">
            <li v-for="(t, i) in TRACKS" :key="t.src">
              <button
                class="music-row"
                type="button"
                :aria-current="i === index ? 'true' : undefined"
                @click="select(i)"
              >
                <span class="music-row-title">{{ t.title }}</span>
                <span class="music-row-artist">{{ t.artist }}</span>
              </button>
            </li>
          </ol>

          <audio
            ref="audioEl"
            :src="track.src"
            :key="track.src"
            preload="metadata"
            @timeupdate="onTime"
            @loadedmetadata="onMeta"
            @durationchange="onMeta"
            @play="onPlay"
            @pause="onPause"
            @waiting="onWaiting"
            @error="onError"
            @ended="onEnded"
          ></audio>
        </div>
      </details>
    </div>
  </liquid-glass>
</template>