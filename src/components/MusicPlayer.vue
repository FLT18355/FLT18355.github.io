<script setup lang="ts">
// MusicPlayer.vue - 首页 Music Player - Test 播放器:自动下载 release 音频(preload=auto),支持播放/暂停/进度跳转
// 音源来自 src/data/music.ts(gh-proxy 直链,浏览器端下载,不落地到仓库)
import { ref } from 'vue';
import { MUSIC_TRACK } from '../data/music';

const audioEl = ref<HTMLAudioElement | null>(null);
const playing = ref(false);
const loading = ref(false);
const failed = ref(false);
const current = ref(0);
const duration = ref(0);

function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

function toggle(): void {
  const a = audioEl.value;
  if (!a) return;
  if (a.paused) {
    a.play().catch(() => { failed.value = true; });
  } else {
    a.pause();
  }
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
}
function onPause(): void {
  playing.value = false;
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
}
function onSeek(e: Event): void {
  const a = audioEl.value;
  if (!a || !Number.isFinite(a.duration)) return;
  const t = Number((e.target as HTMLInputElement).value);
  if (Number.isFinite(t)) a.currentTime = t;
}
</script>

<template>
  <section class="block b-music">
    <div class="block-header">
      <h2>Music Player - Test</h2>
    </div>

    <div class="music-player" :class="{ 'is-playing': playing }">
      <img class="music-cover" :src="MUSIC_TRACK.cover" :alt="MUSIC_TRACK.title" width="96" height="96" />

      <div class="music-body">
        <div class="music-head">
          <div class="music-meta">
            <span class="music-title">{{ MUSIC_TRACK.title }}</span>
            <span class="music-artist">{{ MUSIC_TRACK.artist }}</span>
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

      <div class="music-eq" aria-hidden="true">
        <i></i><i></i><i></i>
      </div>
    </div>

    <audio
      ref="audioEl"
      :src="MUSIC_TRACK.src"
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
