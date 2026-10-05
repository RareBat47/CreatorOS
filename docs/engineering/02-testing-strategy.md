# 02 - Testing Strategy: CreatorOS

## 1. Testing Tiers
- **Unit Tests (Vitest)**: Every package in `packages/` must have >90% coverage on schema parsing, data transformations, and router fallback logic.
- **Integration Tests**: Mocked LLM Council pipelines verifying JSON extraction and error recovery.
- **Visual Smoke Tests**: Headless Remotion render checks verifying video output generation.
