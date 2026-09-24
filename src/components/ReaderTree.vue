<script setup lang="ts">
// ReaderTree.vue - 目录树:递归渲染目录与 .md 文件。
// 用原生 ul/li + button,不装 role=tree 的架子(那需要 roving tabindex
// 等完整键盘模型,装一半反而是无障碍谎言);原生按钮 Enter/Space/Tab 都可达。
// 组件自引用(文件名即组件名)实现递归:每个目录节点的子级用一个 li 包住再递归,
// 保证 ul 的直接子元素恒为 li(Vue 模板编译器对此严格)。
import { computed } from 'vue';
import ReaderIcon from './ReaderIcon.vue';
import type { TreeNode } from '../lib/reader/archive';

const props = defineProps<{
  nodes: TreeNode[];
  active: string | null;
  collapsed: Set<string>;
  filter: string;
}>();

const emit = defineEmits<{
  open: [path: string];
  toggle: [path: string];
}>();

// 过滤:命中文件名的节点保留,并连带保留它的祖先目录(目录本身不参与匹配)。
// 过滤态下目录一律展开(忽略 collapsed),让命中项可见。
const visible = computed(() => {
  const q = props.filter.trim().toLowerCase();
  if (!q) return props.nodes;

  const filterNodes = (list: TreeNode[]): TreeNode[] => {
    const out: TreeNode[] = [];
    for (const node of list) {
      if (node.kind === 'file') {
        if (
          node.name.toLowerCase().includes(q) ||
          node.path.toLowerCase().includes(q)
        ) {
          out.push(node);
        }
        continue;
      }
      const kids = filterNodes(node.children);
      if (kids.length) {
        // 浅拷贝节点只换 children,保持其它字段稳定
        out.push({ ...node, children: kids });
      }
    }
    return out;
  };
  return filterNodes(props.nodes);
});

const isCollapsed = (path: string): boolean =>
  !props.filter.trim() && props.collapsed.has(path);
</script>

<template>
  <ul class="reader-tree-list">
    <li v-for="node in visible" :key="node.path" class="reader-tree-item">
      <!-- 目录:可折叠 -->
      <button
        v-if="node.kind === 'dir'"
        type="button"
        class="reader-node reader-node--dir"
        :class="{ 'is-collapsed': isCollapsed(node.path) }"
        :aria-expanded="!isCollapsed(node.path)"
        @click="emit('toggle', node.path)"
      >
        <ReaderIcon name="chevron" class="reader-ico reader-ico--chev" />
        <ReaderIcon name="folder" class="reader-ico reader-ico--folder" />
        <span class="reader-node-name">{{ node.name }}</span>
      </button>
      <!-- 文件:点击打开 -->
      <button
        v-else
        type="button"
        class="reader-node reader-node--file"
        :aria-current="node.path === active ? 'true' : undefined"
        @click="emit('open', node.path)"
      >
        <ReaderIcon name="file" class="reader-ico" />
        <span class="reader-node-name">{{ node.name }}</span>
      </button>
      <!-- 递归子级:用 li 包住再渲染子树,ul 的直接子元素恒为 li -->
      <li v-if="node.kind === 'dir' && !isCollapsed(node.path)">
        <ReaderTree
          :nodes="node.children"
          :active="active"
          :collapsed="collapsed"
          :filter="filter"
          @open="emit('open', $event)"
          @toggle="emit('toggle', $event)"
        />
      </li>
    </li>
  </ul>
</template>