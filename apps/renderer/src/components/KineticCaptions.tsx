import React, { useMemo } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionToken } from "@creatoros/scene-schema";
import type { BrandTheme } from "../types/index";
import { SafeArea, type SocialPlatform } from "./SafeArea";

export type CaptionStyleMode = "minimal" | "bold" | "karaoke" | "highlight";

export interface KineticCaptionsProps {
  tokens: CaptionToken[];
  styleMode?: CaptionStyleMode;
  brand?: Partial<BrandTheme>;
  platform?: SocialPlatform;
  wordsPerChunk?: number;
  bottomOffsetPx?: number;
  highlightColor?: string;
}

interface CaptionChunk {
  id: string;
  tokens: CaptionToken[];
  startFrame: number;
  endFrame: number;
}

export const KineticCaptions: React.FC<KineticCaptionsProps> = ({
  tokens,
  styleMode = "karaoke",
  brand = {},
  platform = "agnostic",
  wordsPerChunk = 3,
  bottomOffsetPx = 360,
  highlightColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const primaryColor = highlightColor || brand.primaryColor || "#00F0FF";
  const secondaryColor = brand.secondaryColor || "#FFFFFF";
  const accentColor = brand.accentColor || "#FFDD00";
  const fontFamily = brand.fontFamily || "Inter, sans-serif";

  // Group tokens into chunks of wordsPerChunk
  const chunks = useMemo(() => {
    if (!tokens || tokens.length === 0) return [];

    const sorted = [...tokens].sort((a, b) => a.startFrame - b.startFrame);
    const result: CaptionChunk[] = [];

    for (let i = 0; i < sorted.length; i += wordsPerChunk) {
      const slice = sorted.slice(i, i + wordsPerChunk);
      const start = slice[0]!.startFrame;
      const end = slice[slice.length - 1]!.endFrame;

      // Small padding to prevent immediate blink
      const adjustedEnd = Math.max(end, start + 12);

      result.push({
        id: `chunk-${i}`,
        tokens: slice,
        startFrame: start,
        endFrame: adjustedEnd,
      });
    }
    return result;
  }, [tokens, wordsPerChunk]);

  // Find currently active chunk
  const activeChunk = useMemo(() => {
    return chunks.find(
      (chunk) => frame >= chunk.startFrame && frame <= chunk.endFrame
    );
  }, [chunks, frame]);

  if (!activeChunk) {
    return null;
  }

  return (
    <SafeArea platform={platform}>
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: `${bottomOffsetPx}px`,
          pointerEvents: "none",
          zIndex: 35,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "14px",
            maxWidth: "920px",
            padding: "20px 32px",
            backgroundColor:
              styleMode === "minimal"
                ? "transparent"
                : "rgba(11, 12, 16, 0.7)",
            borderRadius: "28px",
            backdropFilter: styleMode === "minimal" ? "none" : "blur(12px)",
            WebkitBackdropFilter: styleMode === "minimal" ? "none" : "blur(12px)",
            border:
              styleMode === "minimal"
                ? "none"
                : "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow:
              styleMode === "minimal"
                ? "none"
                : "0 20px 40px rgba(0, 0, 0, 0.5)",
          }}
        >
          {activeChunk.tokens.map((token, index) => {
            const isActive = frame >= token.startFrame && frame <= token.endFrame;
            const hasPassed = frame > token.endFrame;

            // Entrance spring for the current token
            const entrance = spring({
              frame: Math.max(0, frame - token.startFrame),
              fps,
              config: { damping: 12, mass: 0.35, stiffness: 240 },
            });

            // Styling variants
            if (styleMode === "highlight") {
              const scale = isActive ? 1.0 + entrance * 0.1 : 1.0;
              return (
                <div
                  key={`${activeChunk.id}-token-${index}`}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                    transition: "transform 0.1s ease",
                  }}
                >
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        inset: "-4px -10px",
                        backgroundColor: primaryColor,
                        borderRadius: "10px",
                        transform: "skewX(-6deg)",
                        zIndex: 0,
                        boxShadow: `0 0 20px ${primaryColor}88`,
                      }}
                    />
                  )}
                  <span
                    style={{
                      position: "relative",
                      zIndex: 1,
                      fontFamily,
                      fontWeight: 900,
                      fontSize: "68px",
                      lineHeight: 1.1,
                      textTransform: "uppercase",
                      color: isActive ? "#000000" : secondaryColor,
                      textShadow: isActive
                        ? "none"
                        : "0 4px 16px rgba(0,0,0,0.9)",
                    }}
                  >
                    {token.text}
                  </span>
                </div>
              );
            }

            if (styleMode === "bold") {
              const scale = isActive ? 1.0 + entrance * 0.18 : 1.0;
              return (
                <span
                  key={`${activeChunk.id}-token-${index}`}
                  style={{
                    fontFamily,
                    fontWeight: 900,
                    fontSize: "72px",
                    lineHeight: 1.1,
                    textTransform: "uppercase",
                    transform: `scale(${scale})`,
                    color: isActive ? accentColor : secondaryColor,
                    textShadow: isActive
                      ? `0 0 24px ${accentColor}, 0 4px 20px rgba(0,0,0,0.9)`
                      : "0 4px 16px rgba(0,0,0,0.9)",
                    display: "inline-block",
                  }}
                >
                  {token.text}
                </span>
              );
            }

            if (styleMode === "minimal") {
              return (
                <span
                  key={`${activeChunk.id}-token-${index}`}
                  style={{
                    fontFamily,
                    fontWeight: 700,
                    fontSize: "58px",
                    lineHeight: 1.2,
                    color: isActive ? primaryColor : "rgba(255, 255, 255, 0.6)",
                    textShadow: "0 4px 12px rgba(0,0,0,0.8)",
                    display: "inline-block",
                  }}
                >
                  {token.text}
                </span>
              );
            }

            // Default: "karaoke" style
            const scale = isActive ? 1.0 + entrance * 0.14 : 1.0;
            return (
              <span
                key={`${activeChunk.id}-token-${index}`}
                style={{
                  fontFamily,
                  fontWeight: 900,
                  fontSize: "70px",
                  lineHeight: 1.15,
                  textTransform: "uppercase",
                  transform: `scale(${scale})`,
                  color: isActive
                    ? primaryColor
                    : hasPassed
                    ? secondaryColor
                    : "rgba(255, 255, 255, 0.4)",
                  textShadow: isActive
                    ? `0 0 24px ${primaryColor}99, 0 4px 16px rgba(0,0,0,0.9)`
                    : "0 4px 12px rgba(0,0,0,0.8)",
                  display: "inline-block",
                  willChange: "transform, color",
                }}
              >
                {token.text}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </SafeArea>
  );
};
