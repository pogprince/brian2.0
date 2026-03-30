---
title: Decisions — Brain MVP
type: project
salience: 0.8
last_updated: 2026-03-30
---

# Decisions

## 2026-03-30: Architecture Choices
- **Markdown as storage**: Human-readable, git-friendly, no DB dependency
- **Flow-managed writeback**: Prevents memory corruption from uncontrolled writes
- **Anon + brain-bound modes**: Balances speed with continuity
- **Meta-agents as services**: Flow agents are internal services exposed in UI
