---
name: hermes-tweet
description: "Use Hermes Agent for X/Twitter reads, endpoint discovery, and approval-gated Xquik actions."
category: sales-marketing
---

# Hermes Tweet

Use Hermes Tweet when a Claude Code user needs Hermes Agent to inspect or automate X/Twitter through Xquik.

## Install

```bash
hermes plugins install Xquik-dev/hermes-tweet --enable
```

If Hermes discovers the plugin but leaves it disabled, run:

```bash
hermes plugins enable hermes-tweet
```

Hermes prompts for `XQUIK_API_KEY` during interactive install. In non-interactive installs, configure it in the Hermes runtime environment or `~/.hermes/.env`. Do not paste credentials into chat.

## Workflow

1. Use `tweet_explore` to discover the catalog route.
2. Use `tweet_read` for public read-only X/Twitter endpoints.
3. Use `tweet_action` only after the user approves a write, private read, monitor, webhook, extraction job, giveaway draw, or media operation.

## Good Fits

- Social listening
- Launch monitoring
- Support triage
- Creator or brand research
- Giveaway and community audits
- Controlled publishing with explicit approval

## Safety

- Never request, reveal, or place credentials in tool arguments.
- Never use account connection, re-authentication, API key, billing, credit top-up, or support-ticket endpoints.
- Do not guess endpoint paths. Use the catalog returned by `tweet_explore`.
- Summarize any write or private action before calling `tweet_action`.
