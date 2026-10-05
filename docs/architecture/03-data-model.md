# 03 - Data Model: CreatorOS

## 1. Relational Entities (Drizzle ORM + PostgreSQL)

### 1.1 `users` & `accounts` (Better-Auth)
- `id` (UUID, PK)
- `email` (VARCHAR, Unique)
- `name` (VARCHAR)
- `createdAt`, `updatedAt` (TIMESTAMPTZ)

### 1.2 `creator_profiles`
- `id` (UUID, PK)
- `userId` (UUID, FK -> users.id)
- `name` (VARCHAR)
- `niche` (VARCHAR)
- `audienceICP` (JSONB)
- `toneKeywords` (TEXT[])
- `bannedWords` (TEXT[])
- `visualStyle` (JSONB: primaryColor, accentColor, fonts, logoUrl)
- `createdAt`, `updatedAt` (TIMESTAMPTZ)

### 1.3 `episodic_memories`
- `id` (UUID, PK)
- `creatorId` (UUID, FK -> creator_profiles.id)
- `topic` (VARCHAR)
- `hook` (TEXT)
- `hookCategory` (VARCHAR)
- `fullScript` (TEXT)
- `embedding` (VECTOR(1536) / VECTOR(768))
- `createdAt` (TIMESTAMPTZ)

### 1.4 `performance_memories`
- `id` (UUID, PK)
- `episodicMemoryId` (UUID, FK -> episodic_memories.id)
- `platform` (VARCHAR: tiktok, shorts, reels)
- `views` (INT)
- `retentionScore` (NUMERIC)
- `completionRate` (NUMERIC)
- `recordedAt` (TIMESTAMPTZ)

### 1.5 `scene_specifications`
- `id` (UUID, PK)
- `creatorId` (UUID, FK -> creator_profiles.id)
- `layout` (VARCHAR: talking-head, three-tips, story-arc)
- `durationFrames` (INT)
- `fps` (INT)
- `specJson` (JSONB, strictly parsed via SceneSpecSchema)
- `status` (VARCHAR: draft, ready, rendering, completed, failed)
- `createdAt` (TIMESTAMPTZ)
