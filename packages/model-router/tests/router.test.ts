import { describe, it, expect, vi } from "vitest";
import {
  ModelClient,
  DEV_ANTIGRAVITY_DEFAULT_URL,
  PROD_DASHSCOPE_DEFAULT_URL,
  cleanJsonString,
} from "../src/client.js";
import {
  ModelRouter,
  DEFAULT_ROUTING_TABLE,
} from "../src/router.js";
import {
  ModelCouncil,
  extractMemoryContext,
} from "../src/council.js";
import {
  RoutingTaskSchema,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
} from "../src/types.js";
import type { StableMemory } from "@creatoros/creator-memory";

describe("ModelClient", () => {
  it("defaults to dev environment targeting Antigravity gateway", () => {
    delete process.env.ANTIGRAVITY_BASE_URL;
    const client = new ModelClient({ environment: "dev" });
    expect(client.getEnvironment()).toBe("dev");
    expect(client.getBaseUrl()).toBe(DEV_ANTIGRAVITY_DEFAULT_URL);
  });

  it("respects ANTIGRAVITY_BASE_URL environment variable in dev", () => {
    const orig = process.env.ANTIGRAVITY_BASE_URL;
    process.env.ANTIGRAVITY_BASE_URL = "http://localhost:9999/v1/";
    const client = new ModelClient({ environment: "dev" });
    expect(client.getBaseUrl()).toBe("http://localhost:9999/v1");
    if (orig) process.env.ANTIGRAVITY_BASE_URL = orig;
    else delete process.env.ANTIGRAVITY_BASE_URL;
  });

  it("defaults to prod environment targeting DashScope compatible endpoints", () => {
    delete process.env.DASHSCOPE_BASE_URL;
    delete process.env.OPENAI_BASE_URL;
    const client = new ModelClient({ environment: "prod" });
    expect(client.getEnvironment()).toBe("prod");
    expect(client.getBaseUrl()).toBe(PROD_DASHSCOPE_DEFAULT_URL);
  });

  it("handles custom baseUrl and apiKey overrides", () => {
    const client = new ModelClient({
      environment: "prod",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "sk-test-key",
    });
    expect(client.getBaseUrl()).toBe("https://api.openai.com/v1");
    expect(client.getApiKey()).toBe("sk-test-key");
  });

  it("strips markdown code blocks correctly with cleanJsonString", () => {
    const jsonStr = '{\n  "hello": "world"\n}';
    expect(cleanJsonString(`\`\`\`json\n${jsonStr}\n\`\`\``)).toBe(jsonStr);
    expect(cleanJsonString(`\`\`\`\n${jsonStr}\n\`\`\``)).toBe(jsonStr);
    expect(cleanJsonString(jsonStr)).toBe(jsonStr);
  });

  it("executes chat completions via custom fetch adapter", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async (): Promise<ChatCompletionResponse> => ({
        id: "chatcmpl-test",
        model: "qwen3.7-flash",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: '{"success": true}',
            },
          },
        ],
      }),
    });

    const client = new ModelClient({
      environment: "dev",
      fetch: mockFetch as unknown as typeof fetch,
    });

    const result = await client.createChatCompletion("qwen3.7-flash", [
      { role: "user", content: "ping" },
    ]);

    expect(result).toBe('{"success": true}');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0]?.[0]).toBe("http://127.0.0.1:8999/v1/chat/completions");
  });
});

