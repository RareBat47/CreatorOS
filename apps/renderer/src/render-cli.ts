import path from "node:path";
import fs from "node:fs/promises";
import { parseArgs } from "node:util";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { SceneSpecSchema, type SceneSpec, type CaptionToken } from "@creatoros/scene-schema";
import {
  BrandThemeSchema,
  TalkingHeadPropsSchema,
  ThreeTipsPropsSchema,
  StoryArcPropsSchema,
  type BrandTheme,
  type TalkingHeadProps,
  type ThreeTipsProps,
  type StoryArcProps,
  type TipItem,
  type StoryArcBeat,
} from "./types/index.js";

/**
 * Normalizes captions from SceneSpec format (array or CaptionsConfig) to CaptionToken array
 */
function normalizeCaptions(captions: SceneSpec["captions"]): CaptionToken[] {
  if (Array.isArray(captions)) {
    return captions;
  }
  if (captions && typeof captions === "object") {
    if (Array.isArray(captions.words)) return captions.words;
    if (Array.isArray(captions.lines)) return captions.lines;
    if (Array.isArray(captions.segments)) return captions.segments;
  }
  return [];
}

/**
 * Extracts headline string from SceneSpec hook
 */
function extractHookHeadline(scene: SceneSpec): string {
  if (typeof scene.hook === "string") {
    return scene.hook;
  }
  if (scene.hook && typeof scene.hook === "object" && typeof scene.hook.text === "string") {
    return scene.hook.text;
  }
  return scene.metadata?.title || "CreatorOS High Performance Production";
}

/**
 * Maps SceneSpec to TalkingHeadComposition props
 */
function mapToTalkingHeadProps(scene: SceneSpec, brand: BrandTheme): TalkingHeadProps {
  const talkingHeadLayer = scene.visualLayers.find(
    (l) => l.type === "talking_head" || l.type === "video"
  );

  return TalkingHeadPropsSchema.parse({
    videoSrc:
      talkingHeadLayer?.src ||
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    audioSrc: scene.audioTrack.voiceoverUrl,
    backgroundMusicSrc: scene.audioTrack.musicUrl,
    backgroundMusicVolume: scene.audioTrack.musicVolume ?? 0.12,
    brand,
    captions: normalizeCaptions(scene.captions),
    captionStyle:
      (brand.captionStyle as "minimal" | "bold" | "karaoke" | "highlight") || "karaoke",
    zoomKeyframes: [],
    progressBarPosition: "top",
    patternInterruptInterval: 90,
    showBrandWatermark: true,
    showOutroCard: true,
    headline: extractHookHeadline(scene),
    ctaText: scene.metadata?.cta || "Follow for More",
    ctaHandle: brand.handle || "@creatoros",
    totalDurationInFrames: scene.durationInFrames,
    fps: scene.fps,
  });
}

/**
 * Maps SceneSpec to ThreeTipsComposition props
 */
function mapToThreeTipsProps(scene: SceneSpec, brand: BrandTheme): ThreeTipsProps {
  const defaultTips: TipItem[] = [
    {
      tipNumber: 1,
      badgeLabel: "TIP #1",
      headline: "The 3-Second Retention Rule",
      bodyText: "Hook viewers with pattern interrupts and kinetic visual change within 90 frames.",
      startFrame: 90,
      durationInFrames: 240,
    },
    {
      tipNumber: 2,
      badgeLabel: "TIP #2",
      headline: "High-Contrast Kinetic Typography",
      bodyText: "Over 75% watch on mute. Active word highlighting doubles completion rates.",
      startFrame: 330,
      durationInFrames: 240,
    },
    {
      tipNumber: 3,
      badgeLabel: "TIP #3",
      headline: "The Open-Loop Resolution CTA",
      bodyText: "Give the takeaway fast, then loop back with a focused action call.",
      startFrame: 570,
      durationInFrames: 240,
    },
  ];

  let tips: TipItem[] = defaultTips;

  if (scene.scenes && scene.scenes.length > 0) {
    const tipScenes = scene.scenes.filter((s) => s.type === "list" || s.type === "talking_head" || s.type === "hook");
    if (tipScenes.length > 0) {
      tips = tipScenes.map((s, idx) => ({
        tipNumber: (idx + 1) as 1 | 2 | 3 | 4 | 5,
        badgeLabel: `TIP #${idx + 1}`,
        headline: s.text || `Actionable Step #${idx + 1}`,
        bodyText: s.subtitle || s.text || "",
        startFrame: s.startFrame,
        durationInFrames: s.durationInFrames,
      }));
    }
  }

  return ThreeTipsPropsSchema.parse({
    headline: extractHookHeadline(scene),
    subheadline: scene.metadata?.caption || "And exactly how top creators fix them in seconds",
    tips,
    captions: normalizeCaptions(scene.captions),
    brand,
    backgroundMusicSrc: scene.audioTrack.musicUrl,
    voiceoverUrl: scene.audioTrack.voiceoverUrl,
    totalDurationInFrames: scene.durationInFrames,
    fps: scene.fps,
  });
}

