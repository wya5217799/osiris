import { NextRequest, NextResponse } from 'next/server';

// 实时代理：强制每次请求执行，禁止被静态化/CDN 缓存
// (Next 16: 路由处理器 GET 默认不缓存，显式声明双保险)
export const dynamic = 'force-dynamic';

// historian 基址：仅服务器端读；放 osiris/.env.local；切勿加 NEXT_PUBLIC_ 前缀（会 inline 进浏览器 bundle）
const HISTORIAN_URL = process.env.HISTORIAN_URL || 'http://localhost:8000';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

// GET /api/historian/items?status=&bbox=&t_start=&t_end=&limit=  → 转发 FastAPI GET /items
export async function GET(request: NextRequest): Promise<NextResponse> {
  const sp = request.nextUrl.searchParams; // Next 推荐，已解析
  const forward = new URLSearchParams();
  for (const key of ['status', 'bbox', 't_start', 't_end'] as const) {
    const v = sp.get(key);
    if (v != null && v !== '') forward.set(key, v);
  }
  // ★ historian 对 limit>500 返回 HTTP 422（不是截断）。必须夹到 ≤500
  const rawLimit = Number(sp.get('limit') ?? 50);
  forward.set('limit', String(Math.min(Number.isFinite(rawLimit) ? rawLimit : 50, 500)));

  try {
    const upstream = await fetch(`${HISTORIAN_URL}/items?${forward.toString()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    // historian 在 bbox 非法时返回 HTTP 200 + {error,items:[]}，这里只透传，由前端判 body
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status, headers: NO_STORE });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'historian unreachable', detail: err instanceof Error ? err.message : 'unknown', items: [] },
      { status: 502, headers: NO_STORE },
    );
  }
}
