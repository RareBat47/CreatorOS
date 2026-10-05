# Engineering Documentation: Testing Strategy and Quality Assurance

**Document Reference:** `docs/engineering/02-testing-strategy.md`  
**Package Scope:** `@creatoros/monorepo`  
**Status:** Approved  
**Version:** 2.4.0  
**Owner:** Core Architecture & Platform Engineering Teams

---

## 1. Executive Summary & Testing Philosophy

CreatorOS is an autonomous media synthesis platform comprising low-latency model routing, distributed agent memory, real-time UI collaboration, and deterministic Remotion-based rendering pipelines. The platform operates across non-deterministic components (Large Language Models, multimodal generative models) and strictly deterministic systems (video rendering engines, frame diffs, state machines).

```
                            ▲
                           / \
                          / E2E \             Playwright (Next.js Studio)
                         /-------\            Multi-tenant Session Isolation
                        /  Visual \           Remotion Pixelmatch / Frame-accurate
                       / Regression\          SSIM Structural Invariance
                      /-------------\
                     /  Integration  \        Mock LLM (SSE Streaming, Function Calling)
                    /    Subsystems   \       Mock Renderers, Real DB (Testcontainers)
                   /-------------------\
                  /        Unit         \     Vitest (Schemas, Memory Engine,
                 /     Core & Routing    \    Model Router, State Transducers)
                /-------------------------\
```

### 1.1 Core Directives

1. **Determinism Isolation:** Non-deterministic subsystems (LLM inference, third-party speech synthesis) must be decoupled at the integration boundary via deterministic, seeded mock drivers.
2. **Zero-Flake Mandate:** Any test exhibiting non-deterministic execution in CI is quarantined automatically. Flaky tests are treated as blocking P0 operational defects.
3. **Shift-Left Profiling:** Contract validation, memory leak checks, and invariant verification occur at the lowest possible layer before promoting code to downstream integration pipelines.
4. **Frame-Accurate Visual Quality:** Video rendering regressions are guarded by programmatic frame sampling, perceptual hashing, and strict pixel-level diff tolerances.

---

## 2. Test Architecture & Monorepo Topology

The monorepo organizes tests within co-located directory structures for unit and integration boundaries, with centralized harnesses for end-to-end and rendering verification.

```
creatoros/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── memory/
│   │   │   │   ├── memory-engine.ts
│   │   │   │   └── memory-engine.spec.ts        # Unit: Memory & Vector indexing
│   │   │   ├── router/
│   │   │   │   ├── model-router.ts
│   │   │   │   └── model-router.spec.ts         # Unit: Fallbacks & Circuit Breakers
│   │   │   └── schemas/
│   │   │       ├── project.schema.ts
│   │   │       └── project.schema.spec.ts       # Unit: Zod Validation Boundary
│   ├── render-engine/
│   │   ├── src/
│   │   │   ├── compositions/
│   │   │   └── index.ts
│   │   └── tests/
│   │       ├── visual/
│   │       │   ├── baselines/                   # Canonical gold-standard PNGs
│   │       │   ├── visual-regression.spec.ts    # Remotion Frame-by-frame diffs
│   │       │   └── render-harness.ts
├── apps/
│   ├── studio/                                  # Next.js 14+ Studio Application
│   │   ├── tests/
│   │   │   ├── e2e/
│   │   │   │   ├── auth.setup.ts                # Session state hydration
│   │   │   │   ├── timeline.spec.ts             # Playwright Timeline interactions
│   │   │   │   └── pages/                       # Page Object Models
│   │   │   │       ├── StudioPage.ts
│   │   │   │       └── TimelineComponent.ts
│   │   │   └── integration/
│   │   │       ├── mocks/
│   │   │       │   ├── llm-stream-server.ts     # SSE & Tool Call Mock Server
│   │   │       │   └── mock-renderer.ts
│   │   │       └── pipeline-orchestrator.spec.ts
vitest.workspace.ts
playwright.config.ts
```

---

## 3. Unit Testing with Vitest

