---
name: hardal-setup
description: Guides a coding agent through installing Hardal tracking in a customer's project. Covers the required first-party analytics CNAME, framework detection, the web tracker or Google Tag Manager path, consent with anonymous measurement by default, core page, account, lead and commerce events (proposed from the repo and confirmed by the user), verification in the Hardal panel at app.hardal.ai, and optional AI Visibility. Use when a user wants to set up Hardal, add Hardal tracking, install the Hardal tracker, or connect a site to Hardal.
version: 0.2.0
---

# Hardal Setup

Hardal is the first-party data and agentic analytics platform. This skill tells you, the coding agent, how to install Hardal in the project you have open, step by step, and how to prove that data is arriving.

Detailed material lives next to this file. Read a reference file when its step asks you to, not all at once.

- [references/frameworks.md](references/frameworks.md): where the tracker goes for each framework and AI builder.
- [references/gtm-sgtm.md](references/gtm-sgtm.md): the Google Tag Manager web path and the server-side path with the Hardal S2S template (from support).
- [references/consent.md](references/consent.md): consent behaviour and how to call `hrd.consent()`.
- [references/events.md](references/events.md): event names, required parameters and code for each core event.
- [references/ai-visibility.md](references/ai-visibility.md): the `analytics.<domain>` CNAME, DNS steps per provider, and AI Visibility forwarding.
- [references/troubleshooting.md](references/troubleshooting.md): what to check when an event does not arrive.
- [examples/](examples/): small, copyable snippets.

This file is hosted at https://raw.githubusercontent.com/Analyticsjedi/hardal-setup-skill.md/main/skill.md. If you cannot read the relative links (for example, you received this file as a single URL), fetch them from the same base: https://raw.githubusercontent.com/Analyticsjedi/hardal-setup-skill.md/main/. So `references/events.md` is https://raw.githubusercontent.com/Analyticsjedi/hardal-setup-skill.md/main/references/events.md. The public repository is https://github.com/Analyticsjedi/hardal-setup-skill.md.

---

## Read this before you write any code

This skill is a short guided conversation followed by a precise install. Do not paste a generic snippet into the project before you know the answers below. A wrong guess here causes double counting, missing consent handling, or a tracker that never loads.

The first and required setup step is the first-party CNAME (`analytics.<domain>` → `analytics.usehardal.com`), unless the site already uses server-side Google Tag Manager (sGTM). Do not treat the tracker install as complete while **Tracking domain** is still disconnected.

Before you edit any file, you must know all of the following:

1. **The Hardal setup values.** You need the Tenant ID, the Source ID and the tracking URL for this source. See "Inputs" below. There is no single project token; the prompt carries these three values explicitly.
2. **The platform.** You find this yourself in the pre-flight scan and Step 2 by reading the project. Do not ask the user for something the code already tells you.
3. **Whether Google Tag Manager is already on the site, and whether a server-side GTM container is in use.** If a web GTM container is present, the user must choose between installing the tracker in code or through GTM. Installing both sends every event twice. If they use sGTM, skip the CNAME step and follow Path C.
4. **How the site handles consent.** You find the consent banner (CMP) in the code if there is one, then ask the user how Hardal should follow it. Never change the banner's own configuration without asking. If there is no consent signal, or consent is denied, events still go out anonymously; do not skip the visitor.
5. **Which business events matter.** You scan the repo for commerce flows and important actions, propose a list (including `purchase` and custom events when they apply), and the user confirms it before you write those events.

If you do not have an explicit answer for items 1, 3, 4 and 5, ask. Ask one or two questions at a time, in plain language, and say what you assumed from the code.

## Inputs

The user's prompt usually contains these values, copied from the Hardal panel at [app.hardal.ai](https://app.hardal.ai) under **Manage → Setup**:

