import { describe, it, expect } from 'vitest';
import { zhEnum } from '@/lib/i18n/enum';

// 显示层枚举映射：后端英文枚举 → 中文（仅用于展示，绝不用于比较侧）。
describe('zhEnum 枚举显示映射', () => {
  it('映射已知风险/拥堵枚举（复用 zh 字典）', () => {
    expect(zhEnum('CRITICAL')).toBe('危急');
    expect(zhEnum('HIGH')).toBe('高危');
    expect(zhEnum('SEVERE')).toBe('严重');
    expect(zhEnum('CONGESTED')).toBe('拥堵');
  });

  it('映射状态 / 严重度 / 类型枚举', () => {
    expect(zhEnum('online')).toBe('在线');
    expect(zhEnum('DANGER')).toBe('危险');
    expect(zhEnum('Active Conflict Zone')).toBe('活跃冲突区');
    expect(zhEnum('Operational')).toBe('运行中');
    expect(zhEnum('war')).toBe('战争');
    expect(zhEnum('military')).toBe('军用');
  });

  it('SEISMIC RISK 变体走包含匹配', () => {
    expect(zhEnum('SEISMIC RISK')).toBe('地震风险');
    expect(zhEnum('SEISMIC RISK (zone)')).toBe('地震风险');
  });

  it('未知值原样返回，空值返回空串', () => {
    expect(zhEnum('Foobar')).toBe('Foobar');
    expect(zhEnum(undefined)).toBe('');
    expect(zhEnum(null)).toBe('');
  });
});
