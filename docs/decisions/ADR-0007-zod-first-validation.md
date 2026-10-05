# ADR-0007: Zod-First Validation Across All Boundaries

## Status: Accepted

## Context
LLM responses can hallucinate malformed JSON, and video renderers crash if frame numbers or layer formats are invalid.

## Decision
Every contract between services, AI pipelines, and video renderers is governed by `@creatoros/scene-schema` using **Zod**.

## Consequences
- Runtime errors caught immediately at the boundary.
- Guaranteed type safety from API endpoint to Remotion composition.
