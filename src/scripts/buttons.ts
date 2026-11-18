// buttons.ts - 给 fx 玻璃按钮补 demo 的 .circle-overlay 装饰层
// 纯视觉节点;按钮本身可点、可聚焦。React 重渲染后由 MutationObserver 补回。

(function () {
  'use strict';
  const SELECTOR =
    '.mode-switch-btn, .search-go, .search-engine, .clock-toggle, .search-clear, .quicklink, .music-nav, .music-toggle, .weather-refresh, .reader-btn, .reader-font-close, .err404-search-go, .err404-back';
  let queued = false;

  function decorate(): void {
    queued = false;
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
      if (el.querySelector(':scope > .circle-overlay')) return;
      const ring = document.createElement('span');
      ring.className = 'circle-overlay';
      ring.setAttribute('aria-hidden', 'true');
      el.appendChild(ring);
    });
  }

  function schedule(): void {
    if (queued) return;
    queued = true;
    requestAnimationFrame(decorate);
  }

  decorate();
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });

  /* ---------- 按下挤压:照低配玻璃球的 jellyBack(0.22, 560) ---------- */
  const PRESS =
    'button:not(.theme-toggle), .nav-item, .quicklink, .search-chip, .swatch';
  const pressed = new Map<HTMLElement, Animation>();

  function press(el: HTMLElement): void {
    if (el.hasAttribute('disabled') || !('animate' in el)) return;
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    } catch (e) {
      /* 查询不支持 */
    }
    pressed.get(el)?.cancel();
    pressed.set(
      el,
      el.animate(
        [{ scale: '1 1' }, { scale: '1.08 0.9' }],
        { duration: 90, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' }
      )
    );
  }

  function release(el: HTMLElement): void {
    const anim = pressed.get(el);
    if (!anim) return;
    pressed.delete(el);
    anim.cancel();
    if (!('animate' in el)) return;
    el.animate(
      [{ scale: '1.08 0.9' }, { scale: '1 1' }],
      { duration: 600, easing: 'cubic-bezier(0.2, 1.6, 0.35, 1)' }
    );
  }

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const target = e.target as Element | null;
    const el = target?.closest<HTMLElement>(PRESS);
    if (el) press(el);
  });
  document.addEventListener('pointerup', () => pressed.forEach((_, el) => release(el)));
  document.addEventListener('pointercancel', () => pressed.forEach((_, el) => release(el)));

  /* 键盘 Enter / Space 也挤压一次 */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target as Element | null;
    const el = target?.closest<HTMLElement>(PRESS);
    if (el) press(el);
  });
  document.addEventListener('keyup', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target as Element | null;
    const el = target?.closest<HTMLElement>(PRESS);
    if (el) release(el);
  });
})();
