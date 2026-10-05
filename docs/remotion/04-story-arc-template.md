# Remotion Composition: Story Arc Template

The `StoryArc` composition is a programmatic video template engineered for high-retention narrative storytelling across horizontal (16:9) and vertical (9:16) platforms. Built on the classic five-beat dramatic structure—**The Problem**, **The Mistake**, **The Turning Point**, **The Lesson**, and **The Call to Action (CTA)**—this composition couples deterministic animation physics with a frame-accurate dynamic audio ducking engine.

---

## 1. Narrative Architecture & Beat Dynamics

The template operates on a dynamic timeline parameterized by frames. Each beat corresponds to a visual and emotional phase calibrated to match dopamine-retention curves typical of modern digital media.

```
       [Hook / Problem]      [Mistake / Anti-Climax]   [Turning Point / Climax]     [Lesson / Payoff]      [CTA / Resolution]
       0% ----------> 20%    20% -------------> 45%    45% ---------------> 70%     70% ---------> 88%     88% ---------> 100%
Energy:  HIGH (Urgent)             FALLING (Frustrated)         RISING (Epiphany)             ELEVATED (Clarity)     FOCUSED (Direct)
Visual:  Distorted / Red Tones     Desaturated / Chaos          Flash / High Contrast         Clean / Crisp          Minimal / High-Focus
Audio:   Ducked (-18dB)            Ducked (-22dB)               Swell (-6dB) -> Ducked        Ducked (-18dB)         Ducked (-12dB)
```

### Beat Characteristics Matrix

| Beat | Narrative Function | Visual Palette & Grading | Pacing / Frame Rate Factor | Default Duration Weight | Spring Physics Profile |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. The Problem** | Establish conflict, hook attention within 2 seconds | High contrast, warm reds/oranges, chromatic aberration | Rapid cuts, aggressive zoom (`1.0x -> 1.15x`) | 18% of total duration | Snappy (`mass: 0.5, damping: 12`) |
| **2. The Mistake** | Validate pain points, expose flawed conventional solutions | Cool blues, desaturated hues, screen shake / jitter | Staccato pacing, layered micro-elements | 27% of total duration | Heavy (`mass: 1.8, damping: 24`) |
| **3. The Turning Point** | Reveal the breakthrough, shift the perspective | High key, white flash overlays, emerald/cyan accents | Slow motion pause followed by acceleration | 25% of total duration | Smooth (`mass: 1.0, damping: 18`) |
| **4. The Lesson** | Deliver actionable, step-by-step insight | Neutral dark background, clean typography, accent gold | Steady, metric, rhythmic text reveals | 18% of total duration | Rigid (`mass: 0.8, damping: 20`) |
| **5. The CTA** | Channel gained trust into immediate action | High-focus single brand color, directional focus | Minimalist, single focal point | 12% of total duration | Punchy (`mass: 0.4, damping: 10`) |

---

## 2. Architecture & Data Schemas

The template uses strict runtime schema validation via Zod to enforce programmatic rendering constraints across CreatorOS automation pipelines.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CreatorOS Composition Context                   │
│                                                                        │
│  ┌───────────────────────┐            ┌─────────────────────────────┐  │
│  │ StoryArcSchema (Zod)  │ ─────────> │   StoryArcComposition       │  │
│  └───────────────────────┘            └──────────────┬──────────────┘  │
│                                                      │                 │
│         ┌───────────────────┬────────────────────────┼─────────────┐   │
│         ▼                   ▼                        ▼             ▼   │
│  ┌──────────────┐    ┌──────────────┐         ┌─────────────┐┌───────┐ │
│  │ AudioDirector│    │ SceneRouter  │         │ Transition  ││ Brand │ │
│  │ (Ducking/VO) │    │ (Beats 1-5)  │         │ Controller  ││ Frame │ │
│  └──────────────┘    └──────────────┘         └─────────────┘└───────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Complete Schema Definition (`types.ts`)

