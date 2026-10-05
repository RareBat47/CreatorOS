# ADR-0003: Remotion Video Renderer Separation

## Status: Accepted

## Context
Remotion requires bundling Chromium, Puppeteer, and native audio binaries. Bundling this into the Next.js web application bloats serverless deployments and creates severe memory contention.

## Decision
Quarantine Remotion into an isolated workspace (`apps/renderer`). Next.js communicates with the renderer exclusively via the BullMQ job queue and S3 URLs.

## Consequences
- Fast Next.js builds and independent deployment.
- Video rendering cluster can be scaled horizontally on dedicated GPU/CPU nodes.