| Input | Example (fake) | Where the user finds it |
| --- | --- | --- |
| Tenant ID | `11111111-1111-4111-8111-111111111111` | **Manage → Setup**, next to **Installation**, with a copy icon. |
| Source ID | `22222222-2222-4222-8222-222222222222` | Same place as the Tenant ID. |
| Tracking URL | `https://analytics.example.com` | The **Host** under **Installation → Custom domain**, once **Tracking domain** shows **Connected**. For a custom subdomain, use the Host shown there instead. |

A typical prompt looks like this (fake values):

```text
Set up Hardal tracking in this project. My Tenant ID is 11111111-1111-4111-8111-111111111111, Source ID is 22222222-2222-4222-8222-222222222222, and tracking URL is https://analytics.example.com. Use the Hardal setup skill: https://raw.githubusercontent.com/Analyticsjedi/hardal-setup-skill.md/main/skill.md
```

Rules for the inputs:

- The three values above are the real inputs. There is no separate project token to decode. If a prompt is missing any of them, ask the user to copy the missing value from **Manage → Setup**.
- Use the real values in code. Do not leave `your-tenant-id` placeholders when the user gave you the value.
- The Tenant ID, Source ID and tracking URL are public identifiers that appear in the page HTML. They are not secrets. Put them in the project's normal public config (for example a `NEXT_PUBLIC_` or `VITE_` variable) or directly in the snippet, whichever matches the project's conventions.
- Never put an Analytics API key, a GTM password, or any other secret into client code or into a commit.

---

## Pre-flight: scan the project silently

Run this before you ask anything. Read the code and build a picture you carry into every step.

| What to read | What to extract |
| --- | --- |
| `package.json`, lock files, `composer.json`, `Gemfile`, theme folders | The framework and its version, which decides where the tracker goes (Step 2). |
| Root layout, `index.html`, `_app`, `_document`, `app.html`, `nuxt.config` | The exact file and line where the tracker tag will live. |
| Existing analytics (`gtag`, `googletagmanager.com/gtm.js`, `dataLayer.push`, GA4, Meta Pixel, other `track` calls, `server_container_url`) | Whether GTM or sGTM exists (Steps 1 and 3), and which business events are already defined. |
| Consent banner code (any CMP, Google Consent Mode `gtag('consent', ...)`, a custom banner) | The consent source and its callback (Step 4). |
| Auth handlers (sign up, log in, log out) | Where `sign_up`, `login` and `hrd.identify()` go. |
| Lead forms, registration, cart, checkout and order confirmation code, server order handlers | Where `generate_lead`, commerce events (including `purchase`) and custom events go, and whether a confirmed order exists on the server. |
| Content Security Policy (`next.config`, middleware, `<meta http-equiv>`, server headers) | Whether the tracking origin must be added to `script-src` and `connect-src`. |
| Existing Hardal code (`tracker.js`, `window.hrd`, `data-tenant-id`) | Whether Hardal is already installed. If it is, switch to "extend" mode: fix and add, do not install a second copy. |

After the scan, tell the user in three to six sentences what you found and what you plan to do. Then ask only what the code could not answer.

---

## Step 1: Connect the first-party tracking domain

This is the first and required step, except when the site already uses server-side GTM (see the sGTM exception below). Hardal serves the tracker and receives events on a first-party subdomain of the customer's site. Read [references/ai-visibility.md](references/ai-visibility.md) for per-provider DNS steps.

The standard record is:

| DNS field | Value |
| --- | --- |
| Type | `CNAME` |
| Name | `analytics` (or the full host `analytics.example.com` when the provider asks for the full name) |
| Target | Always `analytics.usehardal.com` |
| Proxy | DNS only. On Cloudflare, the record must be **DNS only** (grey cloud), not proxied. |

