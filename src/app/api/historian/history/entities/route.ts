import { NextRequest, NextResponse } from 'next/server';

// 实时代理：强制每次执行，禁缓存（同其它 historian BFF）。
export const dynamic = 'force-dynamic';

const HISTORIAN_URL = process.env.HISTORIAN_URL || 'http://localhost:8000';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

// GET /api/historian/history/entities?t=&window_m=&min_count=&limit= → 转发 FastAPI GET /history/entities
//   时间轴回放(M6)：给定时刻 t（ISO 8601）的移动实体按 h3 格密度快照（读 entity_positions_5min
//   CAGG，窗口 [t-window_m 分钟, t)）。historian 透传状态码：t 缺失/非法 400、成功 {entities:[...]}。
export async function GET(request: NextRequest): Promise<NextResponse> {
  const sp = request.nextUrl.searchParams;
  const t = sp.get('t');
  if (!t) {
    return NextResponse.json({ error: 't (ISO 8601) required', entities: [] }, { status: 400, headers: NO_STORE });
  }
  const forward = new URLSearchParams({ t });
  for (const key of ['window_m', 'min_count', 'limit'] as const) {
    const v = sp.get(key);
    if (v != null && v !== '') forward.set(key, v);
  }

  try {
    const upstream = await fetch(`${HISTORIAN_URL}/history/entities?${forward.toString()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.any([AbortSignal.timeout(10_000), request.signal]),
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status, headers: NO_STORE });
  } catch (err: unknown) {
    if (request.signal.aborted) {
      return NextResponse.json({ entities: [] }, { status: 499, headers: NO_STORE });
    }
    console.error('[historian-bff] /history/entities 代理失败:', err);
    return NextResponse.json(
      { error: 'historian 服务不可达', entities: [] },
      { status: 502, headers: NO_STORE },
    );
  }
}