The unit test layer operates exclusively under **Vitest**, leveraging native ESM execution, worker thread pooling, and in-memory module mocking.

### 3.1 Schema Validation Engine

Contract boundaries handle untrusted external input (user requests, model completions). The schema validation suite ensures that structural boundaries, custom sanitizers, and validation transforms behave predictably.

```typescript
// packages/core/src/schemas/project.schema.ts
import { z } from 'zod';

export const LayerTypeSchema = z.enum(['video', 'audio', 'text', 'composition', 'agent-overlay']);

export const TimelineKeyframeSchema = z.object({
  frame: z.number().int().nonnegative(),
  value: z.union([z.number(), z.string()]),
  interpolation: z.enum(['linear', 'bezier', 'hold']).default('linear'),
});

export const TimelineLayerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(128),
  type: LayerTypeSchema,
  startFrame: z.number().int().nonnegative(),
  durationInFrames: z.number().int().positive(),
  opacity: z.array(TimelineKeyframeSchema).default([{ frame: 0, value: 1, interpolation: 'linear' }]),
  metadata: z.record(z.unknown()).optional(),
});

export const VideoProjectSpecSchema = z.object({
  id: z.string().uuid(),
  version: z.literal(2),
  fps: z.union([z.literal(24), z.literal(30), z.literal(60)]),
  resolution: z.object({
    width: z.number().int().min(480).max(3840),
    height: z.number().int().min(480).max(2160),
  }),
  layers: z.array(TimelineLayerSchema).min(1),
}).refine(
  (data) => {
    return data.resolution.width % 2 === 0 && data.resolution.height % 2 === 0;
  },
  {
    message: "Rendering dimensions must be even numbers for H.264/HEVC encoder compatibility",
    path: ["resolution"],
  }
);

export type VideoProjectSpec = z.infer<typeof VideoProjectSpecSchema>;
```

```typescript
// packages/core/src/schemas/project.schema.spec.ts
import { describe, it, expect } from 'vitest';
import { VideoProjectSpecSchema } from './project.schema';
import crypto from 'node:crypto';

describe('Project Schema Validation', () => {
  const validBaseProject = {
    id: crypto.randomUUID(),
    version: 2,
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    layers: [
      {
        id: crypto.randomUUID(),
        name: 'Track 1',
        type: 'video' as const,
        startFrame: 0,
        durationInFrames: 300,
        opacity: [{ frame: 0, value: 1, interpolation: 'linear' as const }],
      },
    ],
  };

  it('successfully validates a well-formed video spec', () => {
    const result = VideoProjectSpecSchema.safeParse(validBaseProject);
    expect(result.success).toBe(true);
  });

  it('rejects odd resolutions to avoid H.264 macroblock encoding failure', () => {
    const invalidSpec = {
      ...validBaseProject,
      resolution: { width: 1921, height: 1080 },
    };
    const result = VideoProjectSpecSchema.safeParse(invalidSpec);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('even numbers');
      expect(result.error.issues[0].path).toEqual(['resolution']);
    }
  });

  it('rejects invalid framerates outside production standards', () => {
    const invalidSpec = {
      ...validBaseProject,
      fps: 45, // Only 24, 30, 60 allowed
    };
    const result = VideoProjectSpecSchema.safeParse(invalidSpec);
    expect(result.success).toBe(false);
  });

  it('enforces UUID standards across project and layer structures', () => {
    const invalidSpec = {
      ...validBaseProject,
      id: 'invalid-non-uuid-identifier',
    };
    const result = VideoProjectSpecSchema.safeParse(invalidSpec);
    expect(result.success).toBe(false);
  });
});
```

### 3.2 Agent Memory Engine

The Memory Engine maintains short-term conversational context and vector-indexed long-term memory with LRU eviction and sliding window summarization triggers.

