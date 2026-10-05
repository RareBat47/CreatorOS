import { Hono } from "hono";
import type { AppServices } from "../services.js";
import { ExpandIdeaRequestSchema } from "../schemas.js";

export function createIdeasRouter(services: AppServices) {
  const router = new Hono();

  // POST /api/v1/ideas/expand
  router.post("/expand", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const parseResult = ExpandIdeaRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        400
      );
    }

    const { creatorId, topic, additionalDirectives, hookCount, targetAudience } = parseResult.data;

    // Retrieve creator memory if creatorId is specified
    let creatorMemory = undefined;
    if (creatorId) {
      const stable = await services.memoryStore.getStableMemory(creatorId);
      if (stable) {
        creatorMemory = stable;
      }
    }

    try {
      const result = await services.council.brainstormHooks({
        topic,
        creatorMemory,
        hookCount,
        additionalDirectives: [
          additionalDirectives,
          targetAudience ? `Target audience: ${targetAudience}` : undefined,
        ]
          .filter(Boolean)
          .join(". "),
      });

      return c.json({
        success: true,
        topic,
        creatorId: creatorId ?? null,
        ideas: result,
      });
    } catch (err) {
      return c.json(
        {
          error: "Failed to expand idea",
          message: err instanceof Error ? err.message : String(err),
        },
        500
      );
    }
  });

  return router;
}
