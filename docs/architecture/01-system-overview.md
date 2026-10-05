# 01 - System Overview: CreatorOS

## 1. High-Level Architecture Diagram
```
                     ┌────────────────────────────────────────────────┐
                     │                 User Browser                   │
                     │  (Next.js 15 Web App / Remotion Player UI)     │
                     └───────────────────────┬────────────────────────┘
                                             │ HTTP / WebSocket
                                             ▼
                     ┌────────────────────────────────────────────────┐
                     │                 API Gateway                    │
                     │          (Next.js App Router / Better-Auth)    │
                     └───────────────┬────────────────┬───────────────┘
                                     │                │
            ┌────────────────────────┘                └───────────────────────┐
            ▼                                                                 ▼
┌─────────────────────────────┐                                   ┌───────────────────────────┐
│     Model Council Engine    │                                   │     PostgreSQL Database   │
│  (@creatoros/model-router)  │                                   │       (Drizzle ORM)       │
│  - Antigravity Gateway(dev) │                                   │  - Creators & Profiles    │
│  - DashScope Gateway (prod) │                                   │  - Scene Specifications   │
└──────────────┬──────────────┘                                   │  - pgvector Memory Index  │
               │                                                  └─────────────┬─────────────┘
               ▼                                                                │
┌─────────────────────────────┐                                                 │
│     Creator Memory Store    │◄────────────────────────────────────────────────┘
│  (@creatoros/creator-memory)│
│  - Stable / Episodic Memory │
└──────────────┬──────────────┘
               │ Emits Validated SceneSpec
               ▼
┌─────────────────────────────┐
│       BullMQ Job Queue      │
│     (Redis 7 Orchestration) │
└──────────────┬──────────────┘
               │ Dispatches Render Task
               ▼
┌─────────────────────────────┐
│       Remotion Worker       │
│      (apps/renderer)        │
│  - Headless Chromium Render │
│  - FFMPEG Audio Muxing      │
└──────────────┬──────────────┘
               │ Uploads MP4
               ▼
┌─────────────────────────────┐
│      S3 / MinIO Storage     │
│   (Presigned URL Delivery)  │
└─────────────────────────────┘
```

## 2. Core Subsystems
1. **Studio Web App (`apps/web`)**: Provides authentication, Creator Brain management, script review, timeline previews, and omni-channel asset copying.
2. **AI & Council Engine (`packages/model-router`)**: Multi-stage model orchestration utilizing specialized LLMs for brainstorming, drafting, critiquing, and validating.
3. **Creator Memory Engine (`packages/creator-memory`)**: Tripartite memory engine integrating PostgreSQL and `pgvector` to store brand parameters, script history, and performance data.
4. **Scene Specification Contracts (`packages/scene-schema`)**: Canonical Zod schemas governing all inter-service communication and rendering specifications.
5. **Video Rendering Cluster (`apps/renderer`)**: Headless Remotion composition service consuming `SceneSpec` payloads to produce deterministic 1080x1920 MP4 outputs.
