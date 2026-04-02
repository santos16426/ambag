import type { NextConfig } from "next";
// Serwist injects webpack plugins. Next.js 16 defaults to Turbopack for plain
// `next build`, which errors or skips the SW — use `npm run build` (see README).
import withSerwistInit from "@serwist/next";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

function getSerwistRevision(): string {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf-8",
  });
  const stdout = result.stdout?.trim();
  return stdout && stdout.length > 0 ? stdout : randomUUID();
}

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  cacheOnNavigation: false,
  register: true,
  additionalPrecacheEntries: [
    { url: "/~offline", revision: getSerwistRevision() },
  ],
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "mphluazjrdiodzfjpkzw.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "mphluazjrdiodzfjpkzw.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default withSerwist(nextConfig);
