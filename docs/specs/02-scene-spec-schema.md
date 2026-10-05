# 02 - Scene Spec Schema Specification

Defined in `@creatoros/scene-schema`:
```typescript
export const SceneSpecSchema = z.object({
  sceneId: z.string().min(1, "sceneId is required"),
  layout: LayoutSchema, // 'talking-head' | 'three-tips' | 'story-arc'
  durationInFrames: z.number().int().positive(),
  fps: z.number().int().positive().default(30),
  hook: HookSchema, // String or HookObject with text, category, visualEmphasis
  visualLayers: z.array(VisualLayerSchema).default([]),
  captions: CaptionsSchema.default([]), // Array of tokens with frame timestamps
  audioTrack: AudioTrackSchema.default({}), // Voiceover text/url, background music, ducking
  cameraMotion: CameraMotionSchema.default({}), // Zoom in/out, drift, intensity
  transition: TransitionSchema.default({ type: "cut", durationInFrames: 0 }),
  brandStyle: BrandStyleSchema.optional(),
  metadata: SceneMetadataSchema.optional(),
});
```
