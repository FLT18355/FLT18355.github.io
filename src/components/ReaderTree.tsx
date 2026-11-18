// ReaderTree.tsx - 目录树:递归渲染目录与 .md 文件。
// 用原生 ul/li + button,不装 role=tree 的架子(那需要 roving tabindex
// 等完整键盘模型,装一半反而是无障碍谎言);原生按钮 Enter/Space/Tab 都可达。
import ReaderIcon from './ReaderIcon';
import type { TreeNode } from '../lib/reader/archive';

interface Props {
  nodes: TreeNode[];
  active: string | null;
  collapsed: Set<string>;
  filter: string;
  onOpen: (path: string) => void;
  onToggle: (path: string) => void;
}

// 过滤:命中文件名的节点保留,并连带保留它的祖先目录(目录本身不参与匹配)。
// 过滤态下目录一律展开(忽略 collapsed),让命中项可见。
function filterNodes(list: TreeNode[], q: string): TreeNode[] {
  const out: TreeNode[] = [];
  for (const node of list) {
    if (node.kind === 'file') {
      if (node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q)) {
        out.push(node);
      }
      continue;
    }
    const kids = filterNodes(node.children, q);
    if (kids.length) {
      // 浅拷贝节点只换 children,保持其它字段稳定
      out.push({ ...node, children: kids });
    }
  }
  return out;
}

export default function ReaderTree({ nodes, active, collapsed, filter, onOpen, onToggle }: Props) {
  const q = filter.trim().toLowerCase();
  const visible = q ? filterNodes(nodes, q) : nodes;
  const isCollapsed = (path: string): boolean => !filter.trim() && collapsed.has(path);

  return (
    <ul className="reader-tree-list">
      {visible.map((node) => (
        <li key={node.path} className="reader-tree-item">
          {/* 目录:可折叠 */}
          {node.kind === 'dir' ? (
            <button
              type="button"
              className={`reader-node reader-node--dir${isCollapsed(node.path) ? ' is-collapsed' : ''}`}
              aria-expanded={!isCollapsed(node.path)}
              onClick={() => onToggle(node.path)}
            >
              <ReaderIcon name="chevron" className="reader-ico--chev" />
              <ReaderIcon name="folder" className="reader-ico--folder" />
              <span className="reader-node-name">{node.name}</span>
            </button>
          ) : (
            <button
              type="button"
              className="reader-node reader-node--file"
              aria-current={node.path === active ? 'true' : undefined}
              onClick={() => onOpen(node.path)}
            >
              <ReaderIcon name="file" />
              <span className="reader-node-name">{node.name}</span>
            </button>
          )}
          {node.kind === 'dir' && !isCollapsed(node.path) && (
            <li>
              <ReaderTree
                nodes={node.children}
                active={active}
                collapsed={collapsed}
                filter={filter}
                onOpen={onOpen}
                onToggle={onToggle}
              />
            </li>
          )}
        </li>
      ))}
    </ul>
  );
}
