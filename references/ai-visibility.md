# First-party collection domain and AI Visibility

Source: [Connect Your Tracking Domain](https://docs.usehardal.com/setup/custom-domain), [AI Visibility Setup](https://docs.usehardal.com/setup/ai-visibility), [AI Visibility Installation Examples](https://docs.usehardal.com/setup/ai-visibility-cdn).

## 1. The `analytics.<domain>` record

This is the first and required setup step, unless the site already uses server-side GTM (sGTM). Hardal serves the tracker and receives events on a subdomain of the customer's site. The standard hostname is `analytics.<domain>`. Existing tenants, or tenants who cannot use `analytics`, can choose a custom subdomain in the Hardal tenant settings (**Manage → Setup → Installation → Custom domain**).

The values come from **Manage → Setup → (source) → Installation → Custom domain**, where **Type**, **Name**, **Host** and **Target** each have a copy icon.

| DNS field | Value |
| --- | --- |
| Type | `CNAME` |
| Name | `analytics` when the provider appends the domain, or the full **Host** (`analytics.example.com`) when it asks for the full name |
| Target / Value | Always `analytics.usehardal.com` |
| TTL | Provider default (Auto or 300 to 3600 seconds) |
| Proxy | DNS only. On Cloudflare, set **Proxy status** to **DNS only** (grey cloud). Do not orange-cloud this record. |

If the source has no domain, Setup shows **Configure source domain**. The user adds a bare hostname such as `example.com` (no `https://`, port, path or prefix) on the Sources page first.

If `analytics` is already in use on the domain, do not pick a prefix yourself. Direct the user to the Hardal tenant settings to set a custom subdomain, then use the **Host** and **Target** shown there.

If the site already uses server-side GTM, this CNAME is not required. Skip this section and follow Path C in [gtm-sgtm.md](gtm-sgtm.md).

The agent cannot create DNS records from the repository. Give the user the exact record, the steps for their provider below, and wait until **Tracking domain** shows **Connected**.

### Steps per DNS provider

- **Cloudflare:** **DNS → Records → Add record**. Type `CNAME`, Name `analytics`, Target `analytics.usehardal.com`. Set **Proxy status** to **DNS only** (grey cloud). Setup also offers an **Open Cloudflare** button.
- **GoDaddy:** **My Products → Domain → DNS → Add New Record**. Type `CNAME`, Name `analytics`, Value `analytics.usehardal.com`, TTL default.
- **Namecheap:** **Domain List → Manage → Advanced DNS → Add New Record**. Type **CNAME Record**, Host `analytics`, Value `analytics.usehardal.com`.
- **AWS Route 53:** **Hosted zones → (zone) → Create record**. Record name `analytics`, type `CNAME`, value `analytics.usehardal.com`. Do not use an alias record for this.
- **Google Cloud DNS:** **Cloud DNS → (zone) → Add standard**. DNS name `analytics`, type `CNAME`, canonical name `analytics.usehardal.com.` with a trailing dot.
- **Squarespace Domains (formerly Google Domains):** **Domains → (domain) → DNS → Custom records → Add record**. Host `analytics`, type `CNAME`, data `analytics.usehardal.com`.
- **Vercel DNS:** **Domains → (domain) → DNS Records → Add**. Name `analytics`, type `CNAME`, value `analytics.usehardal.com`.
- **Netlify DNS:** **Domains → (domain) → DNS settings → Add new record**. Type `CNAME`, name `analytics`, value `analytics.usehardal.com`.
- **cPanel, Plesk, Hostinger and similar hosts:** open the **Zone Editor** or **DNS Zone**, add a `CNAME` with name `analytics` and target `analytics.usehardal.com`.
- **Shopify-managed domains:** **Settings → Domains → (domain) → Domain settings → Edit DNS settings → Add custom record → CNAME**, name `analytics`, target `analytics.usehardal.com`.

Some providers reject a CNAME when another record (A, TXT) already exists on `analytics`. If the name is taken, send the user to the Hardal tenant settings to choose a custom subdomain. Remove or rename a conflicting record only with the user's approval.

### Verify the domain

1. Check DNS from a terminal (a trailing dot in the answer is normal):

   ```bash
   dig +short CNAME analytics.example.com
   ```

   Expect `analytics.usehardal.com`. A proxied or flattened record may hide the CNAME and is not correct; the Cloudflare record must be DNS only (grey cloud).

2. In **Setup Status**, select the refresh icon on the **Tracking domain** row ("Check domain again") until it shows **Connected** and "Your tracking domain is ready." **Custom domain** then shows "DNS record verified." Propagation can take from minutes to a few hours. Hardal sets up the TLS certificate after DNS verification.
3. Make sure the tracker `src` uses `https://analytics.example.com/tracker.js` (or the custom Host from Setup) and that `/collect/` requests go to the same host.
4. If the site has a Content Security Policy, add `https://analytics.example.com` to `script-src` and `connect-src`.

## 2. AI Visibility forwarding

AI Visibility shows which AI agents, AI search bots and crawlers (for example GPTBot, ClaudeBot, PerplexityBot) reach the site. Most of them do not run JavaScript, so the browser tracker cannot see them. The layer that receives the original page request (CDN, edge or application server) sends one small request per page request to Hardal, which keeps only recognized bot traffic.

```text
POST https://analytics.example.com/agent-events
Content-Type: application/json
tenant-id: 11111111-1111-4111-8111-111111111111

{ "path": "/pricing", "ip": "<original client IP>", "userAgent": "<raw User-Agent>",
  "eventTime": "2026-04-29T15:12:17.836Z", "sourceId": "22222222-2222-4222-8222-222222222222" }
```

All five body fields are required. The response is `202 Accepted` for a recognized crawler and an empty `204` when the request was ignored.

Rules:

- Forward asynchronously so the page response is not delayed (`waitUntil` on edge platforms).
- Read the client IP from the platform's trusted source (`CF-Connecting-IP` on Cloudflare, `context.ip` on Netlify, `req.ip` with trusted proxies on Express). Never trust an arbitrary `X-Forwarded-For` the client could set.
- Only page routes: skip static assets and methods other than GET and HEAD.
- One forwarding path per request, or visits are counted twice.

Where to put it:

| Platform | What to do |
| --- | --- |
| Next.js (16+, Vercel) | Copy the generated **Next.js** example from **Installation → AI Visibility** into `proxy.ts` (or merge it into the existing proxy or middleware) and make sure the matcher covers public pages. |
| Node.js / Express | Copy the generated `hardalAgentEvents` middleware and register `app.use(hardalAgentEvents)` before page routes. Configure `trust proxy`. |
| Cloudflare | Copy the generated Worker and add a Worker route on the website hostname (not the collection hostname). |
| Netlify | Use an Edge Function; see `examples/netlify-agent-events.js`. |
| AWS CloudFront, Azure Front Door | Use real-time or access logs with a consumer; follow the docs page above. |
| Shopify Online Store | Not supported at Shopify's managed edge. A headless storefront can use its own CDN or server. |

Prefer the generated example from Setup over writing your own; it already contains the right IDs and URL.

### Verify AI Visibility

Use **Check AI Visibility data** on the **AI Visibility** row in **Setup Status**. Verification needs a real crawler visit from a verified IP, so it can take time; a fake bot User-Agent from your own machine will not count. Then open **AI Visibility → Agents → Last Events** for the same source and match time, agent and path.
