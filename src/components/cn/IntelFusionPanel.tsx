'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // 经典包名，不是 'motion/react'
import { Newspaper, ChevronDown, ChevronUp } from 'lucide-react'; // 均已确认存在于 1.14.0

// historian GET /items 真实 schema（照抄 api.py 第 59-64 行；可空字段全标 null）
interface HistorianItem {
  item_id: string;
  window_start: string | null; // "2044-01-01 00:00:00+00:00" 非 RFC3339，解析前 .replace(' ','T')
  window_end: string | null;
  source_types: string[]; // 可能为 []
  source_count: number | null;
  score: number | null;
  status: string;
  summary: string | null;
}
type ItemsResp = { items: HistorianItem[] } | { error: string; items: HistorianItem[] };

export default function IntelFusionPanel() {
  const [items, setItems] = useState<HistorianItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      // 客户端浏览器 fetch：Next 的 next:{revalidate} 在此无效，只能用标准 cache:'no-store'
      const res = await fetch('/api/historian/items?status=open&limit=50', { cache: 'no-store', signal });
      const json: ItemsResp = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if ('error' in json && json.error) throw new Error(json.error); // bbox 非法是 200+error
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return; // 卸载/重入忽略
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    const iv = setInterval(() => load(ctrl.signal), 60_000); // 仿父级轮询节奏
    return () => {
      ctrl.abort();
      clearInterval(iv);
    };
  }, [load]);

  return (
    <motion.div
      data-testid="fusion-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel flex flex-col overflow-hidden pointer-events-auto"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-4 py-3 hover:bg-[var(--hover-accent)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Newspaper className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
          <span className="hud-text text-[12px] text-[var(--text-primary)]">融合情报条目</span>
          <span className="gotham-tag gotham-tag--info" style={{ fontSize: '8px', padding: '1px 5px' }}>
            {items.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-3 h-3 text-[var(--text-muted)]" />
        ) : (
          <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto styled-scrollbar divide-y divide-[var(--border-secondary)]">
              {loading && items.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <span className="text-[11px] font-mono text-[var(--text-muted)] tracking-widest">加载中…</span>
                </div>
              ) : error ? (
                <div className="px-4 py-6 text-center">
                  <span className="text-[11px] font-mono text-[var(--alert-red)]">加载失败：{error}</span>
                </div>
              ) : items.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <span className="text-[11px] font-mono text-[var(--text-muted)] tracking-widest">暂无情报条目</span>
                </div>
              ) : (
                items.slice(0, 50).map((it, i) => (
                  <div
                    key={it.item_id ?? i}
                    data-testid="item"
                    className="item px-4 py-2.5 hover:bg-[var(--hover-accent)] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="hud-value">{it.score != null ? it.score.toFixed(1) : '—'}</span>
                      <span className="text-[8px] font-mono text-[var(--text-muted)]">
                        {it.source_types.join('·') || '—'}
                      </span>
                      {it.window_start && (
                        <span className="text-[8px] font-mono text-[var(--text-muted)] ml-auto">
                          {new Date(it.window_start.replace(' ', 'T')).toLocaleString('zh-CN')}
                        </span>
                      )}
                    </div>
                    <h4 className="text-[11px] text-[var(--text-primary)] leading-tight line-clamp-2 mt-1">
                      {it.summary ?? '（无摘要）'}
                    </h4>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
