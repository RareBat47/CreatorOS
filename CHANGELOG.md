# CHANGELOG

All notable changes to the CreatorOS repository will be documented in this file.

## [0.2.0] - 2026-10-05

### Added
- **Remotion Video Rendering Engine (`apps/renderer`)**:
  - Implemented 1080x1920 @ 30fps vertical video engine with 3 compositions: `TalkingHeadComposition`, `ThreeTipsComposition`, and `StoryArcComposition`.
  - Built reusable Remotion UI components: `KineticCaptions` (karaoke & active highlight), `ProgressBar`, `BrandHeader`, `CTACard`, `DynamicZoom`, and `SafeArea`.
  - Created CLI renderer (`src/render-cli.ts`) for headless MP4 rendering from `SceneSpec` JSON input.
  - Added sample scene fixture in `fixtures/sample-scene.json` and Studio dev scripts.
- **Orchestration API Server (`apps/api`)**:
  - Developed Hono HTTP server running on Node with end-to-end Zod contract validation.
  - Implemented routes: `POST /api/v1/creators`, `GET /api/v1/creators/:id`, `POST /api/v1/ideas/expand`, `POST /api/v1/scripts/generate`, `POST /api/v1/scenes/plan`, `POST /api/v1/renders/jobs`, `POST /api/v1/repurpose`, and `GET /health`.
  - Integrated `@creatoros/model-router`, `@creatoros/scene-schema`, and `@creatoros/creator-memory`.
  - Added 11 passing Vitest integration tests.
- **Web Application & Studio UI (`apps/web`)**:
  - Built Next.js 15 App Router web client with Tailwind CSS, Lucide icons, and cyberpunk neon theme.
  - Added Shell layout with navigation sidebar, status telemetry, and responsive views.
  - Implemented **Creator Onboarding & Brand Profile** (`/onboarding`, `/profile`).
  - Implemented **Idea-to-Script Studio** (`/studio`, `/create`) with angle brainstorming, hook scoring, and A/B/C script comparisons.
  - Implemented **Video Timeline & Scene Preview** (`/editor`, `/preview`) with 9:16 mobile canvas simulation, playback scrubbing, and layer inspector.
  - Implemented **Multi-platform Repurposing Package** (`/repurpose`) for TikTok, YouTube Shorts, Instagram Reels, X/Twitter, LinkedIn, and Newsletters.

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
