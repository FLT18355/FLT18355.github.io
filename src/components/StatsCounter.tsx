// StatsCounter.tsx - 首页 By the Numbers:进入视口时数字滚动计数
// 渐进增强:无 JS / reduced-motion 时直接显示终值;SSR 直出静态数字
import { useEffect, useRef, useState } from 'react';
import { STATS } from '../data/content';

const DURATION = 900;
const TARGETS = STATS.map((s) => s.value);

export default function StatsCounter() {
  const [counts, setCounts] = useState<number[]>(TARGETS);
  const started = useRef(false);

  useEffect(() => {
    const el = document.getElementById('statsBlock');
    if (!el) return;

    const animate = (): void => {
      if (started.current) return;
      started.current = true;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce || !('IntersectionObserver' in window)) return;
      const t0 = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - t, 3);
      const step = (now: number): void => {
        const p = Math.min(1, (now - t0) / DURATION);
        setCounts(TARGETS.map((v) => Math.round(v * ease(p))));
        if (p < 1) requestAnimationFrame(step);
        else setCounts(TARGETS);
      };
      requestAnimationFrame(step);
    };

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
    return () => io.disconnect();
  }, []);

  return (
    <div className="stats-grid" id="statsBlock">
      {STATS.map((s, i) => (
        <div key={s.label} className="stat-card">
          <span className="stat-value">{counts[i]}</span>
          <span className="stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
