import { Hono } from "hono";
import type { AppServices } from "../services.js";
import { RenderJobRequestSchema, type RenderJobRecord } from "../schemas.js";

export function createRendersRouter(services: AppServices) {
  const router = new Hono();

  // POST /api/v1/renders/jobs
  router.post("/jobs", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const parseResult = RenderJobRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        400
      );
    }

    const {
      sceneSpec,
      sceneSpecId,
      compositionId = "TalkingHead",
      outputFormat = "mp4",
      webhookUrl,
      simulateFailure,
    } = parseResult.data;

    const resolvedSceneId = sceneSpec?.sceneId || sceneSpecId || `scene_${Date.now()}`;
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const jobRecord: RenderJobRecord = {
      jobId,
      status: "queued",
      progress: 0,
      outputFormat,
      compositionId,
      estimatedWaitSeconds: 15,
      createdAt: new Date().toISOString(),
    };

    services.renderJobs.set(jobId, jobRecord);

    // Simulate CLI render / async rendering workflow
    // Queued -> rendering (progress updates) -> completed or failed
    if (simulateFailure) {
      setTimeout(() => {
        jobRecord.status = "failed";
        jobRecord.error = "Rendering failed during video compositing stage";
        jobRecord.completedAt = new Date().toISOString();
      }, 50);
    } else {
      setTimeout(() => {
        jobRecord.status = "rendering";
        jobRecord.progress = 50;
      }, 25);

      setTimeout(() => {
        jobRecord.status = "completed";
        jobRecord.progress = 100;
        jobRecord.downloadUrl = `https://storage.creatoros.app/renders/${resolvedSceneId}.${outputFormat}`;
        jobRecord.completedAt = new Date().toISOString();
      }, 75);
    }

    return c.json(
      {
        success: true,
        jobId,
        sceneSpecId: resolvedSceneId,
        status: "queued",
        estimatedWaitSeconds: 15,
        compositionId,
        outputFormat,
        webhookUrl: webhookUrl ?? null,
      },
      202
    );
  });

  // GET /api/v1/renders/jobs/:id
  router.get("/jobs/:id", async (c) => {
    const jobId = c.req.param("id");
    const job = services.renderJobs.get(jobId);

    if (!job) {
      return c.json(
        {
          error: `Render job '${jobId}' not found`,
        },
        404
      );
    }

    return c.json({
      success: true,
      ...job,
    });
  });

  return router;
}
