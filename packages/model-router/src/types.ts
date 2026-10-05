import { z } from "zod";
import type { SceneSpec, CreatorProfile } from "@creatoros/scene-schema";
import type { StableMemory, MemoryRetrievalResult, CreatorMemoryContext } from "@creatoros/creator-memory";

// ============================================================================
// 1. Target Environments & Routing Tasks
// ============================================================================

export const TargetEnvironmentSchema = z.enum(["dev", "prod"]);
export type TargetEnvironment = z.infer<typeof TargetEnvironmentSchema>;

export const RoutingTaskSchema = z.enum([
  "strategy",
  "brainstorm",
  "scriptwriting",
  "multimodal",
  "critique",
  "validation",
]);
export type RoutingTask = z.infer<typeof RoutingTaskSchema>;

// ============================================================================
// 2. Chat & Multimodal Transport Types
// ============================================================================

export interface TextContentPart {
  type: "text";
  text: string;
}

export interface ImageContentPart {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
}

export interface VideoContentPart {
  type: "video_url";
  video_url: {
    url: string;
  };
}

export type ChatContentPart = TextContentPart | ImageContentPart | VideoContentPart;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ChatContentPart[];
  name?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  response_format?: {
    type: "text" | "json_object";
  };
  stream?: boolean;
}

export interface ChatCompletionChoice {
  index?: number;
  message: {
    role: "assistant" | string;
    content: string | null;
  };
  finish_reason?: string;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  object?: string;
  created?: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: ChatCompletionUsage;
}

// ============================================================================
// 3. Client & Router Configuration
// ============================================================================

export interface ModelClientConfig {
  /** Target execution environment (default 'dev') */
  environment?: TargetEnvironment;
  /** Base URL for gateway / API (overrides environment default) */
  baseUrl?: string;
  /** API key for bearer auth (overrides environment default) */
  apiKey?: string;
  /** Additional HTTP headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Custom fetch implementation (useful for tests or runtime proxies) */
  fetch?: typeof fetch;
}

export interface TaskRoutingConfig {
  primaryModel: string;
  fallbackModels: string[];
  defaultTemperature: number;
  systemPromptRole: string;
  maxTokens?: number;
}

export type TaskRoutingTable = Record<RoutingTask, TaskRoutingConfig>;
export type { CreatorMemoryContext };

export interface ModelRouterConfig {
  clientConfig?: ModelClientConfig;
  customRouting?: Partial<Record<RoutingTask, Partial<TaskRoutingConfig>>>;
  modelOverrides?: Partial<Record<RoutingTask, string>>;
}

export interface TaskExecutionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPromptOverride?: string;
  timeoutMs?: number;
  jsonMode?: boolean;
}

// ============================================================================
// 4. Model Council Types & Schemas
// ============================================================================

export const HookVariantSchema = z.object({
  hook: z.string().min(1),
  category: z.string().optional().default("curiosity"),
  angle: z.string().optional(),
  estimatedRetentionScore: z.number().min(0).max(100).optional(),
  rationale: z.string().optional(),
});
export type HookVariant = z.infer<typeof HookVariantSchema>;

export const BrainstormCouncilResultSchema = z.object({
  hooks: z.array(HookVariantSchema).min(1),
  refinedTopic: z.string().optional(),
  anglesConsidered: z.array(z.string()).optional().default([]),
  rawResponse: z.string().optional(),
});
export type BrainstormCouncilResult = z.infer<typeof BrainstormCouncilResultSchema>;

export const ScriptSectionSchema = z.object({
  sectionType: z.enum(["hook", "setup", "core_value", "reframe", "cta"]).or(z.string()),
  spokenText: z.string().min(1),
  visualNotes: z.string().optional(),
  estimatedDurationSeconds: z.number().positive().optional(),
});
export type ScriptSection = z.infer<typeof ScriptSectionSchema>;

export const DraftNarrativeSchema = z.object({
  title: z.string().min(1),
  selectedHook: z.string().min(1),
  fullScript: z.string().min(1),
  sections: z.array(ScriptSectionSchema).min(1),
  ctaText: z.string().min(1),
  estimatedDurationSeconds: z.number().positive(),
  rawResponse: z.string().optional(),
});
export type DraftNarrative = z.infer<typeof DraftNarrativeSchema>;

export const CouncilQualityScoreSchema = z.object({
  retentionPrediction: z.number().min(0).max(100),
  brandConsistencyScore: z.number().min(0).max(100),
  clarityScore: z.number().min(0).max(100),
  productionFeasibilityScore: z.number().min(0).max(100),
  compositeScore: z.number().min(0).max(100),
});
export type CouncilQualityScore = z.infer<typeof CouncilQualityScoreSchema>;

export const CouncilCritiqueResultSchema = z.object({
  scores: CouncilQualityScoreSchema,
  strengths: z.array(z.string()).optional().default([]),
  weaknesses: z.array(z.string()).optional().default([]),
  recommendations: z.array(z.string()).optional().default([]),
  forbiddenWordsFound: z.array(z.string()).optional().default([]),
  brandRuleViolations: z.array(z.string()).optional().default([]),
  approved: z.boolean(),
  critiqueSummary: z.string(),
  rawResponse: z.string().optional(),
});
export type CouncilCritiqueResult = z.infer<typeof CouncilCritiqueResultSchema>;

export interface SceneSpecValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  durationCheck: {
    targetSeconds: number;
    actualSeconds: number;
    fps: number;
    totalFrames: number;
    withinTolerance: boolean;
  };
  hasCta: boolean;
  sceneCount: number;
}

export interface CouncilSceneSpecResult {
  sceneSpec: SceneSpec;
  validationReport: SceneSpecValidationReport;
  rawResponse?: string;
}

export interface CouncilPipelineInput {
  topic: string;
  creatorMemory?: StableMemory | MemoryRetrievalResult | unknown;
  creatorProfile?: CreatorProfile;
  targetDurationSeconds?: number;
  fps?: number;
  format?: "short_vertical" | "square" | "landscape";
  preferredLayout?: "talking-head" | "three-tips" | "story-arc";
  hookCount?: number;
  selectedHookIndex?: number;
  additionalDirectives?: string;
}

export interface CouncilPipelineOutput {
  brainstorm: BrainstormCouncilResult;
  draft: DraftNarrative;
  critique: CouncilCritiqueResult;
  sceneSpec: SceneSpec;
  validation: SceneSpecValidationReport;
  metadata: {
    executionTimeMs: number;
    environment: TargetEnvironment;
    modelsUsed: Record<RoutingTask, string>;
  };
}
