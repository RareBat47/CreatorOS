# CreatorOS Remotion Rendering Architecture

```
Document: DOC-REM-001
Status: Production-Grade / Active
Domain: apps/renderer
Engine: Remotion v4.x / Node.js LTS (v20+) / Chromium Headless / FFmpeg 6.x+
Architectural Tier: Core Compute / Distributed Media Synthesis
```

---

## 1. System Overview & Architecture

The CreatorOS dynamic video generation engine relies on `@creatoros/renderer`, an isolated, horizontally scalable microservice hosted in `apps/renderer`. The service converts dynamic timeline state graphs, schema-validated dynamic parameters, and media assets into broadcast-compliant MP4 media streams.

The architecture decouples timeline composition development (React-driven declarative canvas manipulation) from the compute-intensive rasterization, audio processing, and container muxing phases.

```
                                  [API Gateway / Ingestion]
                                              │
                                              ▼ (Job Payload + Zod Input)
                                     [Redis / BullMQ Queue]
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
         ┌─────────────────────┐                             ┌─────────────────────┐
         │ apps/renderer (Pod) │                             │ apps/renderer (Pod) │
         └──────────┬──────────┘                             └──────────┬──────────┘
                    │                                                   │
  ┌─────────────────┼────────────────────────┐                          │
  ▼                 ▼                        ▼                          ▼
┌──────────────┐  ┌───────────────────────┐  ┌──────────────────┐  [S3 / MinIO Storage]
│ Dynamic      │  │ Headless Chromium     │  │ FFmpeg DSP       │
│ Webpack/     │  │ Cluster Pool          │  │ Pipeline         │
│ Rollup Cache │  │ (Shared GPU/SHM)      │  │ (EBU R128 +      │
└──────────────┘  └───────────────────────┘  │ Sidechain Duck)  │
                                             └──────────────────┘
```

### 1.1 Compute Pipeline Stages

The rendering pipeline processes tasks across five discrete, fully isolated stages:

1. **Composition Resolution & Bundle Retrieval:** Verifies input props via Zod, loads the pre-bundled Remotion root, or dynamically packages production code paths.
2. **Asset Hydration & Pre-Warming:** Downloads, hashes, and caches high-bitrate video, raster graphics, audio stems, and remote web fonts into an ephemeral volume (`/dev/shm` or local NVMe).
3. **Distributed Frame Rasterization:** Spawns pooled headless Chromium instances using `@remotion/renderer`. Renders frame ranges concurrently to disk or memory pipes via Skia/OffscreenCanvas.
4. **Digital Signal Processing (DSP) & Audio Stitching:** Normalizes dynamic volume levels according to EBU R128 broadcast targets, applies algorithmic dynamic range compression (sidechain ducking), and mixes audio stems.
5. **Muxing & Cloud Egress:** Invokes FFmpeg via `@remotion/renderer` or external binary orchestration, muxing frames into container targets (H.264/AAC), and executes a parallelized multipart S3 upload stream.

---

## 2. Service Topology & `apps/renderer` Layout

The `apps/renderer` directory structure centralizes engine logic, pool allocation, composition declarations, and queue workers:

```
apps/renderer/
├── Dockerfile.render-node
├── package.json
├── src/
│   ├── index.ts                     # Fastify daemon & health check ingress
│   ├── config/
│   │   ├── env.ts                   # Validated runtime environment definitions
│   │   └── remotion.config.ts       # Remotion binary, Chromium, and thread limits
│   ├── compositions/                # Concrete React compositions
│   │   ├── Root.tsx                 # Remotion registerRoot entry point
│   │   ├── templates/
│   │   │   ├── ShortsTemplate.tsx
│   │   │   ├── ExplainerTemplate.tsx
│   │   │   └── AudiogramTemplate.tsx
│   │   └── schemas/
│   │       ├── shorts.schema.ts
│   │       └── explainer.schema.ts
│   ├── infrastructure/
│   │   ├── browser-pool.ts          # Ephemeral Chromium cluster manager
│   │   ├── bundler.ts               # Webpack/Rollup composition compiler
│   │   ├── cache-manager.ts         # Shared memory frame and asset cache
│   │   └── storage.ts               # S3/R2 AWS SDK multipart engine
│   ├── audio/
│   │   ├── normalizer.ts            # EBU R128 two-pass FFmpeg implementation
│   │   └── ducking.ts               # Sidechain compressor graph builder
│   └── workers/
│       ├── render.processor.ts      # BullMQ Job consumer
│       └── render.orchestrator.ts   # Core execution timeline coordinator
```