```typescript
// packages/core/src/memory/memory-engine.ts
export interface MemoryRecord {
  id: string;
  embedding: number[];
  payload: {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tokenCount: number;
    timestamp: number;
  };
}

export class MemoryEngine {
  private records: Map<string, MemoryRecord> = new Map();
  private maxTokens: number;
  private currentTokens: number = 0;

  constructor(options: { maxTokens: number }) {
    this.maxTokens = options.maxTokens;
  }

  public static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) {
      throw new Error(`Vector dimension mismatch: ${a.length} != ${b.length}`);
    }
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  public append(record: MemoryRecord): void {
    if (this.records.has(record.id)) {
      this.evict(record.id);
    }

    while (this.currentTokens + record.payload.tokenCount > this.maxTokens && this.records.size > 0) {
      const oldestKey = this.records.keys().next().value;
      if (oldestKey) {
        this.evict(oldestKey);
      }
    }

    this.records.set(record.id, record);
    this.currentTokens += record.payload.tokenCount;
  }

  public evict(id: string): boolean {
    const record = this.records.get(id);
    if (!record) return false;
    this.currentTokens -= record.payload.tokenCount;
    return this.records.delete(id);
  }

  public searchSimilar(queryEmbedding: number[], limit = 5, minSimilarity = 0.7): MemoryRecord[] {
    const results: Array<{ record: MemoryRecord; score: number }> = [];

    for (const record of this.records.values()) {
      const score = MemoryEngine.cosineSimilarity(queryEmbedding, record.embedding);
      if (score >= minSimilarity) {
        results.push({ record, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.record);
  }

  public get tokenCount(): number {
    return this.currentTokens;
  }

  public get size(): number {
    return this.records.size;
  }
}
```

```typescript
// packages/core/src/memory/memory-engine.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryEngine, MemoryRecord } from './memory-engine';

describe('MemoryEngine Core Operations', () => {
  let memory: MemoryEngine;

  beforeEach(() => {
    memory = new MemoryEngine({ maxTokens: 100 });
  });

  it('correctly calculates cosine similarity', () => {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    const vecC = [0, 1, 0];

    expect(MemoryEngine.cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 5);
    expect(MemoryEngine.cosineSimilarity(vecA, vecC)).toBeCloseTo(0.0, 5);
  });

  it('throws an error on dimension mismatch', () => {
    expect(() => {
      MemoryEngine.cosineSimilarity([1, 0], [1, 0, 0]);
    }).toThrow(/Vector dimension mismatch/);
  });

  it('evicts records in FIFO sequence when capacity is exceeded', () => {
    const entry1: MemoryRecord = {
      id: 'msg-1',
      embedding: [0.1, 0.2],
      payload: { role: 'user', content: 'Prompt 1', tokenCount: 40, timestamp: 1000 },
    };
    const entry2: MemoryRecord = {
      id: 'msg-2',
      embedding: [0.3, 0.4],
      payload: { role: 'assistant', content: 'Response 1', tokenCount: 40, timestamp: 2000 },
    };
    const entry3: MemoryRecord = {
      id: 'msg-3',
      embedding: [0.5, 0.6],
      payload: { role: 'user', content: 'Prompt 2', tokenCount: 30, timestamp: 3000 },
    };

    memory.append(entry1);
    memory.append(entry2);
    expect(memory.tokenCount).toBe(80);
    expect(memory.size).toBe(2);

    // Adding entry3 (30 tokens) requires total 110 > 100 max. Should evict entry1.
    memory.append(entry3);
    expect(memory.size).toBe(2);
    expect(memory.tokenCount).toBe(70);
    expect(memory.searchSimilar([0.1, 0.2], 1, 0.9)).toEqual([]);
  });

  it('ranks similarity matches above defined thresholds', () => {
    const reference = [1, 0, 0];
    const exact: MemoryRecord = {
      id: '1',
      embedding: [0.99, 0.01, 0],
      payload: { role: 'user', content: 'Exact match', tokenCount: 10, timestamp: 1 },
    };
    const dissimilar: MemoryRecord = {
      id: '2',
      embedding: [0.1, 0.99, 0],
      payload: { role: 'user', content: 'Divergent', tokenCount: 10, timestamp: 2 },
    };

    memory.append(exact);
    memory.append(dissimilar);

    const matches = memory.searchSimilar(reference, 5, 0.85);
    expect(matches.length).toBe(1);
    expect(matches[0].id).toBe('1');
  });
});
```

