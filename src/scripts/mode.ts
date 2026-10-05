// mode.ts - 页脚的渲染档位开关(低配版 / 高配版)
//
// 档位决定的是「样式与脚本怎么装载」:head 内联脚本据此写 html.lite 与 html[data-lite],
// glass.ts 的挂载闸门、_lite.scss 的精简层、motion.ts 的指针光斑都读它。
// 这些都得在第一帧之前定下来,所以这里选择「写入偏好 + 重新加载」,而不是运行中切类
// (玻璃一旦挂上,运行中也没法干净地拆掉)。localStorage 不可用(隐私模式)时退回 URL 参数。
//
// 与 motion.ts / fold.ts 同一入口(Base.astro 打包),defer 执行,此时 DOM 已就绪。

(function () {
  'use strict';

  const root = document.documentElement;
  /* data-lite 由 head 内联脚本同步写入;它不在说明脚本链路没跑通,控件本来也没渲染 */
  const current = root.getAttribute('data-lite');
  if (!current) return;

  const group = document.querySelector('[data-mode-switch]');
  if (!group) return;

  const buttons = Array.prototype.slice.call(
    group.querySelectorAll('[data-mode]')
  ) as HTMLButtonElement[];

  /** 当前生效的档位键,与按钮的 data-mode 同一套取值 */
  const active = current === 'on' ? 'lite' : 'full';

  buttons.forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.mode === active));
  });

  group.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const btn = target.closest<HTMLButtonElement>('[data-mode]');
    if (!btn || btn.dataset.mode === active) return;

    const next = btn.dataset.mode === 'lite' ? 'on' : 'off';
    const url = new URL(location.href);
    /* 清掉手动传的 ?lite=1/0:它优先于偏好,不清掉会「点了没反应」 */
    url.searchParams.delete('lite');
    let stored = false;
    try {
      localStorage.setItem('site-lite', next);
      stored = true;
    } catch (err) {
      /* 存储不可用:退回 URL 参数,head 脚本同样认 */
    }
    if (!stored) url.searchParams.set('lite', next === 'on' ? '1' : '0');

    if (url.toString() === location.href) location.reload();
    else location.replace(url.toString());
  });
})();
