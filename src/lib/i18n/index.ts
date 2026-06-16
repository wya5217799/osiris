import { zh } from './zh';

/**
 * 取中文文案。path 用点号分隔，如 t('searchBar.placeholder')。
 * 动态/枚举键传 fallback：t(`riskLevel.${level}`, level)。未命中返回 fallback。
 *
 * 纯中文平台：文案直接取自 zh 字典；保留 t() 这层是为集中管理 + 优雅处理数据驱动的枚举键。
 */
export function t(path: string, fallback = ''): string {
  const v = path
    .split('.')
    .reduce<unknown>(
      (o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
      zh as unknown,
    );
  return typeof v === 'string' ? v : fallback;
}

export { zh };
