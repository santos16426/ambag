import { defaultCache } from "@serwist/next/worker";
import type {
  HTTPMethod,
  PrecacheEntry,
  RouteMatchCallbackOptions,
  RuntimeCaching,
  SerwistGlobalConfig,
} from "serwist";
import { NetworkOnly, Serwist } from "serwist";

/**
 * PWA runtime caching guardrails (see README “PWA”):
 * - Same-origin `/api/**` (all common HTTP methods) → NetworkOnly (no SW cache).
 * - `*.supabase.co` → NetworkOnly (client SDK traffic never cached by SW).
 * - Everything else → `@serwist/next` defaultCache (static assets, Next.js
 *   chunks, NetworkFirst HTML/RSC with offline document fallback below).
 */
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const NO_CACHE_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
] as const satisfies readonly HTTPMethod[];

function networkOnlyForApi(): RuntimeCaching[] {
  return NO_CACHE_METHODS.map((method) => ({
    method,
    matcher: ({ sameOrigin, url }: RouteMatchCallbackOptions) =>
      sameOrigin && url.pathname.startsWith("/api/"),
    handler: new NetworkOnly({ networkTimeoutSeconds: 10 }),
  }));
}

function networkOnlyForSupabase(): RuntimeCaching[] {
  return NO_CACHE_METHODS.map((method) => ({
    method,
    matcher: ({ url }: RouteMatchCallbackOptions) =>
      url.hostname.endsWith(".supabase.co"),
    handler: new NetworkOnly({ networkTimeoutSeconds: 10 }),
  }));
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...networkOnlyForApi(),
    ...networkOnlyForSupabase(),
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }: { request: Request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
