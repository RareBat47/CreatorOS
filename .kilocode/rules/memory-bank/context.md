# System Context: CreatorOS

## 1. Operating Environment
- Monorepo root located at `D:\REMOTION_OS`.
- Windows 11 platform with git-bash terminal environment.
- Runtimes: Node.js v26.7.0, pnpm v12.8.1, Python 3.14.7.
- LLM Gateway: Antigravity Gateway running on `http://127.0.0.1:8999/v1` (primary model `antigravity/gemini-3.8-flash-high`, fallback `antigravity/gemini-3.1-pro-low`).

## 2. Architecture Patterns
- **Monorepo**: Turborepo orchestrating workspace builds, tests, and linting.
- **Schema Single Source of Truth**: `@creatoros/scene-schema` exports canonical Zod schemas and inferred TypeScript types.
- **Memory Store**: `@creatoros/creator-memory` implements Stable, Episodic, and Performance memory with vector similarity interfaces.
- **AI Gateway & Council**: `@creatoros/model-router` abstracts model endpoints and runs the multi-pass council pipeline.

## 3. Current Focus
Milestone 1 is actively complete: core packages built, 100% tests passing, complete documentation ledger authored. Preparing for Milestone 2 (Remotion rendering engine and Next.js Studio).
