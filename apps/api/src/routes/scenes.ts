import { Hono } from "hono";
import type { AppServices } from "../services.js";
import { PlanSceneRequestSchema } from "../schemas.js";

export function createScenesRouter(services: AppServices) {
  const router = new Hono();

  // POST /api/v1/scenes/plan
  router.post("/plan", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const parseResult = PlanSceneRequestSchema.safeParse(body);
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
      creatorId,
      topic,
      selectedHook,
      targetDurationSeconds,
      fps,
      format,
      preferredLayout,
      additionalDirectives,
    } = parseResult.data;

    let creatorMemory = undefined;
    let creatorProfile = undefined;
    if (creatorId) {
      const stable = await services.memoryStore.getStableMemory(creatorId);
      if (stable) {
        creatorMemory = stable;
      }
    }

    try {
      const councilInput = {
        topic,
        creatorMemory,
        creatorProfile,
        targetDurationSeconds,
        fps,
        format,
        preferredLayout,
        additionalDirectives,
      };

      // 1. Hook selection or brainstorm
      let hookToUse = selectedHook;
      let brainstormResult = undefined;
      if (!hookToUse) {
        brainstormResult = await services.council.brainstormHooks(councilInput);
        hookToUse = brainstormResult.hooks[0]?.hook || topic;
      }

      // 2. Draft script narrative
      const draft = await services.council.draftScript(councilInput, hookToUse);

      // 3. Critique the drafted script
      const critique = await services.council.critiqueScript(draft, councilInput);

      // 4. Generate & Validate Remotion SceneSpec
      const scenePlan = await services.council.generateAndValidateSceneSpec(
        draft,
        critique,
        councilInput
      );

      return c.json({
        success: true,
        topic,
        creatorId: creatorId ?? null,
        brainstorm: brainstormResult,
        draft,
        critique,
        sceneSpec: scenePlan.sceneSpec,
        validation: scenePlan.validationReport,
      });
    } catch (err) {
      return c.json(
        {
          error: "Failed to plan scene",
          message: err instanceof Error ? err.message : String(err),
        },
        500
      );
    }
  });

  return router;
}
