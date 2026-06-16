import { NextRequest, NextResponse } from 'next/server';

// 实时代理；/nl-query 同步调 DeepSeek，给长超时
export const dynamic = 'force-dynamic';

const HISTORIAN_URL = process.env.HISTORIAN_URL || 'http://localhost:8000';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

// POST /api/historian/nl-query  body: { question: string }  → 转发 FastAPI POST /nl-query
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json(); // body 只能读一次
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400, headers: NO_STORE });
  }

  try {
    const upstream = await fetch(`${HISTORIAN_URL}/nl-query`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      // ★ text-to-SQL + 中文答合成同步走 DeepSeek，秒级 → 45s 超时
      signal: AbortSignal.timeout(45_000),
    });
    const data = await upstream.json(); // 上游异常时为 HTTP 500 {detail:...}
    return NextResponse.json(data, { status: upstream.status, headers: NO_STORE });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'NL 服务不可用', detail: err instanceof Error ? err.message : 'unknown', rows: [] },
      { status: 502, headers: NO_STORE },
    );
  }
}