### 3.3 Dynamic Model Router

The Model Router dynamically dispatches LLM workloads based on token cost, required capability, tier limits, and circuit-breaker telemetry.

```typescript
// packages/core/src/router/model-router.ts
export interface InferenceTarget {
  id: string;
  provider: 'anthropic' | 'openai' | 'local-vllm';
  costPer1kTokens: number;
  maxContext: number;
  supportsStreaming: boolean;
  supportsJsonSchema: boolean;
}

export interface RouterMetricsCollector {
  recordFailure(targetId: string, status: number): void;
  recordSuccess(targetId: string, latencyMs: number): void;
  isAvailable(targetId: string): boolean;
}

export class ModelRouter {
  constructor(
    private targets: InferenceTarget[],
    private metrics: RouterMetricsCollector
  ) {}

  public resolveTarget(requirements: {
    minTokens: number;
    requiresJson: boolean;
    costCeilingPer1k?: number;
  }): InferenceTarget {
    const candidates = this.targets.filter((target) => {
      if (!this.metrics.isAvailable(target.id)) return false;
      if (target.maxContext < requirements.minTokens) return false;
      if (requirements.requiresJson && !target.supportsJsonSchema) return false;
      if (requirements.costCeilingPer1k && target.costPer1kTokens > requirements.costCeilingPer1k) return false;
      return true;
    });

    if (candidates.length === 0) {
      throw new Error('NO_HEALTHY_INFERENCE_TARGET_AVAILABLE');
    }

    // Sort by lowest cost, then by capability ceiling
    return candidates.sort((a, b) => a.costPer1kTokens - b.costPer1kTokens)[0];
  }
}
```

```typescript
// packages/core/src/router/model-router.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelRouter, InferenceTarget, RouterMetricsCollector } from './model-router';

describe('ModelRouter Dispatch Strategy', () => {
  const targets: InferenceTarget[] = [
    {
      id: 'local-vllm-llama3',
      provider: 'local-vllm',
      costPer1kTokens: 0.0,
      maxContext: 8192,
      supportsStreaming: true,
      supportsJsonSchema: false,
    },
    {
      id: 'openai-gpt4o-mini',
      provider: 'openai',
      costPer1kTokens: 0.00015,
      maxContext: 128000,
      supportsStreaming: true,
      supportsJsonSchema: true,
    },
    {
      id: 'claude-3-5-sonnet',
      provider: 'anthropic',
      costPer1kTokens: 0.003,
      maxContext: 200000,
      supportsStreaming: true,
      supportsJsonSchema: true,
    },
  ];

  let mockMetrics: RouterMetricsCollector;

  beforeEach(() => {
    mockMetrics = {
      recordFailure: vi.fn(),
      recordSuccess: vi.fn(),
      isAvailable: vi.fn().mockReturnValue(true),
    };
  });

  it('selects the cheapest available model that satisfies constraints', () => {
    const router = new ModelRouter(targets, mockMetrics);
    const resolved = router.resolveTarget({ minTokens: 2048, requiresJson: false });
    expect(resolved.id).toBe('local-vllm-llama3');
  });

  it('promotes to higher-tier model when structured JSON is explicitly required', () => {
    const router = new ModelRouter(targets, mockMetrics);
    const resolved = router.resolveTarget({ minTokens: 2048, requiresJson: true });
    expect(resolved.id).toBe('openai-gpt4o-mini');
  });

  it('fails over immediately when primary target is circuit-broken', () => {
    vi.mocked(mockMetrics.isAvailable).mockImplementation((targetId) => targetId !== 'openai-gpt4o-mini');

    const router = new ModelRouter(targets, mockMetrics);
    const resolved = router.resolveTarget({ minTokens: 2048, requiresJson: true });
    expect(resolved.id).toBe('claude-3-5-sonnet');
  });

  it('throws an explicit error when no targets fulfill the constraints', () => {
    const router = new ModelRouter(targets, mockMetrics);
    expect(() => {
      router.resolveTarget({
        minTokens: 300000, // Exceeds all model contexts
        requiresJson: true,
      });
    }).toThrow('NO_HEALTHY_INFERENCE_TARGET_AVAILABLE');
  });
});
```

