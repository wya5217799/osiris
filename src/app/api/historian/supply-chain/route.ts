import { NextRequest, NextResponse } from 'next/server';

// 实时代理：强制每次请求执行，禁止被静态化/CDN 缓存
// (Next 16: 路由处理器 GET 默认不缓存，显式声明双保险)
export const dynamic = 'force-dynamic';

// historian 基址：仅服务器端读；放 osiris/.env.local；切勿加 NEXT_PUBLIC_ 前缀（会 inline 进浏览器 bundle）
const HISTORIAN_URL = process.env.HISTORIAN_URL || 'http://localhost:8000';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

// GET /api/historian/supply-chain?window_days=  → 转发 FastAPI GET /supply-chain
export async function GET(request: NextRequest): Promise<NextResponse> {
  const sp = request.nextUrl.searchParams;
  // historian Query 收 window_days ∈ [1,30]（越界 422，不是夹断）。先夹好再转发
  const rawWin = Number(sp.get('window_days') ?? 7);
  const windowDays = Math.min(Math.max(Math.trunc(Number.isFinite(rawWin) ? rawWin : 7), 1), 30);

  try {
    // /supply-chain 每节点一条 PostGIS ST_DWithin（20 节点）→ 比 /items 慢些，超时给 15s
    const upstream = await fetch(`${HISTORIAN_URL}/supply-chain?window_days=${windowDays}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.any([AbortSignal.timeout(15_000), request.signal]),
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status, headers: NO_STORE });
  } catch (err: unknown) {
    // 客户端主动断开（导航 / 新一次请求取消上一次）：上游已随之中止、连接已释放，非错误
    if (request.signal.aborted) {
      return NextResponse.json({ nodes: [] }, { status: 499, headers: NO_STORE });
    }
    console.error('[historian-bff] /supply-chain 代理失败:', err); // 真实错误只留服务端
    return NextResponse.json(
      { error: 'historian 服务不可达', nodes: [] }, // 对外稳定中文文案，不泄露内网细节
      { status: 502, headers: NO_STORE },
    );
  }
}
