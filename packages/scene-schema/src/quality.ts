import { z } from "zod";

/**
 * QualityScoreSchema: Evaluates retention, brand consistency, clarity, feasibility, and composite rating.
 * Matching docs/product/00-original-plan.md Section 4 (Step 7) & Section 7.
 */
export const QualityScoreSchema = z.object({
  retentionPrediction: z.number().min(0).max(100, "retentionPrediction must be between 0 and 100"),
  brandConsistencyScore: z.number().min(0).max(100, "brandConsistencyScore must be between 0 and 100"),
  clarityScore: z.number().min(0).max(100, "clarityScore must be between 0 and 100"),
  productionFeasibilityScore: z.number().min(0).max(100, "productionFeasibilityScore must be between 0 and 100"),
  compositeScore: z.number().min(0).max(100, "compositeScore must be between 0 and 100"),

  // Feedback and analytical breakdown
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
});
