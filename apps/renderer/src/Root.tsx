import React from "react";
import { Composition } from "remotion";
import {
  TalkingHeadComposition,
  ThreeTipsComposition,
  StoryArcComposition,
} from "./compositions/index";
import {
  TalkingHeadPropsSchema,
  ThreeTipsPropsSchema,
  StoryArcPropsSchema,
} from "./types/index";

// Sample caption tokens for rich preview in Remotion Studio
const sampleCaptions = [
  { id: "1", text: "Stop", startFrame: 10, endFrame: 25 },
  { id: "2", text: "making", startFrame: 26, endFrame: 40 },
  { id: "3", text: "boring", startFrame: 41, endFrame: 65, highlight: true },
  { id: "4", text: "videos", startFrame: 66, endFrame: 90 },
  { id: "5", text: "in", startFrame: 91, endFrame: 105 },
  { id: "6", text: "2026.", startFrame: 106, endFrame: 135, highlight: true },
  { id: "7", text: "Here", startFrame: 140, endFrame: 160 },
  { id: "8", text: "is", startFrame: 161, endFrame: 175 },
  { id: "9", text: "the", startFrame: 176, endFrame: 190 },
  { id: "10", text: "exact", startFrame: 191, endFrame: 215, highlight: true },
  { id: "11", text: "blueprint.", startFrame: 216, endFrame: 250 },
];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 1. Talking Head Composition (1080x1920, 30fps, 30s) */}
      <Composition
        id="TalkingHeadComposition"
        component={TalkingHeadComposition}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        schema={TalkingHeadPropsSchema}
        defaultProps={{
          videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          backgroundMusicVolume: 0.12,
          brand: {
            handle: "@creatoros",
            primaryColor: "#00F0FF",
            secondaryColor: "#FFFFFF",
            accentColor: "#FF0055",
            backgroundColor: "#0a0a0c",
            surfaceColor: "#16161a",
            textColor: "#ffffff",
            fontFamily: "Inter, sans-serif",
            borderRadiusPx: 16,
            introDurationInFrames: 45,
            outroDurationInFrames: 60,
          },
          captions: sampleCaptions,
          captionStyle: "karaoke",
          zoomKeyframes: [],
          progressBarPosition: "top",
          patternInterruptInterval: 90,
          showBrandWatermark: true,
          showOutroCard: true,
          headline: "Master Creator Production with Remotion",
          ctaText: "Follow for More",
          ctaHandle: "@creatoros",
          totalDurationInFrames: 900,
          fps: 30,
        }}
      />

      {/* 2. Three Tips Composition (1080x1920, 30fps, 30s) */}
      <Composition
        id="ThreeTipsComposition"
        component={ThreeTipsComposition}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        schema={ThreeTipsPropsSchema}
        defaultProps={ThreeTipsPropsSchema.parse({
          headline: "3 Creator Mistakes Costing You 10,000 Views",
          subheadline: "And exactly how top creators fix them in seconds",
          tips: [
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
              bodyText: "Deliver the takeaway fast, then loop back with a focused action call.",
              startFrame: 570,
              durationInFrames: 240,
            },
          ],
          captions: sampleCaptions,
          brand: {
            handle: "@creatoros",
            primaryColor: "#00FF88",
            secondaryColor: "#FFFFFF",
            accentColor: "#FFE600",
            backgroundColor: "#0a0a0c",
            surfaceColor: "#16161a",
            textColor: "#ffffff",
            fontFamily: "Inter, sans-serif",
            borderRadiusPx: 16,
            introDurationInFrames: 45,
            outroDurationInFrames: 60,
          },
          totalDurationInFrames: 900,
          fps: 30,
        })}
      />

      {/* 3. Story Arc Composition (1080x1920, 30fps, 30s) */}
      <Composition
        id="StoryArcComposition"
        component={StoryArcComposition}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        schema={StoryArcPropsSchema}
        defaultProps={StoryArcPropsSchema.parse({
          title: "The Viral Retention Breakthrough",
          beats: [
            {
              type: "problem",
              tag: "THE HOOK",
              headline: "Your Content Drop-Off Is Happening at Frame 60",
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
              description: "Scale programmatic shorts with Remotion and CreatorOS.",
              accentColor: "#FF007A",
              startFrame: 720,
              durationInFrames: 180,
            },
          ],
          captions: sampleCaptions,
          brand: {
            handle: "@creatoros",
            primaryColor: "#00F0FF",
            secondaryColor: "#FFFFFF",
            accentColor: "#FF0055",
            backgroundColor: "#0a0a0c",
            surfaceColor: "#16161a",
            textColor: "#ffffff",
            fontFamily: "Inter, sans-serif",
            borderRadiusPx: 16,
            introDurationInFrames: 45,
            outroDurationInFrames: 60,
          },
          totalDurationInFrames: 900,
          fps: 30,
        })}
      />
    </>
  );
};
