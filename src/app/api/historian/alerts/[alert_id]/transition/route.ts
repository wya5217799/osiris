import { NextRequest, NextResponse } from 'next/server';

// 实时代理：禁缓存（同其它 historian BFF）。historian 是唯一写库方，这里只透传。
export const dynamic = 'force-dynamic';

const HISTORIAN_URL = process.env.HISTORIAN_URL || 'http://localhost:8000';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

// POST /api/historian/alerts/<alert_id>/transition  body: { to }
//   → 转发 FastAPI POST /alerts/<alert_id>/transition（SOAR 状态推进 ack/snoozed/resolved）。
//   Next 16：动态段 params 是 Promise，须 await（见 node_modules/next/dist/docs route.md）。
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ alert_id: string }> },
): Promise<NextResponse> {
  const { alert_id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400, headers: NO_STORE });
  }
  try {
    const upstream = await fetch(
      `${HISTORIAN_URL}/alerts/${encodeURIComponent(alert_id)}/transition`,
      {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      },
    );
    // historian 透传状态码：400 非法目标 / 404 不存在 / 409 非法或竞态转移 / 200 成功
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status, headers: NO_STORE });
  } catch (err: unknown) {
    console.error('[historian-bff] POST /alerts/transition 代理失败:', err);
    return NextResponse.json({ error: 'historian 服务不可达' }, { status: 502, headers: NO_STORE });
  }
}