---

## 4. Subsystem Integration Testing

Integration tests execute end-to-end pipeline transactions without invoking external paid inference APIs or prolonged GPU rendering passes. They utilize deterministic Mock LLM stream generators and synthetic Mock Renderers.

### 4.1 Mock LLM Infrastructure

```typescript
// apps/studio/tests/integration/mocks/llm-stream-server.ts
import { IncomingMessage, ServerResponse, createServer, Server } from 'node:http';

export interface MockToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export class MockLLMServer {
  private server: Server;
  private port: number;
  private scriptedResponses: Map<string, { chunks: string[]; toolCall?: MockToolCall }> = new Map();

  constructor(port = 9099) {
    this.port = port;
    this.server = createServer((req, res) => this.handleRequest(req, res));
  }

  public scriptScenario(scenarioKey: string, chunks: string[], toolCall?: MockToolCall): void {
    this.scriptedResponses.set(scenarioKey, { chunks, toolCall });
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => resolve());
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const payload = JSON.parse(body || '{}');
      const scenarioKey = payload.scenarioKey || 'default';
      const scenario = this.scriptedResponses.get(scenarioKey);

      if (!scenario) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Scenario ${scenarioKey} not registered` }));
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      let index = 0;
      const interval = setInterval(() => {
        if (index < scenario.chunks.length) {
          const chunkData = {
            id: `chunk-${index}`,
            choices: [{ delta: { content: scenario.chunks[index] } }],
          };
          res.write(`data: ${JSON.stringify(chunkData)}\n\n`);
          index++;
        } else {
          if (scenario.toolCall) {
            const toolData = {
              id: 'tool-call-1',
              choices: [
                {
                  delta: {
                    tool_calls: [
                      {
                        function: {
                          name: scenario.toolCall.name,
                          arguments: JSON.stringify(scenario.toolCall.arguments),
                        },
                      },
                    ],
                  },
                },
              ],
            };
            res.write(`data: ${JSON.stringify(toolData)}\n\n`);
          }
          res.write('data: [DONE]\n\n');
          clearInterval(interval);
          res.end();
        }
      }, 10);
    });
  }
}
```

### 4.2 Mock Renderer Infrastructure

```typescript
// apps/studio/tests/integration/mocks/mock-renderer.ts
import EventEmitter from 'node:events';
import { VideoProjectSpec } from '@creatoros/core';

export interface RenderJobProgress {
  jobId: string;
  frame: number;
  totalFrames: number;
  status: 'rendering' | 'encoding' | 'completed' | 'failed';
  outputUrl?: string;
}

export class MockRenderOrchestrator extends EventEmitter {
  private activeJobs: Map<string, { cancelled: boolean }> = new Map();

  public async dispatchRender(jobId: string, spec: VideoProjectSpec): Promise<string> {
    this.activeJobs.set(jobId, { cancelled: false });
    const totalFrames = spec.layers.reduce((max, l) => Math.max(max, l.startFrame + l.durationInFrames), 0);

    return new Promise((resolve, reject) => {
      let currentFrame = 0;
      const frameStep = Math.max(1, Math.floor(totalFrames / 10));

      const interval = setInterval(() => {
        const job = this.activeJobs.get(jobId);
        if (!job || job.cancelled) {
          clearInterval(interval);
          reject(new Error(`Render job ${jobId} was cancelled`));
          return;
        }

        currentFrame += frameStep;
        if (currentFrame < totalFrames) {
          this.emit('progress', {
            jobId,
            frame: currentFrame,
            totalFrames,
            status: 'rendering',
          } satisfies RenderJobProgress);
        } else {
          clearInterval(interval);
          this.emit('progress', {
            jobId,
            frame: totalFrames,
            totalFrames,
            status: 'completed',
            outputUrl: `https://storage.creatoros.internal/renders/${jobId}.mp4`,
          } satisfies RenderJobProgress);
          resolve(`https://storage.creatoros.internal/renders/${jobId}.mp4`);
        }
      }, 5);
    });
  }

