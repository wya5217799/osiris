'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, AlertTriangle, Brain } from 'lucide-react'; // 三者均已确认存在于现有组件 import
import IntelFusionPanel from '@/components/cn/IntelFusionPanel';
import SentinelAlertsPanel from '@/components/cn/SentinelAlertsPanel';

/* ═══════════════════════════════════════════════════════════════
   烽火 Fanos — 中文情报面板组（就地优化 Osiris，新增文件，零改现有组件）
   单一 active state 天然互斥；slide-out 复用现有右工具条定位类。
   切 1：融合情报面板已接；哨兵告警/问历史为占位，切 2/3 替换。
   ═══════════════════════════════════════════════════════════════ */

type Panel = 'fusion' | 'alerts' | 'history';

interface Props {
  onLocate?: (lat: number, lng: number) => void;
}

const BUTTONS: { key: Panel; Icon: typeof Newspaper; label: string; activeColor: string }[] = [
  { key: 'fusion', Icon: Newspaper, label: '融合情报条目', activeColor: 'text-[var(--gold-primary)]' },
  { key: 'alerts', Icon: AlertTriangle, label: '哨兵告警', activeColor: 'text-[var(--alert-red)]' },
  { key: 'history', Icon: Brain, label: '问历史', activeColor: 'text-[var(--cyan-primary)]' },
];

function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel flex flex-col overflow-hidden pointer-events-auto"
    >
      <div className="px-4 py-3">
        <span className="hud-text text-[12px] text-[var(--text-primary)]">{title}</span>
      </div>
      <div className="px-4 py-8 text-center">
        <span className="text-[11px] font-mono text-[var(--text-muted)] tracking-widest">{note}</span>
      </div>
    </motion.div>
  );
}

export default function ChinesePanels({ onLocate }: Props) {
  const [active, setActive] = useState<Panel | null>(null);

  return (
    <div className="relative flex flex-col gap-2">
      {BUTTONS.map(({ key, Icon, label, activeColor }) => (
        <button
          key={key}
          data-testid={`open-${key}`}
          title={label}
          aria-label={label}
          onClick={() => setActive((prev) => (prev === key ? null : key))}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            active === key ? 'bg-[var(--cyan-primary)]/20' : 'hover:bg-white/10'
          }`}
        >
          <Icon className={`w-4 h-4 ${active === key ? activeColor : 'text-white/60'}`} />
        </button>
      ))}

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-12 top-1/2 -translate-y-1/2 w-80"
          >
            {active === 'fusion' && <IntelFusionPanel onLocate={onLocate} />}
            {active === 'alerts' && <SentinelAlertsPanel onLocate={onLocate} />}
            {active === 'history' && <Placeholder title="问历史" note="切片 3 开放" />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
