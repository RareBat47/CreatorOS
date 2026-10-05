# 03 - Content Repurposing Package Specification

Defined in `@creatoros/scene-schema`:
```typescript
export const RepurposingPackageSchema = z.object({
  shortFormVideo: ShortFormVideoSchema, // Video title, script, platform tags
  twitterThread: TwitterThreadSchema, // Hook tweet, ordered thread tweets
  linkedinPost: LinkedInPostSchema, // Formatted body, callToAction
  newsletterExcerpt: NewsletterExcerptSchema, // Subject line, body excerpt
});
```