  public cancel(jobId: string): void {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.cancelled = true;
    }
  }
}
```

### 4.3 Pipeline Integration Suite

```typescript
// apps/studio/tests/integration/pipeline-orchestrator.spec.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MockLLMServer } from './mocks/llm-stream-server';
import { MockRenderOrchestrator, RenderJobProgress } from './mocks/mock-renderer';
import crypto from 'node:crypto';

describe('Media Synthesis Pipeline Integration', () => {
  const llmServer = new MockLLMServer(9099);
  const renderer = new MockRenderOrchestrator();

  beforeAll(async () => {
    await llmServer.start();
  });

  afterAll(async () => {
    await llmServer.stop();
  });

  it('orchestrates LLM tool output into validated render specification', async () => {
    const targetSceneId = crypto.randomUUID();
    llmServer.scriptScenario(
      'generate-timeline',
      ['Scene definition', ' generating...'],
      {
        name: 'generate_video_project',
        arguments: {
          id: targetSceneId,
          version: 2,
          fps: 30,
          resolution: { width: 1920, height: 1080 },
          layers: [
            {
              id: crypto.randomUUID(),
              name: 'Agent Layer',
              type: 'video',
              startFrame: 0,
              durationInFrames: 60,
              opacity: [{ frame: 0, value: 1, interpolation: 'linear' }],
            },
          ],
        },
      }
    );

    // 1. Invoke Mock LLM
    const res = await fetch('http://localhost:9099', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioKey: 'generate-timeline' }),
    });

    const body = await res.text();
    const lines = body.split('\n\n');
    let capturedToolCall: any = null;

    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        const payload = JSON.parse(line.replace('data: ', ''));
        const toolCalls = payload.choices[0]?.delta?.tool_calls;
        if (toolCalls && toolCalls.length > 0) {
          capturedToolCall = JSON.parse(toolCalls[0].function.arguments);
        }
      }
    }

    expect(capturedToolCall).not.toBeNull();
    expect(capturedToolCall.id).toBe(targetSceneId);

    // 2. Dispatch to Mock Renderer
    const progressEvents: RenderJobProgress[] = [];
    renderer.on('progress', (p: RenderJobProgress) => progressEvents.push(p));

    const finalVideoUrl = await renderer.dispatchRender('render-xyz', capturedToolCall);

    expect(finalVideoUrl).toContain('https://storage.creatoros.internal/renders/render-xyz.mp4');
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[progressEvents.length - 1].status).toBe('completed');
  });
});
```

---

## 5. End-to-End Testing with Playwright

Playwright tests exercise the complete Next.js 14+ Studio app, including DOM manipulation, timeline scrubbing, and real-time state synchronization with backend actors.

### 5.1 Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

export const STORAGE_STATE = path.join(__dirname, 'apps/studio/tests/e2e/.auth/user.json');

export default defineConfig({
  testDir: './apps/studio/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
  ],
  use: {
    baseURL: process.env.STUDIO_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium-studio',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
  ],
});
```

### 5.2 Authentication Fixture Harness

```typescript
// apps/studio/tests/e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import { STORAGE_STATE } from '../../../../playwright.config';
import fs from 'node:fs';
import path from 'node:path';

setup('authenticate studio session', async ({ page, context }) => {
  const authDir = path.dirname(STORAGE_STATE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Bypass physical OAuth provider via signing an ephemeral test JWT
  await context.addCookies([
    {
      name: 'creatoros_session_token',
      value: 'TEST_SYNTHETIC_SECURE_TOKEN_STAGE_E2E',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  await page.goto('/api/auth/mock-session-verify');
  await expect(page.locator('#auth-hydrated-indicator')).toBeAttached();

  await page.context().storageState({ path: STORAGE_STATE });
});
```

### 5.3 Page Object Model: Studio Page & Timeline

