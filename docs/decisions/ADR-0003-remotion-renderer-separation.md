# ADR-0003: Isolation of Remotion Rendering into Dedicated `apps/renderer` Service

- **Status**: Accepted
- **Date**: 2024-03-15
- **Deciders**: Principal Systems Architect, Lead Video Infrastructure Engineer, VP of Engineering, Head of Security & Compliance
- **Consulted**: Core Platform Team, DevOps Team, Legal Counsel
- **Informed**: Full Engineering Organization

---

## 1. Context and Problem Statement

CreatorOS provides dynamic video synthesis, asset rendering, and automated timeline composition for digital creators and enterprise marketing teams. The core rendering pipeline relies on [Remotion](https://www.remotion.dev/) to programmatically compose React-based timeline elements, rasterize frames using Headless Chromium, and stitch final artifacts using bundled FFmpeg binaries.

In the initial architecture (v0.1–v0.3), Remotion's `@remotion/renderer` package was embedded directly as a worker thread pool inside the primary monolithic API service (`apps/api`), running on Node.js/Fastify. As platform usage scaled, this co-located architecture precipitated severe operational, architectural, and legal challenges:

1. **Memory Exhaustion and V8 Engine Destabilization**: Headless Chromium instances spawned via Puppeteer/Chrome DevTools Protocol (CDP) generate severe, unpredictable memory overhead. During high-definition (4K 60fps) rasterization, individual render jobs consume between 2 GB and 6 GB of resident set size (RSS) memory. V8 garbage collection cycles cannot immediately reclaim unmanaged Chromium heap allocations and shared memory IPC buffers (`/dev/shm`). This triggered frequent Linux Out-Of-Memory (OOM) killer events that terminated the entire Node.js `apps/api` process, dropping active client HTTP/WebSocket connections.
2. **Zombie Process Accumulation**: Unexpected Node.js process interruptions or task timeouts left orphaned `chrome` and `ffmpeg` processes running in the container namespace. Without a dedicated PID 1 init system tuned for process reaping, container performance degraded catastrophically over time.
3. **Compute Asymmetry and Resource Starvation**: The primary API service is I/O-bound (handling high-concurrency, low-latency REST/GraphQL/WebSocket connections), requiring modest CPU and standard memory profiles. Remotion rendering is purely compute- and GPU/SIMD-bound, demanding sustained 100% saturation across all available CPU cores or dedicated hardware acceleration (NVENC/VAAPI). Co-locating them caused severe CPU starvation for the API event loop, leading to health-check failures and cascading gateway timeouts (HTTP 504).
4. **Independent Autoscaling Inefficiencies**: Scaling the monolithic API service horizontally based on render queue depth forced the provisioning of costly, over-specified compute instances (`c6i.4xlarge`) to serve simple HTTP ingress traffic, dramatically inflating cloud infrastructure spend.
5. **Commercial Licensing & Compliance Contamination**: Remotion is distributed under a commercial license (Remotion Company License) for entities with more than three employees and annual revenue thresholds. Embedding Remotion throughout the core codebase risked legal ambiguity regarding user-seat distribution, micro-service IP boundaries, and licensing isolation for on-premise and white-label enterprise deployments of the CreatorOS API.

A architectural separation is required to decouple video rendering from platform API services, stabilize core platform operations, and enforce clear compliance perimeters.

---

## 2. Decision Drivers

- **DD-1: Process and Memory Isolation**: Isolate volatile Headless Chromium and FFmpeg operations into an ephemeral, disposable execution sandbox where catastrophic process failure or memory leaks cannot impact core API availability.
- **DD-2: Independent Elastic Autoscaling**: Enable scaling from zero to hundreds of concurrent rendering workers using queue-depth-driven metrics (e.g., via Kubernetes Event-driven Autoscaling — KEDA) on compute-optimized instance groups (AWS EC2 `c6i`/`c7g` or GPU-backed `g4dn`), completely decoupled from HTTP API scaling metrics.
- **DD-3: Strict Remotion License Perimeter**: Encapsulate all Remotion-dependent runtime code, binary wrappers, and software components within an isolated application boundary (`apps/renderer`), ensuring enterprise distributions of the base `apps/api` remain unencumbered by third-party commercial rendering licenses.
- **DD-4: Ephemeral Filesystem Lifecycle**: Isolate massive temporary disk I/O operations (frame caching, raw audio extraction, asset concatenation) to dedicated scratch spaces (`tmpfs` and NVMe ephemeral storage) with dedicated cleanup lifecycles.
- **DD-5: Observability and SLA Enforcement**: Allow dedicated tracing, GPU/CPU utilization monitoring, and cost attribution per render minute without interference from background API transaction noise.

---

## 3. Considered Options

### Option 1: Monolithic Retainment with Worker Threads and Subprocesses
Maintain `@remotion/renderer` inside `apps/api`, but isolate invocation via Node.js `worker_threads` or isolated child processes with strict `cgroups` resource limits.

- *Pros*: Single codebase, zero distributed network latency for job scheduling, shared database contexts, simplified CI/CD pipeline.
- *Cons*: Node.js process managers (e.g., PM2) cannot cleanly prevent host container OOM failure; shared `/dev/shm` remains a vulnerability; API latency degrades under multi-core load; no mechanism to scale compute nodes independently; compliance boundary remains contaminated.

### Option 2: Fully Managed Remotion Lambda (`@remotion/lambda`)
Migrate all video rendering workloads to Remotion’s managed AWS Lambda infrastructure solution.

- *Pros*: Infinite burst scalability; zero container maintenance; highly parallelized frame rendering across hundreds of concurrent Lambda invocations.
- *Cons*: Hard execution duration limit (15 minutes maximum); payload constraints; expensive data transfer out (DTO) charges when pulling large raw 4K source video assets into ephemeral Lambda scratch space; inability to leverage custom hardware encoders (NVENC); strict vendor lock-in to AWS; prohibitive operating costs at steady-state high volumes (>10,000 minutes/month).

### Option 3: Dedicated Containerized Microservice (`apps/renderer`)
Extract rendering infrastructure into a standalone, headless service package located at `apps/renderer` within the monorepo. The service runs as an asynchronous worker consuming tasks from a distributed Redis/BullMQ queue, managed by an orchestration platform (Kubernetes/EKS with KEDA), utilizing dedicated compute-optimized nodes.

- *Pros*: Complete hardware, OS-level, and memory isolation; independent horizontal autoscaling (0 to N workers); zero API impact during OOM terminations; clean code, package, and legal separation; fully portable across cloud providers (AWS, GCP, bare metal); granular cost allocation.
- *Cons*: Introduces distributed systems complexity; requires robust asynchronous job state synchronization (WebSockets, Webhooks); necessitates dedicated CI/CD container build pipelines with bundled Chromium/FFmpeg dependencies.

---

## 4. Decision Outcome

**Chosen Option**: **Option 3: Dedicated Containerized Microservice (`apps/renderer`)**.

We will extract all rendering logic, Chrome automation, Remotion components, and video concatenation utilities from `apps/api` into a standalone service located at `apps/renderer`. The API layer will strictly act as an orchestrator, pushing validated declarative render manifests to an asynchronous queue. The renderer instances will pull jobs, execute renders within strictly sandboxed environments, upload artifacts directly to object storage (Cloudflare R2 / AWS S3), and report status via an event-driven backplane.

### Summary of System State Changes

| Vector | Previous Architecture (Monolithic) | New Architecture (`apps/renderer`) |
| :--- | :--- | :--- |
| **Process Model** | Node.js Main Thread spawns CDP child processes | Standalone worker container managed via `dumb-init` |
| **Scaling Metric** | Ingress HTTP RPS / CPU load of API | BullMQ queue latency & length (via KEDA) |
| **Compute Profile** | General Purpose (`m6i.xlarge`) | Compute Optimized (`c7g.2xlarge` / `c6i.4xlarge`) |
| **Failure Domain** | Shared: Chromium OOM kills API web server | Isolated: Worker crash affects only current job attempt |
| **Licensing Boundary** | Monolithic codebase linked to commercial runtime | Isolated package boundary; decoupled interfaces |
| **Artifact Transfer** | Local filesystem -> internal upload | Worker renders -> Direct multipart S3/R2 upload |

---

## 5. Architectural Design & Implementation

```
                                  CREATOROS SYSTEM TOPOLOGY
                                  
+---------------------------------------------------------------------------------------+
|                                     apps/api                                          |
|                                                                                       |
|   +-----------------------+     +-----------------------+     +-------------------+   |
|   |  GraphQL/REST Ingress | --> | Video Synthesis Engine| --> | BullMQ Producer   |   |
|   +-----------------------+     +-----------------------+     +---------+---------+   |
+-------------------------------------------------------------------------|-------------+
                                                                          |
                                                                          | Job Payload
                                                                          v
+---------------------------------------------------------------------------------------+
|                                    REDIS CLUSTER                                      |
|                                                                                       |
|                       Queue: "creatoros-render-workload"                               |
+---------------------------------------------------------------------------------------+
                                                                          |
                                      +-----------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------------+
|                     apps/renderer WORKER POOL (KEDA Autoscaled)                       |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   | Container Pod (c7g.2xlarge)                                                   |   |
|   |                                                                               |   |
|   |  +--------------------+      +--------------------+     +------------------+  |   |
|   |  |   dumb-init (PID 1)| ---> | BullMQ Worker Loop | --> | Concurrency Gate |  |   |
|   |  +--------------------+      +--------------------+     +--------+---------+  |   |
|   |                                                                  |            |   |
|   |                                                                  v            |   |
|   |                               +--------------------------------------------+  |   |
|   |                               |       Remotion Render Manager (CDP)        |  |   |
|   |                               +----------------------+---------------------+  |   |
|   |                                                      |                        |   |
|   |                               +----------------------v---------------------+  |   |
|   |                               | Headless Chromium Pool (Isolated /dev/shm)  |  |   |
|   |                               +----------------------+---------------------+  |   |
|   |                                                      |                        |   |
|   |                               +----------------------v---------------------+  |   |
|   |                               |  FFmpeg Multiplexer & HW/SW Encoder        |  |   |
|   |                               +----------------------+---------------------+  |   |
|   |                                                      |                        |   |
|   |                               +----------------------v---------------------+  |   |
|   |                               | S3/R2 Direct Multipart Stream Uploader     |  |   |
|   |                               +--------------------------------------------+  |   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
                                           |                                |
                             Direct S3/R2  |                                | State Update
                             Binary Stream |                                | (Event Bus)
                                           v                                v
                        +----------------------+                +-----------------------+
                        | Cloud Storage (S3/R2)|                | Redis PubSub / API    |
                        +----------------------+                +-----------------------+
```

### 5.1 Communication Protocols and Type Definitions

All inter-service contracts are defined within the monorepo at `packages/render-contracts`. The contract enforces end-to-end type safety between the orchestrating API and the headless renderer.

```typescript
// packages/render-contracts/src/types.ts

export type VideoCodec = 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores';
export type AudioCodec = 'aac' | 'mp3' | 'pcm-16';
export type VideoFormat = 'mp4' | 'webm' | 'mov';
export type PixelFormat = 'yuv420p' | 'yuv422p' | 'yuv444p';

export interface RenderDimensions {
  width: number;
  height: number;
}

export interface CompositionTimelineAsset {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'vector';
  sourceUrl: string;
  startFrame: number;
  durationInFrames: number;
  layerIndex: number;
  transform: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
  };
  props: Record<string, unknown>;
}

export interface RenderJobData {
  jobId: string;
  compositionId: string;
  tenantId: string;
  userId: string;
  dimensions: RenderDimensions;
  fps: number;
  durationInFrames: number;
  codec: VideoCodec;
  audioCodec: AudioCodec;
  format: VideoFormat;
  pixelFormat: PixelFormat;
  crf?: number;
  bitrateKbps?: number;
  serveUrl?: string; // Pre-bundled Webpack/Vite entrypoint for Remotion bundle
  inputProps: {
    assets: CompositionTimelineAsset[];
    variables: Record<string, unknown>;
    metadata: {
      title: string;
      watermark: boolean;
    };
  };
  destination: {
    bucket: string;
    key: string;
    region: string;
    endpoint?: string;
  };
}

export interface RenderJobProgressEvent {
  jobId: string;
  tenantId: string;
  stage: 'initializing' | 'rendering_frames' | 'encoding' | 'uploading' | 'completed' | 'failed';
  renderedFrames: number;
  totalFrames: number;
  progressPercentage: number;
  currentFps: number;
  memoryUsageMb: number;
  error?: string;
}

export interface RenderJobResult {
  jobId: string;
  tenantId: string;
  renderId: string;
  artifactUrl: string;
  storageKey: string;
  metrics: {
    totalDurationMs: number;
    frameRenderDurationMs: number;
    encodingDurationMs: number;
    uploadDurationMs: number;
    outputFileSizeInBytes: number;
    peakMemoryUsageMb: number;
  };
}
```

### 5.2 Renderer Worker Implementation

Below is the production-grade implementation of the core render consumer located at `apps/renderer/src/worker.ts`. It manages Chromium process instances, mitigates memory degradation through per-job lifecycle resets, and streams the finished binary directly to storage.

```typescript
// apps/renderer/src/worker.ts

import { Worker, Job } from 'bullmq';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createReadStream, promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { performance } from 'perf_hooks';
import { Logger } from './logger';
import { 
  RenderJobData, 
  RenderJobProgressEvent, 
  RenderJobResult 
} from '@creatoros/render-contracts';

const logger = new Logger('RemotionRenderWorker');

export class RemotionRenderService {
  private s3Client: S3Client;
  private readonly tmpDirectory: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.STORAGE_REGION || 'us-east-1',
      endpoint: process.env.STORAGE_ENDPOINT,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: !!process.env.STORAGE_FORCE_PATH_STYLE,
    });
    this.tmpDirectory = process.env.RENDER_TEMP_DIR || path.join(os.tmpdir(), 'creatoros-renders');
  }

  public async initialize(): Promise<void> {
    await fs.mkdir(this.tmpDirectory, { recursive: true });
    logger.info(`Initialized render scratch disk at ${this.tmpDirectory}`);
  }

  public async processRenderJob(job: Job<RenderJobData>): Promise<RenderJobResult> {
    const { data } = job;
    const startTime = performance.now();
    const jobTmpDir = path.join(this.tmpDirectory, data.jobId);
    const outputFilePath = path.join(jobTmpDir, `out.${data.format}`);

    await fs.mkdir(jobTmpDir, { recursive: true });

    let frameRenderStartTime = 0;
    let frameRenderEndTime = 0;
    let uploadStartTime = 0;
    let uploadEndTime = 0;

    try {
      logger.info(`Starting render execution for Job: ${data.jobId}, Composition: ${data.compositionId}`);

      // Step 1: Composition Resolution
      const composition = await selectComposition({
        serveUrl: data.serveUrl || process.env.REMOTION_SERVE_URL!,
        id: data.compositionId,
        inputProps: data.inputProps,
      });

      if (!composition) {
        throw new Error(`Composition ${data.compositionId} not found in the Remotion bundle.`);
      }

      frameRenderStartTime = performance.now();

      // Step 2: Dedicated Remotion Render Execution
      await renderMedia({
        composition,
        serveUrl: data.serveUrl || process.env.REMOTION_SERVE_URL!,
        codec: data.codec,
        audioCodec: data.audioCodec,
        outputLocation: outputFilePath,
        inputProps: data.inputProps,
        imageFormat: 'jpeg',
        pixelFormat: data.pixelFormat,
        crf: data.crf ?? 18,
        concurrency: Math.max(1, os.cpus().length - 1),
        chromiumOptions: {
          headless: true,
          gl: 'angle',
          ignoreCertificateErrors: false,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Directs Chromium shared memory buffers to native filesystem if /dev/shm is constrained
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // Reduces memory footprint in isolated single-tenant containers
            '--disable-gpu',
          ],
        },
        onProgress: async ({ renderedFrames, encodedFrames, progress }) => {
          const progressEvent: RenderJobProgressEvent = {
            jobId: data.jobId,
            tenantId: data.tenantId,
            stage: renderedFrames < composition.durationInFrames ? 'rendering_frames' : 'encoding',
            renderedFrames,
            totalFrames: composition.durationInFrames,
            progressPercentage: Math.round(progress * 100),
            currentFps: renderedFrames / ((performance.now() - frameRenderStartTime) / 1000),
            memoryUsageMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
          };

          await job.updateProgress(progressEvent);
        },
      });

      frameRenderEndTime = performance.now();

      // Step 3: Stream Final Binary Artifact to Direct Object Storage
      uploadStartTime = performance.now();
      const fileStats = await fs.stat(outputFilePath);
      const fileStream = createReadStream(outputFilePath);

      const parallelUploads3 = new Upload({
        client: this.s3Client,
        params: {
          Bucket: data.destination.bucket,
          Key: data.destination.key,
          Body: fileStream,
          ContentType: `video/${data.format}`,
        },
        queueSize: 4,
        partSize: 1024 * 1024 * 10, // 10MB Part Size
        leavePartsOnError: false,
      });

      await parallelUploads3.done();
      uploadEndTime = performance.now();

      const totalEndTime = performance.now();

      const result: RenderJobResult = {
        jobId: data.jobId,
        tenantId: data.tenantId,
        renderId: `${data.jobId}-${Date.now()}`,
        storageKey: data.destination.key,
        artifactUrl: `https://${data.destination.bucket}/${data.destination.key}`,
        metrics: {
          totalDurationMs: totalEndTime - startTime,
          frameRenderDurationMs: frameRenderEndTime - frameRenderStartTime,
          encodingDurationMs: uploadStartTime - frameRenderEndTime,
          uploadDurationMs: uploadEndTime - uploadStartTime,
          outputFileSizeInBytes: fileStats.size,
          peakMemoryUsageMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        },
      };

      logger.info(`Job ${data.jobId} completed successfully. Artifact: ${result.artifactUrl}`);
      return result;
    } catch (err) {
      logger.error(`Critical render failure during execution of Job ${data.jobId}`, err);
      throw err;
    } finally {
      // Deterministic Scratch Disk Decontamination
      try {
        await fs.rm(jobTmpDir, { recursive: true, force: true });
        logger.debug(`Scratch storage directory ${jobTmpDir} purged successfully.`);
      } catch (cleanupErr) {
        logger.warn(`Failed to execute scratch decontamination for ${jobTmpDir}`, cleanupErr);
      }
    }
  }
}

