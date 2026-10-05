import { z } from "zod";
import {
  SceneSpecSchema,
  LayoutSchema,
  HookSchema,
  HookObjectSchema,
  VisualLayerSchema,
  VisualLayerTypeSchema,
  CaptionTokenSchema,
  CaptionStyleSchema,
  CaptionsConfigSchema,
  CaptionsSchema,
  AudioTrackSchema,
  CameraMotionSchema,
  CameraMotionTypeSchema,
  TransitionSchema,
  TransitionTypeSchema,
  BrandStyleSchema,
  SceneMetadataSchema,
  SceneItemSchema,
} from "./scene.js";
import {
  CreatorProfileSchema,
  AudienceSchema,
  AudienceDetailsSchema,
  ToneSchema,
  ContentPillarsSchema,
  ContentPillarItemSchema,
  VisualStyleSchema,
} from "./creator.js";
import {
  RepurposingPackageSchema,
  ShortFormVideoSchema,
  ShortFormVideoPlatformVariantSchema,
  TwitterThreadSchema,
  TwitterThreadDetailsSchema,
  LinkedInPostSchema,
  LinkedInPostDetailsSchema,
  NewsletterExcerptSchema,
  NewsletterExcerptDetailsSchema,
} from "./repurposing.js";
import { QualityScoreSchema } from "./quality.js";

// Scene Spec Types (Inferred output and input types)
export type SceneSpec = z.infer<typeof SceneSpecSchema>;
export type SceneSpecInput = z.input<typeof SceneSpecSchema>;
export type Layout = z.infer<typeof LayoutSchema>;
export type LayoutType = Layout;
export type Hook = z.infer<typeof HookSchema>;
export type HookObject = z.infer<typeof HookObjectSchema>;
export type VisualLayer = z.infer<typeof VisualLayerSchema>;
export type VisualLayerType = z.infer<typeof VisualLayerTypeSchema>;
export type CaptionToken = z.infer<typeof CaptionTokenSchema>;
export type CaptionStyle = z.infer<typeof CaptionStyleSchema>;
export type CaptionsConfig = z.infer<typeof CaptionsConfigSchema>;
export type Captions = z.infer<typeof CaptionsSchema>;
export type AudioTrack = z.infer<typeof AudioTrackSchema>;
export type CameraMotion = z.infer<typeof CameraMotionSchema>;
export type CameraMotionType = z.infer<typeof CameraMotionTypeSchema>;
export type Transition = z.infer<typeof TransitionSchema>;
export type TransitionType = z.infer<typeof TransitionTypeSchema>;
export type BrandStyle = z.infer<typeof BrandStyleSchema>;
export type SceneMetadata = z.infer<typeof SceneMetadataSchema>;
export type SceneItem = z.infer<typeof SceneItemSchema>;

// Creator Profile Types
export type CreatorProfile = z.infer<typeof CreatorProfileSchema>;
export type CreatorProfileInput = z.input<typeof CreatorProfileSchema>;
export type Audience = z.infer<typeof AudienceSchema>;
export type AudienceDetails = z.infer<typeof AudienceDetailsSchema>;
export type Tone = z.infer<typeof ToneSchema>;
export type ContentPillars = z.infer<typeof ContentPillarsSchema>;
export type ContentPillarItem = z.infer<typeof ContentPillarItemSchema>;
export type VisualStyle = z.infer<typeof VisualStyleSchema>;

// Repurposing Package Types
export type RepurposingPackage = z.infer<typeof RepurposingPackageSchema>;
export type RepurposingPackageInput = z.input<typeof RepurposingPackageSchema>;
export type ShortFormVideo = z.infer<typeof ShortFormVideoSchema>;
export type ShortFormVideoPlatformVariant = z.infer<typeof ShortFormVideoPlatformVariantSchema>;
export type TwitterThread = z.infer<typeof TwitterThreadSchema>;
export type TwitterThreadDetails = z.infer<typeof TwitterThreadDetailsSchema>;
export type LinkedInPost = z.infer<typeof LinkedInPostSchema>;
export type LinkedInPostDetails = z.infer<typeof LinkedInPostDetailsSchema>;
export type NewsletterExcerpt = z.infer<typeof NewsletterExcerptSchema>;
export type NewsletterExcerptDetails = z.infer<typeof NewsletterExcerptDetailsSchema>;

// Quality Score Types
export type QualityScore = z.infer<typeof QualityScoreSchema>;
export type QualityScoreInput = z.input<typeof QualityScoreSchema>;
