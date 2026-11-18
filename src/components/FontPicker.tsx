// FontPicker.tsx - 首启字体选择交互(原 font-picker.js 逻辑)
// 恢复选择与 data-font 属性由 Base.astro 的 head 内联脚本完成(防字体闪烁);
// 本组件挂载后决定选择界面显隐并绑定交互。
import { useEffect, useRef } from 'react';

/* 通知启动层(src/scripts/boot.ts):向导已经决定显隐,门控 4 可以放行了。
   dataset 标记是给「组件先于 boot.ts 挂载」的那种时序兜底,事件是给正常时序用的。 */
function announce(state: 'shown' | 'hidden'): void {
  document.documentElement.dataset.fontPickerState = state;
  document.dispatchEvent(new CustomEvent('fontpicker:state', { detail: { state } }));
}

function choose(font: string): void {
  try {
    localStorage.setItem('site-font', font);
    /* 本次会话的过渡层标记提前写下:重载后直接进页面,
       不再叠一次「加载层 → 向导 → 过渡层」的二次闪屏 */
    sessionStorage.setItem('boot-seen', '1');
  } catch (err) {
    /* 写入失败忽略,页面仍即时切换 */
  }
  /* 先即时切换,再刷新:重载时 head 内联脚本同样恢复 data-font;
     若浏览器拦截刷新,字体也已立即生效,手动刷新确认即可 */
  document.documentElement.setAttribute('data-font', font);
  location.reload();
}

export default function FontPicker() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    let saved: string | null = null;
    try {
      saved = localStorage.getItem('site-font');
    } catch (e) {
      /* 隐私模式下读取失败按未选择处理 */
    }

    const hide = () => {
      overlay.setAttribute('hidden', '');
      document.body.style.overflow = '';
      announce('hidden');
    };
    const show = () => {
      overlay.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
      const first = overlay.querySelector('.font-option') as HTMLElement | null;
      if (first) first.focus();
      announce('shown');
    };

    const reopen = document.getElementById('fontPickerReopen');
    reopen?.addEventListener('click', show);

    if (saved === 'default' || saved === 'maple') {
      hide();
    } else {
      show();
    }
    return () => {
      reopen?.removeEventListener('click', show);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="font-picker"
      id="fontPicker"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fontPickerTitle"
      hidden
    >
      <div className="font-picker-card">
        <h2 id="fontPickerTitle">选择字体</h2>
        <p className="font-picker-sub">默认使用系统字体,秒开页面;Maple Mono 需下载字体文件。</p>
        <p className="font-picker-note">如果选择完字体后页面没有自动刷新,请手动刷新网页。</p>
        <div className="font-picker-options">
          <button type="button" className="font-option" data-font-choice="default" onClick={() => choose('default')}>
            <span className="font-option-name">默认字体 <em>(国人推荐)</em></span>
            <span className="font-option-desc">系统字体,无需下载,打开最快</span>
          </button>
          <button type="button" className="font-option" data-font-choice="maple" onClick={() => choose('maple')}>
            <span className="font-option-name">Maple Mono NF CN</span>
            <span className="font-option-desc">等宽终端风,需下载字体</span>
          </button>
        </div>
      </div>
    </div>
  );
}
