import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Expose GATEWAY_URL to the browser (used for the login link in the test console).
  // Set NEXT_PUBLIC_GATEWAY_URL in your env to the host-reachable gateway address.
  env: {
    NEXT_PUBLIC_GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.GATEWAY_URL ?? 'https://localhost',
  },
};


export default nextConfig;
