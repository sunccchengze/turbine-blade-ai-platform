# Envelope Team

Design and generate `.envelope.json` AI agent team definitions — the open standard for multi-agent AI teams.

## Install

```bash
claude mcp add https://openenvelope.org/claude-code
```

Or install the skill directly in Claude Code:

```
/install-github openenvelope/claude-plugin
```

## What it does

Describe a workflow in plain language. The skill designs the agent hierarchy, writes a schema-valid `.envelope.json` file, and explains any concepts along the way.

## Example

```
Build me an Envelope team for customer support triage — one supervisor,
two agents that read Zendesk tickets, and a Slack notifier for escalations.
```

## Links

- [openenvelope.org](https://openenvelope.org) — deploy and run teams
- [Schema reference](https://openenvelope.org/docs/schema)
- [MCP server](https://openenvelope.org/mcp) — run teams from Claude.ai or ChatGPT
- [GitHub](https://github.com/openenvelope/claude-plugin)