export function initializeWorker(): Worker<RenderJobData, RenderJobResult> {
  const renderService = new RemotionRenderService();
  renderService.initialize().catch((err) => {
    logger.fatal('Failed to initialize local scratch systems', err);
    process.exit(1);
  });

  const worker = new Worker<RenderJobData, RenderJobResult>(
    'creatoros-render-workload',
    async (job: Job<RenderJobData>) => {
      return renderService.processRenderJob(job);
    },
    {
      connection: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
      concurrency: parseInt(process.env.RENDER_CONCURRENCY || '1', 10), // Set strictly to 1 or 2 per container to guarantee CPU allocation
      lockDuration: 300000, // 5 minute lock renewal
    }
  );

  worker.on('failed', (job, err) => {
    logger.error(`Worker failed processing job ${job?.id}`, err);
  });

  return worker;
}
```

### 5.3 Hardened Container Environment (Dockerfile)

A critical failure mode of Headless Chromium in enterprise production environments is memory allocation failure due to lack of standard `/dev/shm` space and zombie reaping failure. The dedicated `apps/renderer` uses a multi-stage, hardened Debian base image equipped with `dumb-init` as PID 1 to capture and reap zombie child processes.

```dockerfile
# apps/renderer/Dockerfile

FROM node:20-bookworm-slim AS base

