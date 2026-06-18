import { NextRequest, NextResponse } from 'next/server';

// 实时代理：强制每次请求执行，禁止被静态化/CDN 缓存
export const dynamic = 'force-dynamic';

// historian 基址：仅服务器端读；放 osiris/.env.local；切勿加 NEXT_PUBLIC_ 前缀
const HISTORIAN_URL = process.env.HISTORIAN_URL || 'http://localhost:8000';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

// GET /api/historian/focus → 转发 FastAPI GET /focus（当前 Focus Profile）
export async function GET(): Promise<NextResponse> {
  try {
    const upstream = await fetch(`${HISTORIAN_URL}/focus`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status, headers: NO_STORE });
  } catch (err: unknown) {
    console.error('[historian-bff] GET /focus 代理失败:', err); // 真实错误只留服务端
    return NextResponse.json({ error: 'historian 服务不可达' }, { status: 502, headers: NO_STORE });
  }
}

// PUT /api/historian/focus  body: { weights, cap } → 转发 FastAPI PUT /focus（整体替换+落盘）
export async function PUT(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json(); // body 只能读一次
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400, headers: NO_STORE });
  }
  try {
    const upstream = await fetch(`${HISTORIAN_URL}/focus`, {
      method: 'PUT',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    // historian 校验失败时返回 HTTP 400 + {error}；这里透传状态码，由前端按 body 判
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status, headers: NO_STORE });
  } catch (err: unknown) {
    console.error('[historian-bff] PUT /focus 代理失败:', err);
    return NextResponse.json({ error: 'historian 服务不可达' }, { status: 502, headers: NO_STORE });
  }
}
