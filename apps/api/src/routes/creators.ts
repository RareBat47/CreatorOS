import { Hono } from "hono";
import type { AppServices } from "../services.js";
import { CreateCreatorRequestSchema } from "../schemas.js";
import type { StableMemory } from "@creatoros/creator-memory";

export function createCreatorsRouter(services: AppServices) {
  const router = new Hono();

  // POST /api/v1/creators
  router.post("/", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const parseResult = CreateCreatorRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        400
      );
    }

    const { profile, stableMemory } = parseResult.data;
    const creatorId =
      (profile && "creatorId" in profile && profile.creatorId) ||
      (stableMemory && "creatorId" in stableMemory && stableMemory.creatorId) ||
      `creator_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Build or normalize stable memory to save in memoryStore
    let memoryToSave: StableMemory;

    if (stableMemory) {
      memoryToSave = {
        ...stableMemory,
        creatorId,
      };
    } else if (profile) {
      memoryToSave = {
        creatorId,
        identity: {
          name: profile.name,
          niche: profile.niche,
          audience: profile.audience,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          primaryPlatforms: profile.primaryPlatforms ?? [],
          goals: [],
        },
        voice: {
          tone: profile.tone,
          forbiddenPhrases: profile.forbiddenPhrases ?? [],
          vocabulary: [],
          sentenceLength: "mixed",
          energy: "balanced",
          humorLevel: 5,
          directness: 8,
        },
        pillars: profile.pillars,
        visualStyle: profile.visualStyle,
        bannedWords: profile.bannedWords ?? [],
        forbiddenPhrases: profile.forbiddenPhrases ?? [],
        favoriteHooks: profile.favoriteHooks ?? [],
        brandRules: [],
        opinions: profile.opinions ?? [],
        personalStories: profile.personalStories ?? [],
        proofPoints: [],
        updatedAt: new Date().toISOString(),
      };
    } else {
      return c.json({ error: "Missing creator data" }, 400);
    }

    await services.memoryStore.setStableMemory(creatorId, memoryToSave);

    return c.json(
      {
        success: true,
        creatorId,
        creator: memoryToSave,
      },
      201
    );
  });

  // GET /api/v1/creators/:id
  router.get("/:id", async (c) => {
    const creatorId = c.req.param("id");
    const memory = await services.memoryStore.getStableMemory(creatorId);

    if (!memory) {
      return c.json(
        {
          error: `Creator with ID '${creatorId}' not found`,
        },
        404
      );
    }

    return c.json({
      success: true,
      creatorId,
      creator: memory,
    });
  });

  return router;
}
