import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

// 跨组件完整性守卫（completeness critic）：
// 所有【字符串字面量】的 label / placeholder 若不含中文，必须属于「技术专名/品牌/示例」白名单。
// 否则说明新加了未中文化的面向用户英文标签 —— 测试失败。
// 动态值（含 {} / ${}）与含中文的值不在约束内。
const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// 允许保留英文的技术专名 / 品牌 / 示例值
const WHITELIST = new Set([
  // OSINT 工具名 / DNS 记录类型 / 协议
  'DNS', 'WHOIS', 'SSL/TLS', 'Shodan IoT', 'SDK',
  'AAAA', 'ASN', 'CNAME', 'MX', 'NS', 'SOA', 'TXT',
  // 品牌
  'Twitter',
  // 输入示例
  '2.5', 'AIza...', 'region:hormuz',
]);

const CJK = /[一-鿿]/;
const PROP = /(?:label: ?|label=|placeholder=)(['"])([^'"]+)\1/g;

function componentFiles(): string[] {
  const comp = readdirSync(resolve(srcRoot, 'components'), { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => join(srcRoot, 'components', f));
  return [...comp, resolve(srcRoot, 'app/page.tsx')];
}

describe('跨组件 label/placeholder 完整性', () => {
  it('英文字面量 label/placeholder 仅限技术专名白名单', () => {
    const offenders: { value: string; file: string }[] = [];
    for (const file of componentFiles()) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(PROP)) {
        const value = m[2];
        if (CJK.test(value)) continue; // 已含中文
        if (value.includes('{') || value.includes('$')) continue; // 动态
        if (WHITELIST.has(value)) continue; // 技术专名
        offenders.push({ value, file: file.slice(srcRoot.length + 1) });
      }
    }
    expect(
      offenders,
      `发现未中文化（且不在白名单）的英文 label/placeholder:\n${offenders.map((o) => `  "${o.value}"  (${o.file})`).join('\n')}`,
    ).toEqual([]);
  });
});
