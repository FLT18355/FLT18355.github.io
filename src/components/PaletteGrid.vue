<script setup lang="ts">
// PaletteGrid.vue - Catppuccin 色板页:SSR 直出色块 + 水合后绑定点击复制 Hex
// 数据源:src/data/palette.ts(原 palette.js 数据)
import { ACCENTS, NEUTRALS, FLAVORS } from '../data/palette';
import type { Flavor } from '../data/palette';

/** 色名 → Catppuccin CSS 变量名:小写、空格转连字符,如 "Subtext 1" → --subtext-1 */
function toVarName(name: string): string {
  return '--' + name.toLowerCase().replace(/ /g, '-');
}

function swatchHtml(name: string, hex: string, varName?: string): string {
  return (
    '<button type="button" class="swatch" data-hex="' +
    hex +
    '"' +
    (varName ? ' data-var="' + varName + '"' : '') +
    ' title="Copy ' +
    hex +
    '">' +
    '<span class="swatch-chip" style="background:' +
    hex +
    '"></span>' +
    '<span class="swatch-name">' +
    name +
    '</span>' +
    '<span class="swatch-hex">' +
    hex +
    '</span>' +
    '</button>'
  );
}

function flavorHtml(f: Flavor): string {
  const accents = ACCENTS.map((n) => swatchHtml(n, f.hex[n], toVarName(n))).join('');
  const neutrals = NEUTRALS.map((n) => swatchHtml(n, f.hex[n], toVarName(n))).join('');
  return (
    '<div class="palette-flavor">' +
    '<div class="palette-head"><h3>' +
    f.name +
    '</h3><span>' +
    f.note +
    '</span></div>' +
    '<div class="palette-group"><span>Accent</span></div>' +
    '<div class="swatch-grid">' +
    accents +
    '</div>' +
    '<div class="palette-group"><span>Neutrals</span></div>' +
    '<div class="swatch-grid">' +
    neutrals +
    '</div>' +
    '</div>'
  );
}

const rootHtml = FLAVORS.map(flavorHtml).join('');

function onRootClick(e: Event): void {
  const target = e.target as HTMLElement;
  const sw = target.closest ? target.closest('.swatch') : null;
  if (!sw) return;
  const hex = sw.getAttribute('data-hex');
  if (!hex) return;
  const label = sw.querySelector('.swatch-hex');
  if (!label) return;
  const old = label.textContent || '';
  /* 优先复制 CSS 变量名(更有用),按钮 title 展示 Hex */
  const copyText = sw.getAttribute('data-var') || hex;
  const done = () => {
    sw.classList.add('copied');
    label.textContent = copyText;
    setTimeout(() => {
      sw.classList.remove('copied');
      label.textContent = old;
    }, 900);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(copyText).then(done, done);
  } else {
    done();
  }
}
</script>

<template>
  <!-- eslint-disable vue/no-v-html: 色板内容由本地数据构造,无外部输入 -->
  <div id="palette" class="palette" v-html="rootHtml" @click="onRootClick"></div>
</template>
