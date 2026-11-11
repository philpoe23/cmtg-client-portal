import type { NextConfig } from "next";

// PocketBase lives on the internal network over plain HTTP. Browsers can't
// reach it from the HTTPS portal (mixed content, and the hostname only
// resolves internally), so the browser talks to /pb on the portal's own
// origin and the Next server forwards those requests to PocketBase.
// Read at build time: the variable must be set when `next build` runs.
const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!pocketbaseUrl) {
      throw new Error("NEXT_PUBLIC_POCKETBASE_URL must be set to proxy /pb to PocketBase");
    }
    return [{ source: "/pb/:path*", destination: `${pocketbaseUrl}/:path*` }];
  },
};

export default nextConfig;
