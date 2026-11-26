# Google Tag Manager paths

Use these paths only when the site already runs Google Tag Manager. Most of this work happens in the GTM interface, not in the repository. Your job is to give the user exact settings, check that the needed dataLayer events exist in code, and never publish a container yourself.

Follow the Setup steps in the Hardal panel at [app.hardal.ai](https://app.hardal.ai) (**Manage → Setup**) and use the snippet the panel gives you.

## Path B: GTM web container with a Custom HTML tag

There is no separate Hardal GTM web template. Paste the Setup snippet into a Custom HTML tag.

1. In the web container, create a **Custom HTML** tag named `Hardal - Tracker`.
2. Paste the tracker snippet from **Manage → Setup**, with the real tracking URL, Tenant ID and Source ID.
3. Trigger: **All Pages** (or **Initialization - All Pages** if the consent setup requires it).
4. For business events, create one Custom HTML tag per event that calls `hrd.track()`. The tag must run after the tracker is ready; starting the tracker tag only begins the download. Use a readiness wait inside the tag:

```html
<script>
(function send(tries) {
  if (window.hrd && typeof window.hrd.track === "function") {
    window.hrd.track("generate_lead", {
      lead_id: {{DLV - lead_id}},
      lead_source: "contact_form"
    });
  } else if (tries < 50) {
    setTimeout(function () { send(tries + 1); }, 100);
  }
})(0);
</script>
```

`window.hrd?.track?.(...)` alone avoids an error but does not queue or resend the event when the tracker is missing.

5. Consent: create a Custom HTML tag that calls `hrd.consent("granted")` or `hrd.consent("denied")` on the CMP's consent-update event, with the same readiness wait. Use the banner vendor's documentation for that event; if consent is missing or denied, events still go out anonymously.
6. Preview caveat: inside GTM Preview's renderer the tracker skips events on purpose. Verify with a normal visit after the user publishes, and check **Engagement → Events** or the **Data is flowing** card in Setup.

## Path C: GTM web plus server-side GTM with the Hardal S2S template

Use this when GA4 events already go to a server container (the GA4 Google tag has `server_container_url` set). The **Hardal S2S** server tag reads incoming GA4 events and posts the selected ones to Hardal.

The first-party `analytics.<domain>` CNAME is not required on this path.

### Get the template from support

The S2S template is not in this repository and is not listed in the Community Template Gallery. Ask the user to email [support@usehardal.com](mailto:support@usehardal.com) and request the Hardal S2S server template. When they have the `.tpl` file, they import it into the server container: **Templates → Tag Templates → New → ⋮ → Import**, choose the file, and save.

### Configure the tag

| Field | Recommended value | Why |
| --- | --- | --- |
| **Tenant ID** | from Setup | Required. |
| **Source ID** | from Setup | Required. |
| **Events to send** | One row per GA4 `event_name` you want in Hardal, for example `page_view`, `sign_up`, `login`, `generate_lead`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase` | An empty table sends nothing. Use **Extra Event Data keys** for custom parameters. |
| **Consent source** | `gcs` | Reads GA4's consent state (`G111` or `G101` is granted; `G100` or `G110` is denied). |
| **When consent signal is missing** | `denied` | The event is still measured anonymously instead of being dropped (`skip`) or arriving without a state. |
| **Session ID source** | `ga4` | Derives a stable session UUID from the GA4 client and session IDs. Use `event_data` only with a per-session UUID from the web container, never a fixed value. |
| **Trigger** | All GA4 events (for example **Client Name equals GA4**) | The events table filters internally. |

What the tag sends: a POST to `https://analytics.usehardal.com/collect` with `Content-Type: application/json`, body `{ tenantId, events: [...], consentStatus, anonymousSessionId }` and the session ID also in the `x-hrd-session-id` header. HTTP `202` is success; anything else fails the tag. Commerce parameters (`items`, `transaction_id`, `value`, `currency`, `tax`, `shipping`, `coupon`, and the lead fields) are copied into `payload.data` automatically. `view_item` needs a non-empty `items` array, and every item needs a `price`.

### Rules for this path

- Do not run Path A or Path B for the same events. One sender per event.
- Do not change the GA4 tags or the CMP to make Hardal work. If GA4 events are missing parameters, propose `dataLayer` changes in code and let the user approve them.
- Test in the server container's Preview: each selected event shows the Hardal S2S tag as **Succeeded** and the outgoing request returns `202`. Test once with consent accepted and once refused (refused and missing consent must still send anonymously).
- Do not publish either container. Hand the user a list of the changes and let them publish.

### Code changes you may need for Path C

Usually only `dataLayer` pushes for GA4 ecommerce events:

```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({
  event: "add_to_cart",
  ecommerce: { currency: "USD", value: 89.99, items: [{ item_id: "RUN-AIR-42", item_name: "AirStride Running Shoes", item_brand: "TrailForce", item_category: "Footwear", price: 89.99, quantity: 1 }] }
});
```

The GA4 event tags in the web container must forward these parameters to the server container.
