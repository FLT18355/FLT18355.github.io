// motion.ts - 页面动效编排(渐进增强层)
// 依赖:_motion.scss;仅在支持 IntersectionObserver、用户未开启
// 「减弱动效」时激活(给 <html> 加 .motion-js 门控)。
// 由 Base.astro 作为模块脚本打包,defer 执行,等价于旧版 body 末尾 script。

(function () {
  'use strict';
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  root.classList.add('motion-js');


  /* ---------- 1. 区块滚动入场:一次性,触发后取消观察 ---------- */
  const blocks = Array.prototype.slice.call(document.querySelectorAll('.block'));
  /* 玻璃外壳(.glass-card)与内层 .block 一起观察:入场动画整体挂在壳上,
     内层只负责标题 / 正文 / 筹码的错峰入场,否则两层动画会叠起来(见 _glass.scss)。 */
  const glassHosts = Array.prototype.slice.call(document.querySelectorAll('.glass-card'));
  const footline = document.querySelector('.footline');

  /* 启动层在场时(首启加载 / 回访过渡)先把入场挂起:入场动画若在遮罩后面播完,
     揭幕时页面已经是静止的,这一遍编排等于白播。boot.ts 收尾时派发 boot:done。
     挂起期间不会空白:入场 keyframes 挂在 .block.in 上,没被观察到的区块本来就完全可见。 */
  let entryStarted = false;
  function startEntry(): void {
    if (entryStarted) return;
    entryStarted = true;

    /* 触发条件必须与元素高度无关:threshold 归零,只要求「有交集」,
       再用 rootMargin 把观察根下边缘上收 6%,让区块露出视口一点就入场。
       不能用 threshold 比例 —— 色板页区块在竖屏窄窗口可高达视口数倍,
       threshold 要求的绝对高度永远大于整个视口,isIntersecting 恒为 false,
       区块会永久停在 opacity:0,整张配色表看不见。
       底部收缩幅度保持小值:过大时页面最后的区块可能滚不到位而永不入场。 */
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add('in');
          io.unobserve(en.target);
        });
      },
      { threshold: 0, rootMargin: '0px 0px -6% 0px' }
    );
    blocks.concat(glassHosts).forEach((b) => io.observe(b));

    if (footline) {
      const ioFoot = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            en.target.classList.add('in');
            ioFoot.unobserve(en.target);
          });
        },
        { threshold: 0.1 }
      );
      ioFoot.observe(footline);
    }
  }

  if (root.classList.contains('boot-first') || root.classList.contains('boot-transition')) {
    document.addEventListener('boot:done', startEntry, { once: true });
    /* 兜底:motion.ts 与 boot.ts 同一个 bundle,正常情况下必然派发;
       这里只防「启动层节点缺失」这类意外,免得入场永远不开始 */
    window.setTimeout(startEntry, 7000);
  } else {
    startEntry();
  }

  /* ---------- 2. 悬停抬升由 CSS 完成(_motion.scss),这里不再挂指针监听 ---------- */

  /* ---------- 3. 阅读进度线 ---------- */
  const bar = document.createElement('div');
  bar.className = 'progress-line';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  let pRaf: number | null = null;
  function updateProgress() {
    pRaf = null;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    bar.style.setProperty('--p', p.toFixed(4));
    /* 顺带给出「已滚过顶部」的信号:与进度线共用这次回调,不另开监听 */
    root.classList.toggle('nav-scrolled', window.scrollY > 8);
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!pRaf) pRaf = requestAnimationFrame(updateProgress);
    },
    { passive: true }
  );
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();
})();
