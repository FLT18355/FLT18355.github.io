// ball.ts - 低配档专属的液态玻璃圆球(从 demo/liquid-glass-web 提取)
//
// 渲染与 demo 的 makeGlass 一致:一张不显示的 canvas 画位移贴图 → data URL 进 feImage,
// 元素用 backdrop-filter: url(#…) 折射背后页面。贴图只算一次,拖动不重算。
//   · 世界坐标移动用 left/top;拖动过程用 transform 做果冻拉伸/倾斜,松手后回弹再「落位」;
//   · 白色染色 + 内阴影 + 跟随指针的柔光层(soft-light),深色主题下也是玻璃而不是黑饼;
//   · 果冻用 transform 与 rAF 弹簧,不依赖 backdrop-filter 能力,任何引擎都看得到;
//   · 位置记在 localStorage,重载后还在原处;
//   · 只在 low 档挂载(high / max 档的玻璃由 @liquidglassjs 负责,不要两个系统打架)。

(function () {
  'use strict';

  const root = document.documentElement;
  /* 档位缺失按 low 兜底,与 HeadPrefs / glass.ts 同一约定 */
  if ((root.getAttribute('data-mode') || 'low') !== 'low') return;

  /* 小屏收一点,别让球在 320px 宽的屏上显得笨重 */
  const SIZE = window.innerWidth < 520 ? 112 : 132;
  const OFFSET = 16;
  const STORE = 'ball-pos';

  function smoothStep(a: number, b: number, t: number) {
    t = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  /* 折射能力与 glass.ts 同一判据:backdrop-filter 里放 url(#…) 只有 Chromium 真会画,
     其它引擎会把整条声明判为无效 —— 那样连模糊都没有,所以退成纯模糊。 */
  let urlFilter = false;
  try {
    urlFilter = CSS.supports('backdrop-filter', 'url("#a")');
  } catch (e) {
    urlFilter = false;
  }
  const chromiumLike = (function () {
    try {
      const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } })
        .userAgentData?.brands;
      if (Array.isArray(brands)) return brands.some((b) => /Chromium/i.test(b.brand));
      return (
        /Chrome\/|Chromium\//.test(navigator.userAgent) &&
        !/Version\/\d/.test(navigator.userAgent) &&
        'chrome' in window
      );
    } catch (e) {
      return false;
    }
  })();
  const refract = urlFilter && chromiumLike;

  const id = 'lg-ball-' + Math.random().toString(36).slice(2, 11);
  const filterId = id + '-filter';

  /* ---------- 位移贴图:一次算完 ---------- */
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  canvas.style.display = 'none';
  const ctx = canvas.getContext('2d');
  let shaderScale = 0;

  if (ctx) {
    const data = new Uint8ClampedArray(SIZE * SIZE * 4);
    const raw: number[] = [];
    let maxScale = 0;

    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % SIZE;
      const y = Math.floor(i / 4 / SIZE);
      const ix = x / SIZE - 0.5;
      const iy = y / SIZE - 0.5;

      /* 玻璃球剖面:中心轻微放大(0.965),越靠球缘采样越向中心收,形成厚度 */
      const dist = Math.hypot(ix, iy);
      const edge = smoothStep(0.3, 0.5, dist);
      const g = 0.965 - edge * edge * 0.35;

      const dx = (ix * g - ix) * SIZE;
      const dy = (iy * g - iy) * SIZE;
      const m = Math.max(Math.abs(dx), Math.abs(dy));
      if (m > maxScale) maxScale = m;
      raw.push(dx, dy);
    }

    /* 通道编码用真实峰值做分母:不裁剪,位移量就是 feDisplacementMap 的 scale */
    maxScale = Math.max(maxScale, 0.0001);
    shaderScale = maxScale;

    let k = 0;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = (raw[k++] / maxScale) * 127.5 + 127.5;
      data[i + 1] = (raw[k++] / maxScale) * 127.5 + 127.5;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }

    ctx.putImageData(new ImageData(data, SIZE, SIZE), 0, 0);
  }

  /* ---------- SVG 滤镜 ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:0';

  const defs = document.createElementNS(NS, 'defs');
  const filter = document.createElementNS(NS, 'filter');
  filter.setAttribute('id', filterId);
  filter.setAttribute('filterUnits', 'userSpaceOnUse');
  filter.setAttribute('colorInterpolationFilters', 'sRGB');
  filter.setAttribute('x', '0');
  filter.setAttribute('y', '0');
  filter.setAttribute('width', String(SIZE));
  filter.setAttribute('height', String(SIZE));

  const feImage = document.createElementNS(NS, 'feImage');
  feImage.setAttribute('preserveAspectRatio', 'none');
  feImage.setAttribute('width', String(SIZE));
  feImage.setAttribute('height', String(SIZE));

  const feMap = document.createElementNS(NS, 'feDisplacementMap');
  feMap.setAttribute('in', 'SourceGraphic');
  feMap.setAttribute('in2', filterId + '-map');
  feMap.setAttribute('xChannelSelector', 'R');
  feMap.setAttribute('yChannelSelector', 'G');
  feMap.setAttribute('scale', '0');

  feImage.setAttribute('id', filterId + '-map');
  filter.appendChild(feImage);
  filter.appendChild(feMap);
  defs.appendChild(filter);
  svg.appendChild(defs);

  /* ---------- 圆球本体 ---------- */
  const ball = document.createElement('div');
  ball.className = 'lg-ball';
  ball.setAttribute('aria-hidden', 'true');
  ball.style.width = SIZE + 'px';
  ball.style.height = SIZE + 'px';

  /* 跟随指针的柔光层:单独一个子元素,改它的渐变不会惊动底下的 backdrop-filter */
  const glow = document.createElement('span');
  glow.className = 'lg-ball__glow';
  glow.setAttribute('aria-hidden', 'true');
  ball.appendChild(glow);

  if (refract && ctx) {
    feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', canvas.toDataURL());
    /* feDisplacementMap 的 scale 是通道偏差(±0.5)的满量程,所以取峰值的两倍,
       实际最大采样偏移才等于贴图里的 dx(px) */
    feMap.setAttribute('scale', (shaderScale * 2).toFixed(2));
    /* demo 的配方:tint 交给 CSS 的白玻璃层,这里只做折射 + 极轻的调色 */
    const bf = `url(#${filterId}) blur(0.5px) contrast(1.12) brightness(1.16) saturate(1.15)`;
    ball.style.setProperty('backdrop-filter', bf);
    ball.style.setProperty('-webkit-backdrop-filter', bf);
  } else {
    /* 不折射的引擎:白玻璃层与高光都在 CSS 里,这里只需要一层模糊 */
    const bf = 'blur(9px) brightness(1.1) saturate(1.2)';
    ball.style.setProperty('backdrop-filter', bf);
    ball.style.setProperty('-webkit-backdrop-filter', bf);
  }

  function clamp(x: number, y: number) {
    const maxX = Math.max(OFFSET, window.innerWidth - SIZE - OFFSET);
    const maxY = Math.max(OFFSET, window.innerHeight - SIZE - OFFSET);
    return {
      x: Math.min(maxX, Math.max(OFFSET, x)),
      y: Math.min(maxY, Math.max(OFFSET, y)),
    };
  }

  function place(x: number, y: number) {
    const p = clamp(x, y);
    ball.style.left = p.x + 'px';
    ball.style.top = p.y + 'px';
    return p;
  }

  function loadPos(): { x: number; y: number } | null {
    try {
      const raw = localStorage.getItem(STORE);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (typeof p.x === 'number' && typeof p.y === 'number') return p;
    } catch (e) {
      /* 存储不可用 / 脏数据:按首次访问处理 */
    }
    return null;
  }

  const saved = loadPos();
  /* 默认落在右侧偏下:不压页脚那枚档位开关(低配档下正好是切回 high 的唯一入口) */
  let pos = place(
    saved ? saved.x : window.innerWidth - SIZE - 28,
    saved ? saved.y : window.innerHeight * 0.58
  );

  function persist() {
    try {
      localStorage.setItem(STORE, JSON.stringify(pos));
    } catch (err) {
      /* 隐私模式:本次会话内仍然可用,只是不记位置 */
    }
  }

  /* ---------- 柔光层:指针在球上时亮起,中心跟着指针 ---------- */
  let glowFrame = 0;
  let glowX = 0;
  let glowY = 0;
  function applyGlow() {
    glowFrame = 0;
    const r = ball.getBoundingClientRect();
    const lx = Math.max(0, Math.min(100, ((glowX - r.left) / r.width) * 100));
    const ly = Math.max(0, Math.min(100, ((glowY - r.top) / r.height) * 100));
    glow.style.setProperty('--lx', lx.toFixed(1) + '%');
    glow.style.setProperty('--ly', ly.toFixed(1) + '%');
  }
  function moveGlow(x: number, y: number) {
    glowX = x;
    glowY = y;
    if (!glowFrame) glowFrame = requestAnimationFrame(applyGlow);
  }

  /* ---------- 果冻:demo 的 applyJelly / springEase ---------- */
  let tx = 0;
  let ty = 0;
  /* 渲染位移:比目标慢半拍,拖起来球身先被拽住、再追上去,果冻感就来自这段滞后 */
  let ox = 0;
  let oy = 0;
  let vx = 0;
  let vy = 0;
  /* 当前形变量与方向:单独存,好让「起形快、回圆慢」有状态可插值 */
  let jellyK = 0;
  let jellyDeg = 0;
  let dragRaf = 0;
  let dragGen = 0;
  let baseX = 0;
  let baseY = 0;
  /* 动画代号:再次按下时把还在跑的滑行 / 回弹作废,免得两条循环同时写 transform */
  let anim = 0;

  function applyJelly(k: number, deg: number) {
    let t = `translate3d(${ox.toFixed(1)}px, ${oy.toFixed(1)}px, 0)`;
    /* k 在回弹的后半段会是负值(反向压扁),这一下才像果冻;别用 k>0 把它挡掉 */
    if (Math.abs(k) >= 0.001) {
      t += ` rotate(${deg.toFixed(1)}deg) scale(${(1 + k).toFixed(3)}, ${(1 - k * 0.8).toFixed(3)}) rotate(${(-deg).toFixed(1)}deg)`;
    }
    ball.style.transform = t;
  }

  function springEase(t: number) {
    return 1 - Math.exp(-5 * t) * Math.cos(9 * t);
  }

  /* 帧内视觉:拉伸量按速度、外发光按速度,与 demo 的 frame() 同构 */
  function frame() {
    /* 先追位移:每帧补一半,松手时剩下的由 jellyBack 收尾 */
    ox += (tx - ox) * 0.5;
    oy += (ty - oy) * 0.5;

    const speed = Math.hypot(vx, vy);
    /* 慢速拖动就有 6%-10% 的形变,速度再往上加;指针停住时形变收回 */
    const target = moved && speed > 0.15 ? Math.min(0.46, 0.05 + speed / 55) : 0;
    jellyK += (target - jellyK) * (target > jellyK ? 0.6 : 0.18);
    if (speed > 0.5) jellyDeg = (Math.atan2(vy, vx) * 180) / Math.PI;
    applyJelly(jellyK, jellyDeg);

    const lit = Math.min(0.85, speed / 26);
    ball.style.setProperty('--bloom', (18 + speed * 2.2).toFixed(1));
    ball.style.setProperty('--bloom-a', (0.12 + lit * 0.5).toFixed(2));
    glow.style.setProperty('--lit', Math.max(0.35, lit).toFixed(2));
  }

  /* 拖动期间常驻的 rAF:指针停住时速度自然衰减,球慢慢回圆,
     不会像只靠 pointermove 那样卡在最后一下的形变上 */
  function dragLoop(gen: number) {
    if (gen !== dragGen || !dragging) {
      if (gen === dragGen) dragRaf = 0;
      return;
    }
    frame();
    vx *= 0.86;
    vy *= 0.86;
    dragRaf = requestAnimationFrame(() => dragLoop(gen));
  }

  function bake() {
    const p = clamp(baseX + tx, baseY + ty);
    ball.style.left = p.x + 'px';
    ball.style.top = p.y + 'px';
    ball.style.transform = '';
    ball.style.removeProperty('--bloom');
    ball.style.removeProperty('--bloom-a');
    pos = p;
    tx = 0;
    ty = 0;
    ox = 0;
    oy = 0;
    jellyK = 0;
    persist();
  }

  function jellyBack(from: number, dur: number) {
    const gen = ++anim;
    const t0 = performance.now();
    (function step(now: number) {
      if (gen !== anim) return;
      const t = Math.min(1, (now - t0) / dur);
      /* 同时把滞后掉的渲染位移补回目标位置 */
      ox += (tx - ox) * 0.3;
      oy += (ty - oy) * 0.3;
      jellyK = from * (1 - springEase(t));
      applyJelly(jellyK, 0);
      if (t < 1) requestAnimationFrame(step);
      else {
        ball.style.transform = '';
        bake();
      }
    })(t0);
  }

  /* ---------- 拖动:世界坐标靠 left/top 落位,过程用 transform 拉伸 ---------- */
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;

  function setDragPos(nx: number, ny: number) {
    const p = clamp(baseX + nx, baseY + ny);
    tx = p.x - baseX;
    ty = p.y - baseY;
  }

  function stopRaf() {
    anim++;
    dragGen++;
    if (dragRaf) cancelAnimationFrame(dragRaf);
    dragRaf = 0;
  }

  ball.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    stopRaf();
    /* 上一段回弹还没落位就又被抓住:先把当前位置落成 left/top,避免瞬移回旧位置 */
    if (ball.style.transform) bake();
    dragging = true;
    moved = false;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    lastT = performance.now();
    baseX = pos.x;
    baseY = pos.y;
    tx = 0;
    ty = 0;
    ox = 0;
    oy = 0;
    vx = 0;
    vy = 0;
    jellyK = 0;
    jellyDeg = 0;
    ball.setPointerCapture(e.pointerId);
    ball.classList.add('is-dragging');
    moveGlow(e.clientX, e.clientY);
    dragLoop(++dragGen);
    e.preventDefault();
  });

  ball.addEventListener('pointermove', (e) => {
    moveGlow(e.clientX, e.clientY);
    if (!dragging) {
      glow.style.setProperty('--lit', '1');
      return;
    }

    const now = performance.now();
    const dt = Math.max(1, now - lastT);
    /* 平滑速度(px/帧),清掉单帧抖动 */
    vx = vx * 0.7 + ((e.clientX - lastX) / dt) * 16 * 0.3;
    vy = vy * 0.7 + ((e.clientY - lastY) / dt) * 16 * 0.3;
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = now;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    if (!moved) return;
    setDragPos(dx, dy);
    frame();
  });

  function endDrag(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    ball.classList.remove('is-dragging');
    if (ball.hasPointerCapture(e.pointerId)) ball.releasePointerCapture(e.pointerId);
    glow.style.setProperty('--lit', '1');

    if (!moved) {
      /* 点一下也弹 */
      jellyBack(0.22, 560);
      return;
    }

    /* 松手立刻把「眼睛看到的位置」定住:不再滑行、也不再追指针,
       否则回圆的过程里球会再往目标挪一下。
       之后只剩形状回弹(位置冻结),落位就是 left/top,不会跳。 */
    stopRaf();
    tx = ox;
    ty = oy;
    /* 从「松手那一刻的形变量」接着弹,不要另外加一截:那会在松手瞬间鼓一下 */
    jellyBack(Math.max(0.14, jellyK), 560);
  }
  ball.addEventListener('pointerup', endDrag);
  ball.addEventListener('pointercancel', endDrag);

  ball.addEventListener('pointerleave', () => {
    if (!dragging) glow.style.setProperty('--lit', '0');
  });

  window.addEventListener(
    'resize',
    () => {
      pos = place(pos.x, pos.y);
    },
    { passive: true }
  );

  if (refract && ctx) document.body.appendChild(svg);
  document.body.appendChild(ball);
})();