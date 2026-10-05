import { Hono } from "hono";
import type { AppServices } from "../services.js";
import { RepurposeRequestSchema } from "../schemas.js";
import { RepurposingPackageSchema, type RepurposingPackage } from "@creatoros/scene-schema";

export function createRepurposeRouter(services: AppServices) {
  const router = new Hono();

  // POST /api/v1/repurpose
  router.post("/", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const parseResult = RepurposeRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        400
      );
    }

    const { creatorId, topic, scriptText, coreInsights, callToAction } = parseResult.data;

    let tone = "Direct, engaging, authentic";
    if (creatorId) {
      const stable = await services.memoryStore.getStableMemory(creatorId);
      if (stable?.voice?.tone) {
        tone = Array.isArray(stable.voice.tone)
          ? stable.voice.tone.join(", ")
          : stable.voice.tone;
      }
    }

    const prompt = `You are the Cross-Platform Repurposing Engine for CreatorOS.
Transform the following short-form content into a cohesive, high-converting multi-platform package.

Topic: ${topic}
${scriptText ? `Script / Spoken Text: ${scriptText}\n` : ""}
${coreInsights?.length ? `Core Insights: ${coreInsights.join("; ")}\n` : ""}
${callToAction ? `Call To Action: ${callToAction}\n` : ""}
Tone: ${tone}

Requirements:
1. shortFormVideo: title, caption, hashtags (at least 3), platformVariants for tiktok, reels, shorts, callToAction
2. twitterThread: hookTweet, tweets array (3-6 punchy tweets), ctaTweet
3. linkedinPost: hook, content, takeaways array, cta, hashtags
4. newsletterExcerpt: subjectLine, previewText, body, callToAction
5. quotePosts: array of 2-3 standout quotes
6. followUpVideoIdeas: array of 2-3 follow-up topic ideas

Return JSON matching RepurposingPackageSchema:
{
  "shortFormVideo": {
    "title": "string",
    "caption": "string",
    "description": "string",
    "hashtags": ["#tag1", "#tag2", "#tag3"],
    "soundRecommendation": "string",
    "platformVariants": {
      "tiktok": { "caption": "string", "hashtags": ["string"] },
      "reels": { "caption": "string", "hashtags": ["string"] },
      "shorts": { "caption": "string", "hashtags": ["string"] }
    },
    "callToAction": "string"
  },
  "twitterThread": {
    "hookTweet": "string",
    "tweets": ["string", "string", "string"],
    "ctaTweet": "string"
  },
  "linkedinPost": {
    "hook": "string",
    "content": "string",
    "takeaways": ["string"],
    "cta": "string",
    "hashtags": ["string"]
  },
  "newsletterExcerpt": {
    "subjectLine": "string",
    "previewText": "string",
    "body": "string",
    "callToAction": "string"
  },
  "quotePosts": ["string", "string"],
  "followUpVideoIdeas": ["string", "string"]
}`;

    try {
      const packageResult = await services.router.executeTaskJson<RepurposingPackage>(
        "scriptwriting",
        prompt,
        RepurposingPackageSchema
      );

      return c.json({
        success: true,
        topic,
        creatorId: creatorId ?? null,
        repurposingPackage: packageResult,
      });
    } catch (err) {
      return c.json(
        {
          error: "Failed to generate repurposing package",
          message: err instanceof Error ? err.message : String(err),
        },
        500
      );
    }
  });

  return router;
}