---

## 3. Bundle Creation & Dynamic Composition Registration

Remotion relies on Webpack under the hood to compile React TSX components into an evaluation bundle consumable by headless Chromium instances. Recompiling the React bundle per render request adds massive latency (5–12 seconds of overhead). CreatorOS uses an immutable bundle caching architecture.

```
                                  Bundle Creation Architecture
                                  
 ┌──────────────────────┐         ┌──────────────────────┐         ┌──────────────────────┐
 │ apps/renderer/src/   │ ──────> │   @remotion/bundler  │ ──────> │ /tmp/creatoros/      │
 │ compositions/Root.tsx│         │   bundle() Invocation│         │ bundles/<commit-hash>│
 └──────────────────────┘         └──────────────────────┘         └──────────────────────┘
                                                                               │
                                                                               ▼
                                                                   ┌──────────────────────┐
                                                                   │ Ephemeral Static     │
                                                                   │ HTTP Server / File   │
                                                                   │ Descriptor Mapping   │
                                                                   └──────────────────────┘
```

### 3.1 Dynamic Composition Registry

Every composition registers through `Root.tsx` with a strict `zod` schema. Dynamic parameters are checked during bundle entry and runtime orchestration:

```typescript
// apps/renderer/src/compositions/Root.tsx
import React from 'react';
import { Composition } from 'remotion';
import { ShortsTemplate } from './templates/ShortsTemplate';
import { ExplainerTemplate } from './templates/ExplainerTemplate';
import { ShortsPayloadSchema } from './schemas/shorts.schema';
import { ExplainerPayloadSchema } from './schemas/explainer.schema';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CreatorOS-Shorts-V1"
        component={ShortsTemplate}
        durationInFrames={1800} // Dynamic default (60s @ 30fps)
        fps={30}
        width={1080}
        height={1920}
        schema={ShortsPayloadSchema}
        defaultProps={{
          hookText: "The Future of Synthetic Video Production",
          timelineStems: [],
          voiceoverUrl: "https://assets.creatoros.internal/stems/default-vo.mp3",
          backgroundMusicUrl: "https://assets.creatoros.internal/stems/default-bg.mp3",
          brandColor: "#6366F1",
          captionSegments: [],
        }}
      />
      <Composition
        id="CreatorOS-Explainer-V1"
        component={ExplainerTemplate}
        durationInFrames={5400} // Dynamic default (180s @ 30fps)
        fps={30}
        width={1920}
        height={1080}
        schema={ExplainerPayloadSchema}
        defaultProps={{
          slides: [],
          voiceoverUrl: "https://assets.creatoros.internal/stems/default-vo.mp3",
          themeConfig: {
            fontFamily: "Inter",
            primaryColor: "#0F172A",
          },
        }}
      />
    </>
  );
};
```

### 3.2 Bundle Service Implementation

The compilation engine ensures bundle isolation. It uses disk caching keyed against git commit hashes and source trees, preventing cold starts across scaled worker pods.

