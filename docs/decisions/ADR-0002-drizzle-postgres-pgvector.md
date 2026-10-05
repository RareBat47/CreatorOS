# ADR-0002: Architectural Decision Record — Persistence Engine and Semantic Vector Memory

- **Status**: Accepted
- **Date**: 2024-03-15
- **Deciders**: Principal Systems Architect, Lead Backend Engineer, Lead AI Engineer, Infrastructure Lead
- **Technical Context**: CreatorOS Storage, RAG Engine, and Creator Episodic Memory Subsystems

---

## 1. Context and Problem Statement

CreatorOS provides an autonomous AI co-pilot and operating system for high-throughput digital creators. The engine coordinates script generation, analytics ingestion, video/audio timeline transcription, audience sentiment modeling, and automated publishing workflows across multi-platform networks.

To power personalization and episodic memory, the system requires a dual-faceted persistence model:
1. **Relational and Transactional Graph**: User profiles, multi-tenant workspace isolation, granular RBAC, billing, platform integrations, video asset states, processing jobs, and asynchronous queue statuses.
2. **High-Dimensional Semantic Memory**: Dense vector embeddings of creator transcripts, reference style guides, historic comment sentiment, audience interaction records, and brand-safety guidelines. This memory layer powers Retrieval-Augmented Generation (RAG) loops during real-time scriptwriting and automated publishing operations.

Historically, architectures split these domains across two independent datastores: a primary transactional relational database (e.g., PostgreSQL managed via Prisma) alongside a dedicated vector database (e.g., Pinecone or Weaviate). 

This split introduces significant architectural friction for CreatorOS:
- **Dual-write failure modes and consistency anomalies**: Writing metadata to an RDBMS and dense vectors to an external index causes race conditions, phantom reads, and "ghost memory" leaks when compensating transactions fail mid-flight.
- **Query fragmentation**: Performing hybrid filtering (e.g., "Find style references created by Workspace $W$ in the last 30 days where similarity $> 0.82$ and tag = 'humorous'") requires two-stage querying—fetching IDs from Pinecone, filtering them in PostgreSQL, or vice versa—introducing round-trip latency and index misalignment.
- **Runtime and deployment overhead**: Prisma's binary query engine introduces cold-start penalties in serverless runtime environments (Cloudflare Workers, AWS Lambda, Vercel Edge Runtime) and limits fine-grained control over raw connection pools and memory allocation.

CreatorOS requires a unified storage strategy that guarantees ACID transactions across relational metadata and semantic embeddings, reduces operational overhead, avoids dual-system synchronization divergence, and provides zero-overhead, type-safe query execution.

---

## 2. Decision Drivers

- **ACID Transaction Guarantees**: Relational asset tracking and semantic embeddings must commit or roll back together atomically.
- **Latency Budget**: RAG context injection within dynamic LLM agent loops must execute in under 25 milliseconds (p95) for hybrid similarity and relational filtering queries.
- **Type-Safe Operational Ergonomics**: Complete TypeScript integration from the schema definition layer to the query client layer without generating heavy intermediate C++ or Rust binaries.
- **Infrastructure Simplicity & Cost**: Single-cluster operations over fragmented distributed systems to prevent operational sprawl and excessive network hop egress billing.
- **Serverless & Edge Portability**: Compatibility with Node.js, Bun, and edge environments with sub-millisecond cold-start runtimes.

---

## 3. Considered Options

1. **Option 1: PostgreSQL + Drizzle ORM + `pgvector`** (Unified Relational & Semantic Persistence)
2. **Option 2: PostgreSQL + Prisma ORM + Dedicated Vector Database (Pinecone)**
3. **Option 3: PostgreSQL + Prisma ORM + Dedicated Vector Database (Weaviate)**
4. **Option 4: PostgreSQL + Prisma ORM + `pgvector`**

---

## 4. Deep-Dive Comparative Evaluation

### 4.1. ORM Comparison: Drizzle ORM vs. Prisma

