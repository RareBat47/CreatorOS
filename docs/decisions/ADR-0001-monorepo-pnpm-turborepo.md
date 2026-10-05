# ADR-0001: Monorepo Architecture with pnpm & Turborepo

## Status: Accepted

## Context
CreatorOS comprises multiple packages (schema, memory, AI gateway) and apps (Next.js web app, Remotion video renderers). We need an efficient monorepo architecture with fast caching and strict dependency boundaries.

## Decision
We adopt **pnpm workspaces** combined with **Turborepo**:
- pnpm provides content-addressable storage and prevents phantom dependency leaks.
- Turborepo coordinates task caching across `build`, `test`, `lint`, and `typecheck`.

## Consequences
- High build speed with remote-ready caching.
- Clean package isolation.