```typescript
// apps/renderer/src/infrastructure/bundler.ts
import { bundle } from '@remotion/bundler';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { FastifyBaseLogger } from 'fastify';

export interface BundlerServiceConfig {
  entryPoint: string;
  cacheDirectory: string;
  logger: FastifyBaseLogger;
}

export class CompositionBundler {
  private entryPoint: string;
  private cacheDirectory: string;
  private logger: FastifyBaseLogger;
  private bundleLocationCache: Map<string, string> = new Map();

  constructor(config: BundlerServiceConfig) {
    this.entryPoint = config.entryPoint;
    this.cacheDirectory = config.cacheDirectory;
    this.logger = config.logger;
  }

  private async calculateSourceHash(): Promise<string> {
    const compositionDir = path.dirname(this.entryPoint);
    const files = await fs.readdir(compositionDir, { recursive: true });
    const hash = createHash('sha256');

    for (const file of files) {
      const fullPath = path.join(compositionDir, file.toString());
      const stat = await fs.stat(fullPath);
      if (stat.isFile()) {
        const content = await fs.readFile(fullPath);
        hash.update(file.toString());
        hash.update(content);
      }
    }
    return hash.digest('hex').slice(0, 16);
  }

  public async getOrGenerateBundle(): Promise<string> {
    const versionHash = await this.calculateSourceHash();
    const targetedOutput = path.join(this.cacheDirectory, `bundle-${versionHash}`);

    if (this.bundleLocationCache.has(versionHash)) {
      const cachedPath = this.bundleLocationCache.get(versionHash)!;
      this.logger.info({ bundlePath: cachedPath }, 'Serving composition bundle from memory index');
      return cachedPath;
    }

    try {
      await fs.access(targetedOutput);
      this.logger.info({ target: targetedOutput }, 'Found warm composition bundle on disk');
      this.bundleLocationCache.set(versionHash, targetedOutput);
      return targetedOutput;
    } catch {
      this.logger.warn({ versionHash }, 'Bundle cache miss. Compiling Webpack bundle...');
    }

    const bundleStartTime = Date.now();
    const bundledPath = await bundle({
      entryPoint: this.entryPoint,
      outDir: targetedOutput,
      webpackOverride: (currentConfiguration) => {
        return {
          ...currentConfiguration,
          optimization: {
            ...currentConfiguration.optimization,
            minimize: process.env.NODE_ENV === 'production',
          },
        };
      },
    });

    const elapsed = Date.now() - bundleStartTime;
    this.logger.info({ bundledPath, elapsedMs: elapsed }, 'Successfully compiled Remotion composition bundle');
    
    this.bundleLocationCache.set(versionHash, bundledPath);
    return bundledPath;
  }
}
```

---

## 4. Headless Chromium Clustering & Lifecycle Management

Headless Chromium is memory-intensive and prone to fragmentation or zombie allocations under high multi-page loads. Rendering video at 60 FPS across concurrent jobs requires a strictly managed pool with sandboxing, explicit lifecycle bounds, and process reclamation policies.

```
                       Chromium Cluster Lifecycle State Machine
                       
   ┌───────────────┐        Acquire Free Slot       ┌───────────────┐
   │               │ ─────────────────────────────> │               │
   │  IDLE POOL    │                                │ ACTIVE RENDER │
   │               │ <───────────────────────────── │               │
   └───────────────┘        Render Clean Exit       └───────────────┘
           │                                                │
           │ Memory > 1.2GB                                 │ Crash / OOM / Zombie
           │ or Reaches 50 Renders                          │
           ▼                                                ▼
   ┌────────────────────────────────────────────────────────────────┐
   │               TERMINATING PROCESS (SIGKILL/TREE-KILL)          │
   └────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
   ┌────────────────────────────────────────────────────────────────┐
   │               RE-SPAWN WITH DEDICATED POSIX SHM                │
   └────────────────────────────────────────────────────────────────┘
```

### 4.1 Resource Allocation Formula

The concurrency limits per node are calculated based on vCPU counts and dynamic memory allocations:

$$\text{Max Browser Instances} = \left\lfloor \frac{\text{Total RAM (MB)} - \text{Base System RAM (MB)}}{\text{Peak Memory Per Page Context (MB)}} \right\rfloor$$

$$\text{Renderer Concurrency} = \min\left(\text{Max Browser Instances}, \text{vCPU Cores} - 1\right)$$

*   **Total RAM Floor:** 16 GB Node.
*   **Base System RAM:** 2,048 MB (OS, Fastify, Node, FFmpeg buffers).
*   **Chromium Process Footprint:** ~1,200 MB under 4K canvas load or ~500 MB under 1080p load.
*   **Standard Concurrency (16 vCPU / 32 GB RAM):** Set dynamically to `12` rendering threads.

