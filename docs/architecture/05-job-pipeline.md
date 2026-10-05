# 05 - Job Pipeline: CreatorOS

## 1. Queue Architecture (BullMQ + Redis)
Video rendering is a CPU/GPU-intensive operation that must never block web requests. We utilize BullMQ running on Redis 7 to handle render concurrency, retries, and rate limits.

```
[Web App] ──▶ (POST /api/render/jobs) ──▶ [BullMQ Queue: video-renders]
                                                     │
                             ┌───────────────────────┴───────────────────────┐
                             ▼                                               ▼
                   [Renderer Worker 1]                             [Renderer Worker 2]
                   (Remotion Bundler)                              (Remotion Bundler)
                             │                                               │
                             └───────────────────────┬───────────────────────┘
                                                     ▼
                                          [S3 Upload + Webhook]
```

## 2. Job Lifecycle & Error Handling
1. **Validation Stage**: When a job is enqueued, worker validates the payload using `SceneSpecSchema.parse()`. Invalid jobs are immediately failed without launching Chromium.
2. **Asset Pre-fetch**: Any remote video or audio URLs referenced in `visualLayers` are pre-cached locally in worker temp storage.
3. **Render Execution**: Worker calls `bundle()` and `renderMedia()` from `@remotion/renderer`.
4. **Concurrency Limits**: Each worker runs at max `concurrency = 2` to prevent memory thrashing.
5. **Retry Policy**: 3 exponential retries for transient Chromium crashes or asset network drops.
