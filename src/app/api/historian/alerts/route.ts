import { NextRequest, NextResponse } from 'next/server';

// 实时代理：强制每次请求执行、禁缓存（同 items 路由）
export const dynamic = 'force-dynamic';

const HISTORIAN_URL = process.env.HISTORIAN_URL || 'http://localhost:8000';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

// GET /api/historian/alerts?status=new&limit=  → 转发 FastAPI GET /alerts
export async function GET(request: NextRequest): Promise<NextResponse> {
  const sp = request.nextUrl.searchParams;
  const forward = new URLSearchParams();
  const status = sp.get('status');
  if (status != null && status !== '') forward.set('status', status);
  // ★ limit>500 → historian 返 422，必须 clamp
  const rawLimit = Number(sp.get('limit') ?? 50);
  // 夹下界+上界并截整：挡掉负数/0/小数等非法 limit
  const limit = Math.min(Math.max(Math.trunc(Number.isFinite(rawLimit) ? rawLimit : 50), 1), 500);
  forward.set('limit', String(limit));

  try {
    const upstream = await fetch(`${HISTORIAN_URL}/alerts?${forward.toString()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status, headers: NO_STORE });
  } catch (err: unknown) {
    console.error('[historian-bff] /alerts 代理失败:', err);
    return NextResponse.json(
      { error: 'historian 服务不可达', alerts: [] },
      { status: 502, headers: NO_STORE },
    );
  }
}