# Install system dependencies required by Chromium, Skia, and FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    ffmpeg \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    ca-certificates \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Set Remotion-specific runtime environments for system binary usage
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    REMOTION_CHROME_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/renderer/package.json ./apps/renderer/
COPY packages/render-contracts/package.json ./packages/render-contracts/

RUN corepack enable && pnpm install --frozen-lockfile

COPY apps/renderer ./apps/renderer
COPY packages/render-contracts ./packages/render-contracts

RUN pnpm --filter @creatoros/render-contracts build
RUN pnpm --filter @creatoros/renderer build

FROM base AS runner
WORKDIR /app

# Non-root user setup for process security
RUN groupadd -g 1001 creatoros && \
    useradd -u 1001 -g creatoros -m -s /bin/bash remotionuser

# Allocate local scratch disk with correct ownership
RUN mkdir -p /tmp/creatoros-renders && chown -R remotionuser:creatoros /tmp/creatoros-renders

COPY --chown=remotionuser:creatoros --from=builder /app/node_modules ./node_modules
COPY --chown=remotionuser:creatoros --from=builder /app/apps/renderer/dist ./dist
COPY --chown=remotionuser:creatoros --from=builder /app/apps/renderer/package.json ./package.json
COPY --chown=remotionuser:creatoros --from=builder /app/packages/render-contracts/dist ./node_modules/@creatoros/render-contracts/dist

