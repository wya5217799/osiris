import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// OsirisMap 地图弹窗中文化回归守卫。
// 只约束【纯展示】英文：字段标签 / 弹窗标题 / 按钮 / 静态展示值 / 冲突区名称与描述。
// 刻意【不】约束数据绑定值（p.status/p.severity/p.type 的原始值、=== 比较串、
// MapLibre filter 串，如 'Active Conflict Zone'/'Operational'/'online'/'SEISMIC RISK'）——
// 这些既参与比较又被原样展示，需在显示层做映射，另列后续处理。
const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FILE = resolve(srcRoot, 'components/OsirisMap.tsx');

const FORBIDDEN = [
  // 字段标签 span
  '>MODEL</span>', '>ALT</span>', '>SPEED</span>', '>HDG</span>', '>REG</span>',
  '>POS</span>', '>DEPTH</span>', '>COORDS</span>', '>MISSION</span>', '>BRIGHTNESS</span>',
  '>TARGET IP</span>', '>STATUS</span>', '>SEVERITY</span>', '>FROM</span>', '>TO</span>',
  '>DOMAIN</span>', '>SOURCE</span>', '>TYPE</span>', '>SCM RISK LEVEL</span>', '>PORTS</span>',
  '>RISK</span>', '>ALTITUDE</span>', '>VERT RATE</span>', '>TEMP</span>', '>READING</span>',
  '>NETWORK</span>', '>HEADING</span>', '>LATITUDE</span>', '>LONGITUDE</span>', '>CITY</span>',
  '>REACTORS</span>', '>CAPACITY</span>', '>OWNER</span>', '>CONGESTION</span>', '>EST. DWELL TIME</span>',
  // 冒号/内联标签
  '>DESTINATION: </span>', '>FLAG: ', '>Open: ', 'ACTIVE THREATS:<br/>', ' / STATUS: ',
  '>Volume: ', '>Fleet: ', '>Global Rank: ', '>Traffic: ', '>Risk: ',
  // 弹窗标题
  ' EARTHQUAKE</div>', '🔥 ACTIVE FIRE DETECTED', '⚠️ CONFLICT EVENT', '🎯 TARGET: ',
  "'⚓ MARITIME'", "'✈ AIR CORRIDOR'", "'🛡 NAVAL INTEL'",
  "'NAVAL BASE'", "'ENERGY PORT'", "'CONTAINER PORT'",
  // 按钮 / 链接
  '[ DEEP DIVE INTEL ]', 'THREAT INTEL ↗', 'DEEP DIVE ANALYTICS', 'OPEN SOURCE ↗',
  '[ IP INTEL DEEP DIVE ]', '>SATELLITE VIEW</a>', '🔭 SOURCE: SATNOGS', '>📡 SOURCE</a>',
  // 静态展示兜底值
  "'Unidentified Threat Payload'", "'Unclassified incident'", "'Origin'", "'Destination'",
  "'Unknown ISP'", "'Unknown event'", "'Nuclear Facility'", "'WARNING EVENT'",
  "'Weather Event'", "'UNIDENTIFIED VESSEL'", "'Global event detected at this location.'",
  // 对抗审查补漏（展示用）
  "'Unknown location'", "'USGS DETAILS'", '- 5} more',
  // 冲突区名称（label 为展示用，severity 才是比较键）
  "label: 'UKRAINE WAR'", "label: 'GAZA CONFLICT'", "label: 'LEBANON BORDER'",
  "label: 'SUDAN CIVIL WAR'", "label: 'MYANMAR CONFLICT'", "label: 'DRC EASTERN CONFLICT'",
  "label: 'YEMEN WAR'", "label: 'SYRIA'", "label: 'TAIWAN STRAIT'", "label: 'KOREAN DMZ'",
  "label: 'SAHEL INSTABILITY'", "label: 'SOMALIA'", "label: 'RED SEA THREAT'",
];

describe('OsirisMap 中文化', () => {
  it('地图弹窗不残留未翻译的展示英文', () => {
    const src = readFileSync(FILE, 'utf8');
    const leaked = FORBIDDEN.filter((s) => src.includes(s));
    expect(leaked, `仍残留英文(${leaked.length}): ${leaked.join('  |  ')}`).toEqual([]);
  });

  it('数据绑定比较串保持英文（未被误翻译，地图逻辑不破坏）', () => {
    const src = readFileSync(FILE, 'utf8');
    const mustKeep = [
      "['get','status'], 'Active Conflict Zone'",
      "'Destroyed / Decommissioning'",
      "=== 'Operational'",
      "includes('SEISMIC RISK')",
      "=== 'online'",
      "=== 'DANGER'",
      "severity === 'war'",
      "risk_level === 'CRITICAL'",
    ];
    const missing = mustKeep.filter((s) => !src.includes(s));
    expect(missing, `数据绑定串被误改: ${missing.join('  |  ')}`).toEqual([]);
  });

  it('原始枚举展示值已经过 zhEnum 显示层映射', () => {
    const src = readFileSync(FILE, 'utf8');
    // 这些「原样展示后端英文枚举」的写法应被 zhEnum(...) 包裹后消失
    const RAW = [
      '${(p.status||\'未知\').toUpperCase()}',
      '${(p.severity||\'low\').toUpperCase()}',
      '${(p.type || \'未知\').toUpperCase()}',
      '>${p.risk_level}</span>',
      '${p.type.toUpperCase()} / 状态: ${p.status.toUpperCase()}',
      '>${p.status}</span>',
      '${(p.type||\'船舶\').toUpperCase()}',
      '${p.status || \'—\'}',
      '>${p.congestion}</span>',
      '>${p.risk}</span>',
    ];
    const leaked = RAW.filter((s) => src.includes(s));
    expect(leaked, `仍有原始枚举未走 zhEnum: ${leaked.join('  |  ')}`).toEqual([]);
    expect(src.includes("import { zhEnum }"), 'OsirisMap 未导入 zhEnum').toBe(true);
  });
});
