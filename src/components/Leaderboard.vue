<script setup lang="ts">
// Leaderboard.vue - following 页底部:BenchLM AI 编程能力 Top 10 排行榜
// 数据源:https://benchlm.ai/api/data/leaderboard?limit=10
// 全英文 UI;仅显示 3 行,超出部分垂直滚动查看
import { computed, onMounted, ref } from 'vue';

interface Model {
  rank: number;
  model: string;
  creator: string;
  categoryScores?: { coding?: number | null };
}

const API_URL = 'https://benchlm.ai/api/data/leaderboard?limit=10';
const rows = ref<Model[]>([]);
const loaded = ref(false);
const failed = ref(false);
const updated = ref('');

const visible = computed(() => rows.value);

function fmt(n: number | null | undefined): string {
  if (n == null) return '-';
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

/** 相对最高分的条形宽度(百分比),用于可视化分数对比 */
function barWidth(m: Model): string {
  const max = Math.max(
    1,
    ...rows.value.map((r) => (r.categoryScores && r.categoryScores.coding) || 0)
  );
  const score = (m.categoryScores && m.categoryScores.coding) || 0;
  return Math.max(8, Math.round((score / max) * 100)) + '%';
}

const MEDALS = [
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8z"/></svg>',
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8z"/></svg>',
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8z"/></svg>',
];

onMounted(async () => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    rows.value = Array.isArray(data.models) ? data.models : [];
    if (data.lastUpdated) updated.value = data.lastUpdated;
    loaded.value = true;
  } catch (e) {
    failed.value = true;
  }
});
</script>

<template>
  <section class="block b-leaderboard">
    <div class="block-header">
      <h2>AI Coding Leaderboard</h2>
    </div>
    <p class="leaderboard-note">
      Top 10 models by coding ability, from BenchLM
      <template v-if="updated"> · Updated {{ updated }}</template>
    </p>

    <div v-if="failed" class="leaderboard-state" role="alert">Failed to load leaderboard.</div>
    <div v-else-if="!loaded" class="leaderboard-state">Loading...</div>
    <div v-else>
      <div class="leaderboard-head" aria-hidden="true">
        <span class="leaderboard-head-rank">#</span>
        <span class="leaderboard-head-model">Model</span>
        <span class="leaderboard-head-score">Coding</span>
      </div>
      <div class="leaderboard-list" role="list">
        <div
          v-for="m in visible"
          :key="m.rank"
          class="leaderboard-row"
          :class="'leaderboard-row--' + m.rank"
          role="listitem"
        >
          <span class="leaderboard-rank">
            <span v-if="m.rank <= 3" class="leaderboard-medal" v-html="MEDALS[m.rank - 1]"></span>
            <span v-else>{{ m.rank }}</span>
          </span>
          <span class="leaderboard-name">
            <span class="leaderboard-model">{{ m.model }}</span>
            <span class="leaderboard-creator">{{ m.creator }}</span>
          </span>
          <span class="leaderboard-score">
            <span class="leaderboard-score-bar" :style="{ width: barWidth(m) }"></span>
            <span class="leaderboard-score-num">{{ fmt(m.categoryScores && m.categoryScores.coding) }}</span>
            <span class="leaderboard-score-label">coding</span>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>