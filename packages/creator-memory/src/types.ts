import { z } from "zod";
import type { SceneSpec } from "@creatoros/scene-schema";
import {
  CreatorProfileSchema,
  AudienceSchema,
  AudienceDetailsSchema,
  ToneSchema,
  ContentPillarsSchema,
  ContentPillarItemSchema,
  VisualStyleSchema,
  QualityScoreSchema,
} from "@creatoros/scene-schema";

// Re-export core scene types and schemas needed for memory
export {
  CreatorProfileSchema,
  AudienceSchema,
  AudienceDetailsSchema,
  ToneSchema,
  ContentPillarsSchema,
  ContentPillarItemSchema,
  VisualStyleSchema,
  QualityScoreSchema,
};

// ============================================================================
// 1. Stable Memory (Identity, tone, pillars, visual style, banned words, audience)
// ============================================================================

export const StableIdentitySchema = z.object({
  creatorId: z.string().optional(),
  name: z.string().min(1),
  profession: z.string().optional(),
  niche: z.string().optional(),
  bio: z.string().optional(),
  audience: AudienceSchema,
  goals: z.array(z.string()).default([]),
  avatarUrl: z.string().optional(),
  primaryPlatforms: z.array(z.string()).optional().default([]),
});
export type StableIdentity = z.infer<typeof StableIdentitySchema>;
export type StableIdentityInput = z.input<typeof StableIdentitySchema>;

export const StableVoiceToneSchema = z.object({
  tone: ToneSchema,
  sentenceLength: z.enum(["short", "mixed", "long"]).optional().default("mixed"),
  energy: z.enum(["calm", "balanced", "high"]).optional().default("balanced"),
  humorLevel: z.number().min(0).max(10).optional().default(5),
  directness: z.number().min(0).max(10).optional().default(8),
  vocabulary: z.array(z.string()).default([]),
  forbiddenPhrases: z.array(z.string()).default([]),
});
export type StableVoiceTone = z.infer<typeof StableVoiceToneSchema>;
export type StableVoiceToneInput = z.input<typeof StableVoiceToneSchema>;

export const BrandRuleCategorySchema = z.enum([
  "tone",
  "voice",
  "pacing",
  "visual",
  "phrasing",
  "topic",
  "cta",
  "general",
]);

export const BrandRuleSchema = z.object({
  id: z.string().optional(),
  rule: z.string().min(1),
  category: BrandRuleCategorySchema.default("general"),
  originFeedback: z.string().optional(), // "Make me sound more direct"
  enforceStrictly: z.boolean().optional(),
  createdAt: z.string().datetime().optional(),
});
export type BrandRule = z.infer<typeof BrandRuleSchema>;
export type BrandRuleInput = z.input<typeof BrandRuleSchema>;

export const ContentStrategySchema = z.object({
  primaryPlatforms: z.array(z.string()).default(["tiktok", "reels", "shorts"]),
  postingFrequencyPerWeek: z.number().int().positive().optional().default(5),
  preferredLengthSeconds: z.number().positive().optional().default(45),
  conversionGoal: z.enum(["followers", "leads", "sales", "authority"]).default("authority"),
});
export type ContentStrategy = z.infer<typeof ContentStrategySchema>;
export type ContentStrategyInput = z.input<typeof ContentStrategySchema>;

export const MemoryContentPillarSchema = z.union([
  z.string().min(1),
  ContentPillarItemSchema,
]);

export const MemoryContentPillarsSchema = z.union([
  ContentPillarsSchema,
  z.array(MemoryContentPillarSchema),
]);

