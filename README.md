# Hardal setup skill for AI coding tools

Hardal is the first-party data and agentic analytics platform. This repository contains a skill file that teaches an AI coding agent how to install Hardal in your project: it starts with the required `analytics.<domain>` CNAME, detects your framework, adds the tracker in the right place, wires consent, proposes and adds the core events, and checks that data reaches Hardal.

Repository: [github.com/Analyticsjedi/hardal-setup-skill.md](https://github.com/Analyticsjedi/hardal-setup-skill.md)

The skill file the agent should read:

https://raw.githubusercontent.com/Analyticsjedi/hardal-setup-skill.md/main/skill.md

Reference pages and examples resolve from the same base, for example `references/events.md` at https://raw.githubusercontent.com/Analyticsjedi/hardal-setup-skill.md/main/references/events.md.

It works with Claude Code, ChatGPT Codex, Cursor, Replit, Lovable, v0 and Bolt, and with any other agent that can read a URL.

## Quick start

1. Sign in to [app.hardal.ai](https://app.hardal.ai) and open **Manage → Setup** for your source.
2. Add the first-party CNAME if you do not already use server-side GTM: name `analytics`, target `analytics.usehardal.com`, DNS only (grey cloud on Cloudflare). Wait until **Tracking domain** shows **Connected**. If the `analytics` subdomain is already taken, choose a custom subdomain in the Hardal tenant settings.
3. Choose your AI coding tool. The panel shows a ready-made prompt with your Tenant ID, Source ID and tracking URL filled in.
4. Paste the prompt into your tool and follow its questions.
5. Return to the panel. It switches to **Data is flowing** when the first event arrives.

The prompt looks like this (fake example values):

```text
Set up Hardal tracking in this project. My Tenant ID is 11111111-1111-4111-8111-111111111111, Source ID is 22222222-2222-4222-8222-222222222222, and tracking URL is https://analytics.example.com. Use the Hardal setup skill: https://raw.githubusercontent.com/Analyticsjedi/hardal-setup-skill.md/main/skill.md
```

## The prompt for each tool

All tools use the same core prompt. Only where you paste it differs.

| Tool | Where to paste | Notes |
| --- | --- | --- |
| **Claude Code** | In your terminal, in the project folder: run `claude`, then paste the prompt. | Claude Code edits files and runs your dev server when you allow it. |
| **ChatGPT Codex** | Codex CLI in the project folder (`codex`), or a Codex cloud task on your repository. | In a cloud task, ask Codex to open a pull request instead of pushing to your main branch. |
| **Cursor** | Open the project, open the Agent chat, paste the prompt. | Agent mode is required, so it can edit files. |
| **Replit** | Paste into Replit Agent in your Repl. | The agent detects whether the app is Next.js, Vite or something else. |
| **Lovable** | Paste into the Lovable chat of your project. | Lovable projects are Vite + React; the tracker goes into `index.html`. Preview hosts are expected to record events; if the first event does not appear, publish and test on your real domain. |
| **v0** | Paste into the v0 chat of your project. | v0 projects are Next.js App Router; the tracker goes into `app/layout.tsx`. |
| **Bolt** | Paste into the Bolt chat. | Bolt projects are usually Vite + React. |
| **Other agents** | Anywhere the agent can read a URL and edit your code. | If it cannot fetch URLs, paste the contents of `skill.md` after the prompt. |

## How the agent uses the skill

The skill is a guided conversation, not a template. The agent:

1. **Confirms the first-party domain** (required, unless you use server-side GTM): `analytics.<your-domain>` CNAME to `analytics.usehardal.com`, DNS only.
2. **Scans your project** silently: framework, existing analytics or Google Tag Manager, consent banner, auth, forms, cart and checkout code.
3. **Tells you what it found** and asks only what the code could not answer.
4. **Picks one install path**: the tracker in code (default), your existing Google Tag Manager web container (the Setup snippet as a Custom HTML tag), or server-side GTM with the Hardal S2S template from support.
5. **Wires consent**: anonymous measurement by default, `granted` and `denied` from your banner via `hrd.consent()`. Events still go out when consent is missing or denied. The agent does not ship vendor-specific CMP snippets; it follows your banner's documentation.
6. **Proposes events** from the repo (including `purchase` and custom events when cart, checkout, forms or sign-up exist), waits for your approval, then adds them. `page_view` is automatic, including single-page app routes. Manual page views use `hrd.pageview()`.
7. **Verifies** the `202` response from Hardal and asks you to confirm in the panel. Preview hosts are expected to work; if the first event does not appear, it suggests testing on the production domain.
8. **Optionally** walks you through AI Visibility forwarding.
9. **Summarizes** the changes and adds a Hardal section to `AGENTS.md`.

Files:

```text
skill.md                     the skill the agent reads
references/frameworks.md     placement per framework and AI builder
references/gtm-sgtm.md       Google Tag Manager web and server-side paths
references/consent.md        consent behaviour and hrd.consent()
references/events.md         event names and parameters
references/ai-visibility.md  analytics.<domain> DNS and AI Visibility
references/troubleshooting.md
examples/                    small, copyable snippets
AGENTS.md.template           what the agent adds to your project's AGENTS.md
LICENSE                      MIT
```

## Privacy and consent

- Until a visitor makes a choice, Hardal measures anonymously and does not write an identity cookie. The visit is not skipped.
- When the visitor accepts, Hardal can recognize them for the same tenant and source. When they refuse, or when no consent signal is present, Hardal keeps anonymous measurement and clears identity (missing consent is treated as `denied`).
- Server-side senders treat a missing choice as `denied`.
- The agent asks before changing your consent banner, and never sends identity without consent.
- The Tenant ID, Source ID and tracking URL are public identifiers. The agent never commits API keys or other secrets.

This skill is implementation guidance, not legal advice. Your own policy decides what you may collect.

## What the agent will not do

It will not deploy, push, publish a GTM container, change DNS, or change your consent banner's configuration without asking you. DNS records and GTM publishing are steps you do yourself; the agent gives you the exact values.

## Support

Questions or the server-side GTM (S2S) template: [support@usehardal.com](mailto:support@usehardal.com).

## Documentation

- Hardal docs: https://docs.usehardal.com
- Web setup: https://docs.usehardal.com/setup/web
- Consent: https://docs.usehardal.com/setup/events/consent
- Standard events: https://docs.usehardal.com/setup/events/standard-events

## License

MIT. Copyright (c) 2026 Hardal.