```
+-----------------------------------+-----------------------------------+
|            Drizzle ORM            |             Prisma                |
+-----------------------------------+-----------------------------------+
| Direct SQL dialect compilation   | Abstract Schema Engine Layer      |
| Zero runtime dependencies         | Heavy binary engine (Rust)        |
| Cold-start: < 5ms                 | Cold-start: 150ms - 400ms         |
| Native PostgreSQL vector types    | Unsupported native vector indexes |
| Fine-grained connection pooling   | Rigid connection pool manager     |
+-----------------------------------+-----------------------------------+
```

- **Query Compilation**: Prisma compiles queries via a dedicated Rust engine binary through an internal IPC channel. Drizzle functions as a thin, TypeScript-native SQL dialect builder that compiles directly to parameterized SQL strings, executing with zero binary abstraction overhead.
- **Cold-Start Performance**: CreatorOS background agents scale dynamically across serverless instances. Prisma's engine binary initialization incurs cold starts between 150ms and 400ms. Drizzle executes instantly ($< 5\text{ms}$), as it is plain JavaScript.
- **Extension & Index Control**: Prisma's schema modeling format (`schema.prisma`) lacks native support for HNSW (Hierarchical Navigable Small World) index parameters (`m`, `ef_construction`) and vector distance operator classes (`vector_cosine_ops`, `vector_l2_ops`). Drizzle supports native PostgreSQL extension schemas, custom operators, and arbitrary index decorators out-of-the-box.

### 4.2. Vector Storage Comparison: `pgvector` vs. Dedicated Engines (Pinecone / Weaviate)

| Evaluation Vector | PostgreSQL + `pgvector` (HNSW) | Pinecone (Serverless) | Weaviate (Cloud/Self-Hosted) |
| :--- | :--- | :--- | :--- |
| **Transaction Boundary** | **ACID (Same WAL log)** | None (Eventual consistency) | None (Dual-write decoupled) |
| **Hybrid Search Model** | Single SQL Query Execution Plan | Pre/Post-filtering over API | Pre/Post-filtering over GraphQL/REST |
| **Dual-Write Penalty** | 0ms (In-memory transaction) | Network hop (50ms - 150ms) | Network hop (40ms - 120ms) |
| **Data Synchronization** | Absolute (Single Source of Truth) | Drifts on process crashes | Drifts on process crashes |
| **Monthly Base Cost** | Included in DB instance | Tiered base + write units | Cluster hosting + memory allocation |
| **Backup / DR** | Unified Point-In-Time (PITR) | Decoupled manual sync | Decoupled snapshot orchestration |

#### The Dual-Write Problem

A distributed architecture combining PostgreSQL with an external vector store requires two-phase commits (2PC) or an asynchronous Saga orchestrator to prevent state divergence:

```
[Client Application]
      │
      ├─── 1. BEGIN TX: Insert Video Metadata ────────► [PostgreSQL] (Success)
      │
      ├─── 2. HTTP POST: Write Dense Embedding ──────► [Pinecone/Weaviate] (FAIL: Timeout/EPIPE)
      │
      └─── 3. FAILURE RECOVERY: Rollback PG TX? ─────► Inconsistency: Ghost vectors or orphaned records
```

In the event of an external network partition during step 2, the primary relational record either commits while the semantic index drops, or the primary transaction aborts while the vector database writes the embedding. Resolving this requires background reconciliation workers that scan and poll both data stores, introducing architectural complexity.

With unified `pgvector`, the insertion of relational entities, permission policies, and semantic embeddings occurs within an atomic transaction:

```
[Client Application]
      │
      └─── BEGIN TRANSACTION ─────────────────────────────────────────┐
             ├── 1. Insert Video Metadata & Transcripts                │
             ├── 2. Insert Memory Chunks with 1536-dim Embeddings     │ Atomic Commit / WAL
             ├── 3. Increment Workspace Usage Record                  │
           COMMIT TRANSACTION ────────────────────────────────────────┘
```

---

## 5. Decision Outcome

We decided on **Option 1: PostgreSQL + Drizzle ORM + `pgvector`**.

CreatorOS will deploy PostgreSQL (version 16 or newer) equipped with the `pgvector` extension (version 0.7.0 or newer for optimized HNSW vector graph traversal). All database interactions, relational modeling, and vector similarity queries will be managed via Drizzle ORM.

### Key Architectural Tenets

