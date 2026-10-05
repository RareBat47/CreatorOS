import { z } from "zod";

/**
 * Layout styles for Remotion video compositions.
 * Matching docs/product/00-original-plan.md Section 7 & Section 10.
 */
export const LayoutSchema = z.enum(["talking-head", "three-tips", "story-arc"]);

/**
 * Hook category and structure.
 * Matching Section 8 hook rules (curiosity, conflict, contrarian, result, personal failure, etc.).
 */
export const HookCategorySchema = z.enum([
  "curiosity",
  "conflict",
  "contrarian",
  "result",
  "personal_failure",
  "unexpected_comparison",
  "audience_pain",
  "open_loop",
]).or(z.string());

export const HookObjectSchema = z.object({
  text: z.string().min(1, "Hook text cannot be empty"),
  category: HookCategorySchema.optional(),
  type: HookCategorySchema.optional(),
  startFrame: z.number().int().nonnegative().optional(),
  durationInFrames: z.number().int().positive().optional(),
  visualEmphasis: z.string().optional(),
});

export const HookSchema = z.union([
  z.string().min(1, "Hook text cannot be empty"),
  HookObjectSchema,
]);

/**
 * Visual layers representing elements in Remotion (video, broll, text, graphics, etc.).
 */
export const VisualLayerTypeSchema = z.enum([
  "background",
  "broll",
  "talking_head",
  "image",
  "video",
  "text",
  "overlay",
  "graphic",
  "shape",
  "caption",
]).or(z.string());

export const VisualLayerAnimationSchema = z.object({
  entrance: z.string().optional(),
  exit: z.string().optional(),
  emphasis: z.string().optional(),
});

export const VisualLayerMediaSchema = z.object({
  src: z.string().optional(),
  searchQuery: z.string().optional(),
  prompt: z.string().optional(),
  alt: z.string().optional(),
});

export const VisualLayerSchema = z.object({
  id: z.string().min(1),
  type: VisualLayerTypeSchema,
  src: z.string().optional(),
  content: z.string().optional(),
  text: z.string().optional(),
  startFrame: z.number().int().nonnegative().optional(),
  durationInFrames: z.number().int().positive().optional(),
  zIndex: z.number().int().optional(),
  style: z.record(z.string(), z.unknown()).optional(),
  animation: VisualLayerAnimationSchema.optional(),
  media: VisualLayerMediaSchema.optional(),
});

/**
 * Captions schema supporting token/word/sentence timings and visual caption configurations.
 */
export const CaptionTokenSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().positive(),
  highlight: z.boolean().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const CaptionStyleSchema = z.enum([
  "minimal",
  "bold",
  "karaoke",
  "highlight",
]).or(z.string());

export const CaptionsConfigSchema = z.object({
  style: CaptionStyleSchema.optional(),
  fontSize: z.number().positive().optional(),
  color: z.string().optional(),
  highlightColor: z.string().optional(),
  position: z.enum(["top", "center", "bottom"]).or(z.string()).optional(),
  lines: z.array(CaptionTokenSchema).optional(),
  words: z.array(CaptionTokenSchema).optional(),
  segments: z.array(CaptionTokenSchema).optional(),
});

export const CaptionsSchema = z.union([
  z.array(CaptionTokenSchema),
  CaptionsConfigSchema,
]);

/**
 * Audio track schema supporting voiceover, background music, volume balancing, and ducking.
 */
export const AudioTrackSchema = z.object({
  voiceoverText: z.string().optional(),
  voiceoverUrl: z.string().optional(),
  musicTrack: z.string().optional(),
  musicUrl: z.string().optional(),
  musicVolume: z.number().min(0).max(1).optional(),
  voiceVolume: z.number().min(0).max(1).optional(),
  ducking: z.boolean().optional(),
  durationInFrames: z.number().int().positive().optional(),
});

/**
 * Camera motion instructions (zoom, pan, shake, drift, etc.) for high retention pacing.
 */
export const CameraMotionTypeSchema = z.enum([
  "static",
  "zoom-in",
  "zoom-out",
  "pan-left",
  "pan-right",
  "whip-pan",
  "shake",
  "drift",
  "none",
]);

export const CameraMotionSchema = z.object({
  type: CameraMotionTypeSchema.or(z.string()),
  intensity: z.union([z.number(), z.enum(["subtle", "moderate", "dramatic"])]).optional(),
  startFrame: z.number().int().nonnegative().optional(),
  durationInFrames: z.number().int().positive().optional(),
  scale: z.number().positive().optional(),
});

/**
 * Transition schema connecting scenes or cuts.
 */
export const TransitionTypeSchema = z.enum([
  "cut",
  "fade",
  "crossfade",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-down",
  "wipe",
  "zoom",
  "none",
]);

export const TransitionSchema = z.object({
  type: TransitionTypeSchema.or(z.string()),
  durationInFrames: z.number().int().nonnegative().optional(),
  easing: z.string().optional(),
});

/**
 * Brand style and metadata helper schemas from Section 7.
 */
export const BrandStyleSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  fontFamily: z.string().optional(),
  captionStyle: CaptionStyleSchema.optional(),
});

export const SceneMetadataSchema = z.object({
  title: z.string().optional(),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  cta: z.string().optional(),
  contentPillar: z.string().optional(),
});

export const SceneItemSchema = z.object({
  id: z.string(),
  startFrame: z.number().int().nonnegative(),
  durationInFrames: z.number().int().positive(),
  type: z.enum(["hook", "talking_head", "broll", "quote", "list", "cta"]).or(z.string()),
  text: z.string().optional(),
  subtitle: z.string().optional(),
  media: VisualLayerMediaSchema.optional(),
  animation: VisualLayerAnimationSchema.optional(),
});

/**
 * SceneSpecSchema: Central contract between AI generation and Remotion rendering.
 * Matches docs/product/00-original-plan.md Section 7.
 */
export const SceneSpecSchema = z.object({
  sceneId: z.string().min(1, "sceneId is required"),
  layout: LayoutSchema,
  durationInFrames: z.number().int().positive("durationInFrames must be a positive integer"),
  fps: z.number().int().positive("fps must be a positive integer").default(30),
  hook: HookSchema,
  visualLayers: z.array(VisualLayerSchema).default([]),
  captions: CaptionsSchema.default([]),
  audioTrack: AudioTrackSchema.default({}),
  cameraMotion: CameraMotionSchema.default({ type: "static" }),
  transition: TransitionSchema.default({ type: "cut" }),

  // Optional Section 7 contract fields
  projectId: z.string().optional(),
  format: z.enum(["short_vertical", "square", "landscape"]).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  brand: BrandStyleSchema.optional(),
  metadata: SceneMetadataSchema.optional(),
  scenes: z.array(SceneItemSchema).optional(),
});
