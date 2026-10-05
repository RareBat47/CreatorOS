# 05 - Quality Control & Safety: CreatorOS

## 1. Automated Guardrail Pipeline
Every output generated in CreatorOS passes through programmatic and model-based filters:

1. **Deterministic Banned Word Check**: Regex token scanning against the creator's banned word list and general AI clichés (`delve`, `tapestry`, `supercharge`, `game-changer`).
2. **Readability & Timing Audit**: Words-per-minute (WPM) calculations ensure the spoken text matches the frame duration (target 140-160 WPM).
3. **Zod Boundary Enforcement**: Output must pass `SceneSpecSchema.safeParse()` without exceptions.
4. **Retention Scoring Threshold**: Minimum composite score of 70 required to pass to Remotion rendering.
