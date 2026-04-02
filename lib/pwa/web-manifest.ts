import type { MetadataRoute } from "next";

import { APP_ICON } from "@/lib/pwa/app-icon";

const THEME_COLOR = "#FDFDFD";

const DEFAULT_NAME = "Ambag - Financial Management System";
const DEFAULT_SHORT_NAME = "Ambag";

export interface ManifestTitleOptions {
  name?: string | null;
  shortName?: string | null;
}

/** Safe path-only start_url for the web manifest (no off-origin or scheme tricks). */
export function sanitizeManifestStartPath(raw: string | null): string {
  if (raw == null || raw === "") return "/";
  let path: string;
  try {
    path = decodeURIComponent(raw.trim());
  } catch {
    return "/";
  }
  if (!path.startsWith("/")) return "/";
  if (path.startsWith("//")) return "/";
  if (path.includes("://")) return "/";
  if (path.includes("\0")) return "/";
  if (path.length > 512) return "/";
  return path;
}

/** Decode + strip controls for manifest name / short_name (query-driven). */
export function sanitizeManifestLabel(
  raw: string | null,
  maxLen: number,
): string | null {
  if (raw == null) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw).trim();
  } catch {
    return null;
  }
  if (!decoded) return null;
  const noControls = decoded.replace(/[\u0000-\u001F\u007F]/g, "");
  if (!noControls) return null;
  const chars = Array.from(noControls);
  if (chars.length <= maxLen) return noControls;
  return chars.slice(0, maxLen).join("");
}

function truncateForShortName(name: string, maxChars: number): string {
  const chars = Array.from(name.trim());
  if (chars.length <= maxChars) return name.trim();
  if (maxChars < 2) return chars.slice(0, maxChars).join("");
  return `${chars.slice(0, maxChars - 1).join("")}..`;
}

export function buildWebManifest(
  startUrl: string,
  titles?: ManifestTitleOptions,
): MetadataRoute.Manifest {
  const sanitizedName = titles?.name
    ? sanitizeManifestLabel(titles.name, 120)
    : null;
  const sanitizedShort = titles?.shortName
    ? sanitizeManifestLabel(titles.shortName, 12)
    : null;

  const name = sanitizedName ?? DEFAULT_NAME;
  const short_name =
    sanitizedShort ??
    (sanitizedName ? truncateForShortName(sanitizedName, 12) : DEFAULT_SHORT_NAME);

  return {
    name,
    short_name,
    description:
      "Financial management system for businesses and organizations",
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      {
        src: APP_ICON.src,
        type: APP_ICON.type,
        sizes: "any",
        purpose: "any",
      },
    ],
  };
}
