'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // 经典包名，不是 'motion/react'
import { Factory, ChevronDown, ChevronUp } from 'lucide-react'; // 均已确认存在于 1.14.0

// historian GET /supply-chain 真实 schema（照抄 supply_chain.py stressed_nodes 返回；可空字段标 null）
interface TopEvent {
  title: string | null;
  source: string;
  severity: number | null;
  ts: string; // ISO（.isoformat()，含 'T'，可直接 new Date）
}
interface StressNode {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  stress: number;
  band: 'low' | 'medium' | 'high' | 'critical';
  event_count: number;
  sources: string[];
  latest_ts: string | null;
  top_events: TopEvent[];
  error?: boolean; // 后端 per-node 隔离：单节点查询失败的占位
}
type Resp = { nodes: StressNode[] } | { error: string; nodes: StressNode[] };

// 类别中文标签（supply_chain.py 的 category 枚举）
const CATEGORY_LABEL: Record<string, string> = {
  semiconductor: '半导体',
  electronics: '电子',
  automotive: '汽车',
  battery: '电池',
  maritime: '海运',
};

// band → 应力分配色（band 值与 gotham-tag--{band} 一致；critical 红/high 橙/medium 金/low 绿）
const BAND_COLOR: Record<string, string> = {
  critical: 'var(--alert-red)',
  high: 'var(--alert-orange)',
  medium: 'var(--gold-primary)',
  low: 'var(--alert-green)',
};

export default function SupplyChainPanel() {
  const [nodes, setNodes] = useState<StressNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set()); // 展开了 top_events 的节点

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      // 客户端浏览器 fetch：标准 cache:'no-store'（Next 的 next:{revalidate} 在此无效）
      const res = await fetch('/api/historian/supply-chain?window_days=7', { cache: 'no-store', signal });
      const json: Resp = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if ('error' in json && json.error) throw new Error(json.error); // historian 不可达是 200/502+error
      setNodes(Array.isArray(json.nodes) ? json.nodes : []);
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

  const toggleNode = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const activeCount = nodes.filter((n) => n.stress > 0).length;

  return (
    <motion.div
      data-testid="supply-panel"
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
          <Factory className="w-3.5 h-3.5 text-[var(--alert-orange)]" />
          <span className="hud-text text-[12px] text-[var(--text-primary)]">供应链应力</span>
          <span className="gotham-tag gotham-tag--info" style={{ fontSize: '8px', padding: '1px 5px' }}>
            {activeCount}/{nodes.length}
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
            <div className="max-h-[420px] overflow-y-auto styled-scrollbar divide-y divide-[var(--border-secondary)]">
              {loading && nodes.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <span className="text-[11px] font-mono text-[var(--text-muted)] tracking-widest">加载中…</span>
                </div>
              ) : error ? (
                <div className="px-4 py-6 text-center">
                  <span className="text-[11px] font-mono text-[var(--alert-red)]">加载失败：{error}</span>
                </div>
              ) : nodes.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <span className="text-[11px] font-mono text-[var(--text-muted)] tracking-widest">暂无节点</span>
                </div>
              ) : (
                nodes.map((n, i) => {
                  const isOpen = openIds.has(n.id);
                  const color = BAND_COLOR[n.band] ?? 'var(--text-muted)';
                  const hasEvents = n.top_events.length > 0;
                  return (
                    <div key={n.id ?? i} data-testid="node" className="node">
                      <button
                        onClick={() => hasEvents && toggleNode(n.id)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[var(--hover-accent)] transition-colors"
                        style={{ cursor: hasEvents ? 'pointer' : 'default' }}
                      >
                        <div className="flex items-center gap-2">
                          {n.stress > 0 ? (
                            <span className="hud-value shrink-0" style={{ color }}>
                              {n.stress.toFixed(1)}
                            </span>
                          ) : (
                            <span className="hud-value shrink-0" style={{ color: 'var(--text-muted)' }}>
                              —
                            </span>
                          )}
                          <span className="text-[11px] text-[var(--text-primary)] leading-tight truncate">{n.name}</span>
                          <span className="text-[8px] font-mono text-[var(--text-muted)] ml-auto shrink-0">
                            {CATEGORY_LABEL[n.category] ?? n.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] font-mono text-[var(--text-muted)] shrink-0">
                            {n.error ? '查询失败' : `${n.event_count} 事件`}
                          </span>
                          {n.sources.length > 0 && (
                            <span className="text-[8px] font-mono text-[var(--text-muted)] truncate">{n.sources.join('·')}</span>
                          )}
                          {n.latest_ts && (
                            <span className="text-[8px] font-mono text-[var(--text-muted)] ml-auto shrink-0">
                              {new Date(n.latest_ts).toLocaleString('zh-CN')}
                            </span>
                          )}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isOpen && hasEvents && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden bg-black/20"
                          >
                            {n.top_events.map((e, j) => (
                              <div
                                key={j}
                                className="px-4 py-1.5 flex items-center gap-2 border-t border-[var(--border-secondary)]"
                              >
                                <span className="text-[8px] font-mono shrink-0" style={{ color }}>
                                  {e.severity != null ? e.severity.toFixed(0) : '—'}
                                </span>
                                <span className="text-[9px] text-[var(--text-primary)]/80 leading-tight truncate">
                                  {e.title || '（无标题）'}
                                </span>
                                <span className="text-[8px] font-mono text-[var(--text-muted)] ml-auto shrink-0">{e.source}</span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