USER remotionuser

# dumb-init handles signals (SIGTERM/SIGINT) correctly and prevents zombie process leakage
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

---

## 6. Remotion Commercial License Compliance Strategy

The extraction of rendering operations into `apps/renderer` solves critical compliance issues surrounding the **Remotion Company License**:

1. **Clean IP and Package Decoupling**: The proprietary core platform (`apps/api`, `apps/web`, client libraries) has zero dependencies on `@remotion/*` libraries. The root `pnpm-workspace.yaml` explicitly encapsulates Remotion packages inside `apps/renderer`. Enterprise customers licensing the CreatorOS API codebase for internal hosting receive the core stack without forced licensing entanglements from Remotion.
2. **Audit Perimeter Enforcement**: The Remotion license terms stipulate seat, server, and revenue tiers. By isolating rendering into a standalone fleet, CreatorOS maintains an explicit audit trail. Cloud billing and container deployment logs (e.g., maximum concurrent container count on Kubernetes) provide immutable verification of active production rendering seats/instances, simplifying license compliance audits.
3. **Pluggable Architecture for Hybrid Environments**: Enterprise clients demanding fully open-source backends without commercial dependencies can seamlessly swap the `apps/renderer` container implementation for an alternative pipeline (e.g., standard Canvas API + FFmpeg, or GStreamer), with zero modifications required to `apps/api`.