export const StableMemorySchema = z.object({
  creatorId: z.string().optional(),
  identity: StableIdentitySchema,
  voice: StableVoiceToneSchema,
  pillars: MemoryContentPillarsSchema,
  visualStyle: VisualStyleSchema,
  bannedWords: z.array(z.string()).default([]),
  forbiddenPhrases: z.array(z.string()).default([]),
  brandRules: z.array(BrandRuleSchema).default([]),
  strategy: ContentStrategySchema.optional(),
  opinions: z.array(z.string()).default([]),
  personalStories: z.array(z.string()).default([]),
  proofPoints: z.array(z.string()).default([]),
  favoriteHooks: z.array(z.string()).default([]),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type StableMemory = z.infer<typeof StableMemorySchema>;
export type StableMemoryInput = z.input<typeof StableMemorySchema>;

// ============================================================================
// 2. Episodic Memory (Previous scripts, hooks tested, topics, narrative arcs)
// ============================================================================

export const HookTestItemSchema = z.object({
  hook: z.string().min(1),
  category: z.string().optional().default("contrarian"),
  variantLabel: z.string().optional(), // e.g. "A", "B"
  wasApproved: z.boolean().default(false),
  impressions: z.number().nonnegative().optional(),
  retentionFirst3s: z.number().min(0).max(100).optional(),
});
export type HookTestItem = z.infer<typeof HookTestItemSchema>;
export type HookTestItemInput = z.input<typeof HookTestItemSchema>;

export const NarrativeArcSchema = z.object({
  type: z.string().default("hook-problem-solution-cta"), // e.g. "before-after-bridge", "story-lesson", "three-tips"
  hook: z.string(),
  buildup: z.string().optional(),
  climaxOrTurningPoint: z.string().optional(),
  resolution: z.string().optional(),
  callToAction: z.string().optional(),
});
export type NarrativeArc = z.infer<typeof NarrativeArcSchema>;
export type NarrativeArcInput = z.input<typeof NarrativeArcSchema>;

export const EpisodicMemoryItemSchema = z.object({
  id: z.string(),
  creatorId: z.string().min(1),
  title: z.string().min(1),
  topicsCovered: z.array(z.string()).default([]),
  pillar: z.string().optional(),
  scriptText: z.string().min(1),
  editedScriptText: z.string().optional(),
  hooksTested: z.array(HookTestItemSchema).default([]),
  approvedHook: z.string().optional(),
  narrativeArc: NarrativeArcSchema.optional(),
  format: z.string().default("talking-head"), // "talking-head", "three-tips", "story-arc", etc.
  platform: z.string().optional(),
  status: z.enum(["draft", "approved", "edited", "published", "archived"]).default("draft"),
  sceneData: z.array(z.custom<SceneSpec>()).optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type EpisodicMemoryItem = z.infer<typeof EpisodicMemoryItemSchema>;
export type EpisodicMemoryItemInput = z.input<typeof EpisodicMemoryItemSchema>;

// ============================================================================
// 3. Performance Memory (Retention rates, views, best hooks, format affinities)
// ============================================================================

export const RetentionMetricsSchema = z.object({
  averagePercentage: z.number().min(0).max(100), // overall retention %
  at3Seconds: z.number().min(0).max(100).optional(),
  at5Seconds: z.number().min(0).max(100).optional(),
  at30Seconds: z.number().min(0).max(100).optional(),
  completionRate: z.number().min(0).max(100).optional(),
});
export type RetentionMetrics = z.infer<typeof RetentionMetricsSchema>;
export type RetentionMetricsInput = z.input<typeof RetentionMetricsSchema>;

export const BestPerformingHookSchema = z.object({
  hook: z.string().min(1),
  retentionRate: z.number().min(0).max(100),
  views: z.number().nonnegative(),
  category: z.string().optional(),
  contentId: z.string().optional(),
});
export type BestPerformingHook = z.infer<typeof BestPerformingHookSchema>;
export type BestPerformingHookInput = z.input<typeof BestPerformingHookSchema>;

export const FormatAffinitySchema = z.object({
  format: z.string().min(1), // e.g. "three-tips", "talking-head", "story-arc"
  affinityScore: z.number().min(0).max(100), // higher = better historical affinity
  sampleCount: z.number().int().nonnegative().default(1),
  averageRetention: z.number().min(0).max(100).optional(),
  averageViews: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});
export type FormatAffinity = z.infer<typeof FormatAffinitySchema>;
export type FormatAffinityInput = z.input<typeof FormatAffinitySchema>;

export const PerformanceMemoryItemSchema = z.object({
  id: z.string(),
  contentId: z.string(), // relates to EpisodicMemoryItem.id
  creatorId: z.string().min(1),
  views: z.number().nonnegative().default(0),
  watchTimeSeconds: z.number().nonnegative().optional(),
  retention: RetentionMetricsSchema,
  saves: z.number().nonnegative().optional().default(0),
  shares: z.number().nonnegative().optional().default(0),
  comments: z.number().nonnegative().optional().default(0),
  likes: z.number().nonnegative().optional().default(0),
  leadsGenerated: z.number().nonnegative().optional().default(0),
  conversionRate: z.number().min(0).max(100).optional(),
  bestPerformingHooks: z.array(BestPerformingHookSchema).default([]),
  formatAffinities: z.array(FormatAffinitySchema).default([]),
  platform: z.string().optional(),
  recordedAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type PerformanceMemoryItem = z.infer<typeof PerformanceMemoryItemSchema>;
export type PerformanceMemoryItemInput = z.input<typeof PerformanceMemoryItemSchema>;

// ============================================================================
// 4. Vector & Search Retrieval Interfaces
// ============================================================================

export interface VectorSearchResult<T> {
  item: T;
  score: number; // 0.0 to 1.0 (or distance score)
  id: string;
}

export interface IVectorRetrievalAdapter {
  index(id: string, text: string, metadata?: Record<string, unknown>): Promise<void>;
  search(
    query: string,
    limit?: number,
    minScore?: number
  ): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>>;
  delete?(id: string): Promise<void>;
}

export const SearchCriteriaSchema = z.object({
  creatorId: z.string().min(1),
  query: z.string().optional(),
  pillar: z.string().optional(),
  format: z.string().optional(),
  topics: z.array(z.string()).optional(),
  hookCategory: z.string().optional(),
  minRetentionRate: z.number().min(0).max(100).optional(),
  minViews: z.number().nonnegative().optional(),
  status: z.enum(["draft", "approved", "edited", "published", "archived"]).optional(),
  limit: z.number().int().positive().optional(),
  minSimilarity: z.number().min(0).max(1).optional(),
});
export type SearchCriteria = z.infer<typeof SearchCriteriaSchema>;
export type SearchCriteriaInput = z.input<typeof SearchCriteriaSchema>;

export const RelevantHookSchema = z.object({
  hook: z.string(),
  source: z.enum(["stable_favorite", "episodic_approved", "top_performance"]),
  score: z.number().optional(),
  retentionRate: z.number().optional(),
  views: z.number().optional(),
});
export type RelevantHook = z.infer<typeof RelevantHookSchema>;
export type RelevantHookInput = z.input<typeof RelevantHookSchema>;

export const PerformanceSummarySchema = z.object({
  averageRetention: z.number().optional(),
  totalViews: z.number().default(0),
  topPerformingHook: z.string().optional(),
});
export type PerformanceSummary = z.infer<typeof PerformanceSummarySchema>;

/**
 * MemoryRetrievalResult: Exactly what Section 11 specifies:
 * When writing a new script, retrieve:
 * - The creator's preferred tone
 * - Five previously approved hooks
 * - Three high-performing scripts
 * - Forbidden phrases
 * - Brand rules
 * - Format affinities & recommendations
 */
export const MemoryRetrievalResultSchema = z.object({
  creatorId: z.string(),
  preferredTone: ToneSchema,
  forbiddenPhrases: z.array(z.string()),
  bannedWords: z.array(z.string()),
  brandRules: z.array(BrandRuleSchema).optional().default([]),
  approvedHooks: z.array(RelevantHookSchema),
  highPerformingScripts: z.array(EpisodicMemoryItemSchema),
  similarEpisodes: z.array(EpisodicMemoryItemSchema).optional().default([]),
  formatAffinities: z.array(FormatAffinitySchema),
  activePillars: MemoryContentPillarsSchema.optional(),
  relevantPillars: z.array(z.string()).optional().default([]),
  performanceSummary: PerformanceSummarySchema.default({ totalViews: 0 }),
  insights: z.array(z.string()).optional().default([]),
});
export type MemoryRetrievalResult = z.infer<typeof MemoryRetrievalResultSchema>;
export type MemoryRetrievalResultInput = z.input<typeof MemoryRetrievalResultSchema>;

// ============================================================================
// 5. Memory Store Interface
// ============================================================================

export type CreatorMemoryContext = MemoryRetrievalResult;
export interface ICreatorMemoryStore {
  // Stable Memory Operations
  getStableMemory(creatorId: string): Promise<StableMemory | null>;
  setStableMemory(creatorId: string, memory: StableMemory): Promise<void>;
  updateStableMemory(creatorId: string, patch: Partial<StableMemory>): Promise<StableMemory>;
  addBrandRule(
    creatorId: string,
    ruleInput: Omit<BrandRule, "id" | "createdAt">
  ): Promise<BrandRule>;

  // Episodic Memory Operations
  addEpisodicMemory(creatorId: string, item: EpisodicMemoryItem): Promise<void>;
  getEpisodicMemories(
    creatorId: string,
    filter?: Partial<EpisodicMemoryItem>
  ): Promise<EpisodicMemoryItem[]>;
  getEpisodicMemory(creatorId: string, episodeId: string): Promise<EpisodicMemoryItem | null>;

  // Performance Memory Operations
  recordPerformanceMemory(creatorId: string, item: PerformanceMemoryItem): Promise<void>;
  getPerformanceMemories(
    creatorId: string,
    filter?: Partial<PerformanceMemoryItem>
  ): Promise<PerformanceMemoryItem[]>;
  getTopPerformingHooks(creatorId: string, limit?: number): Promise<BestPerformingHook[]>;

  // Combined Section 11 Context Retrieval
  retrieve(criteria: SearchCriteria): Promise<MemoryRetrievalResult>;
}
