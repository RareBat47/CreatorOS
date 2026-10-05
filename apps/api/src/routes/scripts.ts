import { Hono } from "hono";
import type { AppServices } from "../services.js";
import { GenerateScriptRequestSchema } from "../schemas.js";

export function createScriptsRouter(services: AppServices) {
  const router = new Hono();

  // POST /api/v1/scripts/generate
  router.post("/generate", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const parseResult = GenerateScriptRequestSchema.safeParse(body);
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
      selectedHookIndex,
      targetDurationSeconds,
      additionalDirectives,
    } = parseResult.data;

    let creatorMemory = undefined;
    if (creatorId) {
      const retrieved = await services.memoryStore.retrieve({
        creatorId,
        query: topic,
      });
      creatorMemory = retrieved;
    }

    try {
      const councilInput = {
        topic,
        creatorMemory,
        targetDurationSeconds,
        selectedHookIndex,
        additionalDirectives,
      };

      // 1. Brainstorm if no hook is provided
      let hookToUse = selectedHook;
      let brainstormResult = undefined;
      if (!hookToUse) {
        brainstormResult = await services.council.brainstormHooks(councilInput);
        const idx = selectedHookIndex ?? 0;
        hookToUse = brainstormResult.hooks[idx]?.hook || brainstormResult.hooks[0]?.hook || topic;
      }

      // 2. Draft script narrative
      const draft = await services.council.draftScript(councilInput, hookToUse);

      // 3. Critique the drafted script
      const critique = await services.council.critiqueScript(draft, councilInput);

      return c.json({
        success: true,
        topic,
        creatorId: creatorId ?? null,
        selectedHook: hookToUse,
        brainstorm: brainstormResult,
        draft,
        critique,
      });
    } catch (err) {
      return c.json(
        {
          error: "Failed to generate script",
          message: err instanceof Error ? err.message : String(err),
        },
        500
      );
    }
  });

  return router;
}