1. **Monolithic Data Layer**: Persistent relational graphs, document logs, task state machines, and high-dimensional semantic spaces reside inside the same PostgreSQL instance.
2. **Unified Data Integrity**: Every vector chunk is linked directly to a tenant, workspace, and source asset using relational foreign keys configured with cascading delete semantics (`ON DELETE CASCADE`).
3. **Single-Pass Hybrid Query Plans**: Relational filtering (e.g., matching workspace IDs, date ranges, and visibility scopes) combines with vector similarity operations (`<=>` cosine distance) into a unified SQL execution plan, evaluated by PostgreSQL's cost-based query optimizer.
4. **HNSW Vector Indexing**: All embedding columns are indexed using Hierarchical Navigable Small World graphs rather than Inverted File Flat (IVFFlat) indices. This eliminates the need for training steps and preserves high recall during concurrent writes.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CreatorOS Application Runtime                   │
│                                                                        │
│   ┌─────────────────────┐                 ┌────────────────────────┐   │
│   │ Workflow Executors  │                 │ Semantic Agent Engine  │   │
│   └──────────┬──────────┘                 └───────────┬────────────┘   │
│              │                                        │                │
│              └───────────────────┬────────────────────┘                │
│                                  │                                     │
│                        Drizzle ORM Engine Layer                        │
│          (Type-Safe Direct SQL Compilation, Unified Connection Pool)   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database Engine                         │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Relational Schema Domain                     │  │
│  │   - workspaces           - creator_profiles     - video_assets   │  │
│  │   - processing_jobs      - publishing_targets   - audit_logs     │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ (Foreign Keys & Constraints)     │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │                    Semantic pgvector Domain                      │  │
│  │   - creator_memories (vector(1536) / vector(3072))               │  │
│  │   - HNSW Cosine Distance Graph Index (vector_cosine_ops)         │  │
│  │   - Relational Metadata Hybrid Partitioning                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│         Single WAL Engine • ACID Boundaries • Atomic Snapshot PITR     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Production Implementation Specifications

### 6.1. Drizzle Schema Architecture

The following production schema implements the relational structure and the semantic vector memory space. It uses HNSW indexing over cosine distance metrics.

```typescript
// src/db/schema/creator-memory.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  real,
  index,
  foreignKey,
  varchar,
  integer,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { customType } from 'drizzle-orm/pg-core';

/**
 * Native pgvector Drizzle custom type adapter.
 * Handles the raw wire format translation for PostgreSQL vector extensions.
 */
export const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config) {
    if (!config?.dimensions) {
      throw new Error('Vector dimensions must be explicitly specified.');
    }
    return `vector(${config.dimensions})`;
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value.replace(/\[/g, '[').replace(/\]/g, ']'));
  },
});

// Workspace Partition Domain
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 128 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Video Processing Relational Asset Domain
export const videoAssets = pgTable('video_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  storagePath: text('storage_path').notNull(),
  status: varchar('status', { length: 64 }).notNull().default('PROCESSING'),
  processedChunks: integer('processed_chunks').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Semantic Creator Memory Domain
export const creatorMemories = pgTable(
  'creator_memories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    videoAssetId: uuid('video_asset_id').references(() => videoAssets.id, {
      onDelete: 'cascade',
    }),
    contentChunk: text('content_chunk').notNull(),
    tokenCount: integer('token_count').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    metadata: jsonb('metadata').$type<{
      speaker?: string;
      sentimentScore?: number;
      timestamps?: { start: number; end: number };
      tags: string[];
    }>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Standard composite relational filtering index
    index('idx_memories_workspace_created').on(table.workspaceId, table.createdAt),
    // HNSW index for sub-linear time approximate nearest neighbor search
    index('idx_memories_embedding_hnsw')
      .using('hnsw', table.embedding.op('vector_cosine_ops'))
      .with({
        m: 16,
        ef_construction: 64,
      }),
  ]
);

export type Workspace = typeof workspaces.$inferSelect;
export type VideoAsset = typeof videoAssets.$inferSelect;
export type CreatorMemory = typeof creatorMemories.$inferSelect;
export type NewCreatorMemory = typeof creatorMemories.$inferInsert;
```

### 6.2. Atomic Transaction Management

