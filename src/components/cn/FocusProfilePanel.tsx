'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // 经典包名
import { SlidersHorizontal, ChevronDown, ChevronUp, Plus, X } from 'lucide-react'; // 均已确认存在于 1.14.0

// historian GET/PUT /focus 真实 schema（ADR0005 可移动镜头：tag→倍率 + cap）
type FocusResp = { weights: Record<string, number>; cap: number } | { error: string };
interface Row {
  id: number; // 本地稳定 key（标签键可编辑/为空/重复，不能拿它当 React key）
  key: string;
  value: string;
}

export default function FocusProfilePanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [cap, setCap] = useState('6');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [expanded, setExpanded] = useState(true);
  const nextId = useRef(0);

  const rowsFromWeights = useCallback(
    (w: Record<string, number>): Row[] =>
      Object.entries(w).map(([key, value]) => ({ id: nextId.current++, key, value: String(value) })),
    [],
  );

  const load = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch('/api/historian/focus', { cache: 'no-store', signal });
        const json: FocusResp = await res.json();
        if (!res.ok || 'error' in json) throw new Error(('error' in json && json.error) || `HTTP ${res.status}`);
        setRows(rowsFromWeights(json.weights || {}));
        setCap(String(json.cap ?? 6));
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setLoadError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    },
    [rowsFromWeights],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const updateRow = (id: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: number) => setRows((rs) => rs.filter((r) => r.id !== id));
  const addRow = () => setRows((rs) => [...rs, { id: nextId.current++, key: '', value: '' }]);

  const save = async () => {
    setSaving(true);
    setStatus(null);
    // 构造 weights：去空键；同键后者覆盖；值转 number。非法值（≤0/NaN/键无冒号）交后端 400 兜底。
    const weights: Record<string, number> = {};
    for (const r of rows) {
      const k = r.key.trim();
      if (k) weights[k] = Number(r.value);
    }
    try {
      const res = await fetch('/api/historian/focus', {
        method: 'PUT',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights, cap: Number(cap) }),
      });
      const json: FocusResp = await res.json();
      if (!res.ok || 'error' in json) throw new Error(('error' in json && json.error) || `HTTP ${res.status}`);
      setRows(rowsFromWeights(json.weights || {})); // 用服务端规范化结果回填
      setCap(String(json.cap ?? cap));
      setStatus({ ok: true, msg: '已保存，即时生效' });
    } catch (err: unknown) {
      setStatus({ ok: false, msg: err instanceof Error ? err.message : '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      data-testid="focus-panel"
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
          <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--cyan-primary)]" />
          <span className="hud-text text-[12px] text-[var(--text-primary)]">关注镜头</span>
          <span className="gotham-tag gotham-tag--info" style={{ fontSize: '8px', padding: '1px 5px' }}>
            {rows.length}
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
            <div className="max-h-[440px] overflow-y-auto styled-scrollbar px-3 py-2">
              {loading ? (
                <div className="px-1 py-4 text-center">
                  <span className="text-[11px] font-mono text-[var(--text-muted)] tracking-widest">加载中…</span>
                </div>
              ) : loadError ? (
                <div className="px-1 py-4 text-center">
                  <span className="text-[11px] font-mono text-[var(--alert-red)]">加载失败：{loadError}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--border-secondary)]">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] w-16 shrink-0">上限 cap</span>
                    <input
                      data-testid="focus-cap"
                      type="number"
                      step="0.1"
                      min="1"
                      value={cap}
                      onChange={(e) => setCap(e.target.value)}
                      className="w-20 bg-black/30 border border-[var(--border-secondary)] rounded px-2 py-1 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--cyan-primary)]"
                    />
                    <span className="text-[8px] font-mono text-[var(--text-muted)]">权重相乘封顶</span>
                  </div>

                  {rows.length === 0 && (
                    <div className="px-1 py-2 text-[10px] font-mono text-[var(--text-muted)]">暂无权重，点下方添加。</div>
                  )}
                  {rows.map((r) => (
                    <div key={r.id} data-testid="focus-row" className="flex items-center gap-1.5 mb-1.5">
                      <input
                        data-testid="focus-key"
                        value={r.key}
                        onChange={(e) => updateRow(r.id, { key: e.target.value })}
                        placeholder="region:hormuz"
                        className="flex-1 min-w-0 bg-black/30 border border-[var(--border-secondary)] rounded px-2 py-1 text-[10px] font-mono text-[var(--text-primary)] outline-none focus:border-[var(--cyan-primary)]"
                      />
                      <input
                        data-testid="focus-value"
                        type="number"
                        step="0.1"
                        min="0"
                        value={r.value}
                        onChange={(e) => updateRow(r.id, { value: e.target.value })}
                        placeholder="2.5"
                        className="w-16 shrink-0 bg-black/30 border border-[var(--border-secondary)] rounded px-2 py-1 text-[10px] font-mono text-[var(--text-primary)] outline-none focus:border-[var(--cyan-primary)]"
                      />
                      <button
                        onClick={() => removeRow(r.id)}
                        title="删除"
                        aria-label="删除"
                        className="shrink-0 p-1 text-[var(--text-muted)] hover:text-[var(--alert-red)] transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <button
                    data-testid="focus-add"
                    onClick={addRow}
                    className="flex items-center gap-1 mt-1 mb-2 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--cyan-primary)] transition-colors"
                  >
                    <Plus className="w-3 h-3" /> 添加标签
                  </button>

                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-secondary)]">
                    <button
                      data-testid="focus-save"
                      onClick={save}
                      disabled={saving}
                      className="px-3 py-1 rounded text-[11px] bg-[var(--cyan-primary)]/15 border border-[var(--border-cyan)] text-[var(--cyan-primary)] hover:bg-[var(--cyan-primary)]/25 transition-colors disabled:opacity-50"
                    >
                      {saving ? '保存中…' : '保存'}
                    </button>
                    {status && (
                      <span
                        data-testid="focus-status"
                        className="text-[9px] font-mono"
                        style={{ color: status.ok ? 'var(--alert-green)' : 'var(--alert-red)' }}
                      >
                        {status.msg}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
