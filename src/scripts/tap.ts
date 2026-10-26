// tap.ts - 全站点击涟漪(所有渲染档位都生效)
//
// 一个全局 pointerdown 监听,点哪儿都在指针位置放一圈扩散光斑;
// 涟漪由 _effects.scss 的 .tap-ripple 绘制,纯 transform/opacity 动画,合成器即可完成。
// 「减弱动效」下仍给反馈,只是改成不扩散的短促闪光(触摸设备上系统常默认关动画,
// 直接不画会像「点了没反应」)。
// 没有 PointerEvent 的老引擎退回 touchstart / mousedown,手机照样能触发。

(function () {
  'use strict';

  let calm = false;
  try {
    calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    /* 查询不支持:按未减弱处理 */
  }

  /* 同时存在的涟漪上限:连点时旧的提前回收,不让 DOM 无限堆 */
  const MAX = 10;
  let live: HTMLElement[] = [];

  function spawn(x: number, y: number, touch: boolean) {
    const r = document.createElement('span');
    r.className = 'tap-ripple';
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    /* 手指落点粗、鼠标落点细:同一团体积光,触摸时铺得更开 */
    if (touch) r.style.setProperty('--tap-size', '240px');
    if (calm) r.classList.add('tap-ripple--calm');
    r.setAttribute('aria-hidden', 'true');

    let done = false;
    function kill() {
      if (done) return;
      done = true;
      r.remove();
      const i = live.indexOf(r);
      if (i !== -1) live.splice(i, 1);
    }
    /* 等最长的体积光跑完再删:按更早结束的细环删,会把光砍在半路 */
    r.addEventListener('animationend', (ev) => {
      if (ev.animationName === 'tapLight') kill();
    });
    /* 动画被外部样式打断时 animationend 不会来,给个硬兜底 */
    window.setTimeout(kill, 1200);

    document.body.appendChild(r);
    live.push(r);
    if (live.length > MAX) live.shift()?.remove();
  }

  if ('PointerEvent' in window) {
    window.addEventListener(
      'pointerdown',
      (e) => {
        /* 鼠标只认主键;触摸/手写笔的 button 本来就是 0,不要拦 */
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        spawn(e.clientX, e.clientY, e.pointerType === 'touch');
      },
      { capture: true, passive: true }
    );
  } else {
    /* 老引擎兜底:iOS 12 / 旧 Android WebView 没有 PointerEvent */
    window.addEventListener(
      'touchstart',
      (e) => {
        const t = e.changedTouches && e.changedTouches[0];
        if (t) spawn(t.clientX, t.clientY, true);
      },
      { capture: true, passive: true }
    );
    window.addEventListener(
      'mousedown',
      (e) => {
        if (e.button === 0) spawn(e.clientX, e.clientY, false);
      },
      { capture: true, passive: true }
    );
  }
})();