// boot.ts - 启动界面编排(首启加载 / 回访过渡)
// 依赖:_boot.scss + components/BootScreen.astro。显隐用的 .boot-first / .boot-transition
// 由 Base.astro 的 head 内联脚本同步写入(先于 body 解析,不会闪出一帧正文),这里只负责
// 进度、跳过与收尾。由 Base.astro 作为模块脚本打包,defer 执行,此时 DOM 已就绪。
//
// 三条硬约束:
//   1. 任何路径都必须能收尾(6s 安全兜底),否则整页会永久停在 inert 里;
//   2. 首启必须等「DOM 内容 + 字体栈 + 整页资源 + 字体向导就位」都到齐才交棒,
//      但整页资源最长只等 1800ms:音乐播放器是 preload="auto",硬等 load 会拖到十几秒;
//   3. 回访过渡必须能点 / 触 / 按键立刻跳过,不能困住人。

(function () {
  'use strict';

  const root = document.documentElement;
  const boot = document.getElementById('boot');
  const mode = root.classList.contains('boot-first')
    ? 'first'
    : root.classList.contains('boot-transition')
      ? 'transition'
      : '';

  /* 没进入启动流程(含 ?boot=0)时直接退出,一行副作用都不留 */
  if (!mode) return;
  /* 类在但节点不在(理论上不会发生):立刻放行动效层,别让它白等 */
  if (!boot) {
    document.dispatchEvent(new CustomEvent('boot:done'));
    return;
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lite = root.classList.contains('lite');

  let finished = false;
  let safety = 0;

  /* ---------- 启动层在时,把正文对键盘与读屏一并收起来 ---------- */
  const inertTargets = (): HTMLElement[] =>
    Array.prototype.slice.call(
      document.querySelectorAll('.site-nav, .shell')
    ) as HTMLElement[];

  function setInert(on: boolean): void {
    inertTargets().forEach((el) => {
      try {
        el.inert = on;
      } catch (e) {
        /* 无 inert 的老浏览器:启动层是全屏固定层,指针仍然点不到正文,
           只是 Tab 还能走到,可接受 */
      }
    });
  }
  setInert(true);

  /* ---------- 收尾:进度满 / 跳过 / 安全超时都汇到这里 ---------- */
  function teardown(): void {
    root.classList.remove('boot-first', 'boot-transition', 'boot-leaving');
    if (boot && boot.parentNode) boot.parentNode.removeChild(boot);
    setInert(false);
    try {
      sessionStorage.setItem('boot-seen', '1');
    } catch (e) {
      /* 隐私模式下写不进:本次会话每次进入都会走过渡层,不影响可用性 */
    }
  }

  function finish(instant?: boolean): void {
    if (finished) return;
    finished = true;
    window.clearTimeout(safety);
    /* 在「开始离场」这一刻就通知动效层:正文的滚动入场要和封面淡出叠着播,
       等揭幕完再播就只剩一个已经静止的页面,那一口气接不上 */
    document.dispatchEvent(new CustomEvent('boot:done'));
    if (instant || reduce) {
      teardown();
      return;
    }
    root.classList.add('boot-leaving');
    /* 与 _boot.scss 的离场时长对齐(封面位移 560ms / 淡出 420ms),留一点余量 */
    window.setTimeout(teardown, 560);
  }

  /* 安全兜底:组件没挂载 / 事件丢失 / 长尾资源卡住,都不会把页面永久锁住 */
  safety = window.setTimeout(() => finish(true), 6000);

  /* ============================================================
     变体 B 回访:走满或跳过,二选一
     ============================================================ */
  if (mode === 'transition') {
    /* 必须按 id 取:两个变体各有一条 .boot__rail-fill,
       querySelector 只会拿到 DOM 里靠前的那个(首启卡里隐藏的那条) */
    const fill = document.getElementById('bootCoverFill');
    const dwell = reduce ? 600 : lite ? 1000 : 1600;
    const t0 = Date.now();

    /* 顶部细进度条:rAF 补间写入 --boot-p,时间轴与停留时长严格一致 */
    let railRaf = 0;
    function railFrame(): void {
      railRaf = 0;
      if (finished) return;
      const k = Math.min(1, (Date.now() - t0) / dwell);
      if (fill) fill.style.setProperty('--boot-p', k.toFixed(4));
      if (k < 1) railRaf = window.requestAnimationFrame(railFrame);
    }
    if (fill && !reduce) {
      fill.style.setProperty('--boot-p', '0');
      railRaf = window.requestAnimationFrame(railFrame);
    }

    const auto = window.setTimeout(() => finish(), dwell);

    function bail(): void {
      window.clearTimeout(auto);
      window.cancelAnimationFrame(railRaf);
      finish();
    }

    const skip = document.getElementById('bootSkip');
    if (skip) skip.addEventListener('click', bail);

    /* 点 / 触 / 滚都算「我要进去」 */
    boot.addEventListener('pointerdown', bail, { passive: true });
    window.addEventListener('wheel', bail, { passive: true });
    window.addEventListener('touchmove', bail, { passive: true });

    /* 只认「想继续」的键:Tab 与方向键留给键盘导航与读屏,不抢 */
    const PASS_KEYS = [
      'Tab', 'Shift', 'Control', 'Alt', 'Meta',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Home', 'End', 'PageUp', 'PageDown',
    ];
    document.addEventListener(
      'keydown',
      (e) => {
        if (finished) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (PASS_KEYS.indexOf(e.key) !== -1) return;
        bail();
      },
      true
    );
    return;
  }

  /* ============================================================
     变体 A 首启:真实门控驱动的进度,加载完淡出交给字体向导
     ============================================================ */
  const fill = document.getElementById('bootRailFill');
  const pctEl = document.getElementById('bootPct');
  const statusEl = document.getElementById('bootStatus');

  /* 文案与站内一致:UI 走英文,中文只留在注释里(注释不参与渲染,也不影响字体子集) */
  const PHASES: Array<[number, string]> = [
    [0, 'Loading page'],
    [0.4, 'Applying theme'],
    [0.68, 'Preparing fonts'],
    [0.96, 'Ready'],
  ];
  const NEEDED = ['dom', 'fonts', 'content', 'picker'];
  /* 门控里程碑:进度条允许爬到的上限。前三个还会被写成首启轨上的刻度
     (--boot-tick-*),所以「进度停住的地方」和「刻度」永远在同一组数字上 */
  const MILES: Record<string, number> = { dom: 0.34, fonts: 0.6, content: 0.84, picker: 0.95 };
  const railEl = document.getElementById('bootRail');
  if (railEl) {
    ['dom', 'fonts', 'content'].forEach((name, i) => {
      railEl.style.setProperty('--boot-tick-' + (i + 1), (MILES[name] * 100).toFixed(0) + '%');
    });
  }
  const passed: string[] = [];
  const t0 = Date.now();
  const MIN_MS = reduce ? 400 : 900;

  let raf = 0;
  let p = 0.05; /* 当前画出的比例 */
  let goal = 0.14; /* 当前允许到的上限,由门控推进 */
  let lastPct = -1;
  let lastPhase = '';

  function phaseOf(v: number): string {
    let name = PHASES[0][1];
    for (let i = 0; i < PHASES.length; i++) {
      if (v >= PHASES[i][0]) name = PHASES[i][1];
    }
    return name;
  }

  function paint(): void {
    if (fill) fill.style.setProperty('--boot-p', p.toFixed(4));
    const pct = Math.round(p * 100);
    if (pctEl && pct !== lastPct) {
      pctEl.textContent = pct + '%';
      lastPct = pct;
    }
    /* 阶段文字只在跨档时写一次:role="status" 的区域不该被百分比刷屏 */
    const phase = phaseOf(p);
    if (statusEl && phase !== lastPhase) {
      statusEl.textContent = phase;
      lastPhase = phase;
    }
  }

  function frame(): void {
    raf = 0;
    /* 定点追上 + 一点匀速,保证门控走得慢时进度条也一直在动 */
    p = Math.min(goal, p + (goal - p) * 0.11 + 0.0018);
    paint();
    if (p >= 1) {
      /* 让启动层至少露脸 MIN_MS,再停一拍让 100% 看得见,然后交棒 */
      const rest = Math.max(0, MIN_MS - (Date.now() - t0));
      window.setTimeout(() => finish(), rest + 240);
      return;
    }
    /* 到顶但门控没到齐:先停下,等下一次 pass() 再续,不空转帧 */
    if (p < goal) raf = window.requestAnimationFrame(frame);
  }

  function kick(): void {
    if (!raf && !finished) raf = window.requestAnimationFrame(frame);
  }

  function pass(name: string): void {
    if (finished || passed.indexOf(name) !== -1) return;
    passed.push(name);
    const value = MILES[name] || 0.95;
    if (value > goal) goal = value;
    let all = true;
    for (let i = 0; i < NEEDED.length; i++) {
      if (passed.indexOf(NEEDED[i]) === -1) all = false;
    }
    if (all) goal = 1;
    kick();
  }

  /* 门控 1:页面内容已经在 DOM 里(模块脚本 defer,通常这里已 interactive,直接通过) */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => pass('dom'), { once: true });
  } else {
    pass('dom');
  }

  /* 门控 2:字体栈就绪。系统字体立即 ready;选过 Maple 的机器会在这里等 woff2 */
  const fontSet = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
  if (fontSet && fontSet.ready && typeof fontSet.ready.then === 'function') {
    fontSet.ready.then(
      () => pass('fonts'),
      () => pass('fonts')
    );
  } else {
    pass('fonts');
  }

  /* 门控 3:整页资源(样式 / 图片)加载完,最长等 1800ms */
  if (document.readyState === 'complete') {
    pass('content');
  } else {
    const cap = window.setTimeout(() => pass('content'), 1800);
    window.addEventListener(
      'load',
      () => {
        window.clearTimeout(cap);
        pass('content');
      },
      { once: true }
    );
  }

  /* 门控 4:字体向导已经决定显隐(见 FontPicker.vue 派发的 fontpicker:state)。
     组件可能先于本脚本完成挂载,所以先查标记再挂监听,并留 2200ms 上限 */
  if (root.dataset.fontPickerState) {
    pass('picker');
  } else {
    const cap = window.setTimeout(() => pass('picker'), 2200);
    document.addEventListener(
      'fontpicker:state',
      () => {
        window.clearTimeout(cap);
        pass('picker');
      },
      { once: true }
    );
  }

  kick();
})();
