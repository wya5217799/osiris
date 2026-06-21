import { zh } from './zh';

/**
 * 显示层枚举映射。后端返回的英文枚举值（status / severity / type / risk / congestion 等）
 * 在「展示」时映射为中文；未知值原样返回。
 *
 * ⚠️ 仅用于显示。绝不可用于比较侧（`x === 'CRITICAL'`、MapLibre filter、对象键），
 * 那些必须保持后端英文原值，否则会破坏地图过滤与配色逻辑。
 *
 * 复用 zh 字典里已有的 riskLevel / congestion，叠加地图专用的状态/严重度/类型补充。
 */
const EXTRA: Record<string, string> = {
  // 严重度（小写，来自 GDELT/天气/冲突数据）
  war: '战争', high: '高', elevated: '中等', moderate: '中等', low: '低', critical: '危急', unknown: '未知',
  // 风险等级补充（大写）
  MEDIUM: '中等', INFO: '信息',
  // 连接/在线状态
  online: '在线', offline: '离线',
  // 辐射/通用告警状态
  DANGER: '危险', WARNING: '警告', NORMAL: '正常',
  // 核设施状态
  'Active Conflict Zone': '活跃冲突区',
  'Operational': '运行中',
  'Destroyed / Decommissioning': '已摧毁/退役',
  // 船舶 / 载具类型
  military: '军用', tanker: '油轮', naval: '海军', energy: '能源',
  vessel: '船舶', cargo: '货船', passenger: '客船', fishing: '渔船',
};

const ENUM_ZH: Record<string, string> = {
  ...zh.riskLevel,
  ...zh.congestion,
  ...EXTRA,
};

export function zhEnum(v: unknown): string {
  if (v == null) return '';
  const s = String(v);
  // SEISMIC RISK 可能带后缀（如 "SEISMIC RISK (zone)"），走包含匹配
  if (s.includes('SEISMIC RISK')) return '地震风险';
  return ENUM_ZH[s] ?? s;
}