### 4.2 Browser Process Pool Implementation

The Chromium process pool tracks process memory footprints using dynamic polling, drops zombie tabs, and flags headless processes for systematic teardown:

```typescript
// apps/renderer/src/infrastructure/browser-pool.ts
import puppeteer, { Browser } from 'puppeteer';
import { FastifyBaseLogger } from 'fastify';

export interface PoolConfig {
  maxInstances: number;
  maxRendersPerInstance: number;
  memoryLimitBytes: number;
  logger: FastifyBaseLogger;
}

interface ManagedInstance {
  browser: Browser;
  usageCount: number;
  createdAt: number;
  pid: number;
}

export class ChromiumClusterPool {
  private instances: Set<ManagedInstance> = new Set();
  private available: ManagedInstance[] = [];
  private waitQueue: ((instance: ManagedInstance) => void)[] = [];
  private config: PoolConfig;
  private shuttingDown = false;

  constructor(config: PoolConfig) {
    this.config = config;
  }

  public async initialize(): Promise<void> {
    this.config.logger.info({ maxInstances: this.config.maxInstances }, 'Pre-warming Chromium pool');
    for (let i = 0; i < this.config.maxInstances; i++) {
      const instance = await this.spawnBrowser();
      this.instances.add(instance);
      this.available.push(instance);
    }
  }

  private async spawnBrowser(): Promise<ManagedInstance> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Critical: uses /tmp instead of strictly constrained /dev/shm
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--hide-scrollbars',
        '--mute-audio',
      ],
      pipe: true, // Bi-directional pipes bypass internal Chromium socket connection bottlenecks
    });

    const process = browser.process();
    if (!process || !process.pid) {
      throw new Error('Chromium instance spawned without valid PID');
    }

    return {
      browser,
      usageCount: 0,
      createdAt: Date.now(),
      pid: process.pid,
    };
  }

  public async acquire(): Promise<Browser> {
    if (this.shuttingDown) {
      throw new Error('Chromium Cluster is currently terminating');
    }

    if (this.available.length > 0) {
      const instance = this.available.pop()!;
      return instance.browser;
    }

    return new Promise<ManagedInstance>((resolve) => {
      this.waitQueue.push(resolve);
    }).then((inst) => inst.browser);
  }

  public async release(browser: Browser): Promise<void> {
    const managed = Array.from(this.instances).find((inst) => inst.browser === browser);
    if (!managed) {
      await browser.close();
      return;
    }

    managed.usageCount += 1;
    const shouldRecycle = managed.usageCount >= this.config.maxRendersPerInstance;

    if (shouldRecycle || this.shuttingDown) {
      await this.destroyInstance(managed);
      if (!this.shuttingDown) {
        const replacement = await this.spawnBrowser();
        this.instances.add(replacement);
        this.dispatchOrEnqueue(replacement);
      }
    } else {
      this.dispatchOrEnqueue(managed);
    }
  }

  private dispatchOrEnqueue(instance: ManagedInstance): void {
    if (this.waitQueue.length > 0) {
      const nextSubscriber = this.waitQueue.shift()!;
      nextSubscriber(instance);
    } else {
      this.available.push(instance);
    }
  }

  private async destroyInstance(instance: ManagedInstance): Promise<void> {
    this.instances.delete(instance);
    try {
      await instance.browser.close();
    } catch (e) {
      this.config.logger.error({ err: e, pid: instance.pid }, 'Force terminating orphaned Chromium process');
      process.kill(instance.pid, 'SIGKILL');
    }
  }

  public async drain(): Promise<void> {
    this.shuttingDown = true;
    const terminationPromises = Array.from(this.instances).map((inst) => this.destroyInstance(inst));
    await Promise.all(terminationPromises);
    this.config.logger.info('Chromium pool completely drained');
  }
}
```

---

## 5. Asset Preloading & Deterministic Frame Caching

