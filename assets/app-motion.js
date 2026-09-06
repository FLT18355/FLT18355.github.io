/* app-motion.js — 页面动效编排（渐进增强层）
   依赖：assets/motion.css；仅在支持 IntersectionObserver、
   用户未开启「减弱动效」时激活（给 <html> 加 .motion-js 门控）。 */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  root.classList.add('motion-js');

  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- 1. 区块滚动入场：一次性，触发后取消观察 ---------- */
  var blocks = Array.prototype.slice.call(document.querySelectorAll('.block'));
  var footline = document.querySelector('.footline');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  blocks.forEach(function (b) { io.observe(b); });

  if (footline) {
    var ioFoot = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        ioFoot.unobserve(en.target);
      });
    }, { threshold: 0.1 });
    ioFoot.observe(footline);
  }

  /* ---------- 2. 指针光斑 + 卡片 3D 微倾斜（仅精确指针） ---------- */
  if (fine) {
    var TILT = 5.5;
    var cards = Array.prototype.slice.call(document.querySelectorAll('.project-card'));
    var spots = blocks.concat(cards);

    function spotlight(el) {
      var raf = null, px = 0, py = 0, inside = false;
      function apply() {
        raf = null;
        if (!inside) return;
        var r = el.getBoundingClientRect();
        var x = clamp((px - r.left) / r.width, 0, 1);
        var y = clamp((py - r.top) / r.height, 0, 1);
        el.style.setProperty('--sx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--sy', (y * 100).toFixed(1) + '%');
      }
      el.addEventListener('pointerenter', function (e) {
        inside = true; px = e.clientX; py = e.clientY;
        el.classList.add('hot');
        if (!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener('pointermove', function (e) {
        px = e.clientX; py = e.clientY;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener('pointerleave', function () {
        inside = false;
        el.classList.remove('hot');
      });
    }

    function tilt(el) {
      var raf = null, px = 0, py = 0, inside = false;
      function apply() {
        raf = null;
        var r = el.getBoundingClientRect();
        var x = clamp((px - r.left) / r.width, 0, 1);
        var y = clamp((py - r.top) / r.height, 0, 1);
        el.style.setProperty('--rx', inside ? ((0.5 - y) * 2 * TILT).toFixed(2) + 'deg' : '0deg');
        el.style.setProperty('--ry', inside ? ((x - 0.5) * 2 * TILT).toFixed(2) + 'deg' : '0deg');
      }
      el.addEventListener('pointerenter', function (e) {
        inside = true; px = e.clientX; py = e.clientY;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener('pointermove', function (e) {
        px = e.clientX; py = e.clientY;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener('pointerleave', function () {
        inside = false;
        if (!raf) raf = requestAnimationFrame(apply);
      });
    }

    spots.forEach(spotlight);
    cards.forEach(tilt);

    /* 2.5 背景光斑视差:全局指针驱动 --mx/--my(-0.5..0.5) */
    var gRaf = null, gx = 0, gy = 0;
    function glowApply() {
      gRaf = null;
      root.style.setProperty('--mx', gx.toFixed(3));
      root.style.setProperty('--my', gy.toFixed(3));
    }
    window.addEventListener('pointermove', function (e) {
      gx = e.clientX / window.innerWidth - 0.5;
      gy = e.clientY / window.innerHeight - 0.5;
      if (!gRaf) gRaf = requestAnimationFrame(glowApply);
    }, { passive: true });
  }

  /* ---------- 3. 阅读进度线 ---------- */
  var bar = document.createElement('div');
  bar.className = 'progress-line';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  var pRaf = null;
  function updateProgress() {
    pRaf = null;
    var max = root.scrollHeight - window.innerHeight;
    var p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    bar.style.setProperty('--p', p.toFixed(4));
  }
  window.addEventListener('scroll', function () {
    if (!pRaf) pRaf = requestAnimationFrame(updateProgress);
  }, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();

  /* ---------- 4. 主题切换涟漪：新主题色以拨钮为中心向外扩散铺满全屏 ---------- */
  var BASE = { mocha: '#1e1e2e', latte: '#eff1f5' };
  window.addEventListener('themechange', function (e) {
    var to = (e.detail && e.detail.to) || 'mocha';
    var via = e.detail && e.detail.via;
    if (!via) return;
    var r = via.getBoundingClientRect();
    var ox = r.left + r.width / 2;
    var oy = r.top + r.height / 2;
    var radius = Math.hypot(
      Math.max(ox, window.innerWidth - ox),
      Math.max(oy, window.innerHeight - oy)
    ) + 2;

    var veil = document.createElement('div');
    veil.className = 'theme-ripple';
    veil.setAttribute('aria-hidden', 'true');
    veil.style.setProperty('--ox', ox.toFixed(0) + 'px');
    veil.style.setProperty('--oy', oy.toFixed(0) + 'px');
    veil.style.setProperty('--or', radius.toFixed(0) + 'px');
    veil.style.background = BASE[to] || BASE.mocha;
    document.body.appendChild(veil);

    var anim = veil.animate(
      [
        { clipPath: 'circle(0px at var(--ox) var(--oy))', opacity: 1 },
        { clipPath: 'circle(var(--or) at var(--ox) var(--oy))', opacity: 1 }
      ],
      { duration: 540, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
    );
    anim.onfinish = function () { veil.remove(); };
  });
})();
