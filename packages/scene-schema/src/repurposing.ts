import { z } from "zod";

/**
 * Short-form video repurposing asset.
 */
export const ShortFormVideoPlatformVariantSchema = z.object({
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  soundRecommendation: z.string().optional(),
});

export const ShortFormVideoSchema = z.object({
  title: z.string().min(1, "title is required"),
  caption: z.string().optional(),
  description: z.string().optional(),
  hashtags: z.array(z.string()).default([]),
  soundRecommendation: z.string().optional(),
  platformVariants: z.object({
    tiktok: ShortFormVideoPlatformVariantSchema.optional(),
    reels: ShortFormVideoPlatformVariantSchema.optional(),
    shorts: ShortFormVideoPlatformVariantSchema.optional(),
  }).optional(),
  callToAction: z.string().optional(),
});

/**
 * Twitter / X thread repurposing asset.
 */
export const TwitterThreadDetailsSchema = z.object({
  hookTweet: z.string().optional(),
  tweets: z.array(z.string().min(1)).min(1, "tweets must contain at least one tweet"),
  ctaTweet: z.string().optional(),
});

export const TwitterThreadSchema = z.union([
  z.array(z.string().min(1)).min(1),
  TwitterThreadDetailsSchema,
]);

/**
 * LinkedIn post repurposing asset.
 */
export const LinkedInPostDetailsSchema = z.object({
  hook: z.string().optional(),
  content: z.string().min(1, "content is required"),
  takeaways: z.array(z.string()).optional(),
  cta: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
});

export const LinkedInPostSchema = z.union([
  z.string().min(1),
  LinkedInPostDetailsSchema,
]);

/**
 * Newsletter excerpt repurposing asset.
 */
export const NewsletterExcerptDetailsSchema = z.object({
  subjectLine: z.string().min(1, "subjectLine is required"),
  previewText: z.string().optional(),
  body: z.string().min(1, "body is required"),
  callToAction: z.string().optional(),
});

export const NewsletterExcerptSchema = z.union([
  z.string().min(1),
  NewsletterExcerptDetailsSchema,
]);

/**
 * RepurposingPackageSchema: Turns one core video idea into cross-platform assets.
 * Matching docs/product/00-original-plan.md Section 4 (Step 6) & Section 7.
 */
export const RepurposingPackageSchema = z.object({
  shortFormVideo: ShortFormVideoSchema,
  twitterThread: TwitterThreadSchema,
  linkedinPost: LinkedInPostSchema,
  newsletterExcerpt: NewsletterExcerptSchema,

  // Optional extensions
  quotePosts: z.array(z.string()).optional(),
  followUpVideoIdeas: z.array(z.string()).optional(),
});