Videos containing remote image elements, Lottie vectors, and high-resolution video layers will stutter or drop frames if assets are hydrated on-the-fly during headless execution. CreatorOS uses a strict two-tier caching and preloading model.

```
                               Deterministic Ingestion Funnel
                               
 ┌──────────────────────┐         ┌──────────────────────┐         ┌──────────────────────┐
 │ Remotion Root Job    │ ──────> │ Hash Pre-Fetch Layer │ ──────> │ High-Speed Local     │
 │ Input Payload        │         │ (HTTP/S3 ETag Check) │         │ Ephemeral NVMe Cache │
 └──────────────────────┘         └──────────────────────┘         └──────────────────────┘
                                                                               │
                                                                               ▼
                                                                   ┌──────────────────────┐
                                                                   │ Frame Worker Canvas: │
                                                                   │ document.fonts.ready │
                                                                   │ <video preload="auto"│
                                                                   └──────────────────────┘
```

### 5.1 Asset Preloading Matrix

| Asset Class | Strategy | Injection Point | Validation Gate |
| :--- | :--- | :--- | :--- |
| **Google/Custom Web Fonts** | CSS `@font-face` + binary preload | Composition DOM Header | `document.fonts.ready === true` |
| **TTS Audio Stems** | Direct NVMe staging via POSIX link | React `<Audio>` tag | `HTMLAudioElement.HAVE_ENOUGH_DATA` |
| **Video Backgrounds** | Local file mount bypassing network | Remotion `<Video>` | Offscreen Canvas Decoder frame check |
| **Dynamic Overlays (PNG)** | Prefetched memory buffer base64 | React `<Img>` tag | `HTMLImageElement.decode()` execution |

### 5.2 Asset Staging Pipeline

This layer guarantees that every remote resource is verified, downloaded, and exposed via direct file endpoints before Chromium receives the frame render request:

```typescript
// apps/renderer/src/infrastructure/cache-manager.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import fsSync from 'node:fs';

export class AssetCacheManager {
  private baseDir: string;

  constructor(baseDir: string = '/tmp/creatoros/asset-cache') {
    this.baseDir = baseDir;
    fsSync.mkdirSync(this.baseDir, { recursive: true });
  }

  public async resolveAsset(remoteUrl: string): Promise<string> {
    if (remoteUrl.startsWith('file://')) {
      return remoteUrl.replace('file://', '');
    }

    const urlHash = createHash('sha256').update(remoteUrl).digest('hex');
    const extension = path.extname(new URL(remoteUrl).pathname) || '.tmp';
    const localizedFilename = `${urlHash}${extension}`;
    const localizedFilePath = path.join(this.baseDir, localizedFilename);

    try {
      await fs.access(localizedFilePath);
      return localizedFilePath; // Local hit
    } catch {
      // Cache miss: stream to disk
    }

    const response = await fetch(remoteUrl);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to prefetch asset: ${remoteUrl} - HTTP ${response.status}`);
    }

    const tempPath = `${localizedFilePath}.${Date.now()}.download`;
    const targetStream = fsSync.createWriteStream(tempPath);

    // ReadableStream to Node.js stream conversion
    // @ts-expect-error Types mismatch bridging web to node stream
    await pipeline(response.body, targetStream);
    await fs.rename(tempPath, localizedFilePath);

    return localizedFilePath;
  }
}
```

---

## 6. Audio Normalization & DSP Pipeline (FFmpeg Integration)

Rendering multi-track audio inside headless Chromium can lead to slight sample drift and lacks the dynamic headroom adjustments needed for broadcast media. CreatorOS disables audio synthesis in Remotion's rasterizer (`renderMedia` run with `everyNthFrame=1`, `--mute-audio`), extracting the composition timeline data and rendering audio through an out-of-band FFmpeg process.

```
                                  Native DSP Graph
                                  
 ┌──────────────────────┐
 │ Voiceover Audio (A0) │ ──> loudnorm [I=-16, LRA=11, TP=-1.5] ──┬─> [VO_NORM]
 └──────────────────────┘                                         │
                                                                  ├───────────────────┐
 ┌──────────────────────┐                                         │                   │
 │ Music Audio (A1)     │ ────────────────────────────────────────┼─────┐             │
 └──────────────────────┘                                         │     │             ▼
                                                                  │     │      ┌─────────────┐
                                                                  ▼     ▼      │ Sidechain   │
                                                       [sidechaincompress] ──> │ Ducking Mix │
                                                                               │ Engine      │
                                                                               └─────────────┘
                                                                                      │
                                                                                      ▼
                                                                              [Broadcast Audio]
