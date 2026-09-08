// nav.ts - 指示条定位:加载时滑到当前页下方;窄屏溢出时把当前页滚进视野

(function () {
  'use strict';
  const list = document.querySelector('.nav-list');
  if (!list) return;
  const bar = list.querySelector('.nav-indicator') as HTMLElement | null;
  const current = list.querySelector<HTMLElement>('.nav-item[aria-current="page"]');
  if (!bar || !current) return;

  function place(animate: boolean) {
    if (!animate) bar.style.transition = 'none';
    /* 横向滚动容器里 rect 差值不含 scrollLeft,会随滑动错位;
       改用 offsetLeft(相对 .nav-list padding box,与指示条 left:0 同一原点,不受滚动影响)。
       宽度用 offsetWidth:nav-item 有 flex-shrink:0,布局宽即视觉宽 */
    bar.style.setProperty('--x', current.offsetLeft.toFixed(1) + 'px');
    bar.style.setProperty('--w', current.offsetWidth.toFixed(1) + 'px');
    bar.classList.add('ready');
    if (!animate) {
      void bar.offsetWidth; // flush
      bar.style.transition = '';
    }
  }

  /* 当前页在屏幕外时(手机溢出)把它滚进视野,居中显示 */
  function bringIntoView() {
    const lr = list.getBoundingClientRect();
    const cr = current.getBoundingClientRect();
    if (cr.left < lr.left || cr.right > lr.right) {
      list.scrollLeft += cr.left - lr.left - (lr.width - cr.width) / 2;
    }
  }

  bringIntoView();
  place(false);
  window.addEventListener('resize', () => place(false), { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => place(false));
  }

  /* 点击另一条时先滑过去再离开,跨页也有一瞬反馈 */
  const items = list.querySelectorAll('.nav-item');
  Array.prototype.forEach.call(items, (a: HTMLElement) => {
    if (a === current) return;
    a.addEventListener('click', () => {
      bar.style.setProperty('--x', a.offsetLeft.toFixed(1) + 'px');
      bar.style.setProperty('--w', a.offsetWidth.toFixed(1) + 'px');
    });
  });
})();
