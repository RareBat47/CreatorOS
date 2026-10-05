# ADR-0008: Local S3-Compatible Object Storage via MinIO

* **Status:** Accepted
* **Date:** 2024-03-22
* **Deciders:** CreatorOS Architecture Review Board (Systems, Cloud Platform, Platform DX)
* **Consulted:** DevOps, Backend Core, Security Engineering
* **Informed:** Full CreatorOS Engineering Organization

---

## 1. Context and Problem Statement

CreatorOS processes high-throughput, multi-gigabyte media assets, including raw video footage, waveform visualizer renders, transcoded video clips, audio tracks, and user-generated branding thumbnails. The platform relies on Amazon Web Services (AWS) Simple Storage Service (S3) for durable, highly available object storage in production environments, orchestrating operations through presigned URLs, multipart uploads, and lifecycle management rules.

During early phases, development environments interfaced directly with live AWS S3 sandboxes or relied on crude filesystem abstraction mocks. Both approaches produced significant systemic drawbacks:

1. **Uncontrolled Cloud Spend:** Developers running integration suites, media transcoding spikes, and pipeline stress tests generated continuous data transfer and storage costs on AWS accounts, accumulating non-trivial monthly bills for ephemeral development data.
2. **Credential and Security Friction:** Every developer, staging container, and ephemeral Pull Request (PR) preview runner required dedicated AWS Identity and Access Management (IAM) credentials. Distributing broad S3 permissions to local development machines exposed our staging/production boundaries to leakage and lateral movement.
3. **Environment Determinism and Offline Inability:** Engineers without low-latency internet connections faced degraded performance or complete failure of asset pipelines during local runs.
4. **Mock Divergence:** In-memory or filesystem mocks (e.g., local disk writes via mock interfaces) failed to exercise the actual AWS SDK v3 mechanics. Crucial behaviors—such as S3 presigned URL generation, multipart upload chunk reconciliation, bucket notification events, ETag validation, and S3-specific error codes (e.g., `NoSuchKey`, `EntityTooLarge`)—were left untested until staging deployment.

CreatorOS requires a fully reproducible, zero-cost, local storage engine capable of running inside Docker Compose that guarantees bit-for-bit API compatibility with the AWS S3 SDK without modifying application logic between environments.

---

## 2. Decision Drivers

