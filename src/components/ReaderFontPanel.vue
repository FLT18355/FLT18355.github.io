<script setup lang="ts">
// ReaderFontPanel.vue - 字体面板:当前字体信息 + 上传 / 恢复默认。
// 面板是工具条下方的弹出层(窄屏贴底);Esc 关闭、点面板外关闭由父组件统一管,
// 这里只负责文件选择与事件上报。文件 input 隐藏,用按钮触发。
import { ref } from 'vue';
import ReaderIcon from './ReaderIcon.vue';

defineProps<{
  /** 当前字体显示名(已上传),null 表示用站点默认 */
  current: { name: string; size: number } | null;
  /** 错误 / 降级说明 */
  note: string;
  noteKind: 'error' | 'info';
}>();

const emit = defineEmits<{
  upload: [file: File];
  reset: [];
  close: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);

// 选同一文件也能再次触发 change:点击前先清空 value
function pick() {
  if (fileInput.value) fileInput.value.value = '';
  fileInput.value?.click();
}

function onChange() {
  const f = fileInput.value?.files?.[0];
  if (f) emit('upload', f);
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>

<template>
  <div class="reader-font-panel" role="dialog" aria-label="Reading font" @keydown.esc="emit('close')">
    <h2 class="reader-font-title">Reading font</h2>

    <div class="reader-font-row">
      <span class="reader-font-label">Current</span>
      <span v-if="current" class="reader-font-name">{{ current.name }} · {{ fmtSize(current.size) }}</span>
      <span v-else class="reader-font-name is-default">Default (system font)</span>
    </div>

    <div class="reader-font-actions">
      <button type="button" class="reader-btn" @click="pick">
        <ReaderIcon name="upload" />
        <span>Upload font</span>
      </button>
      <button
        type="button"
        class="reader-btn"
        :disabled="!current"
        @click="emit('reset')"
      >
        <ReaderIcon name="circle" />
        <span>Reset</span>
      </button>
    </div>

    <p class="reader-font-note" :class="{ 'is-error': noteKind === 'error' }">{{ note }}</p>

    <input
      ref="fileInput"
      type="file"
      accept=".woff2,.woff,.ttf,.otf"
      class="reader-sr"
      @change="onChange"
    />
  </div>
</template>