// MusicPlayer.tsx - 首页 Music Player
// 三个部分:封面 + 曲目信息 + 播放控制,下面是曲目列表(点一行即切歌)。
// 曲目来自 content/music.toml(gh-proxy 直链,浏览器端下载,不落地到仓库)。
// 播放中会把曲目与进度写进 localStorage,下次进站接着放;键盘 ← → 切歌。
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { TRACKS } from '../data/runtime';
import type { MusicTrack } from '../data/runtime';
import GlassCard from './GlassCard';

const STORE_KEY = 'music-player-state';

function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const indexRef = useRef(0);
  const currentRef = useRef(0);
  const playingRef = useRef(false);
  const pendingPlay = useRef(false);
  const restored = useRef<{ index: number; time: number } | null>(null);

  const track: MusicTrack = TRACKS[index];
  const hasCover = !!track.cover;

  const save = (): void => {
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({ index: indexRef.current, time: currentRef.current, playing: playingRef.current })
      );
    } catch (e) {
      /* 存储不可用时静默 */
    }
  };

  const play = (): void => {
    const a = audioRef.current;
    if (!a) return;
    a.play().catch(() => {
      setFailed(true);
    });
  };
  const pause = (): void => {
    audioRef.current?.pause();
  };
  const toggle = (): void => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) play();
    else pause();
  };

  /** 切到第 i 首;keepPlaying = true 时接着播(列表点击 / 上一首下一首) */
  const select = (i: number, keepPlaying = true): void => {
    const n = TRACKS.length;
    if (n === 0) return;
    const nextIndex = ((i % n) + n) % n;
    indexRef.current = nextIndex;
    currentRef.current = 0;
    setIndex(nextIndex);
    setCurrent(0);
    setDuration(0);
    setFailed(false);
    setLoading(true);
    if (keepPlaying) {
      pendingPlay.current = true;
      /* audio 元素随 key 重挂载,等这一次渲染提交后再 play */
      requestAnimationFrame(() => {
        if (!pendingPlay.current) return;
        pendingPlay.current = false;
        play();
      });
    }
  };

  const next = (): void => select(indexRef.current + 1, playingRef.current);
  const prev = (): void => select(indexRef.current - 1, playingRef.current);

  const onTime = (): void => {
    const a = audioRef.current;
    if (!a) return;
    currentRef.current = a.currentTime;
    setCurrent(a.currentTime);
  };
  const onMeta = (): void => {
    const a = audioRef.current;
    if (a && Number.isFinite(a.duration)) setDuration(a.duration);
  };
  const onPlay = (): void => {
    playingRef.current = true;
    setPlaying(true);
    setFailed(false);
    setLoading(false);
    save();
  };
  const onPause = (): void => {
    playingRef.current = false;
    setPlaying(false);
    save();
  };
  const onWaiting = (): void => setLoading(true);
  const onError = (): void => {
    setLoading(false);
    setPlaying(false);
    playingRef.current = false;
    setFailed(true);
  };
  const onEnded = (): void => {
    playingRef.current = false;
    setPlaying(false);
    currentRef.current = 0;
    setCurrent(0);
    select(indexRef.current + 1);
  };
  const onSeek = (e: ChangeEvent<HTMLInputElement>): void => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(a.duration)) return;
    const t = Number(e.target.value);
    if (Number.isFinite(t)) a.currentTime = t;
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const st = JSON.parse(raw) as { index?: number; time?: number } | null;
        if (st && typeof st.index === 'number' && st.index >= 0 && st.index < TRACKS.length) {
          indexRef.current = st.index;
          setIndex(st.index);
        }
        if (st && typeof st.time === 'number' && st.time > 0) {
          currentRef.current = st.time;
          restored.current = { index: st.index ?? 0, time: st.time };
          setCurrent(st.time);
        }
      }
    } catch (e) {
      /* 解析失败用默认第一首 */
    }
    const a = audioRef.current;
    if (a) a.currentTime = currentRef.current;

    /* 关闭标签页 / 刷新 / 跳走都会触发 pagehide */
    window.addEventListener('pagehide', save);
    return () => {
      window.removeEventListener('pagehide', save);
      save();
    };
  }, []);

  /* 恢复曲目时 audio 元素会随 key 重挂载,新元素的 currentTime 要补一次 */
  useEffect(() => {
    const a = audioRef.current;
    const r = restored.current;
    if (a && r && r.index === index) {
      a.currentTime = r.time;
      restored.current = null;
    }
  }, [index]);

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent): void => {
      const t = e.target as HTMLElement | null;
      const tag = t && t.tagName ? t.tagName : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  });

  return (
    <GlassCard className="b-music">
      <details className="block fold card-fold" data-fold="b-music" open>
        <summary className="block-header fold-head">
          <h2>Music</h2>
          <span className="fold-tail">
            <span className="block-note">{TRACKS.length} tracks</span>
            <span className="fold-caret" aria-hidden="true" />
          </span>
        </summary>

        <div className="fold-body">
          <div className={`music-player${playing ? ' is-playing' : ''}`}>
            <div className="music-stage">
              <div className="music-cover-wrap">
                {hasCover ? (
                  <img
                    className="music-cover"
                    src={track.cover}
                    alt={`${track.title} cover art`}
                    width="132"
                    height="132"
                  />
                ) : (
                  <div className="music-cover music-cover--placeholder" role="img" aria-label="No cover art">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z" />
                    </svg>
                  </div>
                )}
                <span className="music-eq" aria-hidden="true"><i /><i /><i /><i /></span>
              </div>

              <div className="music-body">
                <p className="music-title">{track.title}</p>
                <p className="music-artist">{track.artist}</p>

                <div className="music-controls">
                  <button className="music-nav" type="button" aria-label="Previous track" disabled={TRACKS.length < 2} onClick={prev}>
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M6 6h2v12H6zM20 6v12L9 12z" />
                    </svg>
                  </button>
                  <button
                    className="music-toggle"
                    type="button"
                    aria-label={playing ? 'Pause' : 'Play'}
                    aria-pressed={playing}
                    onClick={toggle}
                  >
                    {playing ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <button className="music-nav" type="button" aria-label="Next track" disabled={TRACKS.length < 2} onClick={next}>
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M16 6h2v12h-2zM4 6v12l11-6z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="music-bar">
              <input
                className="music-seek"
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={current}
                disabled={!duration}
                aria-label="Seek"
                onChange={onSeek}
              />
              <div className="music-time">
                <span>{fmt(current)}</span>
                <span className="music-status" role="status">
                  {failed ? 'Load failed' : loading ? 'Buffering…' : playing ? 'Playing' : 'Paused'}
                </span>
                <span>{fmt(duration)}</span>
              </div>
            </div>
          </div>

          <ol className="music-list">
            {TRACKS.map((t, i) => (
              <li key={t.src}>
                <button
                  className="music-row"
                  type="button"
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => select(i)}
                >
                  <span className="music-row-title">{t.title}</span>
                  <span className="music-row-artist">{t.artist}</span>
                </button>
              </li>
            ))}
          </ol>

          <audio
            ref={audioRef}
            src={track.src}
            key={track.src}
            preload="metadata"
            onTimeUpdate={onTime}
            onLoadedMetadata={onMeta}
            onDurationChange={onMeta}
            onPlay={onPlay}
            onPause={onPause}
            onWaiting={onWaiting}
            onError={onError}
            onEnded={onEnded}
          />
        </div>
      </details>
    </GlassCard>
  );
}
