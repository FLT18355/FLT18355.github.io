// github.ts - projects 页 GitHub 资料卡的数据源
// 构建时向 https://api.github.com/users/FLT18355 拉一次:访客侧零请求、无 JS 也完整可见,
// 数据随每次部署刷新(GitHub Actions 会透传 GITHUB_TOKEN,避开共享 IP 上的匿名限流)。
// 拉取失败(限流 / 断网)时退回仓库内的快照,卡片不开天窗;快照用 `npm run snapshot:github` 刷新。

import snapshot from './github-user.snapshot.json';

export const GITHUB_LOGIN = 'FLT18355';
export const GITHUB_USER_API = `https://api.github.com/users/${GITHUB_LOGIN}`;

/** /users/{login} 里指向其它 API 资源的端点字段,展示为可点开的链接 */
const ENDPOINT_KEYS = [
  'url',
  'followers_url',
  'following_url',
  'gists_url',
  'starred_url',
  'subscriptions_url',
  'organizations_url',
  'repos_url',
  'events_url',
  'received_events_url',
] as const;

export interface GithubEndpoint {
  /** API 字段名(去掉 _url 后缀后作为标签) */
  key: string;
  href: string;
}

export interface GithubUser {
  login: string;
  id: number;
  nodeId: string;
  avatarUrl: string;
  gravatarId: string | null;
  /** API 里这一条用户资源的地址(https://api.github.com/users/FLT18355) */
  apiUrl: string;
  htmlUrl: string;
  type: string;
  userViewType: string;
  siteAdmin: boolean;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  hireable: boolean | null;
  bio: string | null;
  twitterUsername: string | null;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  /** ISO 8601(GitHub 原样返回,展示时裁到日期) */
  createdAt: string;
  updatedAt: string;
  endpoints: GithubEndpoint[];
}

type Raw = Record<string, unknown>;

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const num = (v: unknown): number => (typeof v === 'number' ? v : 0);
const nullableStr = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);

/** 把 API 的下划线字段收敛成组件用的驼峰结构;缺字段一律降级,不抛错 */
function normalize(raw: Raw): GithubUser {
  const login = str(raw.login, GITHUB_LOGIN);
  return {
    login,
    id: num(raw.id),
    nodeId: str(raw.node_id),
    avatarUrl: str(raw.avatar_url),
    gravatarId: nullableStr(raw.gravatar_id),
    apiUrl: str(raw.url, GITHUB_USER_API),
    htmlUrl: str(raw.html_url, `https://github.com/${login}`),
    type: str(raw.type, 'User'),
    userViewType: str(raw.user_view_type, 'public'),
    siteAdmin: raw.site_admin === true,
    name: nullableStr(raw.name),
    company: nullableStr(raw.company),
    blog: nullableStr(raw.blog),
    location: nullableStr(raw.location),
    email: nullableStr(raw.email),
    hireable: typeof raw.hireable === 'boolean' ? raw.hireable : null,
    bio: nullableStr(raw.bio),
    twitterUsername: nullableStr(raw.twitter_username),
    publicRepos: num(raw.public_repos),
    publicGists: num(raw.public_gists),
    followers: num(raw.followers),
    following: num(raw.following),
    createdAt: str(raw.created_at),
    updatedAt: str(raw.updated_at),
    endpoints: ENDPOINT_KEYS.map((key) => ({ key, href: str(raw[key]) })).filter((e) => e.href !== ''),
  };
}

/** 部署工作流里显式透传的 token;本地没有则是匿名请求(60 次/小时,够用) */
const GITHUB_TOKEN = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env?.GITHUB_TOKEN;

async function fetchRaw(): Promise<Raw> {
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': 'FLT18355.github.io build',
  };
  if (GITHUB_TOKEN) headers.authorization = `Bearer ${GITHUB_TOKEN}`;
  const res = await fetch(GITHUB_USER_API, { headers, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return (await res.json()) as Raw;
}

/** 构建时取一次用户信息;拿不到实时数据就退回快照,两条路都不通时返回 null(卡片不渲染) */
export async function getGithubUser(): Promise<GithubUser | null> {
  try {
    return normalize(await fetchRaw());
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(
      `[github] 拉取 ${GITHUB_USER_API} 失败(${reason}),改用 src/data/github-user.snapshot.json`
    );
  }
  try {
    return normalize(snapshot as Raw);
  } catch (err) {
    console.warn(`[github] 快照不可用(${err instanceof Error ? err.message : String(err)}),跳过 GitHub 卡片`);
    return null;
  }
}
