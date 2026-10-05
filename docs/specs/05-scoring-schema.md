# 05 - Scoring Schema Specification

Defined in `@creatoros/scene-schema`:
```typescript
export const QualityScoreSchema = z.object({
  retentionPrediction: z.number().min(0).max(100),
  brandConsistencyScore: z.number().min(0).max(100),
  clarityScore: z.number().min(0).max(100),
  productionFeasibilityScore: z.number().min(0).max(100),
  compositeScore: z.number().min(0).max(100),
});
```