The ingestion pipeline showcases the unified transaction guarantee: the system inserts episodic memory chunks, increments processing states, and writes an audit log in a single atomic transaction.

```typescript
// src/services/memory-ingestion.service.ts
import { db } from '../db';
import { creatorMemories, videoAssets } from '../db/schema/creator-memory';
import { eq, sql } from 'drizzle-orm';

export interface ChunkPayload {
  content: string;
  tokenCount: number;
  embedding: number[];
  metadata: {
    speaker?: string;
    sentimentScore?: number;
    timestamps?: { start: number; end: number };
    tags: string[];
  };
}

export class MemoryIngestionService {
  /**
   * Atomically writes semantic embeddings while updating relational processing counters.
   * If any chunk fails to write or constraint violations occur, the entire transaction rolls back.
   */
  public async ingestAssetMemories(
    workspaceId: string,
    videoAssetId: string,
    chunks: ChunkPayload[]
  ): Promise<{ writtenChunks: number }> {
    return await db.transaction(async (tx) => {
      // 1. Verify existence and acquire row lock for monotonic mutation
      const [asset] = await tx
        .select()
        .from(videoAssets)
        .where(eq(videoAssets.id, videoAssetId))
        .for('update');

      if (!asset) {
        throw new Error(`VideoAsset ${videoAssetId} not found.`);
      }

      // 2. Batch write memory records containing high-dimensional vectors
      const recordsToInsert = chunks.map((chunk) => ({
        workspaceId,
        videoAssetId,
        contentChunk: chunk.content,
        tokenCount: chunk.tokenCount,
        embedding: chunk.embedding,
        metadata: chunk.metadata,
      }));

      await tx.insert(creatorMemories).values(recordsToInsert);

      // 3. Atomically update relational metadata
      await tx
        .update(videoAssets)
        .set({
          processedChunks: sql`${videoAssets.processedChunks} + ${chunks.length}`,
          status: 'COMPLETED',
        })
        .where(eq(videoAssets.id, videoAssetId));

      return { writtenChunks: chunks.length };
    });
  }
}
```

### 6.3. Single-Pass Hybrid Retrieval Query

This query performs a unified vector and relational search. It applies strict tenant-level relational isolation, dynamic metadata filters, and cosine distance scoring within a single parameterized query plan.

```typescript
// src/services/memory-retrieval.service.ts
import { db } from '../db';
import { creatorMemories } from '../db/schema/creator-memory';
import { sql, and, eq, gte, cosineDistance, desc } from 'drizzle-orm';

export interface SemanticSearchCriteria {
  workspaceId: string;
  queryEmbedding: number[];
  similarityThreshold: number; // e.g., 0.78
  limit: number;
  tags?: string[];
  createdAfter?: Date;
}

export interface ScoredMemoryResult {
  id: string;
  videoAssetId: string | null;
  contentChunk: string;
  metadata: unknown;
  similarity: number;
  createdAt: Date;
}

export class MemoryRetrievalService {
  /**
   * Executes a single-pass hybrid vector and relational filter query.
   * Leverages the HNSW index alongside PostgreSQL B-tree indices.
   */
  public async searchMemories(
    criteria: SemanticSearchCriteria
  ): Promise<ScoredMemoryResult[]> {
    const similarity = sql<number>`1 - (${cosineDistance(
      creatorMemories.embedding,
      criteria.queryEmbedding
    )})`;

    const conditions = [
      eq(creatorMemories.workspaceId, criteria.workspaceId),
      gte(similarity, criteria.similarityThreshold),
    ];

    if (criteria.createdAfter) {
      conditions.push(gte(creatorMemories.createdAt, criteria.createdAfter));
    }

    if (criteria.tags && criteria.tags.length > 0) {
      // JSONB containment check for array of tags
      conditions.push(
        sql`${creatorMemories.metadata}->'tags' ?| array[${sql.join(
          criteria.tags.map((t) => sql`${t}`),
          sql`, `
        )}]`
      );
    }

    const results = await db
      .select({
        id: creatorMemories.id,
        videoAssetId: creatorMemories.videoAssetId,
        contentChunk: creatorMemories.contentChunk,
        metadata: creatorMemories.metadata,
        createdAt: creatorMemories.createdAt,
        similarity: similarity.as('similarity_score'),
      })
      .from(creatorMemories)
      .where(and(...conditions))
      .orderBy((t) => desc(t.similarity))
      .limit(criteria.limit);

    return results;
  }
}
```