```typescript
import { z } from "zod";

export const SceneTypeSchema = z.enum([
  "problem",
  "mistake",
  "turning_point",
  "lesson",
  "cta",
]);
export type SceneType = z.infer<typeof SceneTypeSchema>;

export const AudioDuckWindowSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().nonnegative(),
  targetVolumeDb: z.number().max(0).default(-18),
  fadeDurationFrames: z.number().int().positive().default(8),
});
export type AudioDuckWindow = z.infer<typeof AudioDuckWindowSchema>;

export const VoiceoverTrackSchema = z.object({
  src: z.string().url(),
  durationInFrames: z.number().int().positive(),
  offsetInFrames: z.number().int().default(0),
  volume: z.number().min(0).max(2).default(1.0),
});
export type VoiceoverTrack = z.infer<typeof VoiceoverTrackSchema>;

export const BackgroundMusicTrackSchema = z.object({
  src: z.string().url(),
  baseVolumeDb: z.number().max(0).default(-6),
  duckedVolumeDb: z.number().max(0).default(-20),
  fadeInFrames: z.number().int().default(15),
  fadeOutFrames: z.number().int().default(30),
});
export type BackgroundMusicTrack = z.infer<typeof BackgroundMusicTrackSchema>;

export const BaseSceneSchema = z.object({
  id: z.string().uuid(),
  type: SceneTypeSchema,
  headline: z.string().min(1).max(120),
  subheadline: z.string().max(240).optional(),
  durationInFrames: z.number().int().positive(),
  mediaUrl: z.string().url().optional(),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/).default("#FF3366"),
});

export const ProblemSceneDataSchema = BaseSceneSchema.extend({
  type: z.literal("problem"),
  intensityLevel: z.number().min(1).max(5).default(3),
  tag: z.string().default("THE CRITICAL FLAW"),
});

export const MistakeSceneDataSchema = BaseSceneSchema.extend({
  type: z.literal("mistake"),
  failedAttempts: z.array(z.string()).min(1).max(4),
});

export const TurningPointSceneDataSchema = BaseSceneSchema.extend({
  type: z.literal("turning_point"),
  breakthroughMetric: z.string(),
  breakthroughLabel: z.string(),
});

export const LessonSceneDataSchema = BaseSceneSchema.extend({
  type: z.literal("lesson"),
  takeaways: z.array(
    z.object({
      order: z.number().int(),
      title: z.string(),
      description: z.string(),
    })
  ).min(1).max(3),
});

export const CtaSceneDataSchema = BaseSceneSchema.extend({
  type: z.literal("cta"),
  actionText: z.string(),
  destinationUrl: z.string(),
  avatarUrl: z.string().url().optional(),
});

export const SceneSchema = z.discriminatedUnion("type", [
  ProblemSceneDataSchema,
  MistakeSceneDataSchema,
  TurningPointSceneDataSchema,
  LessonSceneDataSchema,
  CtaSceneDataSchema,
]);
export type Scene = z.infer<typeof SceneSchema>;

export const StoryArcCompositionSchema = z.object({
  scenes: z.array(SceneSchema).length(5),
  voiceover: VoiceoverTrackSchema,
  backgroundMusic: BackgroundMusicTrackSchema,
  brandKit: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    fontFamilyHeading: z.string(),
    fontFamilyBody: z.string(),
    logoUrl: z.string().url().optional(),
  }),
});
export type StoryArcCompositionProps = z.infer<typeof StoryArcCompositionSchema>;
```

---

## 3. Audio Ducking Engine: Mathematical Formulation

Background music ducking must not abruptly toggle audio levels. It executes an S-curve easing trajectory calculated per frame to eliminate perceptual clipping while maximizing dialogue intelligibility.

```
       BGM dB Level
        0dB ─────────────────────────────────────────── Base Volume (-6dB)
            \                                         /
             \  Fade-In Window                       /  Fade-Out Window
      -10dB   \                                     /
               \                                   /
      -20dB ────\═════════════════════════════════/──── Ducked Volume (-20dB)
                 | Voiceover Active Region       |
```

### Gain Conversion Functions

Decibels are non-linear; applying arithmetic transforms directly to linear gain causes distortion. Gains are calculated as:

$$\text{Gain}_{\text{linear}} = 10^{\frac{\text{dB}}{20}}$$

Given frame $f$, activation start frame $f_s$, transition length $L$, target ducked level $\text{dB}_{\text{duck}}$, and base level $\text{dB}_{\text{base}}$:

$$t = \text{clamp}\left(\frac{f - f_s}{L}, 0, 1\right)$$

$$S(t) = 3t^2 - 2t^3 \quad (\text{Smoothstep interpolation})$$

$$\text{dB}(f) = \text{dB}_{\text{base}} + (\text{dB}_{\text{duck}} - \text{dB}_{\text{base}}) \cdot S(t)$$

