# Memory Bank Instructions

## Purpose
The Memory Bank represents the living operational memory for autonomous AI agents and developers collaborating on CreatorOS.

## Maintenance Rules
1. **Read First**: Before taking on new tasks, review `brief.md`, `context.md`, and `tasks.md`.
2. **Update After State Transitions**: Whenever packages, schemas, or architectural boundaries change, update the relevant files in `.kilocode/rules/memory-bank/`.
3. **No Unvalidated Code**: Maintain strict Zod schemas and verify all code changes by running `pnpm test` and `pnpm build`.
4. **Preserve Clean Boundaries**: Keep `apps/renderer` decoupled from frontend web components.
