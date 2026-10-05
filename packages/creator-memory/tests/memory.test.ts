import { describe, it, expect, beforeEach } from "vitest";
import {
  StableMemorySchema,
  EpisodicMemoryItemSchema,
  PerformanceMemoryItemSchema,
  InMemoryCreatorMemoryStore,
  InMemoryVectorRetrievalAdapter,
  type StableMemory,
  type EpisodicMemoryItem,
  type PerformanceMemoryItem,
  type IVectorRetrievalAdapter,
} from "../src/index.js";

describe("StableMemorySchema", () => {
  it("validates a complete Stable Memory instance matching Section 3 & Section 11", () => {
    const rawStable: StableMemory = {
      creatorId: "creator-alex-growth",
      identity: {
        name: "Alex Growth",
        profession: "B2B SaaS Founder & Bootstrapper",
        niche: "SaaS Marketing",
        primaryPlatforms: ["tiktok", "youtube_shorts"],
        audience: {
          target: "Bootstrapped founders and technical solopreneurs",
          painPoints: ["High customer acquisition cost", "Churn in month 1"],
          desires: ["Predictable organic leads", "Sustainable growth"],
        },
        goals: ["Reach 100k followers", "Generate 50 qualified demo calls/mo"],
      },
      voice: {
        tone: ["direct", "punchy", "pragmatic"],
        sentenceLength: "short",
        energy: "high",
        humorLevel: 4,
        directness: 9,
        vocabulary: ["bottleneck", "leverage", "flywheel", "CAC:LTV"],
        forbiddenPhrases: ["synergy", "paradigm shift", "game changer", "delve"],
      },
      pillars: [
        {
          name: "Organic Acquisition",
          description: "Tactics for getting customers without paid ads",
          keywords: ["organic", "inbound", "seo", "viral loops"],
        },
        "Pricing & Packaging Experiments",
        "Founder Psychology & Focus",
      ],
      visualStyle: {
        primaryColor: "#0F172A",
        secondaryColor: "#38BDF8",
        accentColor: "#F59E0B",
        fontFamily: "Inter",
        layout: "talking-head",
        captionStyle: "bold",
      },
      bannedWords: ["synergy", "delve", "rockstar"],
      forbiddenPhrases: ["game changer", "secret sauce"],
      brandRules: [
        {
          id: "rule-1",
          rule: "Always include a controversial opinion or number in first 3 seconds",
          category: "voice",
          createdAt: new Date().toISOString(),
        },
      ],
      opinions: ["Paid ads hide poor product-market fit early on"],
      personalStories: ["Losing $20,000 on Facebook ads before talking to 10 customers"],
      proofPoints: ["Bootstrapped to $1M ARR in 18 months"],
      favoriteHooks: [
        "Most founders fail because they build before they sell.",
        "Here are 3 frameworks that doubled our outbound reply rate.",
      ],
      updatedAt: new Date().toISOString(),
    };

    const parsed = StableMemorySchema.parse(rawStable);
    expect(parsed.creatorId).toBe("creator-alex-growth");
    expect(parsed.identity.name).toBe("Alex Growth");
    expect(parsed.voice.sentenceLength).toBe("short");
    expect(parsed.voice.forbiddenPhrases).toContain("game changer");
    expect(parsed.bannedWords).toContain("delve");
    expect(parsed.brandRules).toHaveLength(1);
    expect(parsed.brandRules[0]?.rule).toContain("Always include a controversial opinion");
    expect(parsed.favoriteHooks).toHaveLength(2);
  });

  it("throws validation error when identity name or creatorId is missing", () => {
    expect(() =>
      StableMemorySchema.parse({
        creatorId: "",
        identity: {
          name: "",
          audience: "General audience",
          goals: [],
        },
        voice: {
          tone: "direct",
        },
        pillars: ["Pillar 1"],
        visualStyle: {},
      })
    ).toThrow();
  });
});

