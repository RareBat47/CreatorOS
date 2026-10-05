import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";
import { ModelRouter, ModelCouncil, ModelClient } from "@creatoros/model-router";
import { InMemoryCreatorMemoryStore } from "@creatoros/creator-memory";

// Helper to make test requests to Hono app without starting an HTTP server
async function req(
  app: ReturnType<typeof createApp>["app"],
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
) {
  const init: RequestInit = {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  };
  if (options.body) {
    init.body = JSON.stringify(options.body);
  }
  return app.request(path, init);
}

describe("@creatoros/api Integration Tests", () => {
  let app: ReturnType<typeof createApp>["app"];
  let services: ReturnType<typeof createApp>["services"];

  // Mock responses for AI tasks
  const mockHooksJson = JSON.stringify({
    hooks: [
      {
        hook: "Why 99% of creator funnels fail in the first 5 seconds.",
        category: "curiosity",
        angle: "High-contrast hook challenging creator assumptions",
        estimatedRetentionScore: 94,
        rationale: "Creates immediate curiosity gap",
      },
    ],
    refinedTopic: "The 5-Second Creator Funnel Rule",
    anglesConsidered: ["Curiosity gap", "Contrarian breakdown"],
  });

  const mockDraftJson = JSON.stringify({
    title: "The 5-Second Creator Funnel Rule",
    selectedHook: "Why 99% of creator funnels fail in the first 5 seconds.",
    fullScript:
      "Why 99% of creator funnels fail in the first 5 seconds. Most creators waste the intro saying hi. Instead, punch them with the single biggest bottleneck immediately. Structure your hook, deliver 2 insights, and hit follow for more.",
    sections: [
      {
        sectionType: "hook",
        spokenText: "Why 99% of creator funnels fail in the first 5 seconds.",
        visualNotes: "Punchy zoom-in on presenter",
        estimatedDurationSeconds: 4,
      },
      {
        sectionType: "core_value",
        spokenText: "Most creators waste the intro saying hi. Instead, punch them with the single biggest bottleneck immediately.",
        visualNotes: "Kinetic text overlay",
        estimatedDurationSeconds: 20,
      },
      {
        sectionType: "cta",
        spokenText: "Hit follow for more creator breakdowns.",
        visualNotes: "Follow badge card",
        estimatedDurationSeconds: 5,
      },
    ],
    ctaText: "Hit follow for more creator breakdowns.",
    estimatedDurationSeconds: 29,
  });

  const mockCritiqueJson = JSON.stringify({
    scores: {
      retentionPrediction: 91,
      brandConsistencyScore: 95,
      clarityScore: 92,
      productionFeasibilityScore: 94,
      compositeScore: 93,
    },
    strengths: ["Fast hook", "Clear actionable advice"],
    weaknesses: [],
    recommendations: ["Ensure captions highlight key verbs"],
    brandRuleViolations: [],
    approved: true,
    critiqueSummary: "Strong retention pacing with zero forbidden terms.",
  });

  const mockSceneSpecJson = JSON.stringify({
    sceneId: "scene_test_123",
    layout: "talking-head",
    durationInFrames: 900,
    fps: 30,
    hook: "Why 99% of creator funnels fail in the first 5 seconds.",
    visualLayers: [],
    captions: [],
    audioTrack: {
      voiceoverText: "Why 99% of creator funnels fail in the first 5 seconds.",
    },
    cameraMotion: { type: "zoom-in" },
    transition: { type: "cut" },
    scenes: [
      {
        id: "sc_1",
        startFrame: 0,
        durationInFrames: 120,
        type: "hook",
        text: "Why 99% of creator funnels fail in the first 5 seconds.",
      },
      {
        id: "sc_2",
        startFrame: 120,
        durationInFrames: 660,
        type: "talking_head",
      },
      {
        id: "sc_3",
        startFrame: 780,
        durationInFrames: 120,
        type: "cta",
        text: "Hit follow for more creator breakdowns.",
      },
    ],
    metadata: {
      title: "The 5-Second Creator Funnel Rule",
      cta: "Hit follow for more creator breakdowns.",
      hashtags: ["#creators", "#growth"],
    },
  });

  const mockRepurposeJson = JSON.stringify({
    shortFormVideo: {
      title: "The 5-Second Creator Funnel Rule",
      caption: "Stop losing 70% of viewers in your intro.",
      description: "How to fix your retention curve in 5 seconds.",
      hashtags: ["#contentstrategy", "#creators", "#growth"],
      soundRecommendation: "Subtle upbeat lo-fi",
      platformVariants: {
        tiktok: { caption: "Stop losing viewers!", hashtags: ["#tiktokgrowth"] },
        reels: { caption: "The 5-Second retention trick", hashtags: ["#reelsstrategy"] },
        shorts: { caption: "Fix your hooks today", hashtags: ["#shorts"] },
      },
      callToAction: "Follow for daily growth tips",
    },
    twitterThread: {
      hookTweet: "99% of creator funnels fail in the first 5 seconds. Here is why (and how to fix it): 🧵",
      tweets: [
        "1/ Most creators spend the first 3 seconds introducing themselves.",
        "2/ Your viewer has already scrolled away. Start in media res.",
        "3/ Actionable takeaway: State the outcome or pain point before saying your name.",
      ],
      ctaTweet: "If you found this valuable, repost the first tweet to help others.",
    },
    linkedinPost: {
      hook: "Why 99% of creator funnels fail before they even start.",
      content:
        "The hardest metric in short-form video is 3-second hold rate. If you cannot capture attention immediately, great insights will never be seen.",
      takeaways: [
        "Skip conversational fluff in the intro.",
        "Deliver clear bottleneck analysis.",
        "Provide a single actionable pivot.",
      ],
      cta: "What hook style works best for your audience? Let's discuss in the comments.",
      hashtags: ["#CreatorEconomy", "#ContentMarketing", "#Retention"],
    },
    newsletterExcerpt: {
      subjectLine: "The 5-second funnel rule you need to know",
      previewText: "Why introductory fluff is killing your completion rate.",
      body: "Most creators think viewers stay for background context. Data shows the opposite...",
      callToAction: "Read full breakdown on CreatorOS",
    },
    quotePosts: [
      "Viewers don't scroll away from bad content; they scroll away from delayed value.",
    ],
    followUpVideoIdeas: [
      "Top 3 audio transitions that keep viewers hooked after frame 90.",
    ],
  });

  beforeEach(() => {
    // Setup Mock Fetch for ModelClient
    const mockFetch = async (_url: unknown, options: any) => {
      const body = JSON.parse(options?.body || "{}");
      const prompt = body?.messages?.map((m: any) => m.content).join(" ") || "";

      let responseContent = "{}";

      if (prompt.includes("Brainstormer") || prompt.includes("viral, high-converting")) {
        responseContent = mockHooksJson;
      } else if (prompt.includes("Scriptwriter") && !prompt.includes("Scene Planner")) {
        responseContent = mockDraftJson;
      } else if (prompt.includes("Lead Critic")) {
        responseContent = mockCritiqueJson;
      } else if (prompt.includes("Scene Planner") || prompt.includes("SceneSpec JSON")) {
        responseContent = mockSceneSpecJson;
      } else if (prompt.includes("Repurposing Engine") || prompt.includes("Cross-Platform")) {
        responseContent = mockRepurposeJson;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: "chatcmpl-mock",
          model: "mock-model",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: responseContent,
              },
            },
          ],
        }),
      };
    };

    const client = new ModelClient({
      environment: "dev",
      fetch: mockFetch as any,
    });
    const router = new ModelRouter({}, client);
    const council = new ModelCouncil(router);
    const memoryStore = new InMemoryCreatorMemoryStore();

    const created = createApp({
      client: undefined as any,
      router,
      council,
      memoryStore,
    });

    app = created.app;
    services = created.services;
  });

  describe("GET /health", () => {
    it("returns 200 and healthy service status", async () => {
      const res = await req(app, "/health");
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe("ok");
      expect(data.services.memoryStore).toBe("ready");
      expect(data.services.modelRouter).toBe("ready");
      expect(data.services.council).toBe("ready");
    });
  });

  describe("Creators API: POST & GET /api/v1/creators", () => {
    it("creates a creator profile and retrieves it by id", async () => {
      const profilePayload = {
        profile: {
          creatorId: "cr_alex_123",
          name: "Alex Growth",
          niche: "SaaS & Growth",
          audience: "Bootstrapped founders and technical solopreneurs",
          tone: ["direct", "punchy"],
          pillars: ["Growth Experiments", "Retention Tactics"],
          visualStyle: {
            primaryColor: "#000000",
            fontFamily: "Inter",
          },
          bannedWords: ["synergy"],
          forbiddenPhrases: ["game changer"],
        },
      };

      const createRes = await req(app, "/api/v1/creators", {
        method: "POST",
        body: profilePayload,
      });

      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      expect(createData.success).toBe(true);
      expect(createData.creatorId).toBe("cr_alex_123");
      expect(createData.creator.identity.name).toBe("Alex Growth");

      // Verify retrieval
      const getRes = await req(app, "/api/v1/creators/cr_alex_123");
      expect(getRes.status).toBe(200);
      const getData = await getRes.json();
      expect(getData.creatorId).toBe("cr_alex_123");
      expect(getData.creator.identity.name).toBe("Alex Growth");
      expect(getData.creator.bannedWords).toContain("synergy");
    });

    it("returns 404 when creator does not exist", async () => {
      const res = await req(app, "/api/v1/creators/cr_nonexistent");
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain("not found");
    });

    it("returns 400 when invalid payload is sent", async () => {
      const res = await req(app, "/api/v1/creators", {
        method: "POST",
        body: {},
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/ideas/expand", () => {
    it("expands a topic into hook variants via ModelCouncil brainstorm", async () => {
      const res = await req(app, "/api/v1/ideas/expand", {
        method: "POST",
        body: {
          topic: "Retention funnels in short-form video",
          hookCount: 3,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.ideas.hooks).toHaveLength(1);
      expect(data.ideas.hooks[0].hook).toContain("first 5 seconds");
    });

    it("returns 400 if topic is missing", async () => {
      const res = await req(app, "/api/v1/ideas/expand", {
        method: "POST",
        body: {},
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/scripts/generate", () => {
    it("generates and critiques a script narrative", async () => {
      const res = await req(app, "/api/v1/scripts/generate", {
        method: "POST",
        body: {
          topic: "Retention funnels in short-form video",
          targetDurationSeconds: 30,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.draft.title).toBe("The 5-Second Creator Funnel Rule");
      expect(data.draft.sections).toBeInstanceOf(Array);
      expect(data.critique.approved).toBe(true);
      expect(data.critique.scores.compositeScore).toBeGreaterThanOrEqual(90);
    });
  });

  describe("POST /api/v1/scenes/plan", () => {
    it("plans a SceneSpec and validates against @creatoros/scene-schema", async () => {
      const res = await req(app, "/api/v1/scenes/plan", {
        method: "POST",
        body: {
          topic: "Retention funnels in short-form video",
          targetDurationSeconds: 30,
          fps: 30,
          preferredLayout: "talking-head",
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.sceneSpec).toBeDefined();
      expect(data.sceneSpec.sceneId).toBe("scene_test_123");
      expect(data.sceneSpec.layout).toBe("talking-head");
      expect(data.validation).toBeDefined();
      expect(data.validation.isValid).toBe(true);
    });
  });

  describe("POST & GET /api/v1/renders/jobs", () => {
    it("queues a render job and queries its status", async () => {
      const createRes = await req(app, "/api/v1/renders/jobs", {
        method: "POST",
        body: {
          sceneSpecId: "scene_test_123",
          compositionId: "TalkingHead",
          outputFormat: "mp4",
        },
      });

      expect(createRes.status).toBe(202);
      const createData = await createRes.json();
      expect(createData.success).toBe(true);
      expect(createData.jobId).toBeDefined();
      expect(createData.status).toBe("queued");

      // Query job status immediately
      const getRes = await req(app, `/api/v1/renders/jobs/${createData.jobId}`);
      expect(getRes.status).toBe(200);
      const getData = await getRes.json();
      expect(getData.jobId).toBe(createData.jobId);
      expect(getData.compositionId).toBe("TalkingHead");
    });

    it("returns 404 for unknown job ID", async () => {
      const res = await req(app, "/api/v1/renders/jobs/job_unknown_999");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/v1/repurpose", () => {
    it("generates a cross-platform repurposing package", async () => {
      const res = await req(app, "/api/v1/repurpose", {
        method: "POST",
        body: {
          topic: "The 5-Second Creator Funnel Rule",
          scriptText:
            "Why 99% of creator funnels fail in the first 5 seconds. Most creators waste the intro saying hi.",
          coreInsights: ["Hook fast", "Deliver value immediately"],
          callToAction: "Follow for daily growth tips",
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.repurposingPackage).toBeDefined();
      expect(data.repurposingPackage.shortFormVideo.title).toBe("The 5-Second Creator Funnel Rule");
      expect(data.repurposingPackage.twitterThread.tweets.length).toBeGreaterThanOrEqual(1);
      expect(data.repurposingPackage.linkedinPost.content).toBeDefined();
      expect(data.repurposingPackage.newsletterExcerpt.subjectLine).toBeDefined();
    });
  });
});
