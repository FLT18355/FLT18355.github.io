(function () {
  var root = document.documentElement;
  var btn = document.getElementById('themeToggle');
  if (!btn) return;

  var knob = btn.querySelector('.knob');

  /* demo 原布局：200×90 含 2px 边框，内容宽 196，滑钮 86px → 行程 110px（与 demo translateX(110px) 一致） */
  var MAX_X = 110;

  function isMocha() { return root.getAttribute('data-theme') === 'mocha'; }

  function commitTheme(prevTheme, nextTheme) {
    if (prevTheme === nextTheme) return;
    root.setAttribute('data-theme', nextTheme);
    try { localStorage.setItem('theme', nextTheme); } catch (err) {}
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { from: prevTheme, to: nextTheme, via: btn }
    }));
  }

  /* 场景交叉淡化由 CSS --p 驱动（#themeToggle.dragging 规则），JS 只写变量 */
  function setProgress(p) { btn.style.setProperty('--p', String(p)); }
  function clearProgress() { btn.style.removeProperty('--p'); }

  /* 拖尾粒子 */
  var trailQueue = [];

  function spawnTrail(kx, ky) {
    var d = document.createElement('span');
    d.className = 'trail-dot';
    d.style.left = kx + 'px';
    d.style.top = ky + 'px';
    document.body.appendChild(d);
    trailQueue.push(d);
    if (trailQueue.length > 30) {
      var old = trailQueue.shift();
      if (old.parentNode) old.parentNode.removeChild(old);
    }
  }

  var drag = null;

  btn.addEventListener('pointerdown', function (e) {
    if (e.button && e.button !== 0) return;
    var rect = btn.getBoundingClientRect();
    var scale = rect.width / 200; /* 含 hover 放大的实际缩放 */
    drag = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      baseX: isMocha() ? MAX_X : 0,
      scale: scale,
      moved: false,
      lastX: isMocha() ? MAX_X : 0
    };
    /* 拖动中固定缩放，避免 hover 放大干扰坐标换算 */
    btn.style.transform = 'scale(' + scale + ')';
    btn.classList.add('dragging');
    try { btn.setPointerCapture(e.pointerId); } catch (err) {}
  });

  btn.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    var dx = e.clientX - drag.startClientX;
    var dy = e.clientY - drag.startClientY;
    if (!drag.moved && Math.sqrt(dx * dx + dy * dy) > 4) drag.moved = true;
    if (!drag.moved) return;

    var raw = drag.baseX + dx / drag.scale; /* 视觉位移换算回布局坐标 */
    var target = Math.max(0, Math.min(MAX_X, raw));

    knob.style.transform = 'translateX(' + target + 'px)';
    setProgress(target / MAX_X);
    drag.lastX = target;

    /* 拖尾：从滑钮「拖拽反方向」的边缘甩出（滞后于运动），不被圆钮遮住 */
    if (Math.random() < 0.5) {
      var r = btn.getBoundingClientRect();
      var dir = drag.lastX <= target ? 1 : -1;            /* 运动方向 */
      var edge = dir > 0 ? target : target + 86;          /* 反方向的边缘（布局 x） */
      var kx = r.left + (2 + edge) * drag.scale + (dir > 0 ? -4 : 4) * drag.scale;
      var ky = r.top + (90 / 2) * drag.scale + Math.random() * 6 - 3;
      spawnTrail(kx, ky);
    }
  });

  function finishDrag(e) {
    if (!drag) return;

    if (e.type === 'pointerup') {
      var dx = e.clientX - drag.startClientX;
      var dy = e.clientY - drag.startClientY;
      var isClick = Math.sqrt(dx * dx + dy * dy) < 4;
      var toNight = isClick ? !isMocha() : drag.lastX > MAX_X / 2;

      var from = root.getAttribute('data-theme');
      commitTheme(from, toNight ? 'mocha' : 'latte');
    }

    /* 清 inline 样式：CSS 过渡带 overshoot 从当前拖动位置飞向目标 */
    btn.removeAttribute('style');
    knob.removeAttribute('style');
    clearProgress();
    btn.classList.remove('dragging');

    drag = null;
  }

  btn.addEventListener('pointerup', finishDrag);
  btn.addEventListener('pointercancel', finishDrag);

  /* 键盘可达：Enter / 空格 翻转（preventDefault 避免原生 click 二次翻转） */
  btn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      var from = root.getAttribute('data-theme');
      commitTheme(from, from === 'mocha' ? 'latte' : 'mocha');
    }
  });
})();