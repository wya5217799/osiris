import { NextRequest, NextResponse } from 'next/server';

// 实时代理：强制每次执行，禁缓存（同其它 historian BFF）。
export const dynamic = 'force-dynamic';

const HISTORIAN_URL = process.env.HISTORIAN_URL || 'http://localhost:8000';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

// GET /api/historian/history/events?t=&window_h=&min_count=&limit= → 转发 FastAPI GET /history/events
//   时间轴回放(M6)：给定时刻 t（ISO 8601）的 geo-event 按 h3 格聚合密度（读 CAGG 速度层，
//   窗口 [t-window_h, t)）。historian 透传状态码：t 缺失/非法 400、成功 {events:[...]}。
export async function GET(request: NextRequest): Promise<NextResponse> {
  const sp = request.nextUrl.searchParams;
  const t = sp.get('t');
  if (!t) {
    return NextResponse.json({ error: 't (ISO 8601) required', events: [] }, { status: 400, headers: NO_STORE });
  }
  const forward = new URLSearchParams({ t });
  for (const key of ['window_h', 'min_count', 'limit'] as const) {
    const v = sp.get(key);
    if (v != null && v !== '') forward.set(key, v);
  }

  try {
    const upstream = await fetch(`${HISTORIAN_URL}/history/events?${forward.toString()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      // 超时 + 客户端断开任一触发即中止上游 → 拖时间轴/播放频繁取数时不让 historian 连接空跑
      signal: AbortSignal.any([AbortSignal.timeout(10_000), request.signal]),
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status, headers: NO_STORE });
  } catch (err: unknown) {
    // 客户端取消（拖动/播放推进取消上一次取数）：上游已随之中止，非错误
    if (request.signal.aborted) {
      return NextResponse.json({ events: [] }, { status: 499, headers: NO_STORE });
    }
    console.error('[historian-bff] /history/events 代理失败:', err);
    return NextResponse.json(
      { error: 'historian 服务不可达', events: [] },
      { status: 502, headers: NO_STORE },
    );
  }
}