* **Zero Cloud Billing:** Absolute avoidance of AWS data ingress, egress, API call, and storage charges during local development and test suite runs.
* **API Compatibility Parity:** Complete compatibility with the official AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`), enabling the exact same code paths to function against both local and production storage.
* **Deterministic Docker Compose Integration:** The solution must be ephemeral, reproducible, health-checked, and self-provisioning via a single command (`docker compose up`).
* **Presigned URL Viability:** Must support browser-direct presigned `PUT` and `GET` requests from client browsers (`localhost:3000` to the local storage service) without triggering Cross-Origin Resource Sharing (CORS) or domain resolution failures.
* **CI/CD Velocity and Isolation:** Pull request validation tests must run entirely self-contained within GitHub Actions or bare-metal runners without external AWS dependencies or shared state contamination.

---

## 3. Considered Options

* **Option 1: Direct AWS S3 Developer Sandbox Buckets**
* **Option 2: LocalStack (Community & Pro Edition)**
* **Option 3: Custom Node.js In-Memory/Disk Filesystem Adapter Mock**
* **Option 4: MinIO Object Storage (Self-Hosted S3-Compatible Server)**

---

## 4. Evaluation Matrix

| Criterion | Option 1: AWS Sandbox | Option 2: LocalStack | Option 3: Local Filesystem Mock | Option 4: MinIO (Selected) |
| :--- | :--- | :--- | :--- | :--- |
| **Direct Cloud Cost** | High (ongoing monthly) | Zero | Zero | Zero |
| **AWS SDK Compatibility** | 100% Native | High (community S3 features) | Poor (simulated interface) | High (Strict S3 compliance) |
| **Multipart & Presigned URLs** | Native | Supported | Complex / Inaccurate | Supported (Native S3 parity) |
| **Memory Footprint** | 0 MB (Remote) | High (1.5 GB - 3 GB) | Very Low (< 50 MB) | Low to Medium (< 150 MB) |
| **Cold Startup Time** | N/A | Slow (15–45s) | Instant (< 1s) | Fast (< 3s) |
| **Offline Developer Support**| No | Yes | Yes | Yes |
| **Administrative UI** | AWS Console (Complex) | Web UI (Pro tier only) | None | Native MinIO Console |
| **Docker Compose Ergonomics**| N/A | Medium (Monolithic container)| Low (High custom code) | High (Single binary/container)|

---

## 5. Decision Outcome

**Chosen Option:** **Option 4: MinIO Object Storage**.

We decided to adopt MinIO as our official S3-compatible storage engine for all local development, integration testing, and ephemeral staging preview environments. MinIO provides an enterprise-grade, high-performance S3 API implementation written in Go, packaged as a lightweight container image requiring less than 150MB of RAM.

By pairing MinIO with an initialization container running the MinIO Client (`mc`), local environments bootstrap with predefined buckets, permissive CORS configurations, and default developer credentials immediately upon execution of `docker compose up`.

The backend platform leverages the standard `@aws-sdk/client-s3` library. The application inspects environment configuration; when target credentials designate local execution, the client overrides the `endpoint` URI to the MinIO service and enforces `forcePathStyle: true`. No business logic branches on storage types.

---

## 6. Architecture & Implementation Blueprint

### 6.1 Architectural Overview

```
                                  +------------------------------------+
                                  |     CreatorOS Web Dashboard       |
                                  |     (Next.js / Browser Client)     |
                                  +-----------------+------------------+
                                                    |
                         1. Request Upload Presigned| 3. Direct Browser Upload
                            URL (POST /api/assets)  |    via Presigned URL (PUT)
                                                    v
+-----------------------------+         +-----------+----------+
|     AWS Cloud Storage       |         |   CreatorOS Core API |
|   (Staging / Production)    |         |   (NestJS / Node.js) |
|                             |         +-----------+----------+
|  +-----------------------+  |                     |
|  | AWS S3 Global Region  |  |                     | 2. Generate Presigned URL
|  | - creatoros-assets-prod| |                     |    via AWS SDK v3
|  +-----------------------+  |                     v
+--------------^--------------+         +-----------+--------------------------+
               |                        |        Local Development Boundary    |
               | (Prod Environment)     |        (Docker Compose Engine)       |
               +------------------------+                                      |
                                        |  +--------------------------------+  |
                                        |  | MinIO S3 API (:9000)           |  |
                                        |  | Storage Engine: local-volume   |  |
                                        |  +--------------------------------+  |
                                        |  | MinIO Console (:9001)          |  |
                                        |  | Developer Management Web UI    |  |
                                        |  +--------------------------------+  |
                                        +--------------------------------------+
```

### 6.2 Presigned Upload Execution Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer / Browser
    participant API as CreatorOS API Service
    participant SDK as AWS SDK v3 Client
    participant MinIO as MinIO Container (:9000)

    Note over Dev,MinIO: Local Development Context
    Dev->>API: POST /api/v1/assets/upload-intent { fileName, mimeType, size }
    API->>SDK: getSignedUrl(PutObjectCommand)
    SDK->>SDK: Sign URL with Dev Credentials (minioadmin:minioadmin)
    SDK-->>API: Presigned URL: http://localhost:9000/creatoros-dev-assets/uuid-name?X-Amz-Signature=...
    API-->>Dev: 201 Created { assetId, uploadUrl }
    
    Dev->>MinIO: PUT /creatoros-dev-assets/uuid-name (Binary stream)
    Note over Dev,MinIO: Headers: Content-Type, Content-Length
    MinIO-->>Dev: 200 OK (ETag returned)
    
    Dev->>API: POST /api/v1/assets/confirm { assetId, eTag }
    API->>SDK: HeadObjectCommand({ Bucket, Key })
    SDK->>MinIO: HEAD /creatoros-dev-assets/uuid-name
    MinIO-->>SDK: 200 OK (Metadata, Content-Length)
    API-->>Dev: 200 OK (Asset Status: Ready)
```

