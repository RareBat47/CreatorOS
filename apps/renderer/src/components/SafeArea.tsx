import React from "react";
import { useVideoConfig } from "remotion";

export type SocialPlatform = "tiktok" | "reels" | "shorts" | "agnostic";

export interface SafeAreaProps {
  platform?: SocialPlatform;
  children: React.ReactNode;
  debugOverlay?: boolean;
}

const PLATFORM_CONSTRAINTS: Record<
  SocialPlatform,
  { top: number; bottom: number; left: number; right: number }
> = {
  tiktok: {
    top: 0.12, // 12% top header safe margin
    bottom: 0.22, // 22% bottom drawer safe margin
    left: 0.05,
    right: 0.18, // right engagement action bar
  },
  reels: {
    top: 0.1,
    bottom: 0.24,
    left: 0.06,
    right: 0.16,
  },
  shorts: {
    top: 0.08,
    bottom: 0.18,
    left: 0.04,
    right: 0.18,
  },
  agnostic: {
    top: 0.14,
    bottom: 0.22,
    left: 0.06,
    right: 0.18,
  },
};

export const SafeArea: React.FC<SafeAreaProps> = ({
  platform = "agnostic",
  children,
  debugOverlay = false,
}) => {
  const { width, height } = useVideoConfig();
  const bounds = PLATFORM_CONSTRAINTS[platform];

  const topPx = height * bounds.top;
  const bottomPx = height * bounds.bottom;
  const leftPx = width * bounds.left;
  const rightPx = width * bounds.right;

  const contentWidth = width - leftPx - rightPx;
  const contentHeight = height - topPx - bottomPx;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: topPx,
          left: leftPx,
          width: contentWidth,
          height: contentHeight,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>

      {debugOverlay && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "4px solid rgba(0, 255, 128, 0.4)",
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
};
