'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   烽火 Fanos — M6 时间轴回放（底部居中浮条，新增文件零改现有组件）
   时刻游标语义：地图只显示 time_window 包含游标的情报条目（由 OsirisMap setFilter 实现）。
   范围 = 已加载（带坐标）条目的 [min(start), max(end)]；拖动/播放推进游标，上抛父级驱动地图。
   ═══════════════════════════════════════════════════════════════ */

interface TimelineItem {
  window_start: string | null;
  window_end: string | null;
  lat?: number | null;
}

interface Props {
  items?: TimelineItem[];
  active?: boolean;
  onCursor: (epochMs: number | undefined) => void;
}

const PLAY_DURATION_MS = 20000; // 播放一遍全程约 20s

function parseTs(s: string | null): number | null {
  if (!s) return null;
  const t = Date.parse(String(s).replace(' ', 'T')); // 非 RFC3339（空格分隔）先转 T
  return Number.isFinite(t) ? t : null;
}
function fmt(ms: number): string {
  try {
    return new Date(ms).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function TimelineScrubber({ items, active = true, onCursor }: Props) {
  // 时间轴范围：只算有坐标的条目（与地图渲染口径一致）
  const range = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const it of items || []) {
      if (typeof it.lat !== 'number') continue;
      const s = parseTs(it.window_start);
      const e = parseTs(it.window_end);
      for (const v of [s, e]) {
        if (v != null) {
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
        }
      }
    }
    return lo < hi ? { lo, hi } : null;
  }, [items]);

  const [cursor, setCursor] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // 范围就绪后把游标初始化到末端（"现在"）
  useEffect(() => {
    if (range && cursor == null) setCursor(range.hi);
  }, [range, cursor]);

  // 游标上抛父级 → 驱动 OsirisMap setFilter
  useEffect(() => {
    onCursor(cursor ?? undefined);
  }, [cursor, onCursor]);

  // 播放循环：rAF 推进虚拟时钟，到末端循环回起点
  useEffect(() => {
    if (!playing || !range) return;
    const span = range.hi - range.lo;
    const tick = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = now - lastRef.current;
      lastRef.current = now;
      setCursor((c) => {
        const base = c == null ? range.lo : c;
        const next = base + (span * dt) / PLAY_DURATION_MS;
        return next >= range.hi ? range.lo : next; // 循环
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [playing, range]);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || !range) return;
      const r = el.getBoundingClientRect();
      const frac = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
      setCursor(range.lo + frac * (range.hi - range.lo));
    },
    [range],
  );

  // 拖拽 / 点击定位（拖动时暂停播放）
  const onTrackPointerDown = useCallback(
    (e: React.PointerEvent) => {
      setPlaying(false);
      seekFromClientX(e.clientX);
      const move = (ev: PointerEvent) => seekFromClientX(ev.clientX);
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [seekFromClientX],
  );

  if (!active || !range || cursor == null) return null;
  const frac = (cursor - range.lo) / (range.hi - range.lo);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 4 }}
      className="hidden md:flex absolute bottom-[34px] left-1/2 -translate-x-1/2 z-[201] pointer-events-none"
    >
      <div className="glass-panel pointer-events-auto flex items-center gap-3 px-4 py-2.5" style={{ width: 'min(720px, 60vw)' }}>
        <button
          onClick={() => setPlaying((p) => !p)}
          title={playing ? '暂停' : '播放回放'}
          aria-label={playing ? '暂停' : '播放回放'}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--hover-accent)] transition-colors"
        >
          {playing ? (
            <Pause className="w-4 h-4 text-[var(--gold-primary)]" />
          ) : (
            <Play className="w-4 h-4 text-[var(--gold-primary)]" />
          )}
        </button>

        <span className="text-[9px] font-mono text-[var(--text-muted)] tabular-nums shrink-0">{fmt(range.lo)}</span>

        <div ref={trackRef} onPointerDown={onTrackPointerDown} className="relative flex-1 h-[12px] flex items-center cursor-pointer">
          <div className="absolute inset-x-0 h-[2px] rounded-full bg-[var(--border-secondary)]" />
          <div className="absolute left-0 h-[2px] rounded-full bg-[var(--gold-primary)]" style={{ width: `${frac * 100}%` }} />
          <div
            className="absolute w-3 h-3 rounded-full bg-[var(--gold-primary)] animate-osiris-pulse -translate-x-1/2"
            style={{ left: `${frac * 100}%`, boxShadow: '0 0 8px var(--gold-primary)' }}
          />
        </div>

        <span className="text-[9px] font-mono text-[var(--text-muted)] tabular-nums shrink-0">{fmt(range.hi)}</span>
        <span className="text-[10px] font-mono text-[var(--gold-primary)] tabular-nums shrink-0 w-[112px] text-right">{fmt(cursor)}</span>
      </div>
    </motion.div>
  );
}
