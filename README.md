This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## PWA (install + offline shell)

Ambag ships with a web app manifest ([`app/manifest.ts`](./app/manifest.ts)), iOS-oriented metadata in [`app/layout.tsx`](./app/layout.tsx), and a [Serwist](https://serwist.pages.dev/) service worker ([`app/sw.ts`](./app/sw.ts)) that:

- Precaches the app shell and static assets in production.
- Uses a document fallback to [`/~offline`](./app/~offline/page.tsx) when navigation fails offline.
- Applies **NetworkOnly** to same-origin `/api/**` and `*.supabase.co` so authenticated/API traffic is not cached by the SW.

**Build note:** `npm run build` runs `next build --webpack` because `@serwist/next` requires webpack. **Do not run `npx next build` or `next build` by itself** on Next.js 16 — the default bundler is Turbopack, which conflicts with Serwist’s webpack hook and fails with the “webpack config and no turbopack config” error, and even workarounds that only silence that error can skip emitting `public/sw.js`. Always use **`npm run build`** (or explicitly `next build --webpack`).

**Development:** Use **`npm run dev`** for normal work — you get **hot reload** (Fast Refresh). Serwist is **off** in dev (`NODE_ENV === "development"`), so there is no service worker; that is intentional. The dev script uses **`next dev --webpack`** so it matches the webpack-based production build and avoids Turbopack + Serwist noise.

**PWA / install / offline checks only:** run **`npm run build && npm start`** (or your deployed URL). You do not need a full rebuild for every UI change during feature work.

**Icons:** The manifest currently uses SVG (`/logo.svg`). For best install UX on all platforms, add PNG icons (192×192 and 512×512) and reference them in `app/manifest.ts`.

### QA checklist (manual)

1. **Production build:** `npm run build && npm start`, open the site over **HTTPS** or `localhost`.
2. **Manifest:** DevTools → Application → Manifest — verify name, `start_url`, display `standalone`, icons load.
3. **Service worker:** Application → Service Workers — `/sw.js` registered, no errors in console.
4. **Offline shell:** After a full load, go offline (DevTools → Network → Offline) and navigate to a new route — expect offline page or cached shell, not a broken blank page.
5. **APIs:** While offline, actions hitting `/api/*` should fail at the network (no stale cached JSON from prior visits).
6. **Install (Chromium):** Use “Install app” / Lighthouse PWA checks as needed.
7. **iOS Safari:** Add to Home Screen, launch in standalone — confirm title/status bar and that primary flows still require network for data.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