/**
 * Maps SceneSpec to StoryArcComposition props
 */
function mapToStoryArcProps(scene: SceneSpec, brand: BrandTheme): StoryArcProps {
  const defaultBeats: StoryArcBeat[] = [
    {
      type: "problem",
      tag: "THE HOOK",
      headline: extractHookHeadline(scene),
      description: "You're spending 8 hours editing but losing 80% in the first 2 seconds.",
      accentColor: "#FF2E54",
      startFrame: 0,
      durationInFrames: 150,
    },
    {
      type: "mistake",
      tag: "THE MISTAKE",
      headline: "Over-Polishing The Wrong Elements",
      description: "Adding flashy transitions when the core story pacing is completely broken.",
      bulletPoints: ["Random stock footage cuts", "Slow talking head intro", "Unsynchronized subtitles"],
      accentColor: "#FF8A00",
      startFrame: 150,
      durationInFrames: 180,
    },
    {
      type: "realization",
      tag: "THE TURNING POINT",
      headline: "Pacing Multipliers & Programmatic Beats",
      metric: "+340% RETENTION",
      description: "Aligning text emphasis to speech cadences creates an irresistible dopamine loop.",
      accentColor: "#00FFA3",
      startFrame: 330,
      durationInFrames: 180,
    },
    {
      type: "lesson",
      tag: "THE LESSON",
      headline: "The 3 Step Modular Framework",
      bulletPoints: [
        "1. Visual interrupt every 3-4 seconds",
        "2. Kinetic captions inside safe zones",
        "3. Loop closure directly into CTA",
      ],
      accentColor: "#00F0FF",
      startFrame: 510,
      durationInFrames: 210,
    },
    {
      type: "cta",
      tag: "THE RESOLUTION",
      headline: "Build Your Automated Rendering Pipeline",
      description: scene.metadata?.cta || "Scale programmatic shorts with Remotion and CreatorOS.",
      accentColor: "#FF007A",
      startFrame: 720,
      durationInFrames: 180,
    },
  ];

  return StoryArcPropsSchema.parse({
    title: scene.metadata?.title || "The Viral Retention Breakthrough",
    beats: defaultBeats,
    brand,
    captions: normalizeCaptions(scene.captions),
    backgroundMusicSrc: scene.audioTrack.musicUrl,
    voiceoverUrl: scene.audioTrack.voiceoverUrl,
    totalDurationInFrames: scene.durationInFrames,
    fps: scene.fps,
  });
}

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      help: {
        type: "boolean",
        short: "h",
        default: false,
      },
      scene: {
        type: "string",
        short: "s",
      },
      out: {
        type: "string",
        short: "o",
        default: "out/render.mp4",
      },
      composition: {
        type: "string",
        short: "c",
      },
      concurrency: {
        type: "string",
        default: "2",
      },
      gl: {
        type: "string",
        default: "swangle",
      },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(`
Usage: tsx src/render-cli.ts [options] [scene-json-path] [output-mp4-path]

Options:
  -s, --scene <path>        Path to SceneSpec JSON (default: fixtures/sample-scene.json)
  -o, --out <path>          Output path for MP4 video (default: out/render.mp4)
  -c, --composition <name>  Composition ID override (TalkingHeadComposition, ThreeTipsComposition, StoryArcComposition)
      --concurrency <n>     Render concurrency limit (default: 2)
      --gl <driver>         Chromium OpenGL backend (default: swangle)
  -h, --help                Show this help message
`);
    return;
  }

  const cleanPositionals = positionals.filter((p) => p !== "--");
  if (cleanPositionals.includes("--help") || cleanPositionals.includes("-h")) {
    console.log(`
Usage: tsx src/render-cli.ts [options] [scene-json-path] [output-mp4-path]

Options:
  -s, --scene <path>        Path to SceneSpec JSON (default: fixtures/sample-scene.json)
  -o, --out <path>          Output path for MP4 video (default: out/render.mp4)
  -c, --composition <name>  Composition ID override (TalkingHeadComposition, ThreeTipsComposition, StoryArcComposition)
      --concurrency <n>     Render concurrency limit (default: 2)
      --gl <driver>         Chromium OpenGL backend (default: swangle)
  -h, --help                Show this help message
`);
    return;
  }

  // Support scene path passed either via --scene/-s flag or first positional argument
  const rawSceneArg = values.scene ?? cleanPositionals[0] ?? "fixtures/sample-scene.json";
  const rawOutArg = values.out ?? cleanPositionals[1] ?? "out/render.mp4";

  const scenePath = path.isAbsolute(rawSceneArg)
    ? rawSceneArg
    : path.resolve(process.cwd(), rawSceneArg);

  console.log(`[Renderer CLI] Loading scene from: ${scenePath}`);

  const rawJson = await fs.readFile(scenePath, "utf-8");
  const rawParsed = JSON.parse(rawJson);
  const validatedScene: SceneSpec = SceneSpecSchema.parse(rawParsed);

  console.log(
    `[Renderer CLI] Validated scene ${validatedScene.sceneId} (layout: ${validatedScene.layout}, frames: ${validatedScene.durationInFrames}, fps: ${validatedScene.fps})`
  );

  // Parse brand theme with vertical video defaults
  const brandData = (typeof rawParsed === "object" && rawParsed !== null && "brand" in rawParsed)
    ? (rawParsed as { brand?: unknown }).brand
    : {};
  const brand: BrandTheme = BrandThemeSchema.parse(brandData ?? {});

  // Determine composition and convert scene props accordingly
  let compositionId = values.composition;
  let inputProps: Record<string, unknown>;

  if (!compositionId) {
    switch (validatedScene.layout) {
      case "three-tips":
        compositionId = "ThreeTipsComposition";
        break;
      case "story-arc":
        compositionId = "StoryArcComposition";
        break;
      case "talking-head":
      default:
        compositionId = "TalkingHeadComposition";
        break;
    }
  }

  if (compositionId === "ThreeTipsComposition") {
    inputProps = mapToThreeTipsProps(validatedScene, brand);
  } else if (compositionId === "StoryArcComposition") {
    inputProps = mapToStoryArcProps(validatedScene, brand);
  } else {
    inputProps = mapToTalkingHeadProps(validatedScene, brand);
  }

  const entryPoint = path.resolve(import.meta.dirname, "index.ts");
  console.log(`[Renderer CLI] Bundling Remotion project from ${entryPoint}...`);

  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  console.log(`[Renderer CLI] Selecting composition '${compositionId}'...`);
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps,
  });

  const outputPath = path.isAbsolute(rawOutArg)
    ? rawOutArg
    : path.resolve(process.cwd(), rawOutArg);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  console.log(`[Renderer CLI] Rendering to ${outputPath}...`);
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputPath,
    inputProps,
    concurrency: Number(values.concurrency) || 2,
    chromiumOptions: {
      gl: values.gl as "swangle" | "angle" | "egl" | "swiftshader" | undefined,
    },
  });

  console.log(`[Renderer CLI] Render completed successfully: ${outputPath}`);
}

main().catch((err) => {
  console.error("[Renderer CLI] Render error:", err);
  process.exit(1);
});
