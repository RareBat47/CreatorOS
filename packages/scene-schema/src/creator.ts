import { z } from "zod";
import { CaptionStyleSchema } from "./scene.js";

/**
 * Audience definition schema.
 */
export const AudienceDetailsSchema = z.object({
  target: z.string(),
  demographics: z.string().optional(),
  painPoints: z.array(z.string()).optional(),
  desires: z.array(z.string()).optional(),
});

export const AudienceSchema = z.union([
  z.string().min(1),
  AudienceDetailsSchema,
]);

/**
 * Creator tone schema (e.g., authoritative, humorous, concise, direct).
 */
export const ToneSchema = z.union([
  z.string().min(1),
  z.array(z.string().min(1)).min(1),
]);

/**
 * Content Pillar schema.
 */
export const ContentPillarItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
});

export const ContentPillarsSchema = z.union([
  z.array(z.string().min(1)),
  z.array(ContentPillarItemSchema),
]);

/**
 * Visual Style schema (colors, fonts, layout, captionStyle, logoUrl, etc.).
 * Matching Section 3 & Section 7.
 */
export const VisualStyleSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  colors: z.array(z.string()).optional(),
  fontFamily: z.string().optional(),
  fonts: z.array(z.string()).optional(),
  layout: z.string().optional(),
  captionStyle: CaptionStyleSchema.optional(),
  logoUrl: z.string().optional(),
  introStyle: z.string().optional(),
  outroStyle: z.string().optional(),
});

/**
 * CreatorProfileSchema: Represents the Creator Memory & Brain profile.
 * Matching docs/product/00-original-plan.md Section 3, Section 7, & Section 11.
 */
export const CreatorProfileSchema = z.object({
  creatorId: z.string().min(1, "creatorId is required"),
  name: z.string().min(1, "name is required"),
  niche: z.string().min(1, "niche is required"),
  audience: AudienceSchema,
  tone: ToneSchema,
  bannedWords: z.array(z.string()).default([]),
  visualStyle: VisualStyleSchema,
  pillars: ContentPillarsSchema,

  // Additional Creator Memory fields from Section 3 & Section 11
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  forbiddenPhrases: z.array(z.string()).optional(),
  recurringSeries: z.array(z.string()).optional(),
  favoriteHooks: z.array(z.string()).optional(),
  opinions: z.array(z.string()).optional(),
  personalStories: z.array(z.string()).optional(),
  primaryPlatforms: z.array(z.string()).optional(),
});