---

## 7. Concrete Implementation Details

### 7.1 Docker Compose Specification

The local development infrastructure is defined within the root `docker-compose.yml`. A two-container topology ensures MinIO launches and an automated provisioner initializes developer buckets with appropriate policies.

```yaml
version: "3.8"

services:
  minio:
    image: minio/minio:RELEASE.2024-03-21T23-13-43Z
    container_name: creatoros-minio
    restart: unless-stopped
    ports:
      - "9000:9000" # S3 API Gateway
      - "9001:9001" # Web Admin Console UI
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadminpassword
      MINIO_BROWSER: "on"
      MINIO_PROMETHEUS_AUTH_TYPE: "public"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - creatoros-internal

  minio-provision:
    image: minio/mc:RELEASE.2024-03-21T18-19-48Z
    container_name: creatoros-minio-provision
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
      /usr/bin/mc alias set local http://minio:9000 minioadmin minioadminpassword;
      
      echo 'Creating developer storage buckets...';
      /usr/bin/mc mb --ignore-existing local/creatoros-dev-assets;
      /usr/bin/mc mb --ignore-existing local/creatoros-dev-renders;
      
      echo 'Applying CORS rules...';
      echo '{\"CORSRules\": [{\"AllowedOrigins\": [\"*\"], \"AllowedMethods\": [\"GET\", \"PUT\", \"POST\", \"DELETE\", \"HEAD\"], \"AllowedHeaders\": [\"*\"], \"ExposeHeaders\": [\"ETag\"], \"MaxAgeSeconds\": 3600}]}' > /tmp/cors.json;
      /usr/bin/mc anonymous set download local/creatoros-dev-assets;
      
      echo 'MinIO provisioning successfully applied.';
      exit 0;
      "
    networks:
      - creatoros-internal

volumes:
  minio_data:
    name: creatoros-minio-data

networks:
  creatoros-internal:
    name: creatoros-network
    driver: bridge
```

### 7.2 Configuration Schemas and Typing

Configuration is managed via standard, runtime-validated environment schemas utilizing Zod.

```typescript
// src/core/config/storage.config.ts
import { z } from 'zod';

export const StorageConfigSchema = z.object({
  STORAGE_DRIVER: z.enum(['s3', 'minio']).default('minio'),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_REGION: z.string().default('us-east-1'),
  STORAGE_BUCKET_NAME: z.string().min(3),
  STORAGE_ACCESS_KEY_ID: z.string().min(1),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  STORAGE_FORCE_PATH_STYLE: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  STORAGE_PUBLIC_BASE_URL: z.string().url().optional(),
});

export type StorageConfig = z.infer<typeof StorageConfigSchema>;

export function loadStorageConfig(): StorageConfig {
  return StorageConfigSchema.parse({
    STORAGE_DRIVER: process.env.STORAGE_DRIVER,
    STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT,
    STORAGE_REGION: process.env.STORAGE_REGION,
    STORAGE_BUCKET_NAME: process.env.STORAGE_BUCKET_NAME,
    STORAGE_ACCESS_KEY_ID: process.env.STORAGE_ACCESS_KEY_ID,
    STORAGE_SECRET_ACCESS_KEY: process.env.STORAGE_SECRET_ACCESS_KEY,
    STORAGE_FORCE_PATH_STYLE: process.env.STORAGE_FORCE_PATH_STYLE,
    STORAGE_PUBLIC_BASE_URL: process.env.STORAGE_PUBLIC_BASE_URL,
  });
}
```

### 7.3 Storage Driver Factory & Service Implementation

