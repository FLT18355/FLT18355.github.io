<script setup lang="ts">
// StatsCounter.vue - 首页 By the Numbers:进入视口时数字滚动计数
// 渐进增强:无 JS / reduced-motion 时直接显示终值;SSR 直出静态数字
import { onMounted, ref } from 'vue';
import { STATS } from '../data/site';

const counts = ref<number[]>(STATS.map((s) => s.value));
const started = ref(false);

const DURATION = 900;

function animate(): void {
  if (started.value) return;
  started.value = true;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  const targets = STATS.map((s) => s.value);
  const t0 = performance.now();
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  const step = (now: number): void => {
    const p = Math.min(1, (now - t0) / DURATION);
    counts.value = targets.map((v) => Math.round(v * ease(p)));
    if (p < 1) requestAnimationFrame(step);
    else counts.value = targets;
  };
  requestAnimationFrame(step);
}

onMounted(() => {
  const el = document.getElementById('statsBlock');
  if (!el) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        animate();
        io.unobserve(en.target);
      });
    },
    { threshold: 0.3 }
  );
  io.observe(el);
});
</script>

<template>
  <div class="stats-grid" id="statsBlock">
    <div v-for="(s, i) in STATS" :key="s.label" class="stat-card">
      <span class="stat-value">{{ counts[i] }}</span>
      <span class="stat-label">{{ s.label }}</span>
    </div>
  </div>
</template>
