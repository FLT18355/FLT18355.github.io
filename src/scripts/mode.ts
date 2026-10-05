// mode.ts - 页脚的渲染档位开关(低配 / 高配 / 全特效)
//
// 档位决定的是「样式与脚本怎么装载」:head 内联脚本据此写 html[data-mode] 与 html.lite,
// glass.ts 的挂载闸门、_paper.scss 的高频背景、motion.ts 的指针光斑都读它。
// 这些都得在第一帧之前定下来,所以这里选择「写入偏好 + 重新加载」,而不是运行中切类
// (玻璃一旦挂上,运行中也没法干净地拆掉)。
//
// 三个档位:
//   low  低配   —— 不挂玻璃、不要固定背景层、不要常驻动效
//   high 高配   —— 当前的默认观感(玻璃 + 纸面背景)
//   max  全特效 —— 高配 + 库原生 rim 全开 + 高频网格/光斑背景 + 更强的折射参数
//
// localStorage 不可用(隐私模式)时退回 URL 参数 ?mode=。
// 与 motion.ts / fold.ts 同一入口(Base.astro 打包),defer 执行,此时 DOM 已就绪。

(function () {
  'use strict';

  const root = document.documentElement;
  /* data-mode 由 head 内联脚本同步写入;它不在说明脚本链路没跑通,控件本来也没渲染 */
  const current = root.getAttribute('data-mode');
  if (!current) return;

  const group = document.querySelector('[data-mode-switch]');
  if (!group) return;

  const buttons = Array.prototype.slice.call(
    group.querySelectorAll('[data-mode]')
  ) as HTMLButtonElement[];

  buttons.forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.mode === current));
  });

  group.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const btn = target.closest<HTMLButtonElement>('[data-mode]');
    const next = btn && btn.dataset.mode;
    if (!next || next === current) return;

    const url = new URL(location.href);
    /* 清掉手动传的 ?mode= / ?lite=:它们优先于偏好,不清掉会「点了没反应」 */
    url.searchParams.delete('mode');
    url.searchParams.delete('lite');

    let stored = false;
    try {
      localStorage.setItem('site-mode', next);
      stored = true;
    } catch (err) {
      /* 存储不可用:退回 URL 参数,head 脚本同样认 */
    }
    if (!stored) url.searchParams.set('mode', next);

    if (url.toString() === location.href) location.reload();
    else location.replace(url.toString());
  });
})();
