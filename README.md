# Brain — Cognitive Operating System

A modular agent operating system with markdown-based memory, flow-state orchestration, and a control-plane dashboard. Local-first, inspectable, and built for multiple projects from day one.

## Architecture

```
brain/               Modular markdown knowledge base (source of truth)
  core/              Identity, principles, goals, constraints, active focus
  projects/          Per-project memory (decisions, learnings, tasks, notes)
  archive/           Archived/compressed modules (never deleted)
  generated/         System-generated summaries and overviews

data/                Runtime state (JSON)
  agents/            Agent definitions
  runs/              Run history records
  projects/          Project metadata
  flow/              Flow state (priorities, writebacks, mutations)

lib/                 Core application logic
  agents/            Agent CRUD and lifecycle
  brain/             Brain module read/write service
  flow/              Flow state, meta-agents, task runner
  llm/               LLM provider abstraction (Claude default)
  projects/          Project management
  runs/              Run tracking
  utils/             Shared utilities (fs, markdown, paths, priority)

app/                 Next.js pages and API routes
  api/               REST API (agents, brain, flow, projects, runs)
  dashboard/         Overview with quick spawn, stats, focus, recent runs
  agents/            Agent library with create, promote, archive
  brain/             Brain module viewer/editor
  runner/            Task execution interface
  runs/              Run history browser
  flow/              Flow panel (priorities, writebacks, mutations)
  projects/          Project management

components/          React components organized by feature
```

## Core Concepts

### Two Agent Modes

**Anon Mode** — Fast, disposable, zero setup. Describe a task in plain English and spawn an agent instantly. The agent doesn't load brain context or participate in memory. Best for quick experiments and one-off tasks.

**Brain-Bound Mode** — Agent is attached to brain modules, project context, and the flow-managed writeback loop. Reads from relevant brain modules. Can suggest writebacks that flow through meta-agent validation. Best for ongoing work and reusable agents.

### Flow-Managed Writeback

Workers don't directly mutate memory. Instead:

1. A worker run produces output + optional writeback suggestions
2. Suggestions pass through the Memory Manager meta-agent for validation
3. Approved suggestions appear as pending writebacks in the Flow Panel
4. The user reviews and approves/rejects each writeback
5. Only approved writebacks are applied to brain modules

This prevents memory corruption from uncontrolled writes.

### Meta-Agents (Flow System)

Six built-in meta-agents manage the cognitive environment:

| Agent | Role |
|-------|------|
| **Context Loader** | Determines which brain modules to load for a given run |
| **Priority Manager** | Scores and ranks priorities using weighted factors |
| **Task Router** | Routes tasks to the most appropriate agent |
| **Memory Manager** | Validates writeback suggestions and manages memory lifecycle |
| **Conflict Resolver** | Detects contradictions between modules and priorities |
| **Summarizer** | Compresses low-salience information while preserving originals |

### Memory Rules

- Never hard-delete content — archive and downgrade salience instead
- Preserve provenance (source, timestamp, related agents)
- Support module-level metadata: salience, volatility, last_updated
- Generate summaries over time while preserving underlying data
- Writeback is flow-managed, not arbitrary

### Priority Scoring

Priorities are scored using weighted factors:

| Factor | Weight |
|--------|--------|
| Urgency | 0.25 |
| Blockage impact | 0.20 |
| Goal proximity | 0.20 |
| Dependency weight | 0.15 |
| Frequency | 0.10 |
| User emphasis | 0.10 |

### Agent Lifecycle

1. Quick-spawn anon agent from a prompt
2. Run task immediately
3. Review output
4. Choose: discard / save result / save agent / promote to brain-bound
5. If promoted: attach projects, link brain modules, enable flow writeback

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Install

```bash
cd brain
npm install
```

### Configure

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Seed (optional — seed data is included)

```bash
npm run seed
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Dashboard Pages

- **Dashboard** — Quick spawn, stats, active focus, priority stack, recent runs
- **Agents** — Full agent library with create/promote/archive/duplicate
- **Brain** — Browse and edit markdown brain modules with metadata
- **Runner** — Select an agent + project + task and execute
- **Runs** — Browse all run history with detail view
- **Flow** — Active focus, priority stack, blockers, pending writebacks, mutations
- **Projects** — Create and manage projects

## Adding an LLM Provider

The LLM layer uses a provider abstraction. To add a new provider:

1. Create `lib/llm/your-provider.ts` implementing the `LLMProvider` interface:

```typescript
import type { LLMProvider, LLMRequest, LLMResponse } from '@/lib/types'

export class YourProvider implements LLMProvider {
  name = 'your-provider'

  async chat(request: LLMRequest): Promise<LLMResponse> {
    // Call your provider's API
  }

  listModels(): string[] {
    return ['model-a', 'model-b']
  }

  defaultModel(): string {
    return 'model-a'
  }
}
```

2. Register it in `lib/llm/index.ts`:

```typescript
import { YourProvider } from './your-provider'
registerProvider(new YourProvider())
```

## Extension Points

The architecture has clean seams for future expansion:

- **Vector retrieval** — `lib/brain/index.ts` has commented extension points for `indexModules()` and `searchModules()`
- **Richer observability** — Run records include full metadata; extend with tracing
- **Collaborative agents** — Agent configs support tools and linked modules for multi-agent workflows
- **Scheduled heartbeats** — Flow state can be periodically re-evaluated
- **External tool/plugin ecosystem** — Agent `tools` field supports future tool registry
- **Evaluations** — Run history provides the data; add scoring and comparison
- **Database backend** — File I/O is centralized in `lib/utils/fs.ts`; swap for DB adapter

## Stack

- **Runtime**: Node.js + TypeScript
- **Frontend**: Next.js 14 + React 18
- **Styling**: Tailwind CSS
- **Storage**: Markdown files (brain) + JSON files (state)
- **LLM**: Claude (default), provider-agnostic interface
- **No database required**

## License

MIT