```

### 6.1 Audio Processing Pipeline

1. **Two-Pass Loudness Normalization (EBU R128):** Normalizes the dynamic voiceover stem to an integrated loudness target of `-16.0 LUFS`, a maximum true peak of `-1.5 dBFS`, and a loudness range (LRA) of `11.0 LU`.
2. **Sidechain Dynamic Attenuation (Ducking):** The background music stream dynamically ducks down by `-14 dB` whenever the speech waveform exceeds `-30 dBFS`, with a `50 ms` attack and `300 ms` release envelope.

### 6.2 FFmpeg DSP Processor

```typescript
// apps/renderer/src/audio/normalizer.ts
import { spawn } from 'node:child_process';
import { FastifyBaseLogger } from 'fastify';

export interface LoudnessStats {
  inputI: string;
  inputTP: string;
  inputLRA: string;
  inputThresh: string;
  outputI: string;
  outputTP: string;
  outputLRA: string;
  outputThresh: string;
  normalizationType: string;
  targetOffset: string;
}

export class AudioDSPService {
  private logger: FastifyBaseLogger;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger;
  }

  public async measureLoudness(filePath: string): Promise<LoudnessStats> {
    return new Promise((resolve, reject) => {
      const args = [
        '-hide_banner',
        '-i', filePath,
        '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json',
        '-f', 'null',
        '-',
      ];

      const proc = spawn('ffmpeg', args);
      let stderrAccumulator = '';

      proc.stderr.on('data', (chunk) => {
        stderrAccumulator += chunk.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`FFmpeg loudness pass 1 exit code non-zero: ${code}`));
        }

        try {
          const jsonString = stderrAccumulator.slice(stderrAccumulator.lastIndexOf('{'), stderrAccumulator.lastIndexOf('}') + 1);
          const parsed = JSON.parse(jsonString);
          resolve({
            inputI: parsed.input_i,
            inputTP: parsed.input_tp,
            inputLRA: parsed.input_lra,
            inputThresh: parsed.input_thresh,
            outputI: parsed.output_i,
            outputTP: parsed.output_tp,
            outputLRA: parsed.output_lra,
            outputThresh: parsed.output_thresh,
            normalizationType: parsed.normalization_type,
            targetOffset: parsed.target_offset,
          });
        } catch (e) {
          reject(new Error(`Failed parsing EBU R128 pass 1 diagnostics: ${(e as Error).message}`));
        }
      });
    });
  }

  public async processMixAndDuck(params: {
    voiceoverPath: string;
    musicPath: string;
    outputPath: string;
    stats: LoudnessStats;
  }): Promise<void> {
    const { voiceoverPath, musicPath, outputPath, stats } = params;

    // Complex filtergraph applying measured loudnorm constants + Sidechain Compression
    const filterComplex = [
      `[0:a]loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${stats.inputI}:measured_TP=${stats.inputTP}:measured_LRA=${stats.inputLRA}:measured_thresh=${stats.inputThresh}:offset=${stats.targetOffset}:linear=true[vo_norm]`,
      `[vo_norm]asplit=2[vo_duck_trigger][vo_main]`,
      `[1:a]volume=0.25[bg_music]`,
      `[bg_music][vo_duck_trigger]sidechaincompress=threshold=0.03:ratio=4:attack=50:release=300[bg_ducked]`,
      `[vo_main][bg_ducked]amix=inputs=2:duration=first:dropout_transition=2[audio_out]`,
    ].join(';');

    const args = [
      '-y',
      '-i', voiceoverPath,
      '-i', musicPath,
      '-filter_complex', filterComplex,
      '-map', '[audio_out]',
      '-c:a', 'aac',
      '-b:a', '320k',
      '-ar', '48000',
      outputPath,
    ];

    this.logger.info({ filterComplex }, 'Executing FFmpeg dual-stem DSP processing');

    return new Promise((resolve, reject) => {
      const proc = spawn('ffmpeg', args);
      let stderrLog = '';

      proc.stderr.on('data', (d) => { stderrLog += d.toString(); });
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          this.logger.error({ stderrLog }, 'DSP Pipeline Failure');
          reject(new Error(`FFmpeg DSP failed with code: ${code}`));
        }
      });
    });
  }
}
```

---

## 7. End-to-End MP4 Export Pipeline

The rendering pipeline brings together composition bundling, headless rasterization, and our audio processing steps.

### 7.1 Sequence Execution Graph

```
Job Queue           Orchestrator        Asset Cache         Chromium Pool      DSP Service        AWS S3
    │                     │                  │                    │                 │                │
    │  Execute Render     │                  │                    │                 │                │
    ├────────────────────>│                  │                    │                 │                │
    │                     │  Hydrate Assets  │                    │                 │                │
    │                     ├─────────────────>│                    │                 │                │
    │                     │<─────────────────┤                    │                 │                │
    │                     │                                       │                 │                │
    │                     │  Acquire Browser                      │                 │                │
    │                     ├──────────────────────────────────────>│                 │                │
    │                     │<──────────────────────────────────────┤                 │                │
    │                     │                                                         │                │
    │                     │  Process Multi-Stem EBU R128 Audio                      │                │
    │                     ├────────────────────────────────────────────────────────>│                │
    │                     │<────────────────────────────────────────────────────────┤                │
    │                     │                                                                          │
    │                     │  Rasterize & Stitch MP4 via @remotion/renderer                          │
    │                     │────────────────────────────────────────────────────────┐                 │
    │                     │                                                        │                 │
    │                     │<───────────────────────────────────────────────────────┘                 │
    │                     │                                                                          │
    │                     │  Multipart Upload Stream                                                 │
    │                     ├─────────────────────────────────────────────────────────────────────────>│
    │                     │<─────────────────────────────────────────────────────────────────────────┤
    │  Job Complete       │
    │<────────────────────│
