import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

export default defineConfig({
  site: 'https://flt18355.github.io/',
  // preserve：直接产出 /projects.html 等，与旧站 URL 完全一致
  build: { format: 'preserve' },
  integrations: [
    vue({
      // <liquid-glass> 是 @liquidglassjs/element 注册的原生自定义元素,不是 Vue 组件。
      // 不声明的话 Vue 会把它当组件去 resolveComponent(带连字符的小写标签默认按组件解析),
      // 渲染出注释节点并打警告;声明后按原生元素原样输出。
      template: { compilerOptions: { isCustomElement: (tag) => tag === 'liquid-glass' } },
    }),
  ],
});