```typescript
// audio/audioCalculations.ts
export const dbToLinear = (db: number): number => {
  return Math.pow(10, db / 20);
};

export const calculateDuckedVolume = (
  frame: number,
  baseDb: number,
  duckedDb: number,
  duckWindows: Array<{ start: number; end: number; fadeFrames: number }>
): number => {
  let currentDb = baseDb;

  for (const window of duckWindows) {
    const rampInStart = window.start - window.fadeFrames;
    const rampInEnd = window.start;
    const rampOutStart = window.end;
    const rampOutEnd = window.end + window.fadeFrames;

    if (frame >= rampInStart && frame < rampInEnd) {
      const progress = (frame - rampInStart) / window.fadeFrames;
      const smoothProgress = progress * progress * (3 - 2 * progress);
      currentDb = baseDb + (duckedDb - baseDb) * smoothProgress;
      break;
    } else if (frame >= rampInEnd && frame <= rampOutStart) {
      currentDb = duckedDb;
      break;
    } else if (frame > rampOutStart && frame <= rampOutEnd) {
      const progress = (frame - rampOutStart) / window.fadeFrames;
      const smoothProgress = progress * progress * (3 - 2 * progress);
      currentDb = duckedDb + (baseDb - duckedDb) * smoothProgress;
      break;
    }
  }

  return dbToLinear(currentDb);
};
```

---

## 4. Complete Implementation Code

### 4.1 Audio Director (`audio/AudioDirector.tsx`)

```tsx
import React, { useMemo } from "react";
import { Audio, useCurrentFrame } from "remotion";
import { BackgroundMusicTrack, VoiceoverTrack } from "../types";
import { calculateDuckedVolume, dbToLinear } from "./audioCalculations";

interface AudioDirectorProps {
  voiceover: VoiceoverTrack;
  backgroundMusic: BackgroundMusicTrack;
  totalDurationInFrames: number;
}

export const AudioDirector: React.FC<AudioDirectorProps> = ({
  voiceover,
  backgroundMusic,
  totalDurationInFrames,
}) => {
  const frame = useCurrentFrame();

  const duckWindows = useMemo(() => {
    return [
      {
        start: voiceover.offsetInFrames,
        end: voiceover.offsetInFrames + voiceover.durationInFrames,
        fadeFrames: 10,
      },
    ];
  }, [voiceover]);

  const bgmVolume = useMemo(() => {
    // Lead-in and lead-out processing
    let masterFade = 1.0;
    if (frame < backgroundMusic.fadeInFrames) {
      masterFade = frame / backgroundMusic.fadeInFrames;
    } else if (frame > totalDurationInFrames - backgroundMusic.fadeOutFrames) {
      masterFade = (totalDurationInFrames - frame) / backgroundMusic.fadeOutFrames;
    }

    const duckedGain = calculateDuckedVolume(
      frame,
      backgroundMusic.baseVolumeDb,
      backgroundMusic.duckedVolumeDb,
      duckWindows
    );

    return Math.max(0, duckedGain * masterFade);
  }, [frame, backgroundMusic, duckWindows, totalDurationInFrames]);

  return (
    <>
      <Audio
        src={voiceover.src}
        startFrom={0}
        endAt={voiceover.durationInFrames}
        volume={voiceover.volume}
        playbackRate={1.0}
      />
      <Audio
        src={backgroundMusic.src}
        volume={bgmVolume}
        loop
      />
    </>
  );
};
```

### 4.2 Scene Transition Primitives (`transitions/TransitionContainer.tsx`)