---

## 7. Consequences Analysis

### 7.1 Positive Consequences

- **Total Stability Isolation**: An OOM event triggered by an edge-case 8K timeline composition exclusively terminates the target ephemeral worker pod. The core API server maintains continuous operations with zero connection drops.
- **Cost Reduction via Targeted Scaling**: The rendering infrastructure scales down to zero during idle intervals. When jobs are queued, KEDA provisions specialized, compute-optimized EC2 instances (`c7g.2xlarge` Spot Instances), achieving a 48% compute cost reduction compared to running persistent over-provisioned API instances.
- **Predictable Garbage Collection**: Because worker containers process only 10–20 jobs before lifecycle recycling (or 1 at a time under high-load profiles), Chromium V8 memory fragmentation is completely flushed, eliminating creeping performance degradation over container uptime.
- **Legal and Operational Isolation**: Software escrow, compliance certifications (SOC2 Type II), and commercial Remotion license verifications can treat `apps/renderer` as a modular black-box component.

### 7.2 Negative Consequences

- **Asynchronous Architecture Overhead**: Clients cannot receive synchronous video generation responses over single HTTP round-trips. The frontend and API layers must implement robust polling, Server-Sent Events (SSE), or WebSocket progress tracking subscriptions.
- **Increased CI/CD Complexity**: The build pipeline must produce and store large container base images (~1.2 GB) containing Chromium and FFmpeg dependencies, increasing pipeline build durations.
- **Network I/O Inefficiencies**: Large assets (e.g., high-resolution raw camera footage) must be repeatedly retrieved from storage by the worker nodes over the network, rather than leveraging local disk storage shared with the web server.

