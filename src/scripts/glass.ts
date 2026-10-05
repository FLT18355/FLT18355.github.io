// glass.ts - liquid-glass 挂载闸门(@liquidglassjs/element 的 <liquid-glass>)
//
// 页面上的 <liquid-glass> 是「外壳」,真正的玻璃来自这个模块。这里做四件事,
// 顺序不能变(自定义元素一注册,已存在的 <liquid-glass> 会被立刻 upgrade):
//   1. 闸门:low 档 / prefers-reduced-transparency / 不支持 backdrop-filter 一律不注册元素,
//      连这个 chunk 都不下载,内层组件回落到自己的 CSS 玻璃;
//   2. 渲染能力探测:backdrop-filter: url() 只有 Chromium 认(库内部 supportsBackdropUrl()
//      用的也是这个判据)。不认的引擎只会拿到普通模糊,折射一点都不在 ——
//      给根元素打 data-glass="blur",由 _glass.scss 补一圈高对比度镜面描边伪装厚度;
//   3. max 档:把库自己的参数旋钮拧到「折射看得见」的档位,并打开 behind(仅 Firefox 生效);
//   4. 动态 import 注册自定义元素。
//
// 与 motion.ts / fold.ts / mode.ts 同一入口(Base.astro 打包),defer 执行,此时 DOM 已就绪。

(function () {
  'use strict';

  if (!document.querySelector('liquid-glass')) return;

  const root = document.documentElement;
  const mode = root.getAttribute('data-mode') || 'high';

  /* 1. 闸门:低配不挂玻璃(与 Base.astro 的 head 内联脚本同源,类已同步写好) */
  if (mode === 'low') return;

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

  /* 2. 折射能力:backdrop-filter: url(#…) 解析得到、但只有 Chromium 真会画。
     判据 = CSS.supports('backdrop-filter','url(#a)') 且 属于 Chromium 家族 ——
     与库内部 supportsBackdropUrl() 完全一致(光看 CSS.supports:Safari 也会回 true 却不画)。
     不满足就退回纯模糊,按能力给根元素打标记,由 _glass.scss 补镜面描边伪装厚度。 */
  let supportsUrlFilter = false;
  try {
    supportsUrlFilter = CSS.supports('backdrop-filter', 'url("#a")');
  } catch (e) {
    supportsUrlFilter = false;
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
  root.setAttribute('data-glass', supportsUrlFilter && chromiumLike ? 'refract' : 'blur');

  /* 3. max 档:用的全是库文档里的公开属性,没有一处自造结构。
     strength 16 就是库自己的默认值(位移够猛,1px 网格会被明显掰弯);
     chroma 抬到 0.55,边缘彩边更明显;blur 压到 4,免得网格先被糊平;
     tint 降到 6,卡面更透,背后的高频层才透得过来;
     behind 指向固定背景层,Firefox 会走 -moz-element 折射(其它引擎自动忽略)。 */
  if (mode === 'max') {
    const MAX_PRESET: Record<string, string> = {
      strength: '16',
      chroma: '0.55',
      blur: '4',
      tint: '6',
      behind: '.bg-art',
    };
    document.querySelectorAll('liquid-glass').forEach((el) => {
      for (const k in MAX_PRESET) el.setAttribute(k, MAX_PRESET[k]);
    });
  }

  /* 4. 元素一旦注册,页面上已存在的 <liquid-glass> 会被自动 upgrade 并挂上玻璃。
     chrome 三层的样式是静态引入的(Base.astro / 404.astro 的
     `import '@liquidglassjs/core/css'`),不走动态 CSS:本项目页面共用同一份样式表,
     动态 CSS 会被内联进主表却仍留下一条指向不存在文件的 preload,反而制造 404。 */
  void import('@liquidglassjs/element').catch(function () {
    /* 断网 / 被拦截:卡片保持 CSS 玻璃,不做二次降级 */
  });
})();
