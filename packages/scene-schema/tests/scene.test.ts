import { describe, it, expect } from "vitest";
import {
  SceneSpecSchema,
  CreatorProfileSchema,
  RepurposingPackageSchema,
  QualityScoreSchema,
  type SceneSpec,
  type CreatorProfile,
  type RepurposingPackage,
  type QualityScore,
} from "../src/index.js";

describe("SceneSpecSchema", () => {
  it("validates a minimal valid SceneSpec with layout 'talking-head'", () => {
    const rawScene: SceneSpec = {
      sceneId: "scene-talking-head-01",
      layout: "talking-head",
      durationInFrames: 180,
      fps: 30,
      hook: "Most founders fail because they build before they sell.",
      visualLayers: [
        {
          id: "layer-bg",
          type: "talking_head",
          src: "https://assets.creatoros.dev/creator-head.mp4",
          startFrame: 0,
          durationInFrames: 180,
        },
      ],
      captions: [
        {
          id: "cap-1",
          text: "Most founders fail",
          startFrame: 0,
          endFrame: 45,
          highlight: true,
        },
      ],
      audioTrack: {
        voiceoverText: "Most founders fail because they build before they sell.",
        musicTrack: "ambient-focus.mp3",
        musicVolume: 0.15,
        voiceVolume: 1.0,
        ducking: true,
      },
      cameraMotion: {
        type: "zoom-in",
        intensity: "subtle",
        startFrame: 0,
        durationInFrames: 180,
      },
      transition: {
        type: "cut",
        durationInFrames: 0,
      },
    };

    const parsed = SceneSpecSchema.parse(rawScene);
    expect(parsed.sceneId).toBe("scene-talking-head-01");
    expect(parsed.layout).toBe("talking-head");
    expect(parsed.durationInFrames).toBe(180);
    expect(parsed.fps).toBe(30);
    expect(parsed.hook).toBe("Most founders fail because they build before they sell.");
    expect(parsed.visualLayers).toHaveLength(1);
    expect(parsed.cameraMotion.type).toBe("zoom-in");
    expect(parsed.transition.type).toBe("cut");
  });

  it("validates layouts 'three-tips' and 'story-arc'", () => {
    const threeTipsScene = SceneSpecSchema.parse({
      sceneId: "scene-three-tips",
      layout: "three-tips",
      durationInFrames: 300,
      fps: 60,
      hook: {
        text: "Here are 3 frameworks to double your organic reach.",
        category: "result",
      },
      visualLayers: [],
      captions: [],
      audioTrack: {},
      cameraMotion: { type: "drift" },
      transition: { type: "slide-left" },
    });
    expect(threeTipsScene.layout).toBe("three-tips");
    expect(threeTipsScene.fps).toBe(60);

    const storyArcScene = SceneSpecSchema.parse({
      sceneId: "scene-story-arc",
      layout: "story-arc",
      durationInFrames: 450,
      hook: "I lost $10,000 before learning this single lesson.",
      visualLayers: [],
      captions: [],
      audioTrack: {},
      cameraMotion: { type: "shake" },
      transition: { type: "fade" },
    });
    expect(storyArcScene.layout).toBe("story-arc");
    expect(storyArcScene.fps).toBe(30); // Default applied
  });

  it("rejects invalid layouts", () => {
    expect(() =>
      SceneSpecSchema.parse({
        sceneId: "bad-scene",
        layout: "invalid-layout",
        durationInFrames: 120,
        fps: 30,
        hook: "Some hook",
        visualLayers: [],
        captions: [],
        audioTrack: {},
        cameraMotion: { type: "static" },
        transition: { type: "cut" },
      })
    ).toThrow();
  });

  it("rejects non-positive durationInFrames", () => {
    expect(() =>
      SceneSpecSchema.parse({
        sceneId: "bad-duration",
        layout: "talking-head",
        durationInFrames: 0,
        fps: 30,
        hook: "Some hook",
        visualLayers: [],
        captions: [],
        audioTrack: {},
        cameraMotion: { type: "static" },
        transition: { type: "cut" },
      })
    ).toThrow();
  });
});

describe("CreatorProfileSchema", () => {
  it("validates a full CreatorProfile matching Section 7 and Creator Memory", () => {
    const profile: CreatorProfile = {
      creatorId: "creator-alex-hormozi-style",
      name: "Alex H.",
      niche: "B2B SaaS Growth & Bootstrapping",
      audience: "Early-stage SaaS founders and technical entrepreneurs",
      tone: ["direct", "punchy", "authoritative", "pragmatic"],
      bannedWords: ["synergy", "game-changer", "delve", "secret sauce"],
      visualStyle: {
        primaryColor: "#FFDD00",
        secondaryColor: "#000000",
        accentColor: "#FF3366",
        fontFamily: "Inter",
        layout: "talking-head",
        captionStyle: "bold",
      },
      pillars: [
        "Customer Acquisition Without Ads",
        "Pricing & Packaging Experiments",
        "Founder Psychology & Focus",
      ],
    };

    const parsed = CreatorProfileSchema.parse(profile);
    expect(parsed.creatorId).toBe("creator-alex-hormozi-style");
    expect(parsed.name).toBe("Alex H.");
    expect(parsed.niche).toBe("B2B SaaS Growth & Bootstrapping");
    expect(parsed.bannedWords).toContain("game-changer");
    expect(parsed.visualStyle.layout).toBe("talking-head");
    expect(parsed.pillars).toHaveLength(3);
  });

  it("validates detailed structured audience and pillar items", () => {
    const profile = CreatorProfileSchema.parse({
      creatorId: "creator-structured",
      name: "Sarah Creator",
      niche: "AI Video Production",
      audience: {
        target: "Solo content creators looking to scale short form",
        painPoints: ["Editing takes too long", "Inconsistent hooks"],
      },
      tone: "conversational",
      bannedWords: [],
      visualStyle: {
        captionStyle: "karaoke",
      },
      pillars: [
        {
          name: "Hook Mastery",
          description: "Writing irresistible openings",
          keywords: ["retention", "hook", "viral"],
        },
      ],
    });

    expect(typeof profile.audience).toBe("object");
    expect(profile.pillars).toHaveLength(1);
  });

  it("rejects CreatorProfile missing mandatory fields", () => {
    expect(() =>
      CreatorProfileSchema.parse({
        name: "Missing Creator ID",
        niche: "Marketing",
      })
    ).toThrow();
  });
});

