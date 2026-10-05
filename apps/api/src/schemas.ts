import { z } from "zod";
import {
  CreatorProfileSchema,
  SceneSpecSchema,
  RepurposingPackageSchema,
} from "@creatoros/scene-schema";
import { StableMemorySchema } from "@creatoros/creator-memory";

// Creators endpoints schemas
export const CreateCreatorRequestSchema = z.object({
  profile: CreatorProfileSchema.optional(),
  stableMemory: StableMemorySchema.optional(),
}).refine(
  (data) => data.profile !== undefined || data.stableMemory !== undefined,
  {
    message: "Either profile or stableMemory must be provided",
  }
);
export type CreateCreatorRequest = z.infer<typeof CreateCreatorRequestSchema>;

// Ideas Expand endpoint schemas
export const ExpandIdeaRequestSchema = z.object({
  creatorId: z.string().optional(),
  topic: z.string().min(1, "topic is required"),
  additionalDirectives: z.string().optional(),
  hookCount: z.number().int().min(1).max(20).optional().default(5),
  targetAudience: z.string().optional(),
});
export type ExpandIdeaRequest = z.infer<typeof ExpandIdeaRequestSchema>;

// Scripts Generate endpoint schemas
export const GenerateScriptRequestSchema = z.object({
  creatorId: z.string().optional(),
  topic: z.string().min(1, "topic is required"),
  selectedHook: z.string().optional(),
  selectedHookIndex: z.number().int().min(0).optional(),
  targetDurationSeconds: z.number().positive().optional().default(45),
  additionalDirectives: z.string().optional(),
});
export type GenerateScriptRequest = z.infer<typeof GenerateScriptRequestSchema>;

// Scenes Plan endpoint schemas
export const PlanSceneRequestSchema = z.object({
  creatorId: z.string().optional(),
  topic: z.string().min(1, "topic is required"),
  selectedHook: z.string().optional(),
  targetDurationSeconds: z.number().positive().optional().default(45),
  fps: z.number().int().positive().optional().default(30),
  format: z.enum(["short_vertical", "square", "landscape"]).optional().default("short_vertical"),
  preferredLayout: z.enum(["talking-head", "three-tips", "story-arc"]).optional().default("talking-head"),
  additionalDirectives: z.string().optional(),
});
export type PlanSceneRequest = z.infer<typeof PlanSceneRequestSchema>;

// Render Jobs endpoint schemas
export const RenderJobRequestSchema = z.object({
  sceneSpec: SceneSpecSchema.optional(),
  sceneSpecId: z.string().optional(),
  compositionId: z.enum(["TalkingHead", "ThreeTips", "StoryArc"]).optional(),
  outputFormat: z.enum(["mp4", "webm", "gif"]).optional().default("mp4"),
  webhookUrl: z.string().url().optional(),
  simulateFailure: z.boolean().optional(),
}).refine(
  (data) => data.sceneSpec !== undefined || data.sceneSpecId !== undefined,
  {
    message: "Either sceneSpec or sceneSpecId must be provided",
  }
);
export type RenderJobRequest = z.infer<typeof RenderJobRequestSchema>;

export const RenderJobStatusSchema = z.enum(["queued", "rendering", "completed", "failed"]);
export type RenderJobStatus = z.infer<typeof RenderJobStatusSchema>;

export interface RenderJobRecord {
  jobId: string;
  status: RenderJobStatus;
  progress: number;
  outputFormat: string;
  compositionId: string;
  estimatedWaitSeconds: number;
  downloadUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// Repurpose endpoint schemas
export const RepurposeRequestSchema = z.object({
  creatorId: z.string().optional(),
  topic: z.string().min(1, "topic is required"),
  scriptText: z.string().optional(),
  coreInsights: z.array(z.string()).optional(),
  callToAction: z.string().optional(),
});
export type RepurposeRequest = z.infer<typeof RepurposeRequestSchema>;

export { RepurposingPackageSchema };