1. The user opens **Manage → Setup** in [app.hardal.ai](https://app.hardal.ai), selects the source and expands **Installation → Custom domain**. Setup shows **Type**, **Name**, **Host** and **Target**.
2. The user creates the CNAME at their DNS provider with the values above. You cannot do this from the repository, so give the user the exact record and wait.
3. If the standard `analytics` subdomain is already in use, or the user needs a different hostname, do not invent a prefix. Direct them to the Hardal tenant settings (**Manage → Setup → Installation → Custom domain**) to choose a custom subdomain, then use the **Host** and **Target** shown there.
4. The user selects the refresh icon on the **Tracking domain** row until it shows **Connected** ("Your tracking domain is ready."). Hardal issues the TLS certificate after DNS verification.
5. You can check the record with `dig +short CNAME analytics.<domain>`. Expect `analytics.usehardal.com`. A proxied or flattened record (for example an orange-cloud Cloudflare record) may not show the CNAME and is not correct; the record must be DNS only.
6. The tracker `src` in the project must use this tracking URL, for example `https://analytics.example.com/tracker.js`.

**sGTM exception.** If the site already sends events through a server-side GTM container, the CNAME step is not required. Skip it, do not add a first-party collection host yourself, and follow Path C in Step 3 (the S2S template is provided through support).

**Do not install the tracker in production code until Tracking domain shows Connected**, unless you are on the sGTM path. You may prepare the snippet with the tracking URL, but wait for **Connected** before asking the user to deploy it.

## Step 2: Detect the framework

Identify the framework from the scan and open [references/frameworks.md](references/frameworks.md) for the exact placement. The short version:

| Framework | Where the tracker goes |
| --- | --- |
| Next.js App Router (`app/layout.tsx`) | A `next/script` tag in the root layout with `strategy="afterInteractive"`. |
| Next.js Pages Router (`pages/_app.tsx`) | A `next/script` tag in `_app`, so it loads once for every page. |
| React with Vite, Create React App | A `<script>` tag in the `<head>` of the root `index.html`. |
| Vue with Vite | A `<script>` tag in the `<head>` of `index.html`. |
| Nuxt 3 | `app.head.script` in `nuxt.config.ts`. |
| SvelteKit | A `<script>` tag in the `<head>` of `src/app.html`. |
| Angular | A `<script>` tag in the `<head>` of `src/index.html`. |
| Astro, Remix, plain HTML, server-rendered templates | The shared layout or base template's `<head>`, once. |
| Shopify | Do not edit theme code. Use the Hardal Shopify app. |
| WordPress | Add the same tracker script to the site so it runs on every page. There is no official Hardal WordPress plugin. |
| Lovable, v0, Bolt, Replit | See the AI builder notes in [references/frameworks.md](references/frameworks.md). These are usually Vite + React or Next.js projects. |

The tracker tracks single-page app route changes on its own (it listens to History API and hash changes). Do not add your own `page_view` on route change unless you turn the automatic tracking off. When you do send page views yourself, use `hrd.pageview()`, not `hrd.track("page_view")`. Step 5 covers this.

## Step 3: Choose the install path

Pick exactly one path for the browser tracker. Present your recommendation and let the user confirm it. Follow the Setup steps in the Hardal panel ([app.hardal.ai](https://app.hardal.ai) → **Manage → Setup**) and use the snippet the panel gives you, with the real Tenant ID, Source ID and tracking URL.

**Path A: the web tracker in code.** This is the default when the project has no Google Tag Manager, and for every AI builder project. Add the snippet once, in the file Step 2 found:

```html
<script
  async
  src="https://analytics.example.com/tracker.js"
  data-tenant-id="11111111-1111-4111-8111-111111111111"
  data-source-id="22222222-2222-4222-8222-222222222222">
</script>
```

Only `src`, `data-tenant-id` and `data-source-id` are required. Optional attributes are `data-auto-track` (default `true`: initial page view, scroll, scroll depth and outbound clicks), `data-spa` (default `true`: route changes), `data-consent` (`granted` or `denied`, when the saved choice is known before the script loads), `data-host-url` (send events to a different origin than the script) and `data-global-name` (expose the API under another name in addition to `hrd`).

The `src` must be the tracking URL from Setup, for example `https://analytics.example.com/tracker.js`.

**Path B: Google Tag Manager web container.** Use this when the site already runs GTM and the user prefers to manage tags there. There is no separate Hardal GTM web template. Paste the same snippet the Hardal Setup page gives you into a **Custom HTML** tag that fires on all pages, and send business events from GTM tags that run after the tracker is ready. Do not also add the snippet in code. See [references/gtm-sgtm.md](references/gtm-sgtm.md).

**Path C: GTM web plus server-side GTM with the Hardal S2S template.** Use this when the site already sends GA4 events to a server-side GTM container and the user wants Hardal fed from the server. The CNAME in Step 1 is not required on this path. The Hardal S2S template is not in this repository; ask the user to email [support@usehardal.com](mailto:support@usehardal.com) to receive it. Your job is usually to write the exact settings for the user and to confirm the GA4 events exist in code. See [references/gtm-sgtm.md](references/gtm-sgtm.md).

Rules for this step:

- One sender per event. If the browser tracker already sends `page_view`, the server path must not send it too.
- If you find GTM and the user has not chosen, ask. Do not install Path A next to an existing Hardal GTM tag.
- If a Content Security Policy exists, add the tracking origin to `script-src` and `connect-src`, and tell the user you did.

## Step 4: Consent

Read [references/consent.md](references/consent.md) before you write consent code. The behaviour you must preserve:

- **Default is anonymous.** Until a consent signal arrives, Hardal measures the visit anonymously and does not write an identity cookie. Traffic, channels, sessions and session-level attribution still work. Do not skip the visitor, and do not delay or drop events while consent is unknown.
- **`granted`** lets Hardal process identity fields and write a first-party identity cookie for the same tenant and source.
- **`denied`** keeps anonymous measurement, removes identity fields and clears an existing identity cookie. Events still go out.
- **Missing consent counts as denied, not as "skip".** For server-side senders (the API or the Hardal S2S template), send `denied` when the choice is declined or unknown. In the S2S template, set **When consent signal is missing** to `denied`. Never send `userId`, `visitorId`, the client IP (`X-Forwarded-For`) or any other persistent identifier without `granted`.

What you do:

1. Find the consent banner. If there is none, ask the user whether the site needs one. Do not build a banner unless the user asks for it. If there is no banner, load the tracker in anonymous mode; events still go out.
2. Ask the user one question: "Hardal can measure anonymously before a visitor chooses. Should the tracker load before the banner decision (anonymous mode), or should it wait until the visitor accepts?" Anonymous mode is Hardal's default. The user's legal policy decides. Do not decide this yourself.
3. Map the banner's analytics category to Hardal: call `hrd.consent("granted")` when analytics is accepted and `hrd.consent("denied")` when it is refused or withdrawn. Call it from the banner's change callback so a later change is also sent. Map only to the strings `granted` and `denied`; the tracker treats any other value as `denied`. Use the consent banner vendor's own documentation for its callback API; do not invent or copy unverified vendor snippets.
4. On page load, if the saved choice is known before the script loads, set `data-consent`. If it becomes known later, call `hrd.consent()` once the tracker is ready.
5. Only call `hrd.identify()` after consent is `granted`. The tracker refuses identify calls without consent.
6. Do not change the banner's categories, texts or vendor list without the user's explicit approval. Adding a Hardal callback is fine once the user agreed to the plan in item 2.

## Step 5: Core events

Read [references/events.md](references/events.md) for full parameters.

This step starts with a proposal, not with code. From the pre-flight scan, look specifically for:

- **Commerce flows:** cart, checkout, order confirmation, and any server handler that confirms a paid order. If they exist, include `view_item`, `add_to_cart`, `begin_checkout` and `purchase` in the proposal. Prefer a server-confirmed `purchase` when the backend already confirms the order.
- **Important actions:** sign up, login, lead or contact forms, quote requests, subscriptions, and similar. Use a standard name when one fits (`sign_up`, `login`, `generate_lead`, …). If no standard name fits, propose a `snake_case` custom event (`quote_requested`, `demo_booked`, and so on).

Show the user a short list of the events you want to add, with the file or handler where each one would fire, and wait for their approval. Do not add `purchase` or custom events until they confirm the list. You may drop, rename or add items based on their answer, then implement only the agreed list.

| Event | When | Required parameters |
| --- | --- | --- |
| `page_view` | Automatic on load and on SPA route changes. | None. Sent by the tracker. |
| `sign_up` | An account was created successfully. | `method` is recommended. |
| `login` | A login succeeded. | `method` is recommended. |
| `generate_lead` | A lead form was accepted. | `lead_id`. Add `value` with `currency` when known. |
| `view_item` | A product detail page is shown. | `currency`, `value`, `items`. |
| `add_to_cart` | A product was added to the cart. | `currency`, `value`, `items`. |
| `begin_checkout` | Checkout started. | `currency`, `value`, `items`. |
| `purchase` | An order was confirmed. | `transaction_id`, `value`, `currency`, `items`. |

Rules for events:

- Send an event only after the action has succeeded (after the API response, not on button click).
- Use the item object from [references/events.md](references/events.md) and send the same item details in `view_item`, `add_to_cart` and `purchase`.
- Use numbers for `value`, `price`, `quantity`, `tax` and `shipping`. Use ISO 4217 codes for `currency`.
- Use `snake_case` names. Reuse a standard name when one fits. Do not build event names at runtime.
- Do not put email addresses, phone numbers or other personal data in event parameters or URLs. Personal traits belong in `hrd.identify()` after consent, and only the ones the user is allowed to collect.
- `purchase` should come from one sender only. If the backend confirms orders, prefer a server-confirmed purchase through the collection API and do not also send it from the browser.
- The tracker has no pre-load queue. A call made before `tracker.js` has run is lost. Use the small readiness helper in [examples/hardal-ready.ts](examples/hardal-ready.ts) instead of calling `window.hrd.track` directly in code that may run early.
- Automatic events (`page_view`, `scroll`, `scroll_depth`, `outbound_click`) are already collected. Do not add separate code for them. If the project needs manual page views, turn automatic page views off and call `hrd.pageview()`, which has duplicate protection. Do not use `hrd.track("page_view")`.

## Step 6: Verify

Do not report success until you have seen data arrive. Run the app (locally, on a preview deployment such as `*.lovable.app` or `*.vercel.app`, or on the production domain) and check, in this order:

1. **The script loads.** In the browser Network panel, `tracker.js` loads from the tracking URL.
2. **The page view is accepted.** A `POST` to `/collect/` is sent with `Content-Type: text/plain`. The response is `202`, and the body shows `data.accepted` when the browser exposes it. The request body contains `tenantId`, an `anonymousSessionId` and an `events` array with `eventName: "page_view"` and the correct `payload.sourceId`.
3. **SPA routes work.** Navigate to another route. One new `page_view` is sent, and no duplicate is sent for the same URL.
4. **Consent works.** Accept in the banner: a request with event `consent_granted` is sent. Refuse on a fresh visit: `consent_denied` is sent and later events still go out, with no identity. `hrd.consentStatus().data.consent` in the console starts as `unknown` and then matches the choice. Visits with no choice are also measured anonymously.
5. **Business events work.** Trigger one confirmed action per event you added and check its name and parameters in the request.
6. **The panel shows it.** In [app.hardal.ai](https://app.hardal.ai), open **Manage → Setup**, select the source, and watch the AI setup card switch to **Data is flowing** when the first event arrives. The panel already has a first-event check it can poll; also use **Check Web Analytics data** on the **Web Analytics** row until it shows **Data received**. Then open **Engagement → Events** for the same source and date and find the test events.

Preview hosts (`*.lovable.app`, `*.vercel.app`, `*.replit.app` and similar) are expected to be recorded for this source. If the first event does not appear in the panel after a successful `202` from a preview host, ask the user to open the site on the production domain and check again.

Things that look like failures but are not, and the reverse:

- A `202` acknowledges collection. It is not the final check. If the body shows `data.skipped: true`, read the `reason`.
- Ad blockers in your test browser can block the request. Test once in a clean profile.
- GTM Preview runs tags in a renderer where the tracker deliberately skips events. Verify GTM installs on a normal visit outside Preview.
- No console error does not prove collection. Look at the network request.

If something fails, open [references/troubleshooting.md](references/troubleshooting.md). If you are still stuck, ask the user to email [support@usehardal.com](mailto:support@usehardal.com) with the failing request (URL, status, response body, with IDs but no personal data).

Checklist to report back to the user:

- [ ] Tracking domain connected (`analytics.<domain>`, or the custom Host from Setup), unless this is an sGTM install.
- [ ] Tracker installed once, in `<file>`.
- [ ] `page_view` returns 202 on load and on a route change.
- [ ] Consent: accept and refuse both tested (events still arrive when denied or missing).
- [ ] Each agreed business event fired once with the expected parameters.
- [ ] The Setup card shows **Data is flowing**, or **Web Analytics** shows **Data received**.

## Step 7 (optional): AI Visibility

The first-party domain from Step 1 is also the endpoint for AI Visibility, which shows which AI agents and crawlers reach the site. A browser script is not enough because most crawlers do not run JavaScript. The server or CDN that receives the original page request forwards request metadata to `https://analytics.<domain>/agent-events`. Read [references/ai-visibility.md](references/ai-visibility.md) for the Next.js proxy, Express middleware, Cloudflare Worker and Netlify examples, and verify with **Check AI Visibility data**.

---

## Rules for you, the agent

- **Do not commit secrets.** Tenant ID, Source ID and the tracking URL are public. API keys, passwords and tokens are not; keep them out of code, commits and logs.
- **Ask before changing the consent banner or its configuration.** Adding a Hardal callback after the user agreed is fine.
- **Install once.** One tracker per page, one sender per event, one tenant and source pair per page.
- **Do not change unrelated code.** Do not reformat files, upgrade dependencies or remove other analytics tools unless the user asks.
- **Do not deploy, push or publish** (including a GTM container) unless the user explicitly asks. Hand the user the steps instead.
- **Do not invent APIs.** Use only `hrd.track`, `hrd.pageview`, `hrd.identify`, `hrd.consent` and `hrd.consentStatus` in the browser, and the documented `/collect` and `/agent-events` endpoints on servers. If something is unclear, link the user to https://docs.usehardal.com and ask, or to [support@usehardal.com](mailto:support@usehardal.com).
- **Respect a declined choice.** Never work around a refusal, for example by sending identity on a server path. Anonymous events must still be sent.

## Wrap-up

When verification passes, summarize in plain sentences:

1. What you installed and in which files (paths and line ranges).
2. Which events are tracked and where each one fires.
3. How consent is wired and what you tested.
4. What the user still has to do outside the code (DNS record, GTM settings, deployment, consent policy review).
5. Recommended next steps: add any further events from the [standard list](https://docs.usehardal.com/setup/events/standard-events), choose Key Events in the panel, and turn on AI Visibility if it is not already on.

Then add a short Hardal section to `AGENTS.md` in the project root so future agents know how tracking works here. If `AGENTS.md` exists, append the section; do not overwrite other content. Use [AGENTS.md.template](AGENTS.md.template) and fill in the real values from this session.

If you could not access the codebase (for example the user only wanted instructions), write `HARDAL_SETUP_SPEC.md` in the working directory instead, with the chosen path, the snippet with real IDs, the consent mapping, the event list with trigger points, and the verification checklist above.