```typescript
// apps/studio/tests/e2e/pages/StudioPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class StudioPage {
  readonly page: Page;
  readonly canvas: Locator;
  readonly playButton: Locator;
  readonly pauseButton: Locator;
  readonly addLayerButton: Locator;
  readonly renderExportButton: Locator;
  readonly timelineScrubber: Locator;
  readonly timecodeDisplay: Locator;
  readonly renderModal: Locator;
  readonly renderProgressFill: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvas = page.locator('[data-testid="stage-preview-viewport"]');
    this.playButton = page.locator('[data-testid="playback-play-btn"]');
    this.pauseButton = page.locator('[data-testid="playback-pause-btn"]');
    this.addLayerButton = page.locator('[data-testid="timeline-add-layer-btn"]');
    this.renderExportButton = page.locator('[data-testid="header-export-btn"]');
    this.timelineScrubber = page.locator('[data-testid="timeline-scrubber-handle"]');
    this.timecodeDisplay = page.locator('[data-testid="timeline-timecode"]');
    this.renderModal = page.locator('[data-testid="modal-render-export"]');
    this.renderProgressFill = page.locator('[data-testid="render-progress-indicator"]');
  }

  async goto(projectId: string): Promise<void> {
    await this.page.goto(`/studio/${projectId}`);
    await expect(this.canvas).toBeVisible({ timeout: 15000 });
  }

  async scrubToFrame(targetFrame: number): Promise<void> {
    const scrubberBox = await this.timelineScrubber.boundingBox();
    if (!scrubberBox) throw new Error('Scrubber not rendered in viewport');

    // Scrubber scale factor: 10 pixels per frame
    const deltaX = targetFrame * 10;
    await this.page.mouse.move(scrubberBox.x + scrubberBox.width / 2, scrubberBox.y + scrubberBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(scrubberBox.x + deltaX, scrubberBox.y, { steps: 5 });
    await this.page.mouse.up();
  }

  async addTextLayer(content: string): Promise<string> {
    await this.addLayerButton.click();
    await this.page.locator('[data-testid="layer-type-option-text"]').click();
    const activeLayer = this.page.locator('[data-testid^="timeline-layer-row-"]').first();
    const layerId = await activeLayer.getAttribute('data-layer-id');

    const textInput = this.page.locator(`[data-testid="layer-inspector-input-${layerId}"]`);
    await textInput.fill(content);
    return layerId!;
  }

  async triggerRenderExport(): Promise<void> {
    await this.renderExportButton.click();
    await expect(this.renderModal).toBeVisible();
    await this.renderModal.locator('[data-testid="confirm-render-btn"]').click();
  }
}
```

```typescript
// apps/studio/tests/e2e/timeline.spec.ts
import { test, expect } from '@playwright/test';
import { StudioPage } from './pages/StudioPage';

test.describe('CreatorOS Studio Timeline Workflows', () => {
  let studio: StudioPage;
  const mockProjectId = '00000000-0000-0000-0000-000000000001';

  test.beforeEach(async ({ page }) => {
    studio = new StudioPage(page);
    await studio.goto(mockProjectId);
  });

  test('scrubs timeline and synchronizes viewport frames', async () => {
    await studio.scrubToFrame(30);
    await expect(studio.timecodeDisplay).toHaveText('00:00:01:00');
    await expect(studio.canvas).toHaveAttribute('data-current-frame', '30');
  });

  test('creates text overlay and verifies instant stage synchronization', async () => {
    const textContent = 'Autonomous Video Engine';
    const layerId = await studio.addTextLayer(textContent);

    const layerOnCanvas = studio.canvas.locator(`[data-scene-node-id="${layerId}"]`);
    await expect(layerOnCanvas).toBeVisible();
    await expect(layerOnCanvas).toHaveText(textContent);
  });

  test('initiates export job and updates state on rendering progress', async () => {
    await studio.triggerRenderExport();
    await expect(studio.renderProgressFill).toBeVisible();
    await expect(studio.renderProgressFill).toHaveAttribute('data-progress-status', 'completed', {
      timeout: 30000,
    });
  });
});
```

---

## 6. Remotion Visual Regression Testing

Visual testing asserts