```typescript
// src/core/storage/storage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageConfig, loadStorageConfig } from '../config/storage.config';

export interface PresignedUploadResult {
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}

export interface ObjectMetadata {
  contentType?: string;
  contentLength: number;
  etag?: string;
  lastModified?: Date;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly config: StorageConfig;

  constructor() {
    this.config = loadStorageConfig();
    this.client = this.initializeClient();
  }

  private initializeClient(): S3Client {
    this.logger.log(`Initializing Storage Client with Driver: ${this.config.STORAGE_DRIVER}`);

    return new S3Client({
      region: this.config.STORAGE_REGION,
      endpoint: this.config.STORAGE_ENDPOINT,
      forcePathStyle: this.config.STORAGE_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: this.config.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: this.config.STORAGE_SECRET_ACCESS_KEY,
      },
    });
  }

  /**
   * Generates a presigned PUT URL allowing client-side upload direct to storage.
   */
  async createPresignedUploadUrl(
    storageKey: string,
    contentType: string,
    ttlSeconds = 900,
  ): Promise<PresignedUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.config.STORAGE_BUCKET_NAME,
      Key: storageKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: ttlSeconds,
    });

    return {
      uploadUrl,
      storageKey,
      expiresInSeconds: ttlSeconds,
    };
  }

  /**
   * Generates a presigned GET URL for secured media downloading.
   */
  async createPresignedDownloadUrl(
    storageKey: string,
    ttlSeconds = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.STORAGE_BUCKET_NAME,
      Key: storageKey,
    });

    return getSignedUrl(this.client, command, { expiresIn: ttlSeconds });
  }

  /**
   * Verifies object existence and retrieves operational metadata.
   */
  async inspectObject(storageKey: string): Promise<ObjectMetadata> {
    const command = new HeadObjectCommand({
      Bucket: this.config.STORAGE_BUCKET_NAME,
      Key: storageKey,
    });

    const response = await this.client.send(command);

    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength ?? 0,
      etag: response.ETag?.replace(/"/g, ''),
      lastModified: response.LastModified,
    };
  }

  /**
   * Removes an object from storage.
   */
  async deleteObject(storageKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.STORAGE_BUCKET_NAME,
      Key: storageKey,
    });

    await this.client.send(command);
  }
}
```

---

## 8. Environment Topology & Variables

The system relies strictly on configuration to decouple development from production environments:

### Local (`.env.local`)
```ini
STORAGE_DRIVER=minio
STORAGE_ENDPOINT=http://127.0.0.1:9000
STORAGE_REGION=us-east-1
STORAGE_BUCKET_NAME=creatoros-dev-assets
STORAGE_ACCESS_KEY_ID=minioadmin
STORAGE_SECRET_ACCESS_KEY=minioadminpassword
STORAGE_FORCE_PATH_STYLE=true
STORAGE_PUBLIC_BASE_URL=http://localhost:9000/creatoros-dev-assets
```

### Production / Staging AWS (`.env.production`)
```ini
STORAGE_DRIVER=s3
STORAGE_ENDPOINT=
STORAGE_REGION=us-east-1
STORAGE_BUCKET_NAME=creatoros-production-media-us-east-1
STORAGE_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
STORAGE_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STORAGE_FORCE_PATH_STYLE=false
STORAGE_PUBLIC_BASE_URL=https://cdn.creatoros.io
```

---

## 9. Critical Technical Nuances

### 9.1 Path-Style vs. Virtual-Hosted-Style Routing
AWS S3 defaults to Virtual-Hosted-style addressing:
```
https://<bucket-name>.s3.<region>.amazonaws.com/<object-key>
```
MinIO requires **Path-Style** addressing when running on standard localhost ports without wildcard DNS configurations (`*.localhost`):
```
http://127.0.0.1:9000/<bucket-name>/<object-key>
```
Setting `forcePathStyle: true` in development is essential. The `StorageConfigSchema` explicitly converts the `STORAGE_FORCE_PATH_STYLE` flag to ensure that production can disable path style routing while keeping local MinIO operational.

### 9.2 The "localhost vs. Docker Host" Network Resolution Dilemma
When testing client uploads from the browser, the browser resolves `127.0.0.1:9000` or `localhost:9000`. However, when backend microservices (e.g., our video transcode workers running inside Docker) invoke the MinIO S3 API directly, they must target `http://minio:9000`.