describe("ModelRouter", () => {
  it("validates all 6 routing tasks according to Section 5", () => {
    const validTasks = [
      "strategy",
      "brainstorm",
      "scriptwriting",
      "multimodal",
      "critique",
      "validation",
    ];

    for (const task of validTasks) {
      expect(RoutingTaskSchema.safeParse(task).success).toBe(true);
      expect(DEFAULT_ROUTING_TABLE[task as keyof typeof DEFAULT_ROUTING_TABLE]).toBeDefined();
    }
  });

  it("maps primary models according to Section 5 & 6 recommendations", () => {
    const router = new ModelRouter({ clientConfig: { environment: "prod" } });
    expect(router.getModelForTask("strategy")).toBe("qwen/qwen3.8-max:free");
    expect(router.getModelForTask("brainstorm")).toBe("qwen/qwen3.7-flash:free");
    expect(router.getModelForTask("scriptwriting")).toBe("qwen/qwen3.7-plus:free");
    expect(router.getModelForTask("multimodal")).toBe("qwen/qwen3-vl-plus:free");
    expect(router.getModelForTask("critique")).toBe("qwen/qwen3.6-max-preview:free");
    expect(router.getModelForTask("validation")).toBe("qwen/qwen3.6-27b:free");
  });

  it("maps primary models to local Gemini in dev environment", () => {
    const router = new ModelRouter({ clientConfig: { environment: "dev" } });
    expect(router.getModelForTask("strategy")).toBe("gemini-3.8-flash-high");
    expect(router.getModelForTask("brainstorm")).toBe("gemini-3.8-flash-high");
  });

  it("allows custom overrides for task models and temperatures", () => {
    const router = new ModelRouter({
      modelOverrides: {
        scriptwriting: "qwen/qwen3.6-plus:free",
      },
      customRouting: {
        brainstorm: {
          defaultTemperature: 0.95,
        },
      },
    });

    expect(router.getModelForTask("scriptwriting")).toBe("qwen/qwen3.6-plus:free");
    expect(router.getRoutingConfig("brainstorm")?.defaultTemperature).toBe(0.95);
  });

  it("executes fallback model on primary failure", async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async (_url, options) => {
      callCount++;
      const body = JSON.parse(options.body as string) as ChatCompletionRequest;

      // Fail on primary model qwen/qwen3.7-flash:free
      if (body.model === "qwen/qwen3.7-flash:free") {
        return {
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          text: async () => "Rate limit exceeded",
        };
      }

      // Succeed on fallback model qwen/qwen3.5-flash:free
      return {
        ok: true,
        json: async (): Promise<ChatCompletionResponse> => ({
          id: "chatcmpl-fallback",
          model: body.model,
          choices: [
            {
              message: {
                role: "assistant",
                content: JSON.stringify({ recovered: true, model: body.model }),
              },
            },
          ],
        }),
      };
    });

    const client = new ModelClient({ fetch: mockFetch as unknown as typeof fetch, environment: "prod" });
    const router = new ModelRouter({}, client);

    const result = await router.executeTaskJson<{ recovered: boolean; model: string }>(
      "brainstorm",
      "Generate 3 hooks"
    );

    expect(result.recovered).toBe(true);
    expect(result.model).toBe("qwen/qwen3.5-flash:free");
    expect(callCount).toBe(2);
  });
});

