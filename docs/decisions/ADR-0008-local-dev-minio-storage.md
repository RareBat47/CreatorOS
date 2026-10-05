# ADR-0008: Local MinIO & Cloudflare R2 / S3 Object Storage

## Status: Accepted

## Context
Videos, logos, fonts, and A-roll footage require scalable object storage.

## Decision
Use standard S3-compatible APIs. Local development runs on a local **MinIO** instance, while production deploys on **Cloudflare R2** for zero-egress fee video delivery.

## Consequences
- Uniform S3 SDK usage across environments.
- Zero bandwidth egress costs in production.
