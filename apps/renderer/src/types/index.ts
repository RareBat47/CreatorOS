import { z } from "zod";
import {
  CaptionTokenSchema,
  BrandStyleSchema,
  type SceneSpec,
  type CaptionToken,
  type BrandStyle,
} from "@creatoros/scene-schema";

export type { SceneSpec, CaptionToken, BrandStyle };

/**
 * Enhanced brand configuration with vertical video styling defaults
 */
export const BrandThemeSchema = BrandStyleSchema.extend({
  handle: z.string().default("@creatoros"),
  logoUrl: z.string().optional(),
  primaryColor: z.string().default("#00F0FF"),
  secondaryColor: z.string().default("#FFFFFF"),
  accentColor: z.string().default("#FF0055"),
  backgroundColor: z.string().default("#0B0C10"),
  surfaceColor: z.string().default("rgba(255, 255, 255, 0.08)"),
  textColor: z.string().default("#FFFFFF"),
  fontFamily: z.string().default("Inter, -apple-system, BlinkMacSystemFont, sans-serif"),
  borderRadiusPx: z.number().default(24),
  introDurationInFrames: z.number().int().nonnegative().default(30),
  outroDurationInFrames: z.number().int().nonnegative().default(60),
});

export type BrandTheme = z.infer<typeof BrandThemeSchema>;

/**
 * Camera zoom keyframe structure
 */
export const ZoomKeyframeSchema = z.object({
  frame: z.number().int().nonnegative(),
  scale: z.number().min(1.0).max(2.5),
  focalPoint: z.object({
    x: z.number().min(0).max(100).default(50),
    y: z.number().min(0).max(100).default(50),
  }),
  easing: z.enum(["spring", "linear", "ease-in-out"]).default("spring"),
  durationInFrames: z.number().int().positive().default(15),
});

export type ZoomKeyframe = z.infer<typeof ZoomKeyframeSchema>;

/**
 * TalkingHead Composition Props
 */
export const TalkingHeadPropsSchema = z.object({
  videoSrc: z.string().default("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"),
  audioSrc: z.string().optional(),
  backgroundMusicSrc: z.string().optional(),
  backgroundMusicVolume: z.number().min(0).max(1).default(0.12),
  brand: BrandThemeSchema.default({}),
  captions: z.array(CaptionTokenSchema).default([]),
  captionStyle: z.enum(["minimal", "bold", "karaoke", "highlight"]).default("karaoke"),
  zoomKeyframes: z.array(ZoomKeyframeSchema).default([]),
  progressBarPosition: z.enum(["top", "bottom"]).default("top"),
  patternInterruptInterval: z.number().int().default(90),
  showBrandWatermark: z.boolean().default(true),
  showOutroCard: z.boolean().default(true),
  headline: z.string().default("Master Creator Production with Remotion"),
  ctaText: z.string().default("Follow for More"),
  ctaHandle: z.string().default("@creatoros"),
  totalDurationInFrames: z.number().int().positive().default(900),
  fps: z.number().int().positive().default(30),
});

export type TalkingHeadProps = z.infer<typeof TalkingHeadPropsSchema>;

/**
 * ThreeTips Section Props
 */
export const TipItemSchema = z.object({
  tipNumber: z.number().int().min(1).max(10),
  badgeLabel: z.string().default("TIP"),
  headline: z.string(),
  bodyText: z.string(),
  startFrame: z.number().int().nonnegative(),
  durationInFrames: z.number().int().positive(),
  mediaUrl: z.string().optional(),
  accentColor: z.string().optional(),
});

export type TipItem = z.infer<typeof TipItemSchema>;

