# CreatorOS: The AI Content Operating System

> **Turn one idea into a week of consistent, platform-ready content.**

CreatorOS is an enterprise-grade, personalized content engine and Remotion-based programmatic video creation suite designed specifically for business creators, coaches, solo operators, and agency teams. Unlike naive script-to-video wrappers, CreatorOS incorporates a durable **Creator Memory System** that remembers your tone, opinions, audience pain points, visual branding, and past performance metrics.

---

## Architecture Overview

```
                               ┌─────────────────────────────┐
                               │       Creator Studio        │
                               │   (Next.js App / Timeline)  │
                               └──────────────┬──────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         ┌────────────────────────┐                      ┌────────────────────────┐
         │     Model Council      │                      │     Creator Memory     │
         │ (Strategy, Brainstorm, │                      │ (Stable, Episodic,     │
         │  Script, Critique)     │                      │  Performance pgvector) │
         └────────────┬───────────┘                      └────────────┬───────────┘
                      │                                               │
                      └───────────────────────┬───────────────────────┘
                                              ▼
                                 ┌────────────────────────┐
                                 │   Scene Specification  │
                                 │      (Zod Schema)      │
                                 └────────────┬───────────┘
                                              ▼
                                 ┌────────────────────────┐
                                 │    Remotion Engine     │
                                 │ (Talking-head, 3-Tips, │
                                 │  Story-Arc Comps)      │
                                 └────────────┬───────────┘
                                              ▼
                                 ┌────────────────────────┐
                                 │   Multi-Platform Cut   │
                                 │ (TikTok, Shorts, Reels,│
                                 │  X Thread, LinkedIn)   │
                                 └────────────────────────┘
```

---

## Monorepo Structure

```
creatoros/
├── apps/
│   ├── web/                    # Next.js 15 Web Application & Timeline Editor
│   └── renderer/               # Isolated Remotion video rendering service
├── packages/
│   ├── scene-schema/           # Zod contracts & TypeScript types for SceneSpec
│   ├── creator-memory/         # Vector memory stores (Stable, Episodic, Performance)
│   └── model-router/           # Dual-environment LLM gateway & Model Council pipeline
├── docs/                       # Complete specification, architecture, & ADR ledger
├── .kilocode/rules/memory-bank/# Kilo Code Memory Bank context rules
└── turbo.json                  # Turborepo task pipeline
```

---

## Quickstart

### Prerequisites
- Node.js >= 20 (v26+ supported)
- pnpm >= 9 (v12 supported)
- Antigravity Gateway running on `http://127.0.0.1:8999` (for local development)

### Install & Build
```bash
# Install workspace dependencies
pnpm install

# Build all packages via Turborepo
pnpm run build

# Run unit and integration tests
pnpm run test
```

### Developing with OpenCode
```bash
# Run automated tasks through OpenCode CLI
./scripts/run-opencode.sh "Implement new Remotion transition component"
```

---

## Quality Guardrails & Evals

Every generated script and video passes through the CreatorOS Model Council:
1. **Brainstormer**: Generates 3-5 distinct curiosity, contrarian, or story hooks.
2. **Scriptwriter**: Drafts retention-optimized beats with precise frame timestamps.
3. **Critic**: Evaluates against banned words, persona alignment, and retention benchmarks.
4. **Scene Validator**: Enforces strict Zod schema validation before Remotion render passes.

---

## License

Proprietary — CreatorOS Architecture & Implementation.