```tsx
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type TransitionType = "whip-left" | "flash-bang" | "zoom-dissolve" | "slide-up";

interface TransitionContainerProps {
  children: React.ReactNode;
  durationInFrames: number;
  transitionType: TransitionType;
}

export const TransitionContainer: React.FC<TransitionContainerProps> = ({
  children,
  durationInFrames,
  transitionType,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const introProgress = spring({
    frame,
    fps,
    config: { damping: 18, mass: 0.8, stiffness: 120 },
  });

  const outroProgress = spring({
    frame: frame - (durationInFrames - 12),
    fps,
    config: { damping: 14, mass: 0.5, stiffness: 140 },
  });

  let enterTransform = "none";
  let exitTransform = "none";
  let opacity = 1;
  let filter = "none";

  switch (transitionType) {
    case "whip-left": {
      const enterX = interpolate(introProgress, [0, 1], [width, 0]);
      const exitX = frame > durationInFrames - 12
        ? interpolate(outroProgress, [0, 1], [0, -width])
        : 0;
      enterTransform = `translateX(${enterX}px)`;
      exitTransform = `translateX(${exitX}px)`;
      break;
    }
    case "flash-bang": {
      const flash = interpolate(
        frame,
        [0, 6, durationInFrames - 6, durationInFrames],
        [1, 0, 0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      filter = `brightness(${1 + flash * 2.5})`;
      break;
    }
    case "zoom-dissolve": {
      const scaleIn = interpolate(introProgress, [0, 1], [1.2, 1]);
      const scaleOut = frame > durationInFrames - 12
        ? interpolate(outroProgress, [0, 1], [1, 0.9])
        : 1;
      enterTransform = `scale(${scaleIn})`;
      exitTransform = `scale(${scaleOut})`;
      opacity = frame > durationInFrames - 12
        ? interpolate(outroProgress, [0, 1], [1, 0])
        : interpolate(introProgress, [0, 1], [0, 1]);
      break;
    }
    case "slide-up": {
      const enterY = interpolate(introProgress, [0, 1], [height * 0.4, 0]);
      enterTransform = `translateY(${enterY}px)`;
      opacity = interpolate(introProgress, [0, 1], [0, 1]);
      break;
    }
  }

  return (
    <AbsoluteFill
      style={{
        transform: `${enterTransform} ${exitTransform}`,
        opacity,
        filter,
        overflow: "hidden",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
```

### 4.3 Scene Implementations

#### Scene 1: The Problem (`scenes/ProblemScene.tsx`)

```tsx
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ProblemSceneDataSchema } from "../types";
import { z } from "zod";

export const ProblemScene: React.FC<{ data: z.infer<typeof ProblemSceneDataSchema> }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = interpolate(frame, [0, data.durationInFrames], [1.0, 1.12], {
    extrapolateRight: "clamp",
  });

  const textEntry = spring({
    frame,
    fps,
    config: { mass: 0.6, damping: 10, stiffness: 180 },
  });

  const glitchJitter = interpolate(
    Math.sin(frame * 0.8),
    [-1, 1],
    [-2, 2]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0A0A0E",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${data.accentColor}22 0%, transparent 70%)`,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `translateY(${interpolate(textEntry, [0, 1], [60, 0])}px) translateX(${glitchJitter}px)`,
          opacity: textEntry,
          padding: "0 64px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: 22,
            letterSpacing: 6,
            fontWeight: 800,
            color: data.accentColor,
            marginBottom: 20,
            textTransform: "uppercase",
          }}
        >
          {data.tag}
        </span>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1.1,
            color: "#FFFFFF",
            margin: 0,
            maxWidth: 1000,
            fontFamily: "Inter, sans-serif",
            textShadow: `0 8px 32px ${data.accentColor}44`,
          }}
        >
          {data.headline}
        </h1>
        {data.subheadline && (
          <p
            style={{
              fontSize: 28,
              color: "#A0A0B2",
              marginTop: 24,
              maxWidth: 700,
              lineHeight: 1.4,
            }}
          >
            {data.subheadline}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};
```

#### Scene 2: The Mistake (`scenes/MistakeScene.tsx`)

```tsx
import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MistakeSceneDataSchema } from "../types";
import { z } from "zod";

