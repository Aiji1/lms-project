import { NextRequest, NextResponse } from 'next/server';

// Proxy sederhana: /api/proxy?url=<encoded>
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('url');
  if (!target) {
    return new NextResponse('Missing url', { status: 400 });
  }

  try {
    const res = await fetch(target, { cache: 'no-store' });
    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.status}`, { status: 502 });
    }
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const blob = await res.blob();
    return new NextResponse(blob, {
      status: 200,
      headers: { 'content-type': contentType }
    });
  } catch (e) {
    return new NextResponse('Proxy fetch failed', { status: 500 });
  }
}