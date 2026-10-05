// glass.ts - liquid-glass 挂载闸门(@liquidglassjs/element 的 <liquid-glass>)
//
// 页面上的 <liquid-glass> 是「外壳」,真正的玻璃来自这个模块。这里刻意把三个
// 不该装载的条件挡在 import 之前,让它们连 core 的 chrome 样式都不下载:
//   1. lite(低配精简):判定与 Base.astro 的 head 内联脚本同源,类已同步写在 <html> 上。
//      玻璃的逐层 backdrop-filter 是整站最贵的一笔,低配下退回卡片自己的 CSS 玻璃。
//   2. prefers-reduced-transparency: 用户明确要求「减弱透明度」,不给他塞玻璃。
//   3. 不支持 backdrop-filter 的老浏览器:装了也没有玻璃,只有无谓的滤镜节点。
// 任何一条命中时 <liquid-glass> 都保持未定义,只是个 display:block 的普通盒子,
// 内层卡片的 CSS 玻璃照常显示(无 JS 的观感与有 JS 一致)。
//
// 与 boot.ts / fold.ts 同一入口(Base.astro 打包),defer 执行,此时 DOM 已就绪。

(function () {
  'use strict';

  if (!document.querySelector('liquid-glass')) return;

  const root = document.documentElement;
  if (root.classList.contains('lite')) return;

  try {
    if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) return;
  } catch (e) {
    /* 查询不支持:按不减弱处理 */
  }

  try {
    if (!window.CSS || !CSS.supports || !CSS.supports('backdrop-filter', 'blur(6px)')) return;
  } catch (e) {
    return;
  }

  /* 动态引入自定义元素本身:低配 / 减弱透明度 / 老浏览器下这个 chunk 根本不会请求。
     元素一旦注册,页面上已存在的 <liquid-glass> 会被自动 upgrade 并挂上玻璃。
     chrome 三个装饰层的样式是静态引入的(Base.astro / 404.astro 的 import '@liquidglassjs/core/css'),
     不走动态 CSS:本项目页面共用同一份样式表,动态 CSS 会被内联进主表却仍留下一条
     指向不存在文件的 preload,反而制造 404。 */
  void import('@liquidglassjs/element').catch(function () {
    /* 断网 / 被拦截:卡片保持 CSS 玻璃,不做二次降级 */
  });
})();
