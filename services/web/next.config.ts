import type { NextConfig } from "next";

function getApiProxyTarget(): string {
  const candidate =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_GATEWAY_URL ??
    process.env.GATEWAY_URL;

  const base = candidate ?? "https://gateway-service:8443";
  const normalized = base.endsWith("/") ? base.slice(0, -1) : base;
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
}

const nextConfig: NextConfig = {

  // Expose GATEWAY_URL to the browser (used for the login link in the test console).
  // Set NEXT_PUBLIC_GATEWAY_URL in your env to the host-reachable gateway address.
  distDir: 'build',
  env: {
    NEXT_PUBLIC_GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.GATEWAY_URL ?? 'https://localhost',
  },
  turbopack: {
    root: __dirname,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  async rewrites() {
    const apiProxyTarget = getApiProxyTarget();

    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