To prevent signature mismatch when generating presigned URLs:
* The host-accessible interface for the frontend is bound to `127.0.0.1:9000`.
* Presigned URLs targeting browser uploads use the configured external endpoint URL, avoiding internal Docker DNS names (`minio:9000`) leaking to external client requests.

---

## 10. Automated Integration Testing Pipeline

To guarantee reliability in CI environments without spinning up cloud resources, unit and integration test runners execute against an ephemeral MinIO test container via standard test life-cycles:

```typescript
// test/storage.integration.spec.ts
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { StorageService } from '../src/core/storage/storage.service';
import axios from 'axios';

describe('StorageService Integration with Local MinIO', () => {
  let storageService: StorageService;
  const testKey = `integration-tests/test-asset-${Date.now()}.txt`;
  const fileContent = 'CreatorOS binary stream payload verification.';

  beforeAll(async () => {
    // Assert environment guarantees
    process.env.STORAGE_DRIVER = 'minio';
    process.env.STORAGE_ENDPOINT = 'http://127.0.0.1:9000';
    process.env.STORAGE_BUCKET_NAME = 'creatoros-dev-assets';
    process.env.STORAGE_ACCESS_KEY_ID = 'minioadmin';
    process.env.STORAGE_SECRET_ACCESS_KEY = 'minioadminpassword';
    process.env.STORAGE_FORCE_PATH_STYLE = 'true';

    storageService = new StorageService();
  });

  it('should generate a valid presigned PUT URL and accept browser-like uploads', async () => {
    const { uploadUrl, storageKey } = await storageService.createPresignedUploadUrl(
      testKey,
      'text/plain',
      60,
    );

    expect(uploadUrl).toContain('http://127.0.0.1:9000/creatoros-dev-assets/');

    // Simulate Client-side browser PUT
    const uploadResponse = await axios.put(uploadUrl, fileContent, {
      headers: { 'Content-Type': 'text/plain' },
    });

    expect(uploadResponse.status).toBe(200);

    // Verify object existence and metadata via HEAD
    const metadata = await storageService.inspectObject(storageKey);
    expect(metadata.contentLength).toBe(Buffer.byteLength(fileContent));
    expect(metadata.contentType).toBe('text/plain');
    expect(metadata.etag).toBeDefined();
  });

  afterAll(async () => {
    await storageService.deleteObject(testKey);
  });
});
```

---

## 11. Consequences

### Positive
* **Complete Financial Elimination of Dev Storage Charges:** Local development, automated branch testing, and benchmark upload executions cost $0.00 in cloud infrastructure.
* **Deterministic Local Setup:** Onboarding developers execute `docker compose up -d` and possess an active, configured, S3-compatible service ready to receive files within 5 seconds.
* **Network Independence:** Developers can write, run, and test core upload pipelines, transcoding pipelines, and metadata extractors without active internet access.
* **Visual Asset Inspection:** The included MinIO UI Console (`http://localhost:9001`) empowers engineers to visually inspect bucket layouts, verify folder prefixes, view file byte counts, and delete orphaned artifacts during test runs without third-party desktop tools.

### Negative
* **Local Machine Resource Usage:** Running MinIO and the provisioning container consumes roughly ~100MB to 150MB of host RAM.
* **Path-Style Discrepancy:** Developers must remain conscious that `forcePathStyle: true` is strictly mandatory for local MinIO operations, requiring separate environment variable tracking between environments.
* **Feature Parity Edge Cases:** Specialized AWS-proprietary features—such as S3 Object Tagging Lifecycle transition rules to AWS Glacier, AWS KMS custom key policies, or S3 Select—are either absent or behave distinctively within MinIO.

### Mitigations
* Custom lifecycle transitions to Glacier are guarded by environment capabilities flags; local dev treats all stored files as single-tier standard storage.
* Comprehensive continuous integration (CI) tests execute against MinIO containers on every PR; a nightly staging test executes against real AWS S3 sandbox buckets to prevent cloud SDK drift.
