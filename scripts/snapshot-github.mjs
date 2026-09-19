// snapshot-github.mjs - 刷新 src/data/github-user.snapshot.json
// projects 页的 GitHub 卡片在构建时优先用实时 API,拿不到(限流 / 断网)时用这份快照兜底。
// 用法:npm run snapshot:github(有 GITHUB_TOKEN 环境变量时自动带上,避开匿名限流)
import { writeFile } from 'node:fs/promises';

const API = 'https://api.github.com/users/FLT18355';
const OUT = new URL('../src/data/github-user.snapshot.json', import.meta.url);
const token = process.env.GITHUB_TOKEN;

const res = await fetch(API, {
  headers: {
    accept: 'application/vnd.github+json',
    'user-agent': 'FLT18355.github.io snapshot',
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  },
});
if (!res.ok) throw new Error(`${API} → HTTP ${res.status} ${res.statusText}`);

const user = await res.json();
await writeFile(OUT, `${JSON.stringify(user, null, 2)}\n`);
console.log(`wrote src/data/github-user.snapshot.json (${Object.keys(user).length} fields, updated_at ${user.updated_at})`);
