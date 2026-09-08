<script setup lang="ts">
// ThemeToggle.vue - 主题拨钮(原 app.js 逻辑)
// 场景交叉淡化由 CSS --p 驱动(#themeToggle.dragging 规则),JS 只写变量
import { onMounted } from 'vue';

interface ViewTransitionLike {
  ready: Promise<void>;
}
type VTDocument = Document & {
  startViewTransition?: (cb: () => void) => ViewTransitionLike;
};

onMounted(() => {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle') as HTMLButtonElement | null;
  if (!btn) return;
  const knob = btn.querySelector('.knob') as HTMLElement;

  /* demo 原布局:200×90 含 2px 边框,内容宽 196,滑钮 86px → 行程 110px(与 demo translateX(110px) 一致) */
  const MAX_X = 110;

  const isMocha = () => root.getAttribute('data-theme') === 'mocha';

  const THEME_COLOR: Record<string, string> = { mocha: '#1e1e2e', latte: '#eff1f5' };

  const syncMetaTheme = () => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLOR[root.getAttribute('data-theme') || 'mocha'] || THEME_COLOR.mocha);
  };

  const commitTheme = (prevTheme: string | null, nextTheme: string) => {
    if (prevTheme === nextTheme) return;
    const apply = () => {
      root.setAttribute('data-theme', nextTheme);
      syncMetaTheme();
      try {
        localStorage.setItem('theme', nextTheme);
      } catch (err) {
        /* 隐私模式下写入失败可忽略 */
      }
    };
    /* 圆形揭示:新主题快照从拨钮中心向外扩散盖过旧快照。
       用原生 View Transition API,扩散的是新主题画面本身,不存在遮罩层,
       切换全程不遮挡任何内容;不支持或减弱动效时直接瞬切。 */
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = document as VTDocument;
    if (doc.startViewTransition && !reduce) {
      const r = btn.getBoundingClientRect();
      const ox = r.left + r.width / 2;
      const oy = r.top + r.height / 2;
      const radius =
        Math.hypot(Math.max(ox, window.innerWidth - ox), Math.max(oy, window.innerHeight - oy)) + 2;
      const vt = doc.startViewTransition(apply);
      vt.ready.then(
        () => {
          document.documentElement.animate(
            [
              { clipPath: `circle(0px at ${ox}px ${oy}px)` },
              { clipPath: `circle(${radius}px at ${ox}px ${oy}px)` },
            ],
            {
              duration: 540,
              easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        },
        () => {
          /* 过渡被浏览器跳过时静默 */
        }
      );
    } else {
      apply();
    }
  };

  const setProgress = (p: number) => btn.style.setProperty('--p', String(p));
  const clearProgress = () => btn.style.removeProperty('--p');

  let drag: {
    pointerId: number;
    startClientX: number;
    startClientY: number;
    baseX: number;
    scale: number;
    moved: boolean;
    lastX: number;
  } | null = null;

  btn.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.button && e.button !== 0) return;
    const rect = btn.getBoundingClientRect();
    const scale = rect.width / 200; /* 含 hover 放大的实际缩放 */
    const base = isMocha() ? MAX_X : 0;
    drag = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      baseX: base,
      scale,
      moved: false,
      lastX: base,
    };
    /* 拖动中固定缩放,避免 hover 放大干扰坐标换算 */
    btn.style.transform = `scale(${scale})`;
    btn.classList.add('dragging');
    try {
      btn.setPointerCapture(e.pointerId);
    } catch (err) {
      /* 部分浏览器不支持时忽略 */
    }
  });

  btn.addEventListener('pointermove', (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startClientX;
    const dy = e.clientY - drag.startClientY;
    if (!drag.moved && Math.sqrt(dx * dx + dy * dy) > 4) drag.moved = true;
    if (!drag.moved) return;

    const raw = drag.baseX + dx / drag.scale; /* 视觉位移换算回布局坐标 */
    const target = Math.max(0, Math.min(MAX_X, raw));

    knob.style.transform = `translateX(${target}px)`;
    setProgress(target / MAX_X);
    drag.lastX = target;
  });

  const finishDrag = (e: PointerEvent) => {
    if (!drag) return;

    if (e.type === 'pointerup') {
      const dx = e.clientX - drag.startClientX;
      const dy = e.clientY - drag.startClientY;
      const isClick = Math.sqrt(dx * dx + dy * dy) < 4;
      const toNight = isClick ? !isMocha() : drag.lastX > MAX_X / 2;

      const from = root.getAttribute('data-theme');
      commitTheme(from, toNight ? 'mocha' : 'latte');
    }

    /* 清 inline 样式:CSS 过渡带 overshoot 从当前拖动位置飞向目标 */
    btn.removeAttribute('style');
    knob.removeAttribute('style');
    clearProgress();
    btn.classList.remove('dragging');

    drag = null;
  };

  btn.addEventListener('pointerup', finishDrag);
  btn.addEventListener('pointercancel', finishDrag);

  /* 键盘可达:Enter / 空格 翻转(preventDefault 避免原生 click 二次翻转) */
  btn.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const from = root.getAttribute('data-theme');
      commitTheme(from, from === 'mocha' ? 'latte' : 'mocha');
    }
  });
});
</script>

<template>
  <button
    class="theme-toggle"
    id="themeToggle"
    type="button"
    aria-label="切换 Latte / Mocha 配色"
    title="切换主题"
  >
    <span class="sun" aria-hidden="true"></span>
    <span class="cloud cloud1" aria-hidden="true"></span>
    <span class="cloud cloud2" aria-hidden="true"></span>
    <span class="cloud cloud3" aria-hidden="true"></span>
    <span class="cloud cloud4" aria-hidden="true"></span>
    <span class="moon" aria-hidden="true"></span>
    <span class="star s1" aria-hidden="true"></span>
    <span class="star s2" aria-hidden="true"></span>
    <span class="star s3" aria-hidden="true"></span>
    <span class="star s4" aria-hidden="true"></span>
    <span class="star s5" aria-hidden="true"></span>
    <span class="star s6" aria-hidden="true"></span>
    <span class="star s7" aria-hidden="true"></span>
    <span class="star s8" aria-hidden="true"></span>
    <span class="knob" aria-hidden="true"></span>
  </button>
</template>