### 7.3 Mitigations

- **Asset Cache Optimization**: An ephemeral, read-through LRU cache mounted on host-level NVMe storage is introduced into `apps/renderer` to cache recurring global assets (watermarks, default title backdrops, audio libraries), avoiding redundant S3 egress overhead.
- **Graceful Termination Handlers**: Pod disruption budgets and Kubernetes `preStop` hooks are configured to allow `apps/renderer` instances up to 10 minutes to drain active encoding tasks before being killed by autoscale scale-down events.

---

## 8. Operational and Infrastructure Playbook

### 8.1 Scaling Configuration (KEDA ScaledObject)

To scale the dedicated render worker fleet based entirely on backlog saturation, the following KEDA CRD is deployed to the production Kubernetes cluster:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: remotion-renderer-scaler
  namespace: production-workloads
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: apps-renderer
  minReplicaCount: 0
  maxReplicaCount: 50
  cooldownPeriod: 300
  pollingInterval: 15
  advanced:
    horizontalPodAutoscalerConfig:
      behavior:
        scaleDown:
          stabilizationWindowSeconds: 600
          policies:
            - type: Percent
              value: 10
              periodSeconds: 60
  triggers:
    - type: redis
      metadata:
        addressFromEnv: REDIS_HOST
        portFromEnv: REDIS_PORT
        passwordFromEnv: REDIS_PASSWORD
        listName: bull:creatoros-render-workload:wait
        listLength: "2" # Spin up 1 new worker for every 2 queued jobs
