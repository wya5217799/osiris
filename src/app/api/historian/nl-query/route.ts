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
      // ★ text-to-SQL + 中文答合成同步走 DeepSeek，秒级 → 45s 超时。并入 request.signal：用户
      //   导航/重入(HistoryQueryPanel 会 abort 上一次)时，取消一路传到 historian，不让 DeepSeek 空跑。
      signal: AbortSignal.any([AbortSignal.timeout(45_000), request.signal]),
    });
    // historian 透传状态码：空问题 400 {error}/内部失败 500 {route:null,error}/成功 {sql,rows,answer_zh}
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status, headers: NO_STORE });
  } catch (err: unknown) {
    console.error('[historian-bff] /nl-query 代理失败:', err);
    return NextResponse.json(
      { error: 'NL 服务不可用', rows: [] },
      { status: 502, headers: NO_STORE },
    );
  }
}
