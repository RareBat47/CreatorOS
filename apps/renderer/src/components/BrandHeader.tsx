import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { BrandTheme } from "../types/index";

export interface BrandHeaderProps {
  brand?: Partial<BrandTheme>;
  topOffset?: number;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  brand = {},
  topOffset = 180,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const handle = brand.handle || "@creatoros";
  const primaryColor = brand.primaryColor || "#00F0FF";
  const accentColor = brand.accentColor || "#FF0055";
  const fontFamily = brand.fontFamily || "Inter, sans-serif";

  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });

  return (
    <AbsoluteFill
      style={{
        zIndex: 40,
        pointerEvents: "none",
        paddingLeft: "48px",
        paddingRight: "48px",
        top: `${topOffset}px`,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          transform: `scale(${entrance}) translateY(${(1 - entrance) * -20}px)`,
          opacity: Math.max(0, Math.min(1, entrance)),
          backgroundColor: "rgba(11, 12, 16, 0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          padding: "10px 22px",
          borderRadius: "999px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: accentColor,
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />
        {brand.logoUrl ? (
          <img
            src={brand.logoUrl}
            alt="Brand Logo"
            style={{ width: "24px", height: "24px", borderRadius: "50%" }}
          />
        ) : null}
        <span
          style={{
            color: "#FFFFFF",
            fontFamily,
            fontWeight: 800,
            fontSize: "22px",
            letterSpacing: "0.04em",
            textShadow: "0 2px 8px rgba(0,0,0,0.6)",
          }}
        >
          {handle}
        </span>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "6px",
            backgroundColor: `${primaryColor}22`,
            color: primaryColor,
            border: `1px solid ${primaryColor}55`,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          PRO
        </span>
      </div>
    </AbsoluteFill>
  );
};
