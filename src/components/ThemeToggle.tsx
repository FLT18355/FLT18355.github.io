// ThemeToggle.tsx - 主题拨钮(原 app.js 逻辑)
// 场景交叉淡化由 CSS --p 驱动(#themeToggle.dragging 规则),JS 只写变量
import { useEffect, useRef } from 'react';

interface ViewTransitionLike {
  ready: Promise<void>;
}
type VTDocument = Document & {
  startViewTransition?: (cb: () => void) => ViewTransitionLike;
};

export default function ThemeToggle() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const btn = btnRef.current;
    const knob = knobRef.current;
    if (!btn || !knob) return;

    const root = document.documentElement;
    /* demo 原布局:200×90 含 2px 边框,内容宽 196,滑钮 86px → 行程 110px(与 demo translateX(110px) 一致) */
    const MAX_X = 110;
    const isMocha = () => root.getAttribute('data-theme') === 'mocha';
    const THEME_COLOR: Record<string, string> = { mocha: '#1e1e2e', latte: '#eff1f5' };

    const syncMetaTheme = () => {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', THEME_COLOR[root.getAttribute('data-theme') || 'mocha'] || THEME_COLOR.mocha);
    };

    /* 通用扩散环:原生 View Transition 的圆形揭示只有 Chromium 会画,
       这一圈用 WAAPI 推出去,任何引擎、任何档位、任何动效偏好都能渲染。
       颜色取 var(--primary),会随主题令牌一起过渡。 */
    const playWave = (ox: number, oy: number, radius: number, reduce: boolean) => {
      const wave = document.createElement('span');
      wave.className = 'theme-wave';
      wave.setAttribute('aria-hidden', 'true');
      wave.style.cssText =
        `left:${ox}px;top:${oy}px;width:${radius * 2}px;height:${radius * 2}px;` +
        `margin-left:${-radius}px;margin-top:${-radius}px`;
      document.body.appendChild(wave);
      const done = () => wave.remove();
      if (typeof wave.animate !== 'function') {
        window.setTimeout(done, 700);
        return;
      }
      const anim = wave.animate(
        [
          { transform: 'scale(0.02)', opacity: 0.92 },
          { transform: 'scale(1)', opacity: 0 },
        ],
        {
          duration: reduce ? 340 : 680,
          easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        }
      );
      anim.onfinish = done;
      /* 兜底:页面切到后台时 animation 可能不走完 */
      window.setTimeout(done, 1400);
    };

    const commitTheme = (prevTheme: string | null, nextTheme: string) => {
      if (prevTheme === nextTheme) return;
      const apply = () => {
        root.setAttribute('data-theme', nextTheme);
        syncMetaTheme();
        try {
          localStorage.setItem('theme', nextTheme);
        } catch (err) {
          /* 隐私模式下写入失败可忽略 */
        }
      };

      const r = btn.getBoundingClientRect();
      const ox = r.left + r.width / 2;
      const oy = r.top + r.height / 2;
      const radius =
        Math.hypot(Math.max(ox, window.innerWidth - ox), Math.max(oy, window.innerHeight - oy)) + 2;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      /* 低配档平时关掉了颜色令牌过渡(_lite.scss),切换这一下临时放回来,
         让背景 / 文字 / 卡面随扩散环一起换色,而不是硬跳 */
      root.classList.add('theme-fx');
      window.setTimeout(() => root.classList.remove('theme-fx'), 720);

      playWave(ox, oy, radius, reduce);

      /* Chromium:再把新主题画面本身做成圆形揭示(画中画,不遮内容);
         其它引擎就靠上面的光环 + 令牌过渡。 */
      const doc = document as VTDocument;
      if (doc.startViewTransition && !reduce) {
        const vt = doc.startViewTransition(apply);
        vt.ready.then(
          () => {
            document.documentElement.animate(
              [
                { clipPath: `circle(0px at ${ox}px ${oy}px)` },
                { clipPath: `circle(${radius}px at ${ox}px ${oy}px)` },
              ],
              {
                duration: 540,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                pseudoElement: '::view-transition-new(root)',
              }
            );
          },
          () => {
            /* 过渡被浏览器跳过时静默 */
          }
        );
      } else {
        apply();
      }
    };

    const setProgress = (p: number) => btn.style.setProperty('--p', String(p));
    const clearProgress = () => btn.style.removeProperty('--p');

    let drag: {
      pointerId: number;
      startClientX: number;
      startClientY: number;
      baseX: number;
      scale: number;
      moved: boolean;
      lastX: number;
    } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button && e.button !== 0) return;
      const rect = btn.getBoundingClientRect();
      const scale = rect.width / 200; /* 含 hover 放大的实际缩放 */
      const base = isMocha() ? MAX_X : 0;
      drag = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        baseX: base,
        scale,
        moved: false,
        lastX: base,
      };
      /* 拖动中固定缩放,避免 hover 放大干扰坐标换算 */
      btn.style.transform = `scale(${scale})`;
      btn.classList.add('dragging');
      try {
        btn.setPointerCapture(e.pointerId);
      } catch (err) {
        /* 部分浏览器不支持时忽略 */
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const dx = e.clientX - drag.startClientX;
      const dy = e.clientY - drag.startClientY;
      if (!drag.moved && Math.sqrt(dx * dx + dy * dy) > 4) drag.moved = true;
      if (!drag.moved) return;

      const raw = drag.baseX + dx / drag.scale; /* 视觉位移换算回布局坐标 */
      const target = Math.max(0, Math.min(MAX_X, raw));

      knob.style.transform = `translateX(${target}px)`;
      setProgress(target / MAX_X);
      drag.lastX = target;
    };

    const finishDrag = (e: PointerEvent) => {
      if (!drag) return;

      if (e.type === 'pointerup') {
        const dx = e.clientX - drag.startClientX;
        const dy = e.clientY - drag.startClientY;
        const isClick = Math.sqrt(dx * dx + dy * dy) < 4;
        const toNight = isClick ? !isMocha() : drag.lastX > MAX_X / 2;

        const from = root.getAttribute('data-theme');
        commitTheme(from, toNight ? 'mocha' : 'latte');
      }

      /* 清 inline 样式:CSS 过渡带 overshoot 从当前拖动位置飞向目标 */
      btn.removeAttribute('style');
      knob.removeAttribute('style');
      clearProgress();
      btn.classList.remove('dragging');

      drag = null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const from = root.getAttribute('data-theme');
        commitTheme(from, from === 'mocha' ? 'latte' : 'mocha');
      }
    };

    btn.addEventListener('pointerdown', onPointerDown);
    btn.addEventListener('pointermove', onPointerMove);
    btn.addEventListener('pointerup', finishDrag);
    btn.addEventListener('pointercancel', finishDrag);
    btn.addEventListener('keydown', onKeyDown);
    return () => {
      btn.removeEventListener('pointerdown', onPointerDown);
      btn.removeEventListener('pointermove', onPointerMove);
      btn.removeEventListener('pointerup', finishDrag);
      btn.removeEventListener('pointercancel', finishDrag);
      btn.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <button
      ref={btnRef}
      className="theme-toggle"
      id="themeToggle"
      type="button"
      aria-label="切换 Latte / Mocha 配色"
      title="切换主题"
    >
      <span className="sun" aria-hidden="true" />
      <span className="cloud cloud1" aria-hidden="true" />
      <span className="cloud cloud2" aria-hidden="true" />
      <span className="cloud cloud3" aria-hidden="true" />
      <span className="cloud cloud4" aria-hidden="true" />
      <span className="moon" aria-hidden="true" />
      <span className="star s1" aria-hidden="true" />
      <span className="star s2" aria-hidden="true" />
      <span className="star s3" aria-hidden="true" />
      <span className="star s4" aria-hidden="true" />
      <span className="star s5" aria-hidden="true" />
      <span className="star s6" aria-hidden="true" />
      <span className="star s7" aria-hidden="true" />
      <span className="star s8" aria-hidden="true" />
      <span ref={knobRef} className="knob" aria-hidden="true" />
    </button>
  );
}
