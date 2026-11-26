# Troubleshooting

Work from the browser outward: script, request, response, panel.

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| `tracker.js` is not requested | The snippet is not in the rendered HTML, or it is in a component that never mounts. | View the page source or the Elements panel. Move the tag to the root layout or `index.html`. |
| `tracker.js` returns an error or is blocked | Wrong tracking URL, tracking domain not connected yet, an ad blocker, or a Content Security Policy. | Compare the URL with **Installation → Custom domain**. Check **Tracking domain** is **Connected**. Test in a clean profile. Add the origin to `script-src`. |
| Console: "missing data-source-id" or "missing data-tenant-id" | An attribute is missing or empty, often an undefined environment variable. | Print the rendered tag. Check the variable prefix (`NEXT_PUBLIC_`, `VITE_`) and rebuild. |
| No `POST /collect/` | Tracker loaded with `data-auto-track="false"`, or the request is blocked by `connect-src`. | Check the attributes. Add the origin to `connect-src`. |
| `202` but `data.skipped: true` | The request was filtered, for example as a bot request. | Read `reason`. Server senders must forward a real `User-Agent`. Missing or denied consent is not a skip reason; those visits should still be accepted anonymously. |
| `400 Bad Request` | Invalid field, for example a bad UUID, a missing `payload.sourceId`, `scroll_depth` with a non-milestone `percent`, or an `outbound_click` without absolute URLs. | Read `details` in the response and fix the field. |
| Business event never sent | `hrd.track` called before the tracker ran (there is no pre-load queue), or called in server-rendered code. | Use `whenHardalReady()` and call from browser-only code. |
| Event sent twice | The tracker is installed twice (code and GTM), or a manual `page_view` duplicates the automatic one, or a confirmation page reloads. | Keep one install. For manual page views use only `hrd.pageview()`, and only with auto-track off. Guard `purchase` with the order ID. |
| Events in the request but not in the panel | Wrong source or date range in the report, timezone, or a test on a preview host that has not appeared yet. | Open **Engagement → Events** or the **Data is flowing** card for the same source and day. Preview hosts (`*.lovable.app`, `*.vercel.app` and similar) are expected to be recorded; if the first event still does not appear, test on the production domain. |
| Works in GTM Preview but not after publish, or the reverse | The tracker skips events inside GTM Preview's renderer. | Verify on a normal visit outside Preview. |
| Consent always `unknown` | `hrd.consent()` is never called, or it runs before the tracker is ready. | Wire it to the CMP callback through `whenHardalReady()`. Events should still arrive anonymously while the state is `unknown`. |
| Identify returns `CONSENT_REQUIRED` | Consent is not granted. | Expected. Call identify only after `granted`. |
| **Tracking domain** stays pending | Wrong name or target, propagation, or a proxied record. | `dig +short CNAME analytics.<domain>` should return `analytics.usehardal.com`. On Cloudflare the record must be DNS only (grey cloud). Wait, then select refresh again. If `analytics` is taken, choose a custom subdomain in the Hardal tenant settings. |
| AI Visibility shows nothing | No forwarding at the server or CDN, wrong client IP, or no real crawler visit yet. | Check the forwarder logs. A `204` means ignored; see [Send Agent Events](https://docs.usehardal.com/push/agent-events). |

Still stuck: collect the failing request (URL, status, response body, with IDs but no personal data) and ask the user to email [support@usehardal.com](mailto:support@usehardal.com).
