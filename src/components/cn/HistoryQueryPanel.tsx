'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, Send, Loader2 } from 'lucide-react'; // 均已确认存在（AiAnalyst 用过）

// historian POST /nl-query 成功返回（照抄 api.py 第 90-94 行）；rows 是无表头二维数组
interface NlResult {
  sql: string;
  rows: Array<Array<string | number | boolean | null>>;
  answer_zh: string;
}

interface Props {
  onLocate?: (lat: number, lng: number) => void;
}

const SUGGESTIONS = ['数据库里有几条情报条目？', '最近的高分情报是什么？', '一共有哪些来源类型？'];

export default function HistoryQueryPanel(_props: Props) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NlResult | null>(null);
  const [showSql, setShowSql] = useState(false);

  const ask = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || loading) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/historian/nl-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ question: text }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || json?.detail || `HTTP ${res.status}`);
        // 成功判据：body 含 sql（空问题是 200+error，上游异常是 500+detail）
        if (!('sql' in json)) throw new Error(json?.error || json?.detail || 'NL 服务返回异常');
        setResult(json as NlResult);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '查询失败');
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  return (
    <motion.div
      data-testid="history-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel flex flex-col overflow-hidden pointer-events-auto"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-secondary)]">
        <Brain className="w-3.5 h-3.5 text-[var(--cyan-primary)]" />
        <span className="hud-text text-[12px] text-[var(--text-primary)]">问历史</span>
        <span className="text-[8px] font-mono text-[var(--text-muted)] ml-auto">DeepSeek · 中文</span>
      </div>

      {/* 答案区 */}
      <div className="max-h-[320px] overflow-y-auto styled-scrollbar px-4 py-3 min-h-[84px]">
        {loading ? (
          <div className="flex items-center gap-2 text-[var(--cyan-primary)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-[11px] font-mono">分析历史中…</span>
          </div>
        ) : error ? (
          <span className="text-[11px] font-mono text-[var(--alert-red)]">查询失败：{error}</span>
        ) : result ? (
          <div data-testid="nl-answer">
            <p className="text-[12px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{result.answer_zh}</p>
            <button
              onClick={() => setShowSql((s) => !s)}
              className="mt-2 text-[8px] font-mono text-[var(--text-muted)] hover:text-[var(--cyan-primary)] transition-colors"
            >
              {showSql ? '隐藏 SQL' : '查看 SQL'}（{result.rows?.length ?? 0} 行）
            </button>
            {showSql && (
              <pre className="mt-1 text-[8px] font-mono text-[var(--text-muted)] whitespace-pre-wrap bg-[var(--bg-tertiary)] rounded p-2">
                {result.sql}
              </pre>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">问问历史数据（中文）：</span>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={s}
                data-testid={`nl-suggest-${i}`}
                onClick={() => {
                  setQ(s);
                  ask(s);
                }}
                className="block w-full text-left px-2 py-1.5 rounded text-[10px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-accent)] border border-[var(--border-secondary)] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="px-3 py-2.5 border-t border-[var(--border-secondary)] flex gap-2 items-end">
        <textarea
          data-testid="nl-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              ask(q);
            }
          }}
          placeholder="用中文问历史…"
          rows={1}
          disabled={loading}
          className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-[11px] font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none"
        />
        <button
          data-testid="nl-send"
          onClick={() => ask(q)}
          disabled={!q.trim() || loading}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 bg-[var(--cyan-primary)]/15 border border-[var(--cyan-primary)]/30"
        >
          <Send className="w-3.5 h-3.5 text-[var(--cyan-primary)]" />
        </button>
      </div>
    </motion.div>
  );
}
