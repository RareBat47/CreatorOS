# 05 - Kinetic Captions Engine

## 1. Caption Synchronization
Captions are represented in `SceneSpec` as discrete tokens with `startFrame`, `endFrame`, and `highlight` flags.
- **Style**: Inter Black / Montserrat Bold with black drop shadow and stroke.
- **Highlight Effect**: Active spoken word highlighted in brand accent color (e.g. #FFDD00 or #38BDF8).
- **Animation**: Micro bounce scale (scale 1.1 down to 1.0) on word trigger.
