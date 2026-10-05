# 01 - Remotion Renderer Architecture: CreatorOS

## 1. Headless Composition Model
Remotion in CreatorOS runs strictly inside `apps/renderer` as a headless background rendering service.
- **Root Composition**: Dynamically loads composition components based on `SceneSpec.layout`.
- **Resolution**: 1080x1920 (9:16 vertical video).
- **Frame Rate**: 30 FPS standard.
- **Rendering Command**: `@remotion/renderer` bundles and executes video frames via headless Chromium instances, muxing audio via FFMPEG.
