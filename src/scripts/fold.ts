// fold.ts - 卡片折叠增强层(渐进增强,由 Base.astro 作为模块脚本打包)
// 折叠能力本身来自原生 <details>(见 components/CardFold.astro):无 JS 也能点标题收起,默认展开。
// 本脚本只补四件事:① 按卡片记忆折叠状态 ② 右下角全站折叠坞 ③ 快捷键 ④ 深链展开。
// 与 motion.ts / nav.ts 同一入口,defer 执行,此时 DOM 已就绪。

(function () {
  'use strict';

  const folds = Array.prototype.slice.call(
    document.querySelectorAll('details.fold')
  ) as HTMLDetailsElement[];
  if (!folds.length) return;

  const root = document.documentElement;
  const STORE = 'site-fold';
  /** 页面命名空间:状态按页存,不同页面的同名键互不干扰 */
  const page = location.pathname.replace(/\/index\.html$/, '/') || '/';
  const keyOf = (el: HTMLDetailsElement, i: number): string =>
    el.dataset.fold || el.id || 'card-' + i;

  /* ---------- 1. 恢复记忆的折叠状态(无记录时保持 markup 的默认:展开) ---------- */
  let state: Record<string, boolean> = {};
  try {
    const raw = localStorage.getItem(STORE);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (parsed && typeof parsed === 'object') state = parsed as Record<string, boolean>;
  } catch (e) {
    state = {};
  }
  const persist = (): void => {
    try {
      localStorage.setItem(STORE, JSON.stringify(state));
    } catch (e) {
      /* 存储不可用(隐私模式):仅本次会话生效,不影响折叠本身 */
    }
  };

  /* 深链:URL hash 命中的卡片强制展开(优先于记忆状态),并滚到它 */
  let hash = '';
  try {
    hash = decodeURIComponent(location.hash.replace(/^#/, ''));
  } catch (e) {
    hash = '';
  }
  const hashTarget = hash ? folds.find((el) => el.id === hash) : undefined;

  folds.forEach((el, i) => {
    const key = page + '::' + keyOf(el, i);
    if (typeof state[key] === 'boolean') el.open = state[key];
    if (el === hashTarget) el.open = true;
    el.addEventListener('toggle', () => {
      state[page + '::' + keyOf(el, i)] = el.open;
      persist();
      syncCount();
    });
  });

  if (hashTarget) {
    requestAnimationFrame(() => hashTarget.scrollIntoView({ block: 'start' }));
  }

  /* ---------- 2. 折叠坞:收起全部 / 展开全部 + 展开计数 ---------- */
  const dock = document.createElement('div');
  dock.className = 'fold-dock';
  dock.setAttribute('role', 'group');
  dock.setAttribute('aria-label', 'Card folding controls');
  dock.innerHTML = [
    '<span class="fold-dock-count" aria-live="polite" aria-atomic="true"></span>',
    '<span class="fold-dock-divider" aria-hidden="true"></span>',
    '<button class="fold-dock-btn" type="button" data-fold-all="collapse" aria-label="Collapse all cards" title="Collapse all cards ( [ )">',
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 5.5 12 10.5 17 5.5"/><path d="M7 18.5 12 13.5 17 18.5"/></svg>',
    '<span class="fold-dock-label">Fold</span>',
    '</button>',
    '<button class="fold-dock-btn" type="button" data-fold-all="expand" aria-label="Expand all cards" title="Expand all cards ( ] )">',
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10.5 12 5.5 17 10.5"/><path d="M7 13.5 12 18.5 17 13.5"/></svg>',
    '<span class="fold-dock-label">Unfold</span>',
    '</button>',
  ].join('');
  document.body.appendChild(dock);
  root.classList.add('fold-dock-on');

  const countEl = dock.querySelector<HTMLElement>('.fold-dock-count');

  function syncCount(): void {
    if (!countEl) return;
    const open = folds.filter((el) => el.open).length;
    countEl.textContent = '';
    const strong = document.createElement('b');
    strong.textContent = String(open);
    countEl.append(strong, document.createTextNode(' / ' + folds.length));
  }

  function setAll(open: boolean): void {
    folds.forEach((el, i) => {
      if (el.open === open) return;
      el.open = open;
      state[page + '::' + keyOf(el, i)] = open;
    });
    persist();
    syncCount();
  }

  dock.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const btn = target.closest<HTMLElement>('[data-fold-all]');
    if (!btn) return;
    setAll(btn.dataset.foldAll === 'expand');
  });

  syncCount();

  /* ---------- 3. 快捷键:[ 收起全部,] 展开全部(输入框内不抢键) ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key !== '[' && e.key !== ']') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) {
      return;
    }
    e.preventDefault();
    setAll(e.key === ']');
  });

  /* ---------- 4. 只给「用户操作」播展开动画:首屏不播,避免与区块入场叠加 ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('fold-anim')));
})();
