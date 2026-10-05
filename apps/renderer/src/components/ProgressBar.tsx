import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export interface ProgressBarProps {
  totalDurationInFrames?: number;
  segmentsCount?: number;
  barColor?: string;
  trackColor?: string;
  position?: "top" | "bottom";
  offsetPx?: number;
  heightPx?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  totalDurationInFrames,
  segmentsCount = 1,
  barColor = "#00F0FF",
  trackColor = "rgba(255, 255, 255, 0.2)",
  position = "top",
  offsetPx = 140, // Avoid system status bar/notch on mobile
  heightPx = 8,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const totalFrames = totalDurationInFrames ?? durationInFrames;
  const progress = Math.min(1, Math.max(0, frame / Math.max(1, totalFrames)));

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: 48,
    right: 48,
    height: heightPx,
    zIndex: 50,
    pointerEvents: "none",
    ...(position === "top" ? { top: offsetPx } : { bottom: offsetPx }),
  };

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={containerStyle}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            gap: segmentsCount > 1 ? "8px" : "0px",
            alignItems: "center",
          }}
        >
          {Array.from({ length: segmentsCount }).map((_, index) => {
            const segmentCapacity = 1 / segmentsCount;
            const segmentStart = index * segmentCapacity;
            const segmentEnd = segmentStart + segmentCapacity;

            let segmentFill = 0;
            if (progress >= segmentEnd) {
              segmentFill = 1;
            } else if (progress <= segmentStart) {
              segmentFill = 0;
            } else {
              segmentFill = (progress - segmentStart) / segmentCapacity;
            }

            return (
              <div
                key={`progress-seg-${index}`}
                style={{
                  flex: 1,
                  height: "100%",
                  backgroundColor: trackColor,
                  borderRadius: heightPx / 2,
                  overflow: "hidden",
                  position: "relative",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div
                  style={{
                    width: `${segmentFill * 100}%`,
                    height: "100%",
                    backgroundColor: barColor,
                    borderRadius: heightPx / 2,
                    boxShadow: `0 0 12px ${barColor}`,
                    transition: "width 0.05s linear",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
