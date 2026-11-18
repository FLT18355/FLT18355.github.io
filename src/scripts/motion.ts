// motion.ts - 交互层(渐进增强)
// 只保留两件事:滚动位置信号(.nav-scrolled)与由 html.motion-js 门控的
// 悬停 / 状态微动效。页面内容在首帧即完整可见:不做滚动入场、不画进度线,
// 滚动只移动页面本身(规则见 _motion.scss 顶部说明)。
// 由 Base.astro 作为模块脚本打包,defer 执行。

(function () {
  'use strict';
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 减弱动效时不挂门控类:CSS 里的位移/动画整段不生效,颜色与焦点照常变化。 */
  if (!reduce) root.classList.add('motion-js');

  /* 导航在滚过顶部后换成实底;功能信号,与减弱动效无关,始终执行。 */
  let frame: number | null = null;
  function updateScroll(): void {
    frame = null;
    root.classList.toggle('nav-scrolled', window.scrollY > 8);
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!frame) frame = requestAnimationFrame(updateScroll);
    },
    { passive: true }
  );
  window.addEventListener('resize', updateScroll, { passive: true });
  updateScroll();
})();
