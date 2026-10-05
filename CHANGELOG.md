# CHANGELOG

All notable changes to the CreatorOS repository will be documented in this file.

## [0.1.0] - 2026-10-05

### Added
- **Monorepo Foundation**: Initialized Turborepo, pnpm workspaces, TypeScript base configuration, and VS Code tasks.
- **Scene Schema (`@creatoros/scene-schema`)**:
  - Implemented comprehensive Zod schemas for Scene Specifications, Creator Profiles, Content Repurposing Packages, and Quality Scoring.
  - Added unit test suite covering schema validations.
- **Creator Memory (`@creatoros/creator-memory`)**:
  - Implemented Stable, Episodic, and Performance memory data structures and schemas.
  - Built `InMemoryCreatorMemoryStore` with vector retrieval adapter interfaces.
  - Added unit tests for memory lifecycle and retrieval operations.
- **Model Router (`@creatoros/model-router`)**:
  - Built unified AI gateway client supporting Antigravity (local dev) and DashScope (production).
  - Implemented `ModelCouncil` multi-pass pipeline (Brainstorm -> Script -> Critique -> Validation).
  - Added unit tests with mocked LLM responses.
- **Specification Ledger**:
  - Authored comprehensive documentation across product, architecture, AI orchestration, Remotion engine, frontend design, engineering standards, architecture decision records (ADRs), sprints, and marketing strategy.
