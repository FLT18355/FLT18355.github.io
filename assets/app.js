(function () {
  var root = document.documentElement;
  var btn = document.getElementById('themeToggle');
  if (!btn) return;
  var thumb = btn.querySelector('.thumb');
  var icoMoon = btn.querySelector('.ico-moon');
  var icoSun = btn.querySelector('.ico-sun');
  var PAD = 3, THUMB = 30;
  var maxX = btn.clientWidth - THUMB - PAD * 2;
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = mqReduce.matches;
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', function (e) { reduce = e.matches; });

  var dragging = false, startX = 0, originX = 0, moved = 0;
  var prevX = 0, lastT = 0, vel = 0, currentAnim = null, lastTrailX = 0, trailCount = 0;
  var themeAtDown = null;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rubber(o) { var d = 24; return (o * d * 0.55) / (d + 0.55 * Math.abs(o)); }
  function tx() {
    try { return new DOMMatrix(getComputedStyle(thumb).transform).m41; }
    catch (e) { return root.getAttribute('data-theme') === 'mocha' ? maxX : 0; }
  }

  function commitTheme(prevTheme, nextTheme) {
    if (prevTheme === nextTheme) return;
    root.setAttribute('data-theme', nextTheme);
    try { localStorage.setItem('theme', nextTheme); } catch (err) {}
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { from: prevTheme, to: nextTheme, via: btn }
    }));
  }

  btn.addEventListener('pointerdown', function (e) {
    dragging = true; moved = 0; startX = e.clientX;
    themeAtDown = root.getAttribute('data-theme');
    if (currentAnim) {
      thumb.style.transform = getComputedStyle(thumb).transform;
      currentAnim.cancel(); currentAnim = null;
    }
    originX = tx();
    prevX = originX; lastT = e.timeStamp; vel = 0; lastTrailX = originX; trailCount = 0;
    btn.classList.add('dragging');
    try { btn.setPointerCapture(e.pointerId); } catch (err) {}
  });

  btn.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    var raw = originX + dx;
    var x = raw < 0 ? -rubber(-raw) : (raw > maxX ? maxX + rubber(raw - maxX) : raw);
    var dt = e.timeStamp - lastT;
    if (dt > 0) { vel = (x - prevX) / dt * 1000; prevX = x; lastT = e.timeStamp; }
    thumb.style.transform = 'translateX(' + x + 'px) scale(1.12)';
    if (!reduce && trailCount < 48 && Math.abs(x - lastTrailX) >= 6) {
      lastTrailX = x;
      spawnTrail();
    }
    var p = clamp(raw / maxX, 0, 1);
    icoMoon.style.opacity = p;
    icoSun.style.opacity = 1 - p;
    icoMoon.style.transform = 'scale(' + (0.6 + 0.4 * p) + ')';
    icoSun.style.transform = 'scale(' + (0.6 + 0.4 * (1 - p)) + ')';
    // 拖拽跟手期间直接切色，不发事件，避免涟漪打断手感
    var want = p > 0.5 ? 'mocha' : 'latte';
    if (root.getAttribute('data-theme') !== want) root.setAttribute('data-theme', want);
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    try { btn.releasePointerCapture(e.pointerId); } catch (err) {}
    btn.classList.remove('dragging');
    var endX = e.clientX != null ? e.clientX : startX;
    var raw = originX + (endX - startX);
    // 位移小于阈值视为「点击」：直接翻转主题，而不是按半程判定
    var targetTheme = moved >= 4
      ? (raw > maxX / 2 ? 'mocha' : 'latte')
      : (themeAtDown === 'mocha' ? 'latte' : 'mocha');
    var targetX = targetTheme === 'mocha' ? maxX : 0;
    commitTheme(themeAtDown || root.getAttribute('data-theme'), targetTheme);
    icoMoon.style.opacity = '';
    icoSun.style.opacity = '';
    icoMoon.style.transform = '';
    icoSun.style.transform = '';
    springTo(targetX, vel);
  }

  function spawnTrail() {
    var r = btn.getBoundingClientRect();
    var cx = r.left + PAD + lastTrailX + THUMB / 2;
    var cy = r.top + r.height / 2;
    var dot = document.createElement('span');
    dot.className = 'trail-dot';
    dot.style.left = cx + 'px';
    dot.style.top = cy + 'px';
    document.body.appendChild(dot);
    trailCount++;
    var a = dot.animate(
      [
        { opacity: 0.45, transform: 'translate(-50%, -50%) scale(1)' },
        { opacity: 0, transform: 'translate(-50%, -50%) scale(0.35)' }
      ],
      { duration: 420, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
    );
    a.onfinish = function () { dot.remove(); trailCount--; };
  }

  function springTo(targetX, velocity) {
    if (reduce) { thumb.style.transform = 'translateX(' + targetX + 'px)'; return; }
    var fromX = tx();
    var dur = 300 + Math.min(140, Math.abs(velocity) * 0.05);
    var anim = thumb.animate(
      [
        { transform: 'translateX(' + fromX + 'px) scale(1.12)' },
        { transform: 'translateX(' + targetX + 'px) scale(1)' }
      ],
      { duration: dur, easing: 'cubic-bezier(0.34, 1.3, 0.64, 1)', fill: 'both' }
    );
    currentAnim = anim;
    anim.onfinish = function () {
      thumb.style.transform = 'translateX(' + targetX + 'px)';
      anim.cancel(); currentAnim = null;
    };
  }

  btn.addEventListener('pointerup', endDrag);
  btn.addEventListener('pointercancel', endDrag);

  // 键盘可达：Enter / 空格 翻转主题并弹回拨钮
  btn.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    var from = root.getAttribute('data-theme');
    var want = from === 'mocha' ? 'latte' : 'mocha';
    commitTheme(from, want);
    if (currentAnim) { currentAnim.cancel(); currentAnim = null; }
    springTo(want === 'mocha' ? maxX : 0, 0);
  });

  /* Ambient glow parallax — pointer-driven, throttled to rAF */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var queued = false, mx = 0, my = 0;
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        root.style.setProperty('--mx', mx.toFixed(3));
        root.style.setProperty('--my', my.toFixed(3));
      });
    }, { passive: true });
  }
})();
