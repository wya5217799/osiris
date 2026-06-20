'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'; // 均已确认存在于 1.14.0

// historian GET /alerts 真实 schema（照抄 api.py 第 74-77 行）
interface HistorianAlert {
  alert_id: string;
  item_id: string | null;
  severity: string; // 自由文本（如 "high"），无枚举保证
  title: string;
  status: string; // new|ack|snoozed|resolved|auto_closed
  created_at: string | null; // 非 RFC3339，解析前 .replace(' ','T')
}
type AlertsResp = { alerts: HistorianAlert[] } | { error: string; alerts: HistorianAlert[] };

// severity 是自由文本：大小写无关地映射颜色，未知归默认（不做 exhaustive 渲染）
function sevColor(sev: string): string {
  const s = (sev || '').toLowerCase();
  if (s.includes('crit') || s.includes('high')) return 'var(--alert-red)';
  if (s.includes('elev') || s.includes('med') || s.includes('warn')) return 'var(--gold-primary)';
  return 'var(--text-muted)';
}

export default function SentinelAlertsPanel() {
  const [alerts, setAlerts] = useState<HistorianAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [acting, setActing] = useState<string | null>(null); // 正在推进状态的 alert_id

  // SOAR「act」一环：把告警推进到 to 态。成功即从「新告警」列表乐观移除（离开 new 态）；
  // 失败静默——下一次轮询 / SSE 会纠正显示。historian 经 BFF 校验非法转移返 409。
  const transition = useCallback(async (alertId: string, to: string) => {
    setActing(alertId);
    try {
      const res = await fetch(`/api/historian/alerts/${alertId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ to }),
      });
      if (res.ok) setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
    } catch {
      /* 网络/上游错误：静默，靠轮询纠正 */
    } finally {
      setActing(null);
    }
  }, []);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/historian/alerts?status=new&limit=50', { cache: 'no-store', signal });
      const json: AlertsResp = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if ('error' in json && json.error) throw new Error(json.error);
      setAlerts(Array.isArray(json.alerts) ? json.alerts : []);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    const iv = setInterval(() => load(ctrl.signal), 30_000); // 告警刷新比情报勤一点
    return () => {
      ctrl.abort();
      clearInterval(iv);
    };
  }, [load]);

  // 实时推送：SSE 订阅 /alerts/stream，哨兵发新告警即时刷新（上面的 30s 轮询保留为兜底）。
  // EventSource 原生自动重连：断网 / historian 重启后自动恢复，无需手动处理。
  useEffect(() => {
    const es = new EventSource('/api/historian/alerts/stream');
    const ctrl = new AbortController();
    const onAlert = () => load(ctrl.signal); // SSE 只当“变更信号”，full alert 仍走现成 load
    // 后端 LISTEN 线程挂掉时会发具名 `event: error` 再关流；EventSource 对「具名 error 帧」和
    // 「传输层断连」都派发到 'error' 监听器。立即拉一次兜底（不等 30s 轮询），EventSource 随后自动重连。
    const onStreamError = () => load(ctrl.signal);
    es.addEventListener('alert', onAlert);
    es.addEventListener('error', onStreamError);
    return () => {
      es.removeEventListener('alert', onAlert);
      es.removeEventListener('error', onStreamError);
      es.close();
      ctrl.abort();
    };
  }, [load]);

  return (
    <motion.div
      data-testid="alerts-panel"
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
          <AlertTriangle className="w-3.5 h-3.5 text-[var(--alert-red)]" />
          <span className="hud-text text-[12px] text-[var(--text-primary)]">哨兵告警</span>
          <span className="gotham-tag gotham-tag--high" style={{ fontSize: '8px', padding: '1px 5px' }}>
            {alerts.length}
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
              {loading && alerts.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <span className="text-[11px] font-mono text-[var(--text-muted)] tracking-widest">加载中…</span>
                </div>
              ) : error ? (
                <div className="px-4 py-6 text-center">
                  <span className="text-[11px] font-mono text-[var(--alert-red)]">加载失败：{error}</span>
                </div>
              ) : alerts.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <span className="text-[11px] font-mono text-[var(--text-muted)] tracking-widest">暂无告警</span>
                </div>
              ) : (
                alerts.slice(0, 50).map((a, i) => (
                  <div
                    key={a.alert_id ?? i}
                    data-testid="alert-item"
                    className="alert-item px-4 py-2.5 hover:bg-[var(--hover-accent)] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sevColor(a.severity), boxShadow: `0 0 6px ${sevColor(a.severity)}` }}
                      />
                      <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: sevColor(a.severity) }}>
                        {a.severity || '—'}
                      </span>
                      {a.created_at && (
                        <span className="text-[8px] font-mono text-[var(--text-muted)] ml-auto">
                          {new Date(a.created_at.replace(' ', 'T')).toLocaleString('zh-CN')}
                        </span>
                      )}
                    </div>
                    <h4 className="text-[11px] text-[var(--text-primary)] leading-tight line-clamp-2 mt-1">
                      {a.title || '（无标题）'}
                    </h4>
                    <span className="text-[8px] font-mono text-[var(--text-muted)]">状态：{a.status}</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {([['ack', '确认'], ['snoozed', '静默'], ['resolved', '解决']] as const).map(([to, label]) => (
                        <button
                          key={to}
                          data-testid={`alert-action-${to}`}
                          onClick={() => transition(a.alert_id, to)}
                          disabled={acting === a.alert_id}
                          className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-[var(--border-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--cyan-primary)] transition-colors disabled:opacity-40"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
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
