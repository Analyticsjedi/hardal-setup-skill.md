# Changelog

## 0.2.0 (2026-11-26)

- Prompt carries Tenant ID, Source ID and tracking URL explicitly. There is no project token.
- Skill is published from https://github.com/Analyticsjedi/hardal-setup-skill.md. The agent URL is https://raw.githubusercontent.com/Analyticsjedi/hardal-setup-skill.md/main/skill.md; relative references resolve from that base.
- First and required step is the `analytics.<domain>` CNAME to `analytics.usehardal.com`, DNS only (grey cloud on Cloudflare). sGTM installs skip the CNAME. If the `analytics` subdomain is taken, the user chooses a custom subdomain in Hardal tenant settings.
- Manual page views use `hrd.pageview()`.
- Verification points at the panel's Data is flowing view and the existing first-event check (no invented endpoint name). Preview hosts are assumed to record; if the first event is missing, test on the production domain.
- S2S / sGTM template is provided through support@usehardal.com, not as a `.tpl` in this repo. No separate GTM web template; GTM web uses the Setup snippet as Custom HTML.
- WordPress: add the tracker script to the site. No official plugin.
- Support channel is support@usehardal.com.
- The agent scans the repo, proposes purchase and custom events for commerce flows and important actions, and waits for approval.
- Consent guidance shows only `hrd.consent()`. Vendor-specific CookieYes, OneTrust and Cookiebot snippets are removed; link to vendor documentation instead. Missing or denied consent still sends anonymous events.
- License is MIT, copyright 2026 Hardal.

## 0.1.0-draft (2026-11-26)

- First local draft of the Hardal setup skill for AI coding tools.
- `skill.md` with pre-flight scan, framework detection, install path choice (tracker, GTM web, server-side GTM with Hardal S2S), consent, core events, verification, and an optional first-party domain and AI Visibility step.
- Reference pages for frameworks, GTM and sGTM, consent, events, AI Visibility and troubleshooting.
- Examples for HTML, Next.js (App and Pages Router), Vite, a readiness helper, React events, GTM Custom HTML, a terminal test event and Netlify AI Visibility forwarding.
