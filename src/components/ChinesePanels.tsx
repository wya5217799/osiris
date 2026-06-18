'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, AlertTriangle, Brain, Factory, SlidersHorizontal } from 'lucide-react'; // 均已确认存在于 1.14.0
import IntelFusionPanel from '@/components/cn/IntelFusionPanel';
import SentinelAlertsPanel from '@/components/cn/SentinelAlertsPanel';
import HistoryQueryPanel from '@/components/cn/HistoryQueryPanel';
import SupplyChainPanel from '@/components/cn/SupplyChainPanel';
import FocusProfilePanel from '@/components/cn/FocusProfilePanel';

/* ═══════════════════════════════════════════════════════════════
   烽火 Fanos — 中文情报面板组（就地优化 Osiris，新增文件，零改现有组件）
   单一 active state 天然互斥；slide-out 复用现有右工具条定位类。
   五面板（供应链应力 / 融合情报 / 哨兵告警 / 问历史 / 关注镜头）均接入真 historian API。
   ═══════════════════════════════════════════════════════════════ */

type Panel = 'supply' | 'fusion' | 'alerts' | 'history' | 'focus';

const BUTTONS: { key: Panel; Icon: typeof Newspaper; label: string; activeColor: string }[] = [
  { key: 'supply', Icon: Factory, label: '供应链应力', activeColor: 'text-[var(--alert-orange)]' },
  { key: 'fusion', Icon: Newspaper, label: '融合情报条目', activeColor: 'text-[var(--gold-primary)]' },
  { key: 'alerts', Icon: AlertTriangle, label: '哨兵告警', activeColor: 'text-[var(--alert-red)]' },
  { key: 'history', Icon: Brain, label: '问历史', activeColor: 'text-[var(--cyan-primary)]' },
  { key: 'focus', Icon: SlidersHorizontal, label: '关注镜头', activeColor: 'text-[var(--cyan-primary)]' },
];

export default function ChinesePanels() {
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
            {active === 'supply' && <SupplyChainPanel />}
            {active === 'fusion' && <IntelFusionPanel />}
            {active === 'alerts' && <SentinelAlertsPanel />}
            {active === 'history' && <HistoryQueryPanel />}
            {active === 'focus' && <FocusProfilePanel />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
