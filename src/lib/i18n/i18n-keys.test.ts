import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { t } from '@/lib/i18n';

// Cycle 2：组件 ↔ 字典契约 —— 源码里每个静态 t('a.b') 键都必须在 zh 字典命中。
// 动态键 t(`a.${x}`) 由枚举映射 + fallback 兜底，不在此约束。
const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function sourceFiles(): string[] {
  return readdirSync(srcRoot, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => join(srcRoot, f));
}

// 匹配 t('x.y') / t("x.y")（首参为纯字符串字面量，无模板插值）
const STATIC_T = /\bt\(\s*(['"])([^'"`]+?)\1/g;

function collectStaticKeys(): { key: string; file: string }[] {
  const out: { key: string; file: string }[] = [];
  for (const file of sourceFiles()) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(STATIC_T)) {
      out.push({ key: m[2], file: file.slice(srcRoot.length + 1) });
    }
  }
  return out;
}

describe('i18n 键完整性', () => {
  it('源码引用的每个静态 t() 键都在字典中存在', () => {
    const missing = collectStaticKeys().filter(({ key }) => t(key) === '');
    expect(missing, `缺失的文案键:\n${missing.map((m) => `  ${m.key}  (${m.file})`).join('\n')}`).toEqual([]);
  });
});
