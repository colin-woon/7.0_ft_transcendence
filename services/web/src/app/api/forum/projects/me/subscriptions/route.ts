import { NextRequest, NextResponse } from 'next/server';

function getGatewayApiBase(): string {
  const candidate =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_GATEWAY_URL ??
    process.env.GATEWAY_URL;

  const base = candidate ?? 'https://gateway-service:8443';
  const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const upstreamUrl = `${getGatewayApiBase()}/forum/projects/me/subscriptions`;
  const headers = new Headers();
  const cookie = request.headers.get('cookie');

  if (cookie) {
    headers.set('cookie', cookie);
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  const responseText = await upstreamResponse.text();
  const responseContentType = upstreamResponse.headers.get('content-type') ?? 'application/json';

  return new NextResponse(responseText, {
    status: upstreamResponse.status,
    headers: {
      'Content-Type': responseContentType,
    },
  });
}
