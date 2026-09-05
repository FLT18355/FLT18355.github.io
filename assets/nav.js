/* nav.js — 指示条定位：加载时滑到当前页下方 */
(function () {
  'use strict';
  var list = document.querySelector('.nav-list');
  if (!list) return;
  var bar = list.querySelector('.nav-indicator');
  var current = list.querySelector('.nav-item[aria-current="page"]');
  if (!bar || !current) return;

  function place(animate) {
    var lr = list.getBoundingClientRect();
    var cr = current.getBoundingClientRect();
    if (!animate) bar.style.transition = 'none';
    bar.style.setProperty('--x', (cr.left - lr.left).toFixed(1) + 'px');
    bar.style.setProperty('--w', cr.width.toFixed(1) + 'px');
    bar.classList.add('ready');
    if (!animate) {
      void bar.offsetWidth; // flush
      bar.style.transition = '';
    }
  }

  place(false);
  window.addEventListener('resize', function () { place(false); }, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { place(false); });
  }

  /* 点击另一条时先滑过去再离开，跨页也有一瞬反馈 */
  var items = list.querySelectorAll('.nav-item');
  Array.prototype.forEach.call(items, function (a) {
    if (a === current) return;
    a.addEventListener('click', function () {
      bar.style.setProperty('--x', (a.offsetLeft).toFixed(1) + 'px');
      bar.style.setProperty('--w', a.offsetWidth.toFixed(1) + 'px');
    });
  });
})();