export const MistakeScene: React.FC<{ data: z.infer<typeof MistakeSceneDataSchema> }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0D0F14",
        padding: "80px 100px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <h2
        style={{
          fontSize: 48,
          color: "#E2E8F0",
          margin: "0 0 40px 0",
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
        }}
      >
        {data.headline}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 880 }}>
        {data.failedAttempts.map((attempt, idx) => {
          const itemSpring = spring({
            frame: frame - idx * 12,
            fps,
            config: { mass: 0.9, damping: 16, stiffness: 140 },
          });

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#161B22",
                border: "1px solid #30363D",
                borderRadius: 12,
                padding: "20px 24px",
                transform: `translateX(${(1 - itemSpring) * -40}px)`,
                opacity: Math.max(0, itemSpring),
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "#FF444422",
                  color: "#FF4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 18,
                  marginRight: 20,
                  flexShrink: 0,
                }}
              >
                ✕
              </div>
              <span
                style={{
                  fontSize: 26,
                  color: "#94A3B8",
                  textDecoration: "line-through",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {attempt}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

#### Scene 3: The Turning Point (`scenes/TurningPointScene.tsx`)

```tsx
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TurningPointSceneDataSchema } from "../types";
import { z } from "zod";

export const TurningPointScene: React.FC<{ data: z.infer<typeof TurningPointSceneDataSchema> }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({
    frame,
    fps,
    config: { mass: 0.5, damping: 12, stiffness: 220 },
  });

  const auraSize = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [300, 360]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#050B14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: auraSize,
          height: auraSize,
          borderRadius: "50%",
          backgroundColor: "#00FFA3",
          filter: "blur(120px)",
          opacity: 0.25,
        }}
      />
      <span
        style={{
          fontSize: 24,
          letterSpacing: 4,
          fontWeight: 700,
          color: "#00FFA3",
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        {data.breakthroughLabel}
      </span>
      <h1
        style={{
          fontSize: 120,
          fontWeight: 900,
          color: "#FFFFFF",
          margin: 0,
          transform: `scale(${pop})`,
          fontFamily: "Inter, sans-serif",
          letterSpacing: -2,
        }}
      >
        {data.breakthroughMetric}
      </h1>
      <p
        style={{
          fontSize: 32,
          color: "#E2E8F0",
          marginTop: 20,
          maxWidth: 720,
          textAlign: "center",
        }}
      >
        {data.headline}
      </p>
    </AbsoluteFill>
  );
};
```

#### Scene 4: The Lesson (`scenes/LessonScene.tsx`)

```tsx
import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { LessonSceneDataSchema } from "../types";
import { z } from "zod";

export const LessonScene: React.FC<{ data: z.infer<typeof LessonSceneDataSchema> }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0A0A0A",
        padding: "80px 100px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <h2
        style={{
          fontSize: 44,
          color: "#FFFFFF",
          fontWeight: 800,
          marginBottom: 48,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {data.headline}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {data.takeaways.map((item, index) => {
          const itemAnim = spring({
            frame: frame - index * 15,
            fps,
            config: { mass: 0.7, damping: 14, stiffness: 120 },
          });

          return (
            <div
              key={item.order}
              style={{
                display: "flex",
                alignItems: "flex-start",
                opacity: Math.max(0, itemAnim),
                transform: `translateY(${(1 - itemAnim) * 20}px)`,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: "#E2E8F015",
                  color: "#00E5FF",
                  border: "1px solid #00E5FF44",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 800,
                  marginRight: 24,
                  flexShrink: 0,
                }}
              >
                0{item.order}
              </div>
              <div>
                <h3
                  style={{
                    fontSize: 26,
                    color: "#FFFFFF",
                    margin: "0 0 6px 0",
                    fontWeight: 700,
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: 20, color: "#8E8E9F", margin: 0 }}>
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

#### Scene 5: The CTA (`scenes/CtaScene.tsx`)

```tsx
import React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CtaSceneDataSchema } from "../types";
import { z } from "zod";

export const CtaScene: React.FC<{ data: z.infer<typeof CtaSceneDataSchema> }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { mass: 0.5, damping: 10, stiffness: 150 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "0 80px",
      }}
    >
      {data.avatarUrl && (
        <Img
          src={data.avatarUrl}
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            marginBottom: 24,
            border: "3px solid #FFFFFF",
          }}
        />
      )}
      <h1
        style={{
          fontSize: 64,
          color: "#FFFFFF",
          textAlign: "center",
          fontWeight: 900,
          margin: "0 0 32px 0",
          fontFamily: "Inter, sans-serif",
          maxWidth: 900,
        }}
      >
        {data.headline}
      </h1>
      <div
        style={{
          transform: `scale(${scale})`,
          backgroundColor: data.accentColor,
          padding: "20px 48px",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#FFFFFF",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {data.actionText}
        </span>
      </div>
      <span
        style={{
          fontSize: 20,
          color: "#6B7280",
          marginTop: 20,
          fontFamily: "monospace",
        }}
      >
        {data.destinationUrl}
      </span>
    </AbsoluteFill>
  );
};
```

---

## 5. Main Orchestrator Composition

The orchestrator assembles sequential visual layers through computed offsets, pairs each with deliberate entry/exit dynamics, and binds execution to the deterministic audio ducking sublayer.

```tsx
// StoryArcComposition.tsx
import React, { useMemo } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { StoryArcCompositionProps, Scene } from "./types";
import { AudioDirector } from "./audio/AudioDirector";
import { TransitionContainer, TransitionType } from "./transitions/TransitionContainer";
import { ProblemScene } from "./scenes/ProblemScene";
import { MistakeScene } from "./scenes/MistakeScene";
import { TurningPointScene } from "./scenes/TurningPointScene";
import { LessonScene } from "./scenes/LessonScene";
import { CtaScene } from "./scenes/CtaScene";

