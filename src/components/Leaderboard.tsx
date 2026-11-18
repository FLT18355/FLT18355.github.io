// Leaderboard.tsx - following 页底部:BenchLM AI 编程能力 Top 10 排行榜
// 数据源:https://benchlm.ai/api/data/leaderboard?limit=10
// 全英文 UI;仅显示 3 行,超出部分垂直滚动查看
import { useEffect, useState } from 'react';
import GlassCard from './GlassCard';

interface Model {
  rank: number;
  model: string;
  creator: string;
  categoryScores?: { coding?: number | null };
}

const API_URL = 'https://benchlm.ai/api/data/leaderboard?limit=10';

const MEDALS = [
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8z"/></svg>',
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8z"/></svg>',
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8z"/></svg>',
];

function fmt(n: number | null | undefined): string {
  if (n == null) return '-';
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

export default function Leaderboard() {
  const [rows, setRows] = useState<Model[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [updated, setUpdated] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!alive) return;
        setRows(Array.isArray(data.models) ? data.models : []);
        if (data.lastUpdated) setUpdated(data.lastUpdated);
        setLoaded(true);
      } catch (e) {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /** 相对最高分的条形宽度(百分比),用于可视化分数对比 */
  const barWidth = (m: Model): string => {
    const max = Math.max(
      1,
      ...rows.map((r) => (r.categoryScores && r.categoryScores.coding) || 0)
    );
    const score = (m.categoryScores && m.categoryScores.coding) || 0;
    return Math.max(8, Math.round((score / max) * 100)) + '%';
  };

  return (
    <GlassCard className="b-leaderboard">
      <details className="block fold card-fold" data-fold="b-leaderboard" open>
        <summary className="block-header fold-head">
          <h2>AI Coding Leaderboard</h2>
          <span className="fold-tail"><span className="fold-caret" aria-hidden="true" /></span>
        </summary>

        <div className="fold-body">
          <p className="leaderboard-note">
            Top 10 models by coding ability, from BenchLM
            {updated ? <> · Updated {updated}</> : null}
          </p>

          {failed ? (
            <div className="leaderboard-state" role="alert">Failed to load leaderboard.</div>
          ) : !loaded ? (
            /* 加载中用与最终行同形的骨架屏,而不是一行「Loading...」:
               版式不跳动,数据到达时是「填进来」而不是「换一屏」 */
            <div
              className="leaderboard-list leaderboard-list--skeleton"
              role="status"
              aria-busy="true"
              aria-label="Loading leaderboard"
            >
              {[1, 2, 3].map((n) => (
                <div key={'skel-' + n} className="leaderboard-row leaderboard-skel" aria-hidden="true">
                  <span className="leaderboard-rank skel-chip" />
                  <span className="leaderboard-name">
                    <span className="skel-line skel-line--title" />
                    <span className="skel-line skel-line--sub" />
                  </span>
                  <span className="leaderboard-score">
                    <span className="skel-line skel-line--score" />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className="leaderboard-head" aria-hidden="true">
                <span className="leaderboard-head-rank">#</span>
                <span className="leaderboard-head-model">Model</span>
                <span className="leaderboard-head-score">Coding</span>
              </div>
              <div className="leaderboard-list" role="list">
                {rows.map((m) => (
                  <div key={m.rank} className={`leaderboard-row leaderboard-row--${m.rank}`} role="listitem">
                    <span className="leaderboard-rank">
                      {m.rank <= 3 ? (
                        <span className="leaderboard-medal" dangerouslySetInnerHTML={{ __html: MEDALS[m.rank - 1] }} />
                      ) : (
                        <span>{m.rank}</span>
                      )}
                    </span>
                    <span className="leaderboard-name">
                      <span className="leaderboard-model">{m.model}</span>
                      <span className="leaderboard-creator">{m.creator}</span>
                    </span>
                    <span className="leaderboard-score">
                      <span className="leaderboard-score-bar" style={{ width: barWidth(m) }} />
                      <span className="leaderboard-score-num">{fmt(m.categoryScores && m.categoryScores.coding)}</span>
                      <span className="leaderboard-score-label">coding</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>
    </GlassCard>
  );
}
