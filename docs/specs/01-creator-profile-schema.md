# 01 - Creator Profile Schema Specification

Defined in `@creatoros/scene-schema`:
```typescript
export const CreatorProfileSchema = z.object({
  creatorId: z.string().min(1, "creatorId is required"),
  name: z.string().min(1, "name is required"),
  niche: z.string().min(1, "niche is required"),
  audience: AudienceSchema, // String or { target, demographics, painPoints, desires }
  tone: ToneSchema, // String or Array of tone keywords
  bannedWords: z.array(z.string()).default([]),
  visualStyle: VisualStyleSchema, // Colors, fonts, layout preferences, logoUrl
  pillars: ContentPillarsSchema, // Array of pillar names or detailed pillar objects
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  forbiddenPhrases: z.array(z.string()).optional(),
  recurringSeries: z.array(z.string()).optional(),
  favoriteHooks: z.array(z.string()).optional(),
  opinions: z.array(z.string()).optional(),
  personalStories: z.array(z.string()).optional(),
  primaryPlatforms: z.array(z.string()).optional(),
});
```