const getTransitionForBeat = (type: Scene["type"]): TransitionType => {
  switch (type) {
    case "problem":
      return "whip-left";
    case "mistake":
      return "flash-bang";
    case "turning_point":
      return "zoom-dissolve";
    case "lesson":
      return "slide-up";
    case "cta":
      return "zoom-dissolve";
  }
};

export const StoryArcComposition: React.FC<StoryArcCompositionProps> = ({
  scenes,
  voiceover,
  backgroundMusic,
}) => {
  const calculatedLayout = useMemo(() => {
    let accumulator = 0;
    return scenes.map((scene) => {
      const from = accumulator;
      accumulator += scene.durationInFrames;
      return {
        scene,
        from,
        durationInFrames: scene.durationInFrames,
      };
    });
  }, [scenes]);

  const totalDurationInFrames = useMemo(() => {
    return scenes.reduce((acc, curr) => acc + curr.durationInFrames, 0);
  }, [scenes]);

  const renderSceneContent = (scene: Scene) => {
    switch (scene.type) {
      case "problem":
        return <ProblemScene data={scene} />;
      case "mistake":
        return <MistakeScene data={scene} />;
      case "turning_point":
        return <TurningPointScene data={scene} />;
      case "lesson":
        return <LessonScene data={scene} />;
      case "cta":
        return <CtaScene data={scene} />;
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <AudioDirector
        voiceover={voiceover}
        backgroundMusic={backgroundMusic}
        totalDurationInFrames={totalDurationInFrames}
      />

      {calculatedLayout.map(({ scene, from, durationInFrames }) => (
        <Sequence
          key={scene.id}
          from={from}
          durationInFrames={durationInFrames}
        >
          <TransitionContainer
            durationInFrames={durationInFrames}
            transitionType={getTransitionForBeat(scene.type)}
          >
            {renderSceneContent(scene)}
          </TransitionContainer>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
```

---

## 6. Registration & Root Configuration

The composition is exposed to the Remotion pipeline via the project root (`Root.tsx`), enforcing canvas bounds and duration math based on default fixtures.

```tsx
// Root.tsx
import React from "react";
import { Composition } from "remotion";
import { StoryArcComposition } from "./StoryArcComposition";
import { StoryArcCompositionProps } from "./types";

export const defaultStoryArcProps: StoryArcCompositionProps = {
  scenes: [
    {
      id: "9f8a3d5e-2b1a-4c8d-9e7f-1a2b3c4d5e6f",
      type: "problem",
      tag: "THE AD ENGINE TRAP",
      headline: "Your Customer Acquisition Cost Just Doubled Overnight",
      subheadline: "Most teams burn cash scaling bids without analyzing creative fatigue.",
      durationInFrames: 90, // 3.0s @ 30fps
      accentColor: "#FF2E54",
    },
    {
      id: "8e7d6c5b-1a2f-3b4c-5d6e-7f8a9b0c1d2e",
      type: "mistake",
      headline: "How Most Brands Try to Fix It",
      failedAttempts: [
        "Increasing daily ad spend budget indiscriminately",
        "A/B testing minor changes on button copy colors",
        "Changing target demographics every 48 hours",
      ],
      durationInFrames: 135, // 4.5s
      accentColor: "#FF5E3A",
    },
    {
      id: "7d6c5b4a-0f1e-2d3c-4b5a-6e7f8a9b0c1d",
      type: "turning_point",
      breakthroughMetric: "+340%",
      breakthroughLabel: "RETENTION RECOVERY",
      headline: "Engineering programmatic asset variation instead of static batch production.",
      durationInFrames: 120, // 4.0s
      accentColor: "#00FFA3",
    },
    {
      id: "6c5b4a3f-9e8d-1c2b-3a4f-5e6d7c8b9a0f",
      type: "lesson",
      headline: "The Dynamic Rendering Engine",
      takeaways: [
        {
          order: 1,
          title: "Modular Scripting",
          description: "Decouple narrative hooks from the core product demonstration.",
        },
        {
          order: 2,
          title: "Timeline Parametrization",
          description: "Control timing, transitions, and audio via deterministic JSON state.",
        },
      ],
      durationInFrames: 105, // 3.5s
      accentColor: "#00E5FF",
    },
    {
      id: "5b4a3f2e-8d7c-0b1a-2f3e-4d5c6b7a8f9e",
      type: "cta",
      headline: "Scale Programmatic Creative with CreatorOS",
      actionText: "Deploy Story Arc Engine",
      destinationUrl: "engine.creatoros.io",
      avatarUrl: "https
