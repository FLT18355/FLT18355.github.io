// snapshot-github.mjs - 刷新 src/data/github-user.snapshot.json
// projects 页的 GitHub 卡片在构建时优先用实时 API,拿不到(限流 / 断网)时用这份快照兜底。
// 用法:npm run snapshot:github(有 GITHUB_TOKEN 环境变量时自动带上,避开匿名限流)
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'smol-toml';

// 用户名与站点共用 content/projects.toml 的 [github].login,不在这里重复
const toml = await readFile(new URL('../content/projects.toml', import.meta.url), 'utf8');
const login = parse(toml).github?.login ?? 'FLT18355';
const API = `https://api.github.com/users/${login}`;
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
