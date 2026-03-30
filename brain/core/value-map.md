---
title: Value Map
type: core
salience: 0.7
volatility: medium
last_updated: 2026-03-30
---

# Value Map

## What Matters Most
1. **Speed to execution** — Reducing friction from idea to running agent
2. **Transparency** — System is inspectable at every layer
3. **Continuity** — Memory persists and evolves without loss
4. **Modularity** — Components are replaceable and composable

## Trade-offs Accepted
- Local files over database (simpler, inspectable, but no concurrent access)
- Markdown over structured DB (human-readable, but harder to query at scale)
- MVP scope over completeness (ship core, extend later)
