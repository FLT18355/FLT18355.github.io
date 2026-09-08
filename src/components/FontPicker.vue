<script setup lang="ts">
// FontPicker.vue - 首启字体选择交互(原 font-picker.js 逻辑)
// 恢复选择与 data-font 属性由 Base.astro 的 head 内联脚本完成(防字体闪烁);
// 本组件挂载后决定选择界面显隐并绑定交互。
import { onMounted, ref } from 'vue';

const hidden = ref(true);

onMounted(() => {
  const overlay = document.getElementById('fontPicker');
  if (!overlay) return;
  const root = document.documentElement;

  let saved: string | null = null;
  try {
    saved = localStorage.getItem('site-font');
  } catch (e) {
    /* 隐私模式下读取失败按未选择处理 */
  }

  const hide = () => {
    hidden.value = true;
    overlay.setAttribute('hidden', '');
    document.body.style.overflow = '';
  };
  const show = () => {
    hidden.value = false;
    overlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    const first = overlay.querySelector('.font-option') as HTMLElement | null;
    if (first) first.focus();
  };

  const choose = (font: string) => {
    try {
      localStorage.setItem('site-font', font);
    } catch (err) {
      /* 写入失败忽略,页面仍即时切换 */
    }
    /* 先即时切换,再刷新:重载时 head 内联脚本同样恢复 data-font;
       若浏览器拦截刷新,字体也已立即生效,手动刷新确认即可 */
    root.setAttribute('data-font', font);
    location.reload();
  };

  const reopen = document.getElementById('fontPickerReopen');
  if (reopen) reopen.addEventListener('click', show);

  if (saved === 'default' || saved === 'maple') {
    hide();
  } else {
    show();
  }
});
</script>

<template>
  <div
    class="font-picker"
    id="fontPicker"
    role="dialog"
    aria-modal="true"
    aria-labelledby="fontPickerTitle"
    :hidden="hidden"
  >
    <div class="font-picker-card">
      <h2 id="fontPickerTitle">选择字体</h2>
      <p class="font-picker-sub">默认使用系统字体,秒开页面;Maple Mono 需下载字体文件。</p>
      <p class="font-picker-note">如果选择完字体后页面没有自动刷新,请手动刷新网页。</p>
      <div class="font-picker-options">
        <button
          type="button"
          class="font-option"
          data-font-choice="default"
          @click="choose('default')"
        >
          <span class="font-option-name">默认字体 <em>(国人推荐)</em></span>
          <span class="font-option-desc">系统字体,无需下载,打开最快</span>
        </button>
        <button type="button" class="font-option" data-font-choice="maple" @click="choose('maple')">
          <span class="font-option-name">Maple Mono NF CN</span>
          <span class="font-option-desc">等宽终端风,需下载字体</span>
        </button>
      </div>
    </div>
  </div>
</template>