describe("EpisodicMemoryItemSchema", () => {
  it("validates episodic memory containing scripts, hooks tested, topics, and narrative arcs", () => {
    const rawEpisodic: EpisodicMemoryItem = {
      id: "ep-001",
      creatorId: "creator-alex-growth",
      title: "Why Building Before Selling Guarantees Failure",
      topicsCovered: ["startup validation", "customer interviews", "product market fit"],
      pillar: "Organic Acquisition",
      scriptText: "Most founders fail because they build before they sell. In 2024, code is cheap...",
      editedScriptText: "Most founders fail because they write code before speaking to users...",
      hooksTested: [
        {
          hook: "Most founders fail because they build before they sell.",
          category: "contrarian",
          wasApproved: true,
          impressions: 45000,
          retentionFirst3s: 78.5,
        },
        {
          hook: "Don't write another line of code until you hear this.",
          category: "warning",
          wasApproved: false,
          impressions: 12000,
          retentionFirst3s: 52.1,
        },
      ],
      approvedHook: "Most founders fail because they build before they sell.",
      narrativeArc: {
        type: "problem-mistake-solution-cta",
        hook: "Most founders fail because they build before they sell.",
        buildup: "Spent 6 months in stealth, launched to crickets.",
        climaxOrTurningPoint: "Ran 15 discovery calls and got 3 pre-orders in 48 hours.",
        resolution: "Validation must precede engineering.",
        callToAction: "Comment 'VALIDATE' to get our 5-question interview script.",
      },
      format: "talking-head",
      platform: "tiktok",
      status: "published",
      tags: ["bootstrapping", "growth", "mvp"],
      createdAt: new Date().toISOString(),
    };

    const parsed = EpisodicMemoryItemSchema.parse(rawEpisodic);
    expect(parsed.id).toBe("ep-001");
    expect(parsed.approvedHook).toBe("Most founders fail because they build before they sell.");
    expect(parsed.hooksTested).toHaveLength(2);
    expect(parsed.hooksTested[0]?.wasApproved).toBe(true);
    expect(parsed.narrativeArc?.climaxOrTurningPoint).toContain("Ran 15 discovery calls");
    expect(parsed.status).toBe("published");
  });
});

describe("PerformanceMemoryItemSchema", () => {
  it("validates performance metrics with retention rates, views, and format affinities", () => {
    const rawPerformance: PerformanceMemoryItem = {
      id: "perf-001",
      contentId: "ep-001",
      creatorId: "creator-alex-growth",
      views: 125000,
      watchTimeSeconds: 52000,
      retention: {
        averagePercentage: 68.4,
        at3Seconds: 78.5,
        at5Seconds: 65.2,
        at30Seconds: 42.0,
        completionRate: 31.5,
      },
      saves: 3400,
      shares: 1250,
      comments: 480,
      likes: 9800,
      leadsGenerated: 85,
      conversionRate: 4.8,
      bestPerformingHooks: [
        {
          hook: "Most founders fail because they build before they sell.",
          retentionRate: 78.5,
          views: 125000,
          category: "contrarian",
          contentId: "ep-001",
        },
      ],
      formatAffinities: [
        {
          format: "talking-head",
          affinityScore: 88,
          sampleCount: 5,
          averageRetention: 66.5,
          averageViews: 95000,
          notes: "Consistently outperforms montage videos",
        },
      ],
      platform: "tiktok",
      recordedAt: new Date().toISOString(),
    };

    const parsed = PerformanceMemoryItemSchema.parse(rawPerformance);
    expect(parsed.views).toBe(125000);
    expect(parsed.retention.averagePercentage).toBe(68.4);
    expect(parsed.retention.at3Seconds).toBe(78.5);
    expect(parsed.bestPerformingHooks).toHaveLength(1);
    expect(parsed.formatAffinities[0]?.format).toBe("talking-head");
  });
});