describe("RepurposingPackageSchema", () => {
  it("validates a complete repurposing package matching Section 7 and Step 6", () => {
    const repurposingData: RepurposingPackage = {
      shortFormVideo: {
        title: "Why 90% of Startups Fail in Month 1",
        caption: "Here is what happens when you build before validating.",
        hashtags: ["#startups", "#saas", "#entrepreneurship"],
        soundRecommendation: "Upbeat Lo-Fi Beat 120bpm",
        platformVariants: {
          tiktok: {
            caption: "Stop building products nobody wants 🛑 #tech #founder",
          },
          reels: {
            caption: "The #1 mistake first-time founders make. Watch till the end.",
          },
        },
      },
      twitterThread: {
        hookTweet: "90% of founders fail before their first customer. Here is why (and how to avoid it): 🧵👇",
        tweets: [
          "1/ They build products based on imagination rather than market pain.",
          "2/ They spend 6 months perfecting code instead of having 20 customer calls.",
          "3/ Distribution must precede product development.",
        ],
        ctaTweet: "If you found this useful, retweet and follow for weekly breakdowns.",
      },
      linkedinPost: {
        hook: "Most founders fail because they build before they sell.",
        content:
          "In 2024, code is cheap. Attention is expensive.\n\nHere are 3 rules we use to validate demand before writing a single line:",
        takeaways: [
          "Pre-sell before writing code",
          "Conduct 30 customer interviews",
          "Focus on one painful problem",
        ],
        cta: "What is your validation process? Let me know in the comments.",
        hashtags: ["#Startups", "#Entrepreneurship", "#VentureCapital"],
      },
      newsletterExcerpt: {
        subjectLine: "Issue #42: Build less, sell first",
        previewText: "Why customer discovery beats building features every time.",
        body: "Hey builders,\n\nThis week we explored why building before validating drains founder momentum...",
        callToAction: "Read the full case study on our blog.",
      },
    };

    const parsed = RepurposingPackageSchema.parse(repurposingData);
    expect(parsed.shortFormVideo.title).toBe("Why 90% of Startups Fail in Month 1");
    expect(parsed.twitterThread).toBeDefined();
    expect(parsed.linkedinPost).toBeDefined();
    expect(parsed.newsletterExcerpt).toBeDefined();
  });

  it("validates shorthand string arrays for twitterThread and string content for linkedin/newsletter", () => {
    const shorthandPackage = RepurposingPackageSchema.parse({
      shortFormVideo: {
        title: "Short Clip",
        hashtags: ["#tips"],
      },
      twitterThread: [
        "1/ Tweet one",
        "2/ Tweet two",
      ],
      linkedinPost: "Full LinkedIn text content here",
      newsletterExcerpt: "Full newsletter excerpt body text here",
    });

    expect(shorthandPackage.shortFormVideo.title).toBe("Short Clip");
    expect(Array.isArray(shorthandPackage.twitterThread)).toBe(true);
    expect(typeof shorthandPackage.linkedinPost).toBe("string");
  });
});

describe("QualityScoreSchema", () => {
  it("validates quality scores across all required dimensions", () => {
    const scoreData: QualityScore = {
      retentionPrediction: 88,
      brandConsistencyScore: 92,
      clarityScore: 95,
      productionFeasibilityScore: 90,
      compositeScore: 91.25,
      strengths: ["Strong contrarian hook in first 2 seconds", "Consistent brand color palette"],
      weaknesses: ["Second tip could be tighter"],
      recommendations: ["Trim 15 frames from transition between tip 1 and tip 2"],
    };

    const parsed = QualityScoreSchema.parse(scoreData);
    expect(parsed.retentionPrediction).toBe(88);
    expect(parsed.brandConsistencyScore).toBe(92);
    expect(parsed.clarityScore).toBe(95);
    expect(parsed.productionFeasibilityScore).toBe(90);
    expect(parsed.compositeScore).toBe(91.25);
  });

  it("rejects scores out of bounds (<0 or >100)", () => {
    expect(() =>
      QualityScoreSchema.parse({
        retentionPrediction: 105,
        brandConsistencyScore: 90,
        clarityScore: 80,
        productionFeasibilityScore: 85,
        compositeScore: 90,
      })
    ).toThrow();

    expect(() =>
      QualityScoreSchema.parse({
        retentionPrediction: -5,
        brandConsistencyScore: 90,
        clarityScore: 80,
        productionFeasibilityScore: 85,
        compositeScore: 90,
      })
    ).toThrow();
  });
});
