# Core events

Source: [Standard Events](https://docs.usehardal.com/setup/events/standard-events) and [Custom Events](https://docs.usehardal.com/setup/events/custom-events). Values below are fake examples.

In the browser, send events with `hrd.track(name, params)`. From a backend, POST the same name and put the parameters in `payload.data` (see "Server-side" at the end).

Before you write event code, propose a list from the repository (commerce flows and important actions) and wait for the user's approval. See Step 5 in `skill.md`.

## Automatic events (do not add code)

With `data-auto-track="true"` (the default) the tracker sends:

| Event | When |
| --- | --- |
| `page_view` | On first load, and after SPA route changes when `data-spa="true"` (the default). A second page view for the same URL is skipped. |
| `scroll` | Once, on the first scroll of each page view. |
| `scroll_depth` | Once per milestone: 25, 50, 75, 90 and 100 percent (`percent`). |
| `outbound_click` | Each click on an external HTTP(S) link, with `linkUrl` and `linkDomain`. |

### Manual page views

Only if the project needs full control (for example virtual pages in a wizard), turn automatic page views off and send them yourself with `hrd.pageview()`. Do not use `hrd.track("page_view")`. `hrd.pageview()` has duplicate protection for the same URL.

```html
<script async src="https://analytics.example.com/tracker.js"
  data-tenant-id="..." data-source-id="..."
  data-auto-track="false" data-spa="false"></script>
```

```js
whenHardalReady((hrd) => hrd.pageview());                       // current URL
whenHardalReady((hrd) => hrd.pageview("https://example.com/pricing", { route_name: "pricing" }));
```

`data-auto-track="false"` also turns off scroll and outbound click tracking.

## Account events

```js
// After the account was created successfully
hrd.track("sign_up", { method: "Email" });   // "Google", "Email", ...

// After a successful login
hrd.track("login", { method: "Google" });
```

Identify the user only when consent is granted, right after sign up, login, or consent given while signed in:

```js
if (hrd.consentStatus().data.consent === "granted") {
  hrd.identify("USR_8827");             // your stable user ID, not an email
}
```

Send identity traits (`email`, `firstName`, `lastName`, `phone`, `city`, `country`, and others) only when the user confirmed they are allowed to collect them. Use a stable, non-personal ID as the first argument.

## Lead events

```js
// After the lead form was accepted by your backend
hrd.track("generate_lead", {
  lead_id: "LEAD-12345",   // required
  value: 500,              // optional, number
  currency: "USD",         // required if value is set
  lead_source: "Pricing page form"
});
```

Other lead-type events with standard names: `share` (`method`, `content_type`, `item_id`), `subscribe` (`list_name`, `list_id`) and `trial_start` (`plan`, `trial_days`, `value`, `currency`).

## Commerce events

### Item object

Use the same item details in every commerce event.

| Field | Type | Required |
| --- | --- | --- |
| `item_id` | string | yes |
| `item_name` | string | yes |
| `item_brand` | string | yes |
| `item_category` | string | yes |
| `price` | number (unit price after discount) | yes |
| `quantity` | integer | yes (defaults to 1) |
| `item_variant`, `item_sku`, `item_category2`, `item_category3`, `coupon`, `discount`, `index`, `item_list_id`, `item_list_name`, `item_url` | | optional |

### `view_item`

```js
hrd.track("view_item", {
  currency: "USD",
  value: 89.99,               // sum of price x quantity, no tax or shipping
  items: [{ item_id: "RUN-AIR-42", item_name: "AirStride Running Shoes",
            item_brand: "TrailForce", item_category: "Footwear", price: 89.99, quantity: 1 }]
});
```

### `add_to_cart`

```js
hrd.track("add_to_cart", { currency: "USD", value: 89.99, items: [/* same item object */] });
```

### `begin_checkout`

```js
hrd.track("begin_checkout", { currency: "USD", value: 179.98, coupon: "SUMMER20", items: [/* ... */] });
```

### `purchase`

```js
hrd.track("purchase", {
  transaction_id: "ORD-20260615-7891",  // required, stable per order
  value: 214.98,                        // required, excludes tax and shipping
  currency: "USD",                      // required
  tax: 17.20,
  shipping: 5.99,
  coupon: "SUMMER20",
  items: [/* item objects */]           // required
});
```

Send `purchase` once per order. A shared `transaction_id` alone does not deduplicate repeated submissions to Hardal, so guard the confirmation page against reloads (for example, remember sent order IDs in `sessionStorage`), or send the purchase from the server.

Other commerce events with standard names: `view_item_list`, `select_item`, `view_promotion`, `select_promotion`, `search` (`search_term`), `remove_from_cart`, `add_to_wishlist`, `view_cart`, `add_shipping_info`, `add_payment_info` and `refund`.

## Custom events

Use a custom event only when no standard name fits. Use `snake_case`, name the action (`quote_requested`, not `quote_page`), keep names and parameter types stable, and use only strings, numbers and booleans.

```js
hrd.track("quote_requested", { plan: "enterprise", seats: 250, region: "EMEA" });
```

## Server-side (collection API)

Use this for confirmed backend outcomes such as a paid order. Send JSON with a real `User-Agent` (requests without one, or with a bot-like one, can be skipped).

```bash
curl --fail-with-body -X POST "https://analytics.example.com/collect" \
  -H "Content-Type: application/json" \
  -H "User-Agent: $ORIGINAL_USER_AGENT" \
  -H "x-hrd-consent: denied" \
  --data-binary @- <<JSON
{
  "tenantId": "11111111-1111-4111-8111-111111111111",
  "type": "event",
  "eventName": "purchase",
  "payload": {
    "sourceId": "22222222-2222-4222-8222-222222222222",
    "url": "https://www.example.com/order/confirmation",
    "timestamp": 1794402000000,
    "data": { "transaction_id": "ORDER-12345", "value": 99.9, "currency": "USD",
              "items": [{ "item_id": "SKU-1", "item_name": "Example product", "price": 49.95, "quantity": 2 }] }
  }
}
JSON
```

- `payload.timestamp` is the occurrence time in Unix milliseconds. Keep the original time when retrying.
- Send the browser's session UUID as `x-hrd-session-id` only when the backend legitimately has it. Never use one fixed UUID for all requests.
- Send `x-hrd-consent: granted` and `X-Forwarded-For` only when the visitor granted consent. Send `denied` when it was declined or is unknown; the event is still accepted and measured anonymously.
- Expect HTTP `202` with `data.accepted: 1`. `data.skipped: true` comes with a `reason`.