describe("InMemoryCreatorMemoryStore & Vector Adapter Integration", () => {
  let store: InMemoryCreatorMemoryStore;
  let vectorAdapter: InMemoryVectorRetrievalAdapter;

  const mockCreatorId = "creator-sarah-tech";

  const initialStableMemory: StableMemory = {
    creatorId: mockCreatorId,
    identity: {
      name: "Sarah Tech",
      profession: "AI Engineer & Educator",
      primaryPlatforms: ["tiktok", "youtube_shorts"],
      audience: "Developers wanting to master generative AI",
      goals: ["Educate 10k developers"],
    },
    voice: {
      tone: ["concise", "clear", "energetic"],
      sentenceLength: "short",
      energy: "high",
      humorLevel: 6,
      directness: 8,
      vocabulary: ["architecture", "latent space", "embeddings", "pipeline"],
      forbiddenPhrases: ["mind-blowing", "game-changer", "magic"],
    },
    pillars: [
      {
        name: "AI Agents",
        description: "Autonomous reasoning and tool use",
        keywords: ["agents", "tools", "mcp"],
      },
      "Vector Search & RAG",
    ],
    visualStyle: {
      primaryColor: "#059669",
      secondaryColor: "#10B981",
      fontFamily: "JetBrains Mono",
      layout: "three-tips",
      captionStyle: "bold",
    },
    bannedWords: ["revolutionary", "jaw-dropping"],
    forbiddenPhrases: ["mind-blowing", "game-changer"],
    brandRules: [],
    favoriteHooks: ["Stop writing raw LLM prompts in production."],
    opinions: ["Most wrapper apps will be obsolete in 6 months."],
    personalStories: [],
    proofPoints: ["Built agent systems handling 1M daily requests"],
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    vectorAdapter = new InMemoryVectorRetrievalAdapter();
    store = new InMemoryCreatorMemoryStore(vectorAdapter);
    await store.setStableMemory(mockCreatorId, initialStableMemory);
  });

  it("stores and retrieves stable memory correctly", async () => {
    const memory = await store.getStableMemory(mockCreatorId);
    expect(memory).not.toBeNull();
    expect(memory?.creatorId).toBe(mockCreatorId);
    expect(memory?.identity.name).toBe("Sarah Tech");
    expect(memory?.voice.tone).toEqual(["concise", "clear", "energetic"]);
  });

  it("updates stable memory and persists durable brand rules", async () => {
    const updated = await store.updateStableMemory(mockCreatorId, {
      bannedWords: ["revolutionary", "jaw-dropping", "delve"],
    });
    expect(updated.bannedWords).toContain("delve");

    const rule = await store.addBrandRule(mockCreatorId, {
      rule: "Never use stock footage of robots or cyborgs",
      category: "visual",
    });

    expect(rule.id).toBeDefined();
    expect(rule.rule).toBe("Never use stock footage of robots or cyborgs");

    const refreshed = await store.getStableMemory(mockCreatorId);
    expect(refreshed?.brandRules).toHaveLength(1);
    expect(refreshed?.brandRules[0]?.category).toBe("visual");
  });

  it("adds episodic memories and indexes them into the vector adapter", async () => {
    const episode1: EpisodicMemoryItem = {
      id: "ep-agent-01",
      creatorId: mockCreatorId,
      title: "How to Build Production AI Agents with MCP",
      topicsCovered: ["model context protocol", "tools", "safety"],
      pillar: "AI Agents",
      scriptText: "Most developers connect AI models directly to APIs. That is a security nightmare...",
      hooksTested: [
        {
          hook: "Stop giving LLMs unrestricted database access.",
          category: "warning",
          wasApproved: true,
          retentionFirst3s: 82.0,
        },
      ],
      approvedHook: "Stop giving LLMs unrestricted database access.",
      format: "three-tips",
      status: "published",
      tags: ["agents", "mcp"],
      createdAt: new Date().toISOString(),
    };

    const episode2: EpisodicMemoryItem = {
      id: "ep-rag-02",
      creatorId: mockCreatorId,
      title: "Vector Search Pitfalls: Why RAG Fails",
      topicsCovered: ["embeddings", "chunking", "reranking"],
      pillar: "Vector Search & RAG",
      scriptText: "Cosine similarity alone will ruin your search accuracy. Here is why reranking matters...",
      approvedHook: "Your RAG pipeline is probably returning garbage data.",
      hooksTested: [],
      format: "talking-head",
      status: "published",
      tags: ["rag", "vectors"],
      createdAt: new Date().toISOString(),
    };

    await store.addEpisodicMemory(mockCreatorId, episode1);
    await store.addEpisodicMemory(mockCreatorId, episode2);

    const episodes = await store.getEpisodicMemories(mockCreatorId);
    expect(episodes).toHaveLength(2);

    const singleEp = await store.getEpisodicMemory(mockCreatorId, "ep-agent-01");
    expect(singleEp?.title).toBe("How to Build Production AI Agents with MCP");

    // Check vector adapter search
    const searchResults = await vectorAdapter.search("security database APIs", 5);
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0]?.id).toBe("ep-agent-01");
  });

  it("records performance memories and retrieves top-performing hooks", async () => {
    const perf1 = PerformanceMemoryItemSchema.parse({
      id: "perf-01",
      contentId: "ep-agent-01",
      creatorId: mockCreatorId,
      views: 200000,
      retention: {
        averagePercentage: 74.5,
        at3Seconds: 82.0,
      },
      bestPerformingHooks: [
        {
          hook: "Stop giving LLMs unrestricted database access.",
          retentionRate: 82.0,
          views: 200000,
          contentId: "ep-agent-01",
        },
      ],
      formatAffinities: [
        {
          format: "three-tips",
          affinityScore: 92,
          sampleCount: 3,
        },
      ],
      recordedAt: new Date().toISOString(),
    });

    const perf2 = PerformanceMemoryItemSchema.parse({
      id: "perf-02",
      contentId: "ep-rag-02",
      creatorId: mockCreatorId,
      views: 75000,
      retention: {
        averagePercentage: 58.0,
        at3Seconds: 61.0,
      },
      bestPerformingHooks: [
        {
          hook: "Your RAG pipeline is probably returning garbage data.",
          retentionRate: 61.0,
          views: 75000,
          contentId: "ep-rag-02",
        },
      ],
      formatAffinities: [
        {
          format: "talking-head",
          affinityScore: 70,
          sampleCount: 2,
        },
      ],
      recordedAt: new Date().toISOString(),
    });

    await store.recordPerformanceMemory(mockCreatorId, perf1);
    await store.recordPerformanceMemory(mockCreatorId, perf2);

    const topHooks = await store.getTopPerformingHooks(mockCreatorId, 2);
    expect(topHooks).toHaveLength(2);
    expect(topHooks[0]?.hook).toBe("Stop giving LLMs unrestricted database access.");
    expect(topHooks[0]?.retentionRate).toBe(82.0);
  });

  it("executes the full Section 11 retrieval pipeline", async () => {
    // Populate episodes and performance
    await store.addEpisodicMemory(mockCreatorId, {
      id: "ep-agent-01",
      creatorId: mockCreatorId,
      title: "How to Build Production AI Agents with MCP",
      topicsCovered: ["agents", "mcp", "security"],
      pillar: "AI Agents",
      scriptText: "Stop giving LLMs unrestricted database access. Always enforce sandbox boundaries...",
      hooksTested: [
        {
          hook: "Stop giving LLMs unrestricted database access.",
          category: "warning",
          wasApproved: true,
          retentionFirst3s: 82.0,
        },
      ],
      approvedHook: "Stop giving LLMs unrestricted database access.",
      format: "three-tips",
      status: "published",
      tags: ["agents"],
      createdAt: new Date().toISOString(),
    });

    await store.recordPerformanceMemory(
      mockCreatorId,
      PerformanceMemoryItemSchema.parse({
        id: "perf-01",
        contentId: "ep-agent-01",
        creatorId: mockCreatorId,
        views: 200000,
        retention: {
          averagePercentage: 74.5,
          at3Seconds: 82.0,
        },
        bestPerformingHooks: [
          {
            hook: "Stop giving LLMs unrestricted database access.",
            retentionRate: 82.0,
            views: 200000,
            contentId: "ep-agent-01",
          },
        ],
        formatAffinities: [
          {
            format: "three-tips",
            affinityScore: 92,
            sampleCount: 1,
          },
        ],
        recordedAt: new Date().toISOString(),
      })
    );

    // Run retrieve for writing a new script on "AI Agents"
    const retrieval = await store.retrieve({
      creatorId: mockCreatorId,
      query: "database security agents",
      pillar: "AI Agents",
      format: "three-tips",
      limit: 3,
      minSimilarity: 0.05,
    });

    expect(retrieval.creatorId).toBe(mockCreatorId);
    expect(retrieval.preferredTone).toEqual(["concise", "clear", "energetic"]);
    expect(retrieval.forbiddenPhrases).toContain("game-changer");
    expect(retrieval.bannedWords).toContain("revolutionary");
    expect(retrieval.relevantPillars).toContain("AI Agents");
    expect(retrieval.approvedHooks.length).toBeGreaterThan(0);
    expect(retrieval.highPerformingScripts).toHaveLength(1);
    expect(retrieval.highPerformingScripts[0]?.id).toBe("ep-agent-01");
    expect(retrieval.similarEpisodes?.length).toBeGreaterThan(0);
    expect(retrieval.performanceSummary?.totalViews).toBe(200000);
    expect(retrieval.performanceSummary?.topPerformingHook).toBe(
      "Stop giving LLMs unrestricted database access."
    );
  });

  it("supports custom external vector adapters conforming to IVectorRetrievalAdapter", async () => {
    const customIndexed: string[] = [];
    const customAdapter: IVectorRetrievalAdapter = {
      async index(id: string) {
        customIndexed.push(id);
      },
      async search(query: string) {
        if (query.includes("custom")) {
          return [{ id: "custom-hit", score: 0.99 }];
        }
        return [];
      },
    };

    const customStore = new InMemoryCreatorMemoryStore(customAdapter);
    await customStore.addEpisodicMemory("test-creator", {
      id: "ep-custom",
      creatorId: "test-creator",
      title: "Custom Episode",
      topicsCovered: [],
      scriptText: "Some text",
      hooksTested: [],
      format: "talking-head",
      status: "draft",
      tags: [],
      createdAt: new Date().toISOString(),
    });

    expect(customIndexed).toContain("ep-custom");
  });
});
