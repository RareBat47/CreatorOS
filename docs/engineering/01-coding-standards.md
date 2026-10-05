# 01 - Coding Standards: CreatorOS

## 1. Core Engineering Rules
1. **TypeScript Strictness**: `"strict": true` and `"noImplicitAny": true` across all packages.
2. **Zod-First Interfaces**: All incoming API requests, queue jobs, and LLM structured outputs must pass Zod schema validation.
3. **Pure Composition Functions**: Remotion components must remain pure functions of their input props. No asynchronous fetching inside Remotion composition render cycles.
4. **Error Handling**: Throw typed domain errors. Never swallow uncaught exceptions silently.