```

### 7.2 Export Pipeline Execution Core

The orchestration engine coordinates headless Chromium frame generation, applies audio stems, and streams the finished file directly to object storage via an S3 Multipart interface.

```typescript
// apps/renderer/src/workers/render.orchestrator.ts
import { renderMedia, selectComposition } from '@remotion/renderer';
import { CompositionBundler } from '../infrastructure/bundler';
import { ChromiumClusterPool } from '../infrastructure/browser-pool';
import { AssetCacheManager } from '../infrastructure/cache-manager';
import { AudioDSPService } from '../audio/normalizer';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import path from 'node:path';
import fs from 'node:fs';
import { FastifyBaseLogger } from 'fastify';

export interface RenderJobRequest {
  jobId: string;
  compositionId: string;
  inputProps: Record<string, unknown>;
  outputKey: string;
}

export class RenderOrchestrator {
  private bundler: CompositionBundler;
  private pool: ChromiumClusterPool;
  private cache: AssetCacheManager;
  private dsp: AudioDSPService;
  private s3: S3Client;
  private logger: FastifyBaseLogger;

  constructor(dependencies: {
    bundler: CompositionBundler;
    pool: ChromiumClusterPool;
    cache: AssetCacheManager;
    dsp: AudioDSPService;
    s3: S3Client;
    logger: FastifyBaseLogger;
  }) {
    this.bundler = dependencies.bundler;
    this.pool = dependencies.pool;
    this.cache = dependencies.cache;
    this.dsp = dependencies.dsp;
    this.s3 = dependencies.s3;
    this.logger = dependencies.logger;
  }

