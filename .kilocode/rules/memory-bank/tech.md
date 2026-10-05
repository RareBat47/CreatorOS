# Technology Stack: CreatorOS

## 1. Languages & Core Runtimes
- **TypeScript 5.8+**: Strict type safety enabled across all packages.
- **Node.js 20+ / 26+**: Execution runtime for services and build tooling.
- **pnpm 12+**: Fast workspace package management and symlinked dependency isolation.

## 2. Build & Test Tooling
- **Turborepo 2.x**: High-performance task scheduling and caching.
- **Vitest 3.x**: Unit and integration testing framework.
- **ESBuild / tsc**: Fast transpilation and declaration emitting.

## 3. Production Infrastructure (Target)
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide Icons.
- **Video Rendering**: Remotion 4.x with headless Chromium.
- **Database & Vectors**: PostgreSQL 16+ with `pgvector` extension and Drizzle ORM.
- **Job Queue**: BullMQ backed by Redis for video rendering jobs.
- **Authentication**: Better-Auth for session and organization multi-tenancy.
- **Object Storage**: S3-compatible storage (MinIO for local dev, Cloudflare R2 / AWS S3 for production).
