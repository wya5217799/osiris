import { NextRequest } from 'next/server';

// SSE 透传：把 historian /alerts/stream 的事件流原样转给浏览器 EventSource。
// 长连接，不设超时；DB 访问仍全在 historian（ADR 0001）。
export const dynamic = 'force-dynamic';

const HISTORIAN_URL = process.env.HISTORIAN_URL || 'http://localhost:8000';

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no', // 关掉中间层缓冲，保证逐事件下发
} as const;

// 用 200 而非 502：EventSource 规范规定非 200 响应直接 fail 连接、丢弃 body，那条 `event: error`
// 帧浏览器根本读不到。返 200 + 错误帧后即自然关流，前端的 'error' 监听器能收到帧，随后自动重连。
function sseError(message: string): Response {
  return new Response(`event: error\ndata: ${message}\n\n`, { status: 200, headers: SSE_HEADERS });
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const upstream = await fetch(`${HISTORIAN_URL}/alerts/stream`, {
      headers: { Accept: 'text/event-stream' },
      cache: 'no-store',
      signal: request.signal, // 浏览器断开 → 取消上游连接，释放 pg LISTEN
    });
    if (!upstream.ok || !upstream.body) return sseError('historian 流不可用');
    // 直接把上游可读流当响应体回传，逐块透传
    return new Response(upstream.body, { status: 200, headers: SSE_HEADERS });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return new Response(null, { status: 204 }); // 客户端主动断开，非错误
    }
    console.error('[historian-bff] /alerts/stream 透传失败:', err);
    return sseError('historian 服务不可达');
  }
}