export const ThreeTipsPropsSchema = z.object({
  headline: z.string().default("3 Creator Mistakes Costing You 10,000 Views"),
  subheadline: z.string().default("And exactly how top creators fix them in seconds"),
  tips: z.array(TipItemSchema).min(1).default([
    {
      tipNumber: 1,
      badgeLabel: "TIP #1",
      headline: "The 3-Second Retention Rule",
      bodyText: "Hook viewers with pattern interrupts and kinetic visual change within 90 frames.",
      startFrame: 90,
      durationInFrames: 240,
    },
    {
      tipNumber: 2,
      badgeLabel: "TIP #2",
      headline: "High-Contrast Kinetic Typography",
      bodyText: "Over 75% watch on mute. Active word highlighting doubles completion rates.",
      startFrame: 330,
      durationInFrames: 240,
    },
    {
      tipNumber: 3,
      badgeLabel: "TIP #3",
      headline: "The Open-Loop Resolution CTA",
      bodyText: "Give the takeaway fast, then loop back with a focused action call.",
      startFrame: 570,
      durationInFrames: 240,
    },
  ]),
  captions: z.array(CaptionTokenSchema).default([]),
  brand: BrandThemeSchema.default({}),
  backgroundMusicSrc: z.string().optional(),
  voiceoverUrl: z.string().optional(),
  totalDurationInFrames: z.number().int().positive().default(900),
  fps: z.number().int().positive().default(30),
});

export type ThreeTipsProps = z.infer<typeof ThreeTipsPropsSchema>;

/**
 * StoryArc Section & Props (Problem -> Mistake -> Realization -> Lesson -> CTA)
 */
export const StoryArcBeatTypeSchema = z.enum([
  "problem",
  "mistake",
  "realization",
  "lesson",
  "cta",
]);

export type StoryArcBeatType = z.infer<typeof StoryArcBeatTypeSchema>;

export const StoryArcBeatSchema = z.object({
  type: StoryArcBeatTypeSchema,
  tag: z.string(),
  headline: z.string(),
  description: z.string().optional(),
  metric: z.string().optional(),
  bulletPoints: z.array(z.string()).optional(),
  accentColor: z.string().optional(),
  startFrame: z.number().int().nonnegative(),
  durationInFrames: z.number().int().positive(),
});

export type StoryArcBeat = z.infer<typeof StoryArcBeatSchema>;

export const StoryArcPropsSchema = z.object({
  title: z.string().default("The Viral Retention Breakthrough"),
  beats: z.array(StoryArcBeatSchema).default([
    {
      type: "problem",
      tag: "THE HOOK",
      headline: "Your Content Drop-Off Is Happening at Frame 60",
      description: "You're spending 8 hours editing but losing 80% in the first 2 seconds.",
      accentColor: "#FF2E54",
      startFrame: 0,
      durationInFrames: 150,
    },
    {
      type: "mistake",
      tag: "THE MISTAKE",
      headline: "Over-Polishing The Wrong Elements",
      description: "Adding flashy transitions when the core story pacing is completely broken.",
      bulletPoints: ["Random stock footage cuts", "Slow talking head intro", "Unsynchronized subtitles"],
      accentColor: "#FF8A00",
      startFrame: 150,
      durationInFrames: 180,
    },
    {
      type: "realization",
      tag: "THE TURNING POINT",
      headline: "Pacing Multipliers & Programmatic Beats",
      metric: "+340% RETENTION",
      description: "Aligning text emphasis to speech cadences creates an irresistible dopamine loop.",
      accentColor: "#00FFA3",
      startFrame: 330,
      durationInFrames: 180,
    },
    {
      type: "lesson",
      tag: "THE LESSON",
      headline: "The 3 Step Modular Framework",
      bulletPoints: [
        "1. Visual interrupt every 3-4 seconds",
        "2. Kinetic captions inside safe zones",
        "3. Loop closure directly into CTA",
      ],
      accentColor: "#00F0FF",
      startFrame: 510,
      durationInFrames: 210,
    },
    {
      type: "cta",
      tag: "THE RESOLUTION",
      headline: "Build Your Automated Rendering Pipeline",
      description: "Scale programmatic shorts with Remotion and CreatorOS.",
      accentColor: "#FF007A",
      startFrame: 720,
      durationInFrames: 180,
    },
  ]),
  brand: BrandThemeSchema.default({}),
  captions: z.array(CaptionTokenSchema).default([]),
  backgroundMusicSrc: z.string().optional(),
  voiceoverUrl: z.string().optional(),
  totalDurationInFrames: z.number().int().positive().default(900),
  fps: z.number().int().positive().default(30),
});

export type StoryArcProps = z.infer<typeof StoryArcPropsSchema>;