---

## 7. Consequences & Trade-offs

### 7.1. Positive Consequences

- **Atomic Transactions (Zero Drift)**: Embeddings live in the same transaction boundaries as system data. Video metadata updates, credit deductions, and chunk indexing succeed or fail as a single unit of work.
- **Unified Backups and Recovery**: Backups, restores, and Point-In-Time-Recovery (PITR) execute through a single operational interface (e.g., standard WAL archiving, `pg_dump`, AWS RDS snapshots). There is no risk of vector indices drifting out of sync with point-in-time backups.
- **Reduced Cold Start Penalties**: Drizzle contains no binary engine wrappers, keeping runtime worker startup overhead within 5ms.
- **Lower Network Latency**: Hybrid searches run within the database engine via a single query execution plan, eliminating extra network hops between the app, database, and an external vector service.
- **Lower Total Cost of Ownership**: Removing external services like Pinecone drops platform baseline costs by several hundred to thousands of dollars per month during early and growth scaling stages.

### 7.2. Negative Consequences & Mitigations

- **RAM Footprint for Large Scale HNSW Graphs**: 
  - *Risk*: HNSW requires keeping vector graph structures in memory for optimal latency. As vectors reach tens of millions of rows, PostgreSQL memory usage increases.
  - *Mitigation*: Tune `shared_buffers` and `work_mem`. If working sets exceed RAM capacity, apply partial indexing (e.g., indexing only recent workspaces) or partition tables by `workspaceId` using PostgreSQL declarative table partitioning.
- **Index Build Resource Usage**:
  - *Risk*: Building HNSW indexes across millions of pre-existing vectors requires significant CPU and memory.
  - *Mitigation*: Configure `maintenance_work_mem` to generous values (e.g., 2GB–4GB) during bulk index rebuilds. Run migrations using `CONCURRENTLY` to avoid blocking concurrent writes during deployment.
- **Vector Dimension Adjustments**:
  - *Risk*: Migrating between embedding models (e.g., changing from OpenAI's `text-embedding-3-small` at 1536 dimensions to `text-embedding-3-large` at 3072 dimensions) requires updating column types and regenerating embeddings.
  - *Mitigation*: Version the memory tables (`creator_memories_v2`) and use dual-writing orchestration services during model transitions.

---

## 8. Operational & Infrastructure Playbook

### 8.1. Extension Initialization Migration

To configure PostgreSQL clusters for CreatorOS, apply the following baseline SQL migration prior to compiling application schemas:

```sql
-- Migration: 0000_setup_pgvector_extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Verify installation and validate SIMD optimization (AVX2 / AVX-512)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    RAISE EXCEPTION 'pgvector extension failed to initialize.';
  END IF;
END $$;
```

### 8.2. Engine Memory & HNSW Query Tuning

Adjust runtime PostgreSQL configurations based on index requirements. Set these values in `postgresql.conf` or execute them dynamically at connection initialization:

```sql
-- Allocate adequate memory for HNSW graph index builds
ALTER SYSTEM SET maintenance_work_mem = '2GB';

-- Tune ef_search for runtime approximate nearest neighbor accuracy vs latency
-- Default is 40. Higher values yield higher recall at the cost of execution latency.
ALTER SYSTEM SET hnsw.ef_search = 100;

-- Ensure working memory accommodates sorting operations during hybrid filtering
ALTER SYSTEM SET work_mem = '64MB';

-- Reload configuration live without restarting the PostgreSQL engine
SELECT pg_reload_conf();
```

---

## 9. References

- [pgvector GitHub Repository & Documentation](https://github.com/pgvector/pgvector)
- [Drizzle ORM Technical Documentation](https://orm.drizzle.team)
- [HNSW: Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs (Malkov & Yashunin, 2018)](https://arxiv.org/abs/1603.09320)
- CreatorOS System Architecture: Core Data Model Specifications (`docs/architecture/system-overview.md`)
