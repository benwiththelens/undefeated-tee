import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 blocks dev-only assets for any origin but localhost, so opening the dev server from a
  // phone on the LAN loads a page with no JavaScript. Hosts come from DEV_ORIGINS in .env.local
  // (comma-separated) so no machine's address is committed. Dev-only; ignored in production.
  allowedDevOrigins: (process.env.DEV_ORIGINS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean),
};

export default nextConfig;
