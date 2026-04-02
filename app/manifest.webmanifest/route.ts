import { NextRequest, NextResponse } from "next/server";

import {
  buildWebManifest,
  sanitizeManifestStartPath,
} from "@/lib/pwa/web-manifest";

export async function GET(request: NextRequest) {
  const startParam = request.nextUrl.searchParams.get("start");
  const startUrl = sanitizeManifestStartPath(startParam);
  const nameParam = request.nextUrl.searchParams.get("name");
  const shortParam = request.nextUrl.searchParams.get("short");
  const manifest = buildWebManifest(startUrl, {
    name: nameParam,
    shortName: shortParam,
  });

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "private, no-cache",
    },
  });
}
