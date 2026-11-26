# Framework placement

Install the Hardal tracker exactly once, in the file that renders on every page. The examples use fake IDs; replace them with the values from **Manage → Setup** in [app.hardal.ai](https://app.hardal.ai). The tracker `src` is the tracking URL, by default `https://analytics.example.com/tracker.js`.

The tracker tracks route changes itself through the History API and hash changes (`data-spa="true"` by default), so single-page apps need no router hook for `page_view`. If you turn automatic page views off, send them with `hrd.pageview()`.

## Next.js App Router

Signs: an `app/` directory with `layout.tsx` or `layout.js`, Next.js 13.4 or later.

Add the script to the root layout. Keep it out of nested layouts, or it may be added more than once.

```tsx
// app/layout.tsx
import Script from "next/script";

const HRD_URL = process.env.NEXT_PUBLIC_HARDAL_COLLECT_URL ?? "https://analytics.example.com";
const HRD_TENANT_ID = process.env.NEXT_PUBLIC_HARDAL_TENANT_ID ?? "11111111-1111-4111-8111-111111111111";
const HRD_SOURCE_ID = process.env.NEXT_PUBLIC_HARDAL_SOURCE_ID ?? "22222222-2222-4222-8222-222222222222";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          id="hrd-tracker"
          strategy="afterInteractive"
          src={`${HRD_URL}/tracker.js`}
          data-tenant-id={HRD_TENANT_ID}
          data-source-id={HRD_SOURCE_ID}
        />
      </body>
    </html>
  );
}
```

Business events run in client components (`"use client"`) after the action succeeded. Use `examples/hardal-ready.ts`.

If the project has `middleware.ts` (or `proxy.ts` on Next.js 16) with a Content Security Policy, add the tracking origin to `script-src` and `connect-src`.

## Next.js Pages Router

Signs: a `pages/` directory with `_app.tsx`, no `app/` root layout.

```tsx
// pages/_app.tsx
import type { AppProps } from "next/app";
import Script from "next/script";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script
        id="hrd-tracker"
        strategy="afterInteractive"
        src={`${process.env.NEXT_PUBLIC_HARDAL_COLLECT_URL}/tracker.js`}
        data-tenant-id={process.env.NEXT_PUBLIC_HARDAL_TENANT_ID}
        data-source-id={process.env.NEXT_PUBLIC_HARDAL_SOURCE_ID}
      />
      <Component {...pageProps} />
    </>
  );
}
```

`next/router` navigation uses `pushState`, so route changes are tracked automatically.

## React with Vite, and Create React App

Signs: `vite.config.*` with `@vitejs/plugin-react`, or `react-scripts`. The root `index.html` is in the project root (Vite) or in `public/` (Create React App).

Add the snippet to the `<head>` of that `index.html`. If the project uses environment variables, Vite replaces `%VITE_NAME%` in `index.html` at build time:

```html
<script
  async
  src="%VITE_HARDAL_COLLECT_URL%/tracker.js"
  data-tenant-id="%VITE_HARDAL_TENANT_ID%"
  data-source-id="%VITE_HARDAL_SOURCE_ID%">
</script>
```

If the project has no `.env` convention, put the literal values in the tag. They are public.

React Router, TanStack Router and wouter all navigate with `pushState`, so no extra code is needed for page views.

## Vue with Vite

Add the snippet to the `<head>` of `index.html`, as for React with Vite. Vue Router in `createWebHistory` mode uses `pushState`; in `createWebHashHistory` mode, the tracker follows hash changes. Both are tracked.

## Nuxt 3

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      script: [
        {
          src: "https://analytics.example.com/tracker.js",
          async: true,
          "data-tenant-id": "11111111-1111-4111-8111-111111111111",
          "data-source-id": "22222222-2222-4222-8222-222222222222",
        },
      ],
    },
  },
});
```

Send business events from client-only code (`onMounted`, or a `.client.ts` plugin).

## SvelteKit

Add the snippet inside `<head>` in `src/app.html`, before `%sveltekit.head%`. SvelteKit client navigation uses `pushState`. Send events from code that runs in the browser (`onMount`, or behind `import { browser } from "$app/environment"`).

## Angular

Add the snippet inside `<head>` in `src/index.html`. The Angular router uses `pushState` by default. Declare the global once in a `.d.ts` file (see `examples/hardal-ready.ts`) so `window.hrd` type-checks.

## Astro, Remix, plain HTML and server templates

Put the snippet in the shared layout's `<head>` (`src/layouts/*.astro`, `app/root.tsx`, a base template, or every static page if there is no shared layout). With Astro view transitions, navigation uses `pushState` and is tracked.

## Shopify

Do not edit `theme.liquid` to add the tracker. Hardal has a Shopify app that installs its own web pixel:

1. Install the app from the [Hardal app listing](https://apps.shopify.com/hardal).
2. In Shopify Admin, open **Apps → Hardal**, choose **Configure Analytics** and select **Hardal AI**. If you see **Signal URL** and **Signal ID**, the **Legacy** option is selected.
3. Copy **Tenant ID**, **Source ID** and the tracking hostname from Hardal Setup into the app and select **Save and Start Tracking**.
4. Open a storefront page and look for `page_view` in **Engagement → Events**.

In a headless Shopify storefront (Hydrogen or a custom Next.js front end), install the tracker in that front end as above.

## WordPress

There is no official Hardal WordPress plugin. Add the same tracker script the Hardal Setup page gives you to the site, so it runs on every page. Do not invent a plugin or a more complicated install path.

## AI app builders

Preview hostnames such as `*.lovable.app`, `*.vercel.app`, `*.replit.dev` and Bolt preview URLs are expected to be recorded for a source whose domain is the production domain. Verify in the preview with the browser's Network panel. If the first event does not appear in the Hardal panel after a `202`, ask the user to test on the production domain.

### Lovable

Lovable projects are Vite + React + TypeScript with React Router and Tailwind. The user pastes the prompt into the Lovable chat; Lovable's agent edits the project.

- Put the snippet in the `<head>` of the root `index.html`. Literal IDs are fine.
- Put business events in the component or hook that handles the successful action.
- If the project uses Supabase auth, fire `sign_up` and `login` after the Supabase call resolves without an error, and call `hrd.identify()` only after consent is granted.
- Verify in the Lovable preview, then on the published URL if the first event does not show in the panel.

### v0

v0 generates Next.js App Router projects. Use the App Router placement in `app/layout.tsx`. If the user deploys to Vercel, set the `NEXT_PUBLIC_HARDAL_*` variables in the Vercel project, or use literal values.

### Bolt

Bolt projects are usually Vite + React, sometimes Next.js or Astro. Detect from `package.json` and use the matching section. Bolt runs the preview inside a WebContainer; check the request in the preview's Network panel and again after deploy if needed.

### Replit

Replit projects can be anything. Detect the framework from the files. For a Replit agent app with a separate backend (Express or Flask) and front end, put the tracker in the front end's HTML and keep any server-side senders in the backend.

### Claude Code, ChatGPT Codex, Cursor

These work directly in the user's repository. Follow the framework sections above. Show the diff and the verification checklist before you finish.
