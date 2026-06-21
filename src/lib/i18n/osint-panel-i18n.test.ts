import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// OsintPanel 中文化回归守卫：以下英文不应再向用户呈现。
// 保留的技术专名（不在禁止名单）：DNS/SSL/TLS/BGP/MAC/ASN/CVE/IoT/AAAA/MX/NS/TXT/CNAME/SOA/Twitter 等。
const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FILE = resolve(srcRoot, 'components/OsintPanel.tsx');

// 作为 JSX 子节点出现的英文文案（>...<）
const FORBIDDEN_JSX_TEXT = [
  '>EXPLOIT<',
  '>RECENT REPOS<',
  '>EXPOSED DATA POINTS<',
  '>Identified Vulnerabilities<',
  '>Open Ports<',
  '>Hostnames<',
  '>No reverse DNS<',
  '>Source: ',
  '>Fetching vulnerability intelligence...<',
];

// ResultRow 的英文字段名 label="..."
const FORBIDDEN_LABELS = [
  'Target', 'Scan Type', 'Duration', 'Total CVEs', 'Risk Level', 'Domain',
  'A Records', 'Registrar', 'Created', 'Expires', 'Updated', 'Status',
  'Nameservers', 'Target IP', 'Hostnames', 'Open Ports', 'Tags', 'Query',
  'Prefix', 'Country', 'Description', 'Name', 'Prefixes', 'Peers',
  'MAC Address', 'Vendor', 'Valid', 'E.164 Format', 'Intl Format', 'Nat Format',
  'Line Type', 'Company', 'Location', 'Email', 'Website', 'Bio', 'Email Target',
  'Certificates', 'Issuer', 'Common Name', 'Not Before', 'Not After',
  'Risk Score', 'Malicious', 'Category', 'Reports', 'Last Seen', 'Protocol',
  'Cipher', 'Subject', 'SANs',
].map((l) => `label="${l}"`);

// 直接展示给用户的英文枚举值
const FORBIDDEN_VALUES = [
  "? 'YES' : 'NO'",
  "'COMPROMISED' : 'SECURE'",
  "|| 'UNKNOWN'",
  "|| 'Unknown'",
];

describe('OsintPanel 中文化', () => {
  it('不残留未翻译的英文 UI 标签 / 字段名 / 枚举值', () => {
    const src = readFileSync(FILE, 'utf8');
    const all = [...FORBIDDEN_JSX_TEXT, ...FORBIDDEN_LABELS, ...FORBIDDEN_VALUES];
    const leaked = all.filter((s) => src.includes(s));
    expect(leaked, `仍残留英文: ${leaked.join('  |  ')}`).toEqual([]);
  });
});
