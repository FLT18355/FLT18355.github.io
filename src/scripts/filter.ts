// filter.ts - 项目列表的名字过滤 + 「超过 5 条就变滚动预览」
//
// 作用对象:带 [data-project-filter] 的块(projects 页的重点项目、following 页的关注项目)。
// 匹配 data-name(标题 + 仓库名 + 标签,由 ProjectCard.astro 生成)。
// 可见条数超过 5 时给滚动容器加 .is-scroll 并把高度收到「第 5 张卡片的底边」,
// 右侧出现一条主题色的竖向滚动条;过滤到 5 条以内就恢复自然高度。
// 无 JS 时列表完整显示,不做裁切(渐进增强)。

(function () {
  'use strict';

  const groups = document.querySelectorAll<HTMLElement>('[data-project-filter]');
  if (!groups.length) return;

  const VISIBLE_LIMIT = 5;

  groups.forEach((host) => {
    const input = host.querySelector<HTMLInputElement>('.project-filter__input');
    const scroll = host.querySelector<HTMLElement>('[data-project-scroll]');
    const grid = scroll && scroll.querySelector<HTMLElement>('.project-grid');
    const empty = host.querySelector<HTMLElement>('[data-project-empty]');
    const counter = host.querySelector<HTMLElement>('[data-project-count]');
    if (!input || !scroll || !grid) return;
    const field = input;
    const viewport = scroll;
    const list = grid;

    const cards = Array.prototype.slice.call(
      list.querySelectorAll<HTMLElement>('.project-card')
    ) as HTMLElement[];
    const total = cards.length;

    function layout() {
      const shown = cards.filter((c) => !c.hidden);
      if (counter) counter.textContent = String(shown.length);
      if (empty) empty.hidden = shown.length !== 0;

      viewport.classList.remove('is-scroll');
      viewport.style.maxHeight = '';
      if (shown.length <= VISIBLE_LIMIT) {
        viewport.scrollTop = 0;
        return;
      }
      /* 卡片所在的折叠卡片收着的时候量不到高度,等 toggle 打开再算 */
      if (!list.getClientRects().length) return;

      const fifth = shown[VISIBLE_LIMIT - 1];
      const listTop = list.getBoundingClientRect().top;
      const bottom = fifth.getBoundingClientRect().bottom - listTop;
      viewport.style.maxHeight = Math.ceil(bottom + 8) + 'px';
      viewport.classList.add('is-scroll');
      /* 第 6 张若和它同一行,整行都已经露出来了:没有可滚的内容就别挂滚动条 */
      if (viewport.scrollHeight <= viewport.clientHeight + 2) {
        viewport.classList.remove('is-scroll');
        viewport.style.maxHeight = '';
      }
    }

    function apply() {
      const q = field.value.trim().toLowerCase();
      cards.forEach((card) => {
        card.hidden = q !== '' && !(card.dataset.name || '').includes(q);
      });
      layout();
    }

    let raf = 0;
    field.addEventListener('input', apply);
    /* 字体加载 / 窗口缩放会改变卡片高度,滚动上限要跟着重算 */
    window.addEventListener(
      'resize',
      () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          layout();
        });
      },
      { passive: true }
    );

    layout();

    /* 折叠状态恢复后再量一次(收起时所有卡片高度为 0) */
    const fold = list.closest('details');
    if (fold) {
      fold.addEventListener('toggle', () => {
        if (fold.open) layout();
      });
    }

    /* 数据里有项目但过滤后为空时,让输入框保留说明性提示 */
    if (empty && total === 0) empty.hidden = false;
  });
})();