# 04 - API Contracts: CreatorOS

## 1. REST Endpoints

### 1.1 `POST /api/council/generate`
Initiates the Model Council pipeline to turn a prompt into hooks and scripts.
- **Request Body**:
```json
{
  "creatorId": "cr_123",
  "topic": "Why most B2B founders fail at short-form video",
  "preferredLayout": "talking-head",
  "targetDurationSeconds": 45
}
```
- **Response (200 OK)**:
```json
{
  "brainstorm": {
    "hooks": [
      { "hook": "90% of B2B founders talk like robots online.", "category": "contrarian", "estimatedRetentionScore": 92 }
    ]
  },
  "draft": {
    "title": "B2B Content Trap",
    "selectedHook": "90% of B2B founders talk like robots online.",
    "fullScript": "...",
    "sections": []
  },
  "critique": {
    "scores": { "retentionPrediction": 92, "brandConsistencyScore": 95, "compositeScore": 93 },
    "approved": true
  },
  "sceneSpec": { /* Valid SceneSpec JSON */ }
}
```

### 1.2 `POST /api/render/jobs`
Submits a validated `SceneSpec` to the BullMQ rendering queue.
- **Request Body**:
```json
{
  "sceneSpecId": "sc_789",
  "webhookUrl": "https://creatoros.app/api/render/webhook"
}
```
- **Response (202 Accepted)**:
```json
{
  "jobId": "bull_job_456",
  "status": "queued",
  "estimatedWaitSeconds": 15
}
```

### 1.3 `GET /api/render/jobs/:jobId`
Returns real-time render progress and delivery URL.
- **Response (200 OK)**:
```json
{
  "jobId": "bull_job_456",
  "status": "completed",
  "progress": 100,
  "downloadUrl": "https://storage.creatoros.app/renders/cr_123_sc_789.mp4"
}
```
