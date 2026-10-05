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
} from "../index.js";

describe("SceneSpecSchema (src/__tests__)", () => {
  it("validates SceneSpec layout variants and core schema fields", () => {
    const scene: SceneSpec = {
      sceneId: "scene-arc-01",
      layout: "story-arc",
      durationInFrames: 240,
      fps: 30,
      hook: "Nobody talks about this reality of starting an agency.",
      visualLayers: [
        {
          id: "vl-01",
          type: "talking_head",
          startFrame: 0,
          durationInFrames: 240,
        },
      ],
      captions: [
        {
          text: "Nobody talks about this",
          startFrame: 0,
          endFrame: 60,
        },
      ],
      audioTrack: {
        musicVolume: 0.2,
        voiceVolume: 1.0,
      },
      cameraMotion: {
        type: "zoom-in",
      },
      transition: {
        type: "cut",
      },
    };

    const parsed = SceneSpecSchema.parse(scene);
    expect(parsed.sceneId).toBe("scene-arc-01");
    expect(parsed.layout).toBe("story-arc");
  });

  it("validates CreatorProfile, RepurposingPackage, and QualityScore", () => {
    const profile: CreatorProfile = {
      creatorId: "cr-1",
      name: "Test Creator",
      niche: "Fitness",
      audience: "Busy executives",
      tone: "motivational",
      bannedWords: ["lazy"],
      visualStyle: { layout: "three-tips" },
      pillars: ["Habits", "Nutrition", "Sleep"],
    };
    expect(CreatorProfileSchema.parse(profile).creatorId).toBe("cr-1");

    const repurposing: RepurposingPackage = {
      shortFormVideo: {
        title: "3 Fast Workouts",
        hashtags: ["#fitness"],
      },
      twitterThread: ["1/ Quick workouts for busy founders", "2/ Do sprints"],
      linkedinPost: "Health is wealth.",
      newsletterExcerpt: "Here is why 15 min workouts work...",
    };
    expect(RepurposingPackageSchema.parse(repurposing).shortFormVideo.title).toBe("3 Fast Workouts");

    const quality: QualityScore = {
      retentionPrediction: 85,
      brandConsistencyScore: 90,
      clarityScore: 92,
      productionFeasibilityScore: 95,
      compositeScore: 90.5,
    };
    expect(QualityScoreSchema.parse(quality).compositeScore).toBe(90.5);
  });
});
