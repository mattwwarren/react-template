# React Template - Claude Code Configuration

This directory contains Claude Code configuration for the react-template project.

## Directory Structure

```
.claude/
├── settings.json           # Claude Code settings (hooks, permissions)
├── hooks/
│   └── auto-format.sh      # PostToolUse hook for Biome auto-formatting
├── agents/                 # Specialized review agents
│   ├── component-reviewer.md
│   ├── test-writer.md
│   ├── performance-reviewer.md
│   ├── api-integration-reviewer.md
│   ├── accessibility-reviewer.md
│   └── tailwind-reviewer.md
├── commands/               # Custom slash commands
│   ├── react-implement.md
│   ├── react-component.md
│   ├── react-e2e.md
│   └── react-msw.md
├── shared/                 # Shared documentation for agents
│   ├── testing-philosophy.md
│   ├── edge-cases.md
│   └── output-formats.md
└── README.md               # This file
```

## Quick Reference

### Hooks

**PostToolUse Auto-Format** runs after every Edit/Write:
- Applies Biome lint + format to .ts/.tsx/.js/.jsx/.json files
- ~100x faster than ESLint + Prettier
- Non-blocking (continues even with unfixable violations)

### Agents (6 total)

| Agent | Focus |
|-------|-------|
| `component-reviewer` | React component quality, hooks patterns, accessibility |
| `test-writer` | React Testing Library + Playwright test generation |
| `performance-reviewer` | React rendering, bundle size, code splitting |
| `api-integration-reviewer` | TanStack Query + MSW patterns |
| `accessibility-reviewer` | WCAG 2.1 AA compliance |
| `tailwind-reviewer` | Tailwind CSS + shadcn/ui patterns |

### Commands (4 total)

| Command | Purpose |
|---------|---------|
| `/react-implement` | Full feature implementation workflow |
| `/react-component` | Generate component + test + Storybook story |
| `/react-e2e` | Generate Playwright E2E tests |
| `/react-msw` | Generate MSW handlers from OpenAPI types |

### MCP Servers

To enable MCP servers, copy the example config:

```bash
cp .claude/settings.local.json.example .claude/settings.local.json
```

Available servers:
- **Playwright** - AI-powered E2E testing and browser automation
- **Figma** - Design-to-code bridge (requires `FIGMA_TOKEN` env var)
- **Memory** - Persistent project knowledge across sessions

## Related Documentation

- **[CLAUDE.md](../CLAUDE.md)** - Project patterns and conventions
- **[TESTING_GUIDE.md](../TESTING_GUIDE.md)** - Testing philosophy
- **[CONFIGURATION-GUIDE.md](../CONFIGURATION-GUIDE.md)** - Environment configuration
