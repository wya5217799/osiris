/**
 * 烽火 Fanos — 中文文案字典（集中管理，单一文案源）。
 *
 * 纯中文平台、无多语切换；集中化便于维护，并统一「枚举值 → 中文显示」映射。
 * 取值：静态文案用 t('searchBar.placeholder')；
 *       动态/枚举键传兜底，如 t(`riskLevel.${level}`, level)。
 * 约定：枚举映射的 KEY = 后端数据原值（CRITICAL/HIGH/…，不可改），只换显示文本。
 *
 * 随汉化推进逐域追加；保持按组件/域分组、键名稳定。
 */
export const zh = {
  searchBar: {
    cmdLocate: '定位',
    placeholder: '输入坐标或目标名称…',
  },
  statusBar: {
    mkt: 'MKT',
    cyber: '网络威胁',
    cves: '个 CVE',
    scoreLabel: '评分',
    riskFallback: '基于全球威胁数据的风险评估',
  },
  common: {
    retry: '重试',
    close: '关闭',
    loading: '加载中…',
    alerts: '告警',
    live: '实时',
    yes: '是',
    no: '否',
    restore: '还原',
    maximize: '最大化',
  },
  viewPresets: {
    title: '区域预设',
    hot: '热点',
  },
  shortcuts: {
    title: '快捷键',
    closeHint: '按 [?] 或 [ESC] 关闭',
  },
  errorBoundary: {
    component: '组件',
    error: '错误',
  },
  cameraViewer: {
    secureUplink: '安全链路',
    source: '源',
    refreshFeed: '刷新画面',
    flyTo: '飞至位置',
    toggleFullscreen: '切换全屏',
    decrypting: '解密画面中…',
    encrypted: '画面已加密',
    needClearance: '该画面需外部权限',
    accessTerminal: '访问终端',
    unavailable: '画面不可用',
    offlineHint: '摄像头可能离线或受限',
    liveSatLink: '实时卫星链路',
    liveFeed: '实时画面',
    feedType: '画面类型',
    status: '状态',
    activeRecording: '活动 / 录制中',
    rawFeed: '原始画面',
    mapTarget: '地图定位',
  },
  intelFeed: {
    title: '信号情报流',
    awaiting: '等待情报…',
    openSource: '查看原文',
    minsAgo: '分钟前',
    hrsAgo: '小时前',
    daysAgo: '天前',
  },
  marketsPanel: {
    title: '市场与情报',
    restore: '还原',
    maximize: '最大化',
    spaceWeather: '空间天气',
    latestFlare: '最新耀斑',
  },
  scmPanel: {
    title: '供应链风险指挥',
    marketImpact: '市场影响告警',
    criticalSuppliers: '关键供应商',
    suppliersOk: '✓ 所有受监控的 Tier 1/2 节点运行正常。',
    congestedNodes: '拥堵节点',
    flowOptimal: '✓ 全球海运流通畅。',
    dwell: '停泊',
  },
  congestion: {
    SEVERE: '严重',
    CONGESTED: '拥堵',
  } as Record<string, string>,
  sharePanel: {
    shareViewTitle: '分享视图 (S)',
    shareView: '分享视图',
    currentView: '当前视图',
    zoom: '缩放',
    layersActive: '个图层激活',
    shareableLink: '可分享链接',
    xPost: '𝕏 发布',
    linkedinShare: '领英分享',
    reddit: 'Reddit',
    toggleHint: '按 [S] 切换 · 分享链接保留视图状态',
    tweetText: '🏛️ 烽火 Fanos — 全球情报看板',
    redditTitle: '烽火 Fanos — 开源全球情报平台',
  },
  aiAnalyst: {
    openLabel: '打开 AI 情报分析师',
    analyst: '烽火分析师',
    online: '在线',
    clearChat: '清空对话',
    settings: '设置',
    apiKeyLabel: 'GEMINI API 密钥（可选）',
    save: '保存',
    keyHintPre: '你的密钥仅存于本地，且只发送到烽火服务器。可在',
    keyHintPost: '免费获取',
    analysisError: '情报分析出错',
    analysisFailed: '分析失败',
    briefingError: '简报生成出错',
    briefingFailed: '简报生成失败',
    briefingRequest: '📋 根据当前作战数据生成完整情报简报',
    ready: '情报分析师就绪',
    intro: '我关联实时地震、OSINT、威胁与网络数据，给出可执行的情报研判。',
    suggestedQueries: '推荐提问',
    q1: '当前最值得关注的 3 个威胁是什么？',
    q2: '有与冲突相关联的地震模式吗？',
    q3: '评估关键基础设施面临的网络风险',
    operator: '操作员',
    analyzing: '正在分析情报',
    generateBriefing: '生成简报',
    newlineHint: 'SHIFT+ENTER 换行',
    inputPlaceholder: '向情报分析师提问…',
    customKey: '🔑 自定义密钥',
    serverKey: '🔧 服务器密钥',
    queries: '次提问',
    feeds: '数据源',
    items: '条',
  },
  entityType: {
    aircraft: '飞机', vessel: '船舶', company: '公司', person: '人物',
    country: '国家', event: '事件', sanction: '制裁', ip: 'IP',
  } as Record<string, string>,
  liveAlerts: {
    title: '实时告警',
    feeds: '直播源',
    source: '来源',
    noAlerts: '该筛选无告警',
  },
  liveAlertsFilter: {
    all: '全部', news: '新闻', quakes: '地震', feeds: '直播源',
  } as Record<string, string>,
  // 枚举显示映射：键 = 后端 risk_level 原值，值 = 中文显示
  riskLevel: {
    CRITICAL: '危急',
    HIGH: '高危',
    ELEVATED: '中等',
    LOW: '低危',
  } as Record<string, string>,
  riskTooltip: {
    CRITICAL: '检测到活跃冲突、制裁或重大动荡',
    HIGH: '威胁等级升高——持续紧张或安全隐患',
    ELEVATED: '中等风险——政治不稳定或地区争端',
    LOW: '稳定——未检测到重大威胁',
  } as Record<string, string>,
} as const;

export type Zh = typeof zh;
