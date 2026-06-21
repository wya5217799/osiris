import { describe, it, expect } from 'vitest';
import { t } from '@/lib/i18n';

// Cycle 1（tracer bullet）：t() 公共契约 —— 命中取中文、未命中走 fallback。
describe('t() 文案取值', () => {
  it('命中已知键时返回中文文案', () => {
    expect(t('searchBar.cmdLocate')).toBe('定位');
  });

  it('未命中键时返回传入的 fallback', () => {
    expect(t('does.not.exist', '兜底')).toBe('兜底');
  });

  it('未命中且无 fallback 时返回空串', () => {
    expect(t('nope.nope')).toBe('');
  });
});
