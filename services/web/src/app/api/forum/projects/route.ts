import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// Resolve the same gateway API base that rewrites would target.
function getGatewayApiBase(): string {
  const candidate =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_GATEWAY_URL ??
    process.env.GATEWAY_URL;

  const base = candidate ?? 'https://gateway-service:8443';
  const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}

// Forward this route to the gateway while preserving cookie-based auth.
async function proxyProjectsRequest(request: NextRequest, method: 'GET' | 'POST'): Promise<NextResponse> {
  const upstreamUrl = `${getGatewayApiBase()}/forum/projects`;
  const headers = new Headers();
  const cookie = request.headers.get('cookie');

  if (cookie) {
    headers.set('cookie', cookie);
  }

  // Only set content-type for mutation requests with a body.
  let bodyText: string | undefined;
  if (method === 'POST') {
    const contentType = request.headers.get('content-type') ?? 'application/json';
    headers.set('content-type', contentType);
    bodyText = await request.text();
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method,
    headers,
    body: bodyText,
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

// Keep reads behaving like the rewrite path.
export async function GET(request: NextRequest): Promise<NextResponse> {
  return proxyProjectsRequest(request, 'GET');
}

// Intercept create to invalidate the tag used by cached project-list fetches.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const response = await proxyProjectsRequest(request, 'POST');

  // Only invalidate cache if create succeeded.
  if (!response.ok) {
    return response;
  }

  revalidateTag('projects');
  return response;
}