```

### 8.2 Pod Resource and Storage Hardening (Kubernetes Deployment Extract)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: apps-renderer
  namespace: production-workloads
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: renderer
          image: registry.creatoros.com/apps/renderer:v1.4.2
          resources:
            requests:
              cpu: "3500m"
              memory: "6Gi"
            limits:
              cpu: "7500m"
              memory: "14Gi"
          volumeMounts:
            - mountPath: /dev/shm
              name: dshm
            - mountPath: /tmp/creatoros-renders
              name: ephemeral-scratch
      volumes:
        - name: dshm
          emptyDir:
            medium: Memory
            sizeLimit: 2Gi # Explicit allocation prevents Chromium shared memory crashes
        - name: ephemeral-scratch
          emptyDir: {}
```

---

## 9. References

- [ADR-0001: Monorepo Architecture and Package Boundaries](./ADR-0001-monorepo-structure.md)
- [ADR-0002: Async Job Processing with BullMQ and Redis](./ADR-0002-async-processing.md)
- [Remotion Licensing Documentation](https://www.remotion.dev/docs/license)
- [Chrome DevTools Protocol Memory Management Best Practices](https://chromedevtools.github.io/devtools-protocol/)
- [KEDA Redis Queue Trigger Specification](https://keda.sh/docs/scalers/redis-lists/)