describe("ModelCouncil Architecture", () => {
  const mockStableMemory: StableMemory = {
    creatorId: "creator-test",
    identity: {
      name: "Sam Tech",
      niche: "AI Video",
      audience: {
        target: "Video editors and founders",
        painPoints: ["Slow rendering", "Scriptwriter block"],
        desires: ["Automated creation"],
      },
      goals: ["100k subscribers"],
      primaryPlatforms: ["tiktok", "youtube"],
    },
    voice: {
      tone: ["punchy", "direct"],
      sentenceLength: "short",
      energy: "high",
      humorLevel: 4,
      directness: 9,
      vocabulary: ["automation", "render"],
      forbiddenPhrases: ["game changer", "revolutionary", "delve into"],
    },
    pillars: ["Video AI", "Automated Editing"],
    visualStyle: {
      primaryColor: "#111827",
      secondaryColor: "#3B82F6",
      accentColor: "#F59E0B",
      fontFamily: "Inter",
    },
    bannedWords: ["revolutionary", "synergy"],
    forbiddenPhrases: ["game changer"],
    brandRules: [
      {
        rule: "Always end with an actionable CTA",
        category: "cta",
        enforceStrictly: true,
        createdAt: new Date().toISOString(),
      },
    ],
    favoriteHooks: ["Stop editing videos by hand in 2026."],
    opinions: [],
    personalStories: [],
    proofPoints: [],
    updatedAt: new Date().toISOString(),
  };

  it("extractMemoryContext properly aggregates memory rules and forbidden phrases", () => {
    const extracted = extractMemoryContext(mockStableMemory);
    expect(extracted.name).toBe("Sam Tech");
    expect(extracted.forbiddenPhrases).toContain("game changer");
    expect(extracted.bannedWords).toContain("revolutionary");
    expect(extracted.brandRules).toContain("Always end with an actionable CTA");
    expect(extracted.favoriteHooks).toContain("Stop editing videos by hand in 2026.");
  });

  it("detects forbidden phrases during critique evaluation", async () => {
    const mockNarrative = {
      title: "How to Automate Remotion",
      selectedHook: "This revolutionary tool is a game changer for video",
      fullScript:
        "This revolutionary tool is a game changer for video. In 3 steps you can automate your timeline.",
      sections: [
        {
          sectionType: "hook",
          spokenText: "This revolutionary tool is a game changer for video.",
          estimatedDurationSeconds: 4,
        },
        {
          sectionType: "core_value",
          spokenText: "In 3 steps you can automate your timeline.",
          estimatedDurationSeconds: 12,
        },
      ],
      ctaText: "Follow for more Remotion tips.",
      estimatedDurationSeconds: 16,
    };

    const mockFetch = vi.fn().mockImplementation(async (_url, options) => {
      const body = JSON.parse(options.body as string) as ChatCompletionRequest;
      return {
        ok: true,
        json: async (): Promise<ChatCompletionResponse> => ({
          id: "critique-test",
          model: body.model || "qwen/qwen3.6-max-preview:free",
          choices: [
            {
              message: {
                role: "assistant",
                content: JSON.stringify({
                  scores: {
                    retentionPrediction: 80,
                    brandConsistencyScore: 85,
                    clarityScore: 90,
                    productionFeasibilityScore: 95,
                    compositeScore: 88,
                  },
                  strengths: ["Fast start"],
                  weaknesses: [],
                  recommendations: [],
                  forbiddenWordsFound: [],
                  brandRuleViolations: [],
                  approved: true,
                  critiqueSummary: "Good script",
                }),
              },
            },
          ],
        }),
      };
    });

    const client = new ModelClient({ fetch: mockFetch as unknown as typeof fetch, environment: "prod" });
    const router = new ModelRouter({}, client);
    const council = new ModelCouncil(router);

    const critique = await council.critiqueScript(mockNarrative, {
      topic: "Automating Remotion",
      creatorMemory: mockStableMemory,
    });

    expect(critique.forbiddenWordsFound).toContain("game changer");
    expect(critique.forbiddenWordsFound).toContain("revolutionary");
    // Should NOT be approved because forbidden phrases were found
    expect(critique.approved).toBe(false);
  });

  it("validates valid SceneSpec and catches timing discrepancies", () => {
    const council = new ModelCouncil();

    const validSpec = {
      sceneId: "scene_001",
      layout: "talking-head",
      durationInFrames: 900,
      fps: 30,
      hook: "Stop editing videos manually.",
      audioTrack: {
        voiceoverText: "Stop editing videos manually. Use programmatic rendering.",
      },
      scenes: [
        {
          id: "hook_1",
          startFrame: 0,
          durationInFrames: 150,
          type: "hook",
          text: "Stop editing videos manually.",
        },
        {
          id: "body_1",
          startFrame: 150,
          durationInFrames: 650,
          type: "talking_head",
        },
        {
          id: "cta_1",
          startFrame: 800,
          durationInFrames: 100,
          type: "cta",
          text: "Try it today.",
        },
      ],
      metadata: {
        title: "Automate Editing",
        cta: "Try it today.",
      },
    };

    const report = council.validateSceneSpec(validSpec, 30, 30);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.hasCta).toBe(true);
    expect(report.durationCheck.withinTolerance).toBe(true);
    expect(report.durationCheck.actualSeconds).toBe(30);
  });

  it("runs full 4-pass Model Council pipeline successfully", async () => {
    // Mock the sequential calls:
    // 1. Brainstormer
    // 2. Scriptwriter
    // 3. Critic
    // 4. Scene Planner & Validator
    const mockFetch = vi.fn().mockImplementation(async (_url, options) => {
      const body = JSON.parse(options.body as string) as ChatCompletionRequest;

      if (body.model === "qwen/qwen3.7-flash:free") {
        return {
          ok: true,
          json: async (): Promise<ChatCompletionResponse> => ({
            id: "brainstorm-res",
            model: "qwen/qwen3.7-flash:free",
            choices: [
              {
                message: {
                  role: "assistant",
                  content: JSON.stringify({
                    hooks: [
                      {
                        hook: "Most creators waste 10 hours a week on manual edits.",
                        category: "contrarian",
                        angle: "Highlighting wasted time leverage",
                        estimatedRetentionScore: 92,
                        rationale: "Sharp pain point trigger",
                      },
                    ],
                    refinedTopic: "Automating short-form video assembly",
                    anglesConsidered: ["Time waste", "Cost savings"],
                  }),
                },
              },
            ],
          }),
        };
      }

      if (body.model === "qwen/qwen3.7-plus:free") {
        // If it's scriptwriting or scene generation
        const userContent = body.messages.find((m) => m.role === "user")?.content as string;
        if (userContent.includes("Draft an elite short-form video narrative")) {
          return {
            ok: true,
            json: async (): Promise<ChatCompletionResponse> => ({
              id: "script-res",
              model: "qwen/qwen3.7-plus:free",
              choices: [
                {
                  message: {
                    role: "assistant",
                    content: JSON.stringify({
                      title: "The 10-Hour Creator Paradox",
                      selectedHook: "Most creators waste 10 hours a week on manual edits.",
                      fullScript:
                        "Most creators waste 10 hours a week on manual edits. Instead of dragging clips on a timeline, build a Remotion pipeline. You write the script, the engine renders it. Follow for more workflows.",
                      sections: [
                        {
                          sectionType: "hook",
                          spokenText: "Most creators waste 10 hours a week on manual edits.",
                          estimatedDurationSeconds: 4,
                        },
                        {
                          sectionType: "core_value",
                          spokenText:
                            "Instead of dragging clips on a timeline, build a Remotion pipeline. You write the script, the engine renders it.",
                          estimatedDurationSeconds: 16,
                        },
                        {
                          sectionType: "cta",
                          spokenText: "Follow for more workflows.",
                          estimatedDurationSeconds: 3,
                        },
                      ],
                      ctaText: "Follow for more workflows.",
                      estimatedDurationSeconds: 23,
                    }),
                  },
                },
              ],
            }),
          };
        }

        // Scene planner response
        return {
          ok: true,
          json: async (): Promise<ChatCompletionResponse> => ({
            id: "scene-res",
            model: "qwen/qwen3.7-plus:free",
            choices: [
              {
                message: {
                  role: "assistant",
                  content: JSON.stringify({
                    sceneId: "scene_automated_pipeline_01",
                    layout: "talking-head",
                    durationInFrames: 690,
                    fps: 30,
                    hook: "Most creators waste 10 hours a week on manual edits.",
                    audioTrack: {
                      voiceoverText:
                        "Most creators waste 10 hours a week on manual edits. Instead of dragging clips on a timeline, build a Remotion pipeline. Follow for more workflows.",
                    },
                    scenes: [
                      {
                        id: "scene_hook",
                        startFrame: 0,
                        durationInFrames: 120,
                        type: "hook",
                        text: "Most creators waste 10 hours a week on manual edits.",
                      },
                      {
                        id: "scene_body",
                        startFrame: 120,
                        durationInFrames: 480,
                        type: "talking_head",
                      },
                      {
                        id: "scene_cta",
                        startFrame: 600,
                        durationInFrames: 90,
                        type: "cta",
                        text: "Follow for more workflows.",
                      },
                    ],
                    metadata: {
                      title: "The 10-Hour Creator Paradox",
                      cta: "Follow for more workflows.",
                    },
                  }),
                },
              },
            ],
          }),
        };
      }

      if (body.model === "qwen/qwen3.6-max-preview:free") {
        return {
          ok: true,
          json: async (): Promise<ChatCompletionResponse> => ({
            id: "critique-res",
            model: "qwen/qwen3.6-max-preview:free",
            choices: [
              {
                message: {
                  role: "assistant",
                  content: JSON.stringify({
                    scores: {
                      retentionPrediction: 88,
                      brandConsistencyScore: 92,
                      clarityScore: 95,
                      productionFeasibilityScore: 90,
                      compositeScore: 91,
                    },
                    strengths: ["Strong contrast hook", "Crisp Remotion value prop"],
                    weaknesses: [],
                    recommendations: ["Ensure captions have karaoke emphasis"],
                    forbiddenWordsFound: [],
                    brandRuleViolations: [],
                    approved: true,
                    critiqueSummary: "Excellent pacing and brand adherence.",
                  }),
                },
              },
            ],
          }),
        };
      }

      throw new Error(`Unhandled mock model: ${body.model}`);
    });

    const client = new ModelClient({
      environment: "prod",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const router = new ModelRouter({}, client);
    const council = new ModelCouncil(router);

    const result = await council.runCouncilPipeline({
      topic: "Stop editing manually with Remotion",
      creatorMemory: mockStableMemory,
      targetDurationSeconds: 23,
      fps: 30,
    });

    // Check Pass 1: Brainstormer
    expect(result.brainstorm.hooks).toHaveLength(1);
    expect(result.brainstorm.hooks[0]?.category).toBe("contrarian");

    // Check Pass 2: Scriptwriter
    expect(result.draft.title).toBe("The 10-Hour Creator Paradox");
    expect(result.draft.sections).toHaveLength(3);

    // Check Pass 3: Critic
    expect(result.critique.approved).toBe(true);
    expect(result.critique.scores.compositeScore).toBe(91);

    // Check Pass 4: Scene planner & validator
    expect(result.sceneSpec.sceneId).toBe("scene_automated_pipeline_01");
    expect(result.sceneSpec.durationInFrames).toBe(690);
    expect(result.validation.isValid).toBe(true);
    expect(result.validation.hasCta).toBe(true);

    // Check Metadata
    expect(result.metadata.environment).toBe("prod");
    expect(result.metadata.modelsUsed.brainstorm).toBe("qwen/qwen3.7-flash:free");
    expect(result.metadata.modelsUsed.critique).toBe("qwen/qwen3.6-max-preview:free");
  });
});