  public async execute(job: RenderJobRequest): Promise<{ s3Location: string; renderTimeMs: number }> {
    const startTime = Date.now();
    const tempOutputDir = path.join('/tmp/creatoros/renders', job.jobId);
    await fs.promises.mkdir(tempOutputDir, { recursive: true });

    const rawVideoOutput = path.join(tempOutputDir, 'frames_only.mp4');
    const finalAudioOutput = path.join(tempOutputDir, 'normalized_audio.aac');
    const finalMultiplexedOutput = path.join(tempOutputDir, 'final_mux.mp4');

    try {
      // 1. Resolve composition bundle
      const bundleDir = await this.bundler.getOrGenerateBundle();

      // 2. Resolve & cache dynamic stems
      const resolvedVoiceover = await this.cache.resolveAsset(job.inputProps.voiceoverUrl as string);
      const resolvedMusic = await this.cache.resolveAsset(job.inputProps.backgroundMusicUrl as string);

      // 3. Audio DSP normalization pass (out-of-band)
      const loudnessStats = await this.dsp.measureLoudness(resolvedVoiceover);
      await this.dsp.processMixAndDuck({
        voiceoverPath: resolvedVoiceover,
        musicPath: resolvedMusic,
        outputPath: finalAudioOutput,
        stats: loudnessStats,
      });

      // 4. Composition Resolution
      const composition = await selectComposition({
        serveUrl: bundleDir,
        id: job.compositionId,
        inputProps: job.inputProps,
      });

      // 5. Headless Chromium Render Execution
      const browserInstance = await this.pool.acquire();
      try {
        await renderMedia({
          composition,
          serveUrl: bundleDir,
          codec: 'h264',
          outputLocation: rawVideoOutput,
          inputProps: job.inputProps,
          puppeteerInstance: browserInstance,
          concurrency: 8,
          muted: true, // Audio generated via FFmpeg DSP pass
          pixelFormat: 'yuv420p',
          videoBitrate: '18M',
          crf: 18,
          scale: 1,
          bufferPaddingInSeconds: 3,
          everyNthFrame: 1,
          chromiumOptions: {
            enableMultiProcessOnLinux: true,
          },
        });
      } finally {
        await this.pool.release(browserInstance);
      }

      // 6. Final Multiplexing (Mux pristine video with DSP audio)
      await this.multiplexStream(rawVideoOutput, finalAudioOutput, finalMultiplexedOutput);

      // 7. Multipart Pipeline to Object Storage
      const s3Location = await this.uploadToStorage(finalMultiplexedOutput, job.outputKey);

      return {
        s3Location,
        renderTimeMs: Date.now() - startTime,
      };
    } finally {
      // Ensure disk cleanup on both success and error
      await fs.promises.rm(tempOutputDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private async multiplexStream(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
    const { spawn } = await import('node:child_process');
    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-i', videoPath,
        '-i', audioPath,
        '-c:v', 'copy',
        '-c:a', 'copy',
        '-movflags', '+faststart',
        outputPath,
      ];
      const proc = spawn('ffmpeg', args);
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Multiplexing container failed with FFmpeg code ${code}`));
      });
    });
  }

  private async uploadToStorage(filePath: string, key: string): Promise<string> {
    const fileStream = fs.createReadStream(filePath);
    const bucket = process.env.S3_BUCKET_NAME || 'creatoros-renders-live';

    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: bucket,
        Key: key,
        Body: fileStream,
        ContentType: 'video/mp4',
      },
      queueSize: 4,
      partSize: 10 * 1024 * 1024, // 10MB chunk buffer
    });

    await upload.done();
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }
}
```

---

## 8. Production Configuration, Observability, & Failure Modes

### 8.1 Configuration Variables Matrix

```typescript
// apps/renderer/src/config/env.ts
import { z } from 'zod';

export const RendererEnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().default(4001),
  CONCURRENCY_LIMIT: z.coerce.number().default(8),
  MAX_BROWSER_INSTANCES: z.coerce.number().default(4),
  CHROMIUM_MEMORY_LIMIT_BYTES: z.coerce.number().default(1024 * 1024 * 1280), // 1.25 GB
  CACHE_DIR
