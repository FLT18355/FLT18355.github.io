// GlassCard.tsx - 把卡片内容真正放进 @vepando/liquid-glass-react 的 .lg__content
//
// 这是库的预期用法:玻璃根元素就是卡片本身,正文在 .lg__content 内,
// 不再用「背景层 + 外层卡片底色」两套叠着。静态 Astro 卡通过 <slot /> 把
// 服务端 HTML 作为 children 传进来;交互卡直接传 React children。
import { useEffect, useState, type ReactNode } from 'react';
import { LiquidGlass } from '@vepando/liquid-glass-react';

const RADIUS = 14;

interface Props {
  className?: string;
  radius?: number;
  children?: ReactNode;
}

function themeNow(): 'latte' | 'mocha' {
  return document.documentElement.getAttribute('data-theme') === 'latte' ? 'latte' : 'mocha';
}

export default function GlassCard({ className = '', radius = RADIUS, children }: Props) {
  const [theme, setTheme] = useState<'latte' | 'mocha'>('mocha');
  const [mode, setMode] = useState('high');
  const [live, setLive] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setTheme(themeNow());
    sync();
    const current = root.getAttribute('data-mode') || 'high';
    setMode(current);
    let enabled = current !== 'low';
    try {
      if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) enabled = false;
    } catch (e) {
      /* 查询不支持 */
    }
    if (!(window.CSS && CSS.supports && CSS.supports('backdrop-filter', 'blur(6px)'))) enabled = false;
    setLive(enabled);
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const max = mode === 'max';
  const latte = theme === 'latte';
  /* low / 减弱透明度:identity 不生成位移图、不挂 backdrop-filter,但保留同一个
     根元素,children 不会因模式变化而重挂 */
  const variant = live ? 'clear' : 'identity';

  return (
    <LiquidGlass
      className={`glass-card${className ? ' ' + className : ''}`}
      radius={radius}
      variant={variant}
      tint={latte ? 'rgba(255, 255, 255, 0.10)' : 'rgba(18, 18, 24, 0.05)'}
      bezel={max ? 28 : 20}
      thickness={max ? 18 : 12}
      blur={max ? 2 : 4}
      saturation={max ? 1.8 : 1.6}
      specular={0}
      refraction={max ? 2.4 : 1.8}
      dispersion={max ? 0.09 : 0.04}
      interactive={false}
    >
      {children}
    </LiquidGlass>
  );
}
