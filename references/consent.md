# Consent

This page is implementation guidance, not legal advice. The site owner's policy and counsel decide what is allowed.

## How Hardal behaves

| State | What Hardal does |
| --- | --- |
| No signal yet (`unknown`) | Measures the visit anonymously. Does not write an identity cookie. Traffic, channels, sessions and session-level attribution still work. The visitor is not skipped. If a valid identity cookie from an earlier granted visit exists for the same tenant and source, it can be used. |
| `granted` | Can process identity fields and writes a secure first-party identity cookie for the same tenant and source. |
| `denied` | Keeps measuring anonymously, removes identity fields (`userId`, `visitorId`) and clears an existing identity cookie. Events still go out. |

The latest signal wins. Without granted consent or a valid matching identity cache, the collection service removes `userId` and `visitorId` before processing. Missing consent is treated as `denied` (anonymous measurement), not as a skip.

## The browser API

```js
hrd.consent("granted");          // visitor accepted analytics
hrd.consent("denied");           // visitor refused or withdrew
hrd.consentStatus().data.consent // "unknown", "granted" or "denied"
```

Facts about the tracker that matter when you wire it:

- `hrd.consent()` sends its own small event (`consent_granted` or `consent_denied`) to `/collect/`. You do not need to send a separate consent event, and you must not send a second `page_view` on consent.
- Any value other than the string `"granted"` is treated as `"denied"`. Map your banner's state explicitly. Never pass an object, a category name or `undefined`.
- `hrd.identify()` is refused when consent is not granted.
- The script attribute `data-consent="granted"` or `data-consent="denied"` sets the starting state when the saved choice is known before the script loads, so the first automatic `page_view` already carries it.

## Ask the user first

Before you write consent code, ask one question and record the answer in `AGENTS.md`:

> "Hardal can measure anonymously before a visitor chooses, without identity cookies. Should the tracker load before the banner decision (anonymous mode, Hardal's default), or only after the visitor accepts analytics?"

- **Anonymous mode:** load the tracker on every page, then call `hrd.consent()` from the banner callback. This is the default. Events flow before a choice is made, and after a refusal, without identity.
- **Wait for acceptance:** load the tracker only after analytics is accepted (inject the script tag from the callback), and pass `data-consent="granted"` on it. Only use this when the user explicitly chooses it.

If there is no consent banner, load the tracker in anonymous mode. Do not skip those visits.

Do not change the banner's categories, vendor list or texts. If the user wants Hardal listed in the banner, tell them which setting to change and let them do it, or ask for explicit approval first.

## Wiring `hrd.consent()`

Run `hrd.consent()` only when the tracker is ready. Use `whenHardalReady()` from `examples/hardal-ready.ts`.

```js
function onAnalyticsChoice(allowed) {
  if (typeof allowed !== "boolean") return;
  whenHardalReady((hrd) => hrd.consent(allowed ? "granted" : "denied"));
}

// Call this from the banner's accept, refuse and change callbacks.
acceptButton.addEventListener("click", () => onAnalyticsChoice(true));
declineButton.addEventListener("click", () => onAnalyticsChoice(false));

// Re-send the saved choice on load, if you already know it.
const saved = getStoredConsent(); // your own helper
if (saved === "granted" || saved === "denied") {
  whenHardalReady((hrd) => hrd.consent(saved));
}
```

If the site already has a consent banner (CMP) or Google Consent Mode, use that product's own documentation to find the "consent changed" callback, then call `hrd.consent("granted")` or `hrd.consent("denied")` from it. Confirm the analytics category or purpose with the user. Do not invent vendor-specific snippets.

Vendor documentation (not maintained by Hardal):

- [CookieYes JavaScript API](https://www.cookieyes.com/documentation/getting-started/cookieyes-javascript-api/)
- [OneTrust developer documentation](https://developer.onetrust.com/)
- [Cookiebot developer documentation](https://www.cookiebot.com/en/developer/)
- [Google Consent Mode](https://developers.google.com/tag-platform/security/guides/consent)
- Other CMPs (Usercentrics, Didomi, Iubenda, Complianz, and similar): use that vendor's "consent changed" documentation.

If you cannot confirm the API, ask the user instead of guessing.

## Server-side senders: missing consent means denied, not skipped

For the collection API and the Hardal S2S server template:

- Send `x-hrd-consent: denied` (or `consentStatus: "denied"`) when the choice is declined **or unknown**. The event is still measured anonymously.
- Send `X-Forwarded-For` (the original client IP) only when consent is granted.
- Never attach `userId`, `visitorId` or another persistent identifier without `granted`.
- In the Hardal S2S template, set **When consent signal is missing** to `denied`, so an event without a consent signal is still measured anonymously instead of being dropped.

## Verify

Test four visits: a first visit with no choice, an accept, a refusal on a fresh profile, and a later change of an existing choice. For each, inspect the `/collect/` requests for the expected consent event and state, and check `hrd.consentStatus()`. Visits with no choice or with `denied` must still produce events. A consent call on its own does not prove that identity was stored or that a destination received anything.
