import path from "node:path";
import fs from "node:fs/promises";
import { parseArgs } from "node:util";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { SceneSpecSchema, type SceneSpec } from "@creatoros/scene-schema";
import { BrandThemeSchema, type BrandTheme } from "./types/index";

async function main() {
  const { values } = parseArgs({
    options: {
      scene: {
        type: "string",
        short: "s",
        default: "fixtures/sample-scene.json",
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

  const scenePath = path.resolve(process.cwd(), values.scene || "fixtures/sample-scene.json");
  console.log(`[Renderer CLI] Loading scene from: ${scenePath}`);

  const rawJson = await fs.readFile(scenePath, "utf-8");
  const sceneData = JSON.parse(rawJson);
  const validatedScene: SceneSpec = SceneSpecSchema.parse(sceneData);

  console.log(`[Renderer CLI] Validated scene ${validatedScene.sceneId} (${validatedScene.layout})`);

  // Map scene layout to Remotion composition ID
  let compositionId = values.composition;
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

  // Derive inputProps matching composition expectations
  const brand: BrandTheme = BrandThemeSchema.parse(sceneData?.brand ?? {});
  const inputProps = {
    videoSrc: validatedScene.visualLayers?.[0]?.src || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    backgroundMusicVolume: validatedScene.audioTrack?.musicVolume ?? 0.12,
    zoomKeyframes: [],
    brand,
    captions: validatedScene.captions || [],
    captionStyle: "karaoke",
    progressBarPosition: "top",
    patternInterruptInterval: 90,
    showBrandWatermark: true,
    showOutroCard: true,
    headline: typeof validatedScene.hook === "string" ? validatedScene.hook : "CreatorOS High Performance Production",
    ctaText: "Follow for More",
    ctaHandle: brand.handle,
    totalDurationInFrames: validatedScene.durationInFrames || 900,
    fps: validatedScene.fps || 30,
  };

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

  const outputPath = path.resolve(process.cwd(), values.out || "out/render.mp4");
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
