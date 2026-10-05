# 08 - Local Development Environment: CreatorOS

## 1. Prerequisites
- **Node.js**: v20+ (recommended v26 LTS).
- **pnpm**: v12+.
- **Docker**: For running PostgreSQL + pgvector, Redis, and MinIO locally.
- **Antigravity Gateway**: Running locally on `http://127.0.0.1:8999` with Gemini 3.8 Flash High active.

## 2. Getting Started
```bash
# 1. Clone repository and install dependencies
cd D:\REMOTION_OS
pnpm install

# 2. Run TypeScript checks and tests
pnpm run build
pnpm run test

# 3. Launch Docker infrastructure (optional for package dev, required for full app)
docker compose up -d

# 4. Start local Turborepo dev servers
pnpm run dev
```

## 3. Environment Variables (`.env.example`)
```env
# AI Gateway
ANTIGRAVITY_BASE_URL=http://127.0.0.1:8999/v1
ANTIGRAVITY_API_KEY=local-dev-key
DASHSCOPE_API_KEY=

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/creatoros

# Cache & Queue
REDIS_URL=redis://localhost:6379

# Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=creatoros-assets
```
