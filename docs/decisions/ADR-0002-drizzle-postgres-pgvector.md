# ADR-0002: Drizzle ORM, PostgreSQL & pgvector

## Status: Accepted

## Context
The Creator Memory engine requires both relational storage (users, subscriptions, scene configurations) and vector similarity search (retrieving past hooks, scripts, and topics).

## Decision
We adopt **PostgreSQL 16+** with the **`pgvector`** extension, managed via **Drizzle ORM**:
- Avoids operating a separate vector database (e.g. Pinecone/Qdrant) in early stages.
- Drizzle offers zero-overhead TypeScript type safety and simple migration workflows.

## Consequences
- Single unified database for relational and vector queries.
- Simplified local development via standard Docker containers.
