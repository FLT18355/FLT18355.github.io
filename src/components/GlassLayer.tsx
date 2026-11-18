// GlassLayer.tsx - 顶部导航的纯背景玻璃层(卡片用 GlassCard)
//
// 只画玻璃,不包内容:绝对定位铺满卡片外壳,卡片正文仍是普通 DOM(可选中、可点击、
// 可被读屏读到)。js 不可用 / 低配 / 减弱透明度时不挂载,内层卡片自己的 CSS 玻璃照常生效。
import { useEffect, useRef, useState } from 'react';
import { LiquidGlass } from '@vepando/liquid-glass-react';

const RADIUS = 14;

function eligible(): boolean {
  const root = document.documentElement;
  if ((root.getAttribute('data-mode') || 'low') === 'low') return false;
  try {
    if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) return false;
  } catch (e) {
    /* 查询不支持:按不减弱处理 */
  }
  return !!(window.CSS && CSS.supports && CSS.supports('backdrop-filter', 'blur(6px)'));
}

interface LayerProps {
  radius?: number;
  className?: string;
}

export default function GlassLayer({ radius = RADIUS, className = '' }: LayerProps) {
  const [on, setOn] = useState(false);
  const [mode, setMode] = useState('high');
  const [theme, setTheme] = useState<'latte' | 'mocha'>('mocha');
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!eligible()) return;
    const root = document.documentElement;
    const sync = () => setTheme(root.getAttribute('data-theme') === 'latte' ? 'latte' : 'mocha');
    sync();
    setMode(root.getAttribute('data-mode') || 'high');
    setOn(true);
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  /* 用类而不是只靠 :has:静态卡外面还套着 display:contents 的 astro-island,
     显式给外壳挂状态,内层卡片的底色才能稳定让位 */
  useEffect(() => {
    if (!on) return;
    const layer = layerRef.current;
    const shell = layer?.closest('.glass-shell');
    const nav = layer?.closest('.site-nav');
    shell?.classList.add('glass-live');
    nav?.classList.add('glass-live');
    return () => {
      shell?.classList.remove('glass-live');
      nav?.classList.remove('glass-live');
    };
  }, [on]);

  if (!on) return null;
  const max = mode === 'max';
  const latte = theme === 'latte';

  return (
    <div ref={layerRef} className={`lg-layer${className ? ' ' + className : ''}`} aria-hidden="true">
      <LiquidGlass
        className="lg-effect"
        radius={radius}
        variant="clear"
        tint={latte ? 'rgba(255, 255, 255, 0.18)' : 'rgba(18, 18, 24, 0.12)'}
        blur={max ? 4 : 8}
        saturation={max ? 1.8 : 1.6}
        specular={0}
        refraction={max ? 2 : 1.5}
        dispersion={max ? 0.07 : 0.03}
        interactive={false}
        style={{ position: 'absolute', inset: 0 }}
      />
    </div>
  );
}
